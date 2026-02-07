"""
Google Forms Service for EduAid
Handles fetching form structure and building submission URLs
"""

import re
from urllib.parse import parse_qs, urlparse, urlencode
from apiclient import discovery
from httplib2 import Http
from oauth2client import client, file, tools


class GoogleFormsService:
    """Service class for Google Forms integration"""
    
    def __init__(self):
        """
        Initialize Google Forms Service
        No credentials needed for scraping method
        """
        pass
        
    def extract_form_id(self, form_url_or_id):
        """
        Extract form ID from various Google Forms URL formats
        
        Args:
            form_url_or_id: Google Form URL or direct ID
            
        Returns:
            str: Extracted form ID or None if invalid
        """
        # If it's already just an ID (no slashes or special chars), return it
        if '/' not in form_url_or_id and '?' not in form_url_or_id:
            return form_url_or_id
        
        # Try to extract from URL
        patterns = [
            r'forms/d/e/([a-zA-Z0-9_-]+)',  # /d/e/ format
            r'forms/d/([a-zA-Z0-9_-]+)',     # /d/ format
            r'forms\.gle/([a-zA-Z0-9_-]+)',  # Short URL format
        ]
        
        for pattern in patterns:
            match = re.search(pattern, form_url_or_id)
            if match:
                return match.group(1)
        
        return None
    
    def get_form_structure(self, form_id):
        """
        Fetch form structure by scraping the public form page
        """
        import requests
        import json
        
        url = f"https://docs.google.com/forms/d/e/{form_id}/viewform"
        
        try:
            response = requests.get(url, timeout=15)
            if response.status_code != 200:
                raise ValueError(f"Failed to access form. Status code: {response.status_code}")
                
            # Extract FB_PUBLIC_LOAD_DATA_
            match = re.search(r'var FB_PUBLIC_LOAD_DATA_ = (.*?);', response.text, re.DOTALL)
            if not match:
                raise ValueError("Could not find form data in page HTML")
                
            data = json.loads(match.group(1))
            
            # Parse form info
            form_info = {
                'form_id': form_id,
                'title': data[1][8] or "Untitled Form",
                'description': data[1][0] or "",
                'questions': []
            }
            
            # Parse questions
            # data[1][1] contains the list of questions
            if data[1][1]:
                for item in data[1][1]:
                    # Skip non-question items (like headers or images without inputs)
                    if not item[4]: 
                        continue
                        
                    question_data = item[4][0]
                    question_id = str(question_data[0])
                    entry_id = str(question_data[0]) # usually same or mapped
                    
                    # Try to find the entry ID for submission
                    # item[4][0][0] is the ID used in logic
                    # But for submission we often need 'entry.XXXX'
                    # The entry ID is usually found in item[4][0][0] for simple fields
                    
                    question_type = "text" # default
                    options = []
                    
                    # Determine type based on question structure
                    # item[3] identifies the type of widget
                    widget_type = item[3]
                    
                    # 0: Short Answer, 1: Paragraph, 2: Multiple Choice, 3: Dropdown, 4: Checkboxes
                    if widget_type == 0:
                        question_type = "text"
                    elif widget_type == 1:
                        question_type = "paragraph"
                    elif widget_type == 2:
                        question_type = "multiple_choice"
                    elif widget_type == 3:
                        question_type = "dropdown"
                    elif widget_type == 4:
                        question_type = "checkbox"
                    
                    # Extract options if available
                    if item[4][0][1]:
                        options = [opt[0] for opt in item[4][0][1] if opt[0]]
                        
                    form_info['questions'].append({
                        'id': question_id,
                        'title': item[1],
                        'description': item[2] or "",
                        'required': item[4][0][2] == 1,
                        'type': question_type,
                        'options': options,
                        'entry_id': question_id # Storing this for submission mapping logic
                    })
            
            return form_info
            
        except Exception as e:
            raise ValueError(f"Error fetching form: {str(e)}")

    def submit_response(self, form_id, responses):
        """
        Submit responses to Google Form
        
        Args:
            form_id: Google Form ID
            responses: List of dicts {question_id: answer}
        
        Returns:
            dict: {success: bool, message: str}
        """
        import requests
        
        submit_url = f"https://docs.google.com/forms/d/e/{form_id}/formResponse"
        
        form_data = {}
        
        # We need to map our question IDs to entry IDs
        # Since we stored question_id as entry_id in get_form_structure, we use that.
        # Format for submission is 'entry.{id}': 'value'
        
        for resp in responses:
            q_id = resp.get('question_id')
            answer = resp.get('answer')
            
            # Handle array answers (checkboxes)
            if isinstance(answer, list):
                for val in answer:
                    # For checkboxes, Google Forms often expects multiple keys with same name
                    # requests handles this if we pass a list of tuples or list of values
                    key = f"entry.{q_id}"
                    if key in form_data:
                        if not isinstance(form_data[key], list):
                            form_data[key] = [form_data[key]]
                        form_data[key].append(val)
                    else:
                        form_data[key] = val
            else:
                form_data[f"entry.{q_id}"] = answer
                
        try:
            # Send POST request
            response = requests.post(submit_url, data=form_data, timeout=15)
            
            # Print for debugging
            print(f"Submission Status: {response.status_code}")
            print(f"Submission Response: {response.text[:200]}...")
            
            if response.status_code == 200:
                # Basic check for success text in response usually "Your response has been recorded"
                # But status 200 is a good start.
                return {'success': True, 'message': 'Form submitted successfully'}
            else:
                return {'success': False, 'error': f'Submission failed. Status: {response.status_code}. Reason: {response.reason}'}
                
        except Exception as e:
             print(f"Submission Exception: {e}")
             return {'success': False, 'error': f'Error submitting form: {str(e)}'}

    def validate_form_access(self, form_id):
        try:
            import requests
            url = f"https://docs.google.com/forms/d/e/{form_id}/viewform"
            response = requests.get(url, timeout=15)
            return response.status_code == 200, ""
        except Exception as e:
            return False, str(e)
