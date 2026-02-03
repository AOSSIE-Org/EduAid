"""
Minimal test server to verify Google Forms integration endpoints
This bypasses the torch dependency issue
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from google_forms_service import GoogleFormsService

app = Flask(__name__)
CORS(app)

# Initialize Google Forms service
google_forms_service = GoogleFormsService()

@app.route("/", methods=["GET"])
def hello():
    return "Google Forms Integration Test Server is running!"

@app.route('/fetch_google_form', methods=['POST'])
def fetch_google_form():
    """Fetch Google Form structure and questions"""
    try:
        data = request.get_json()
        form_url = data.get('form_url', '').strip()
        
        if not form_url:
            return jsonify({'success': False, 'error': 'Form URL is required'}), 400
        
        # Extract form ID
        form_id = google_forms_service.extract_form_id(form_url)
        if not form_id:
            return jsonify({'success': False, 'error': 'Invalid Google Form URL or ID'}), 400
        
        # Validate form access
        is_valid, error_msg = google_forms_service.validate_form_access(form_id)
        if not is_valid:
            return jsonify({'success': False, 'error': error_msg}), 403
        
        # Get form structure
        form_data = google_forms_service.get_form_structure(form_id)
        form_data['success'] = True
        
        return jsonify(form_data)
        
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error fetching form: {str(e)}'}), 500


@app.route('/submit_to_google_form', methods=['POST'])
def submit_to_google_form():
    """Submit responses to Google Form programmatically"""
    try:
        data = request.get_json()
        form_id = data.get('form_id', '')
        responses = data.get('responses', [])
        
        if not form_id:
            return jsonify({'success': False, 'error': 'Form ID is required'}), 400
        
        # Submit the form using the service
        result = google_forms_service.submit_response(form_id, responses)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error processing submission: {str(e)}'}), 500


@app.route('/extract_form_id', methods=['GET'])
def extract_form_id_endpoint():
    """Extract and validate form ID from URL"""
    form_url = request.args.get('url', '').strip()
    
    if not form_url:
        return jsonify({'valid': False, 'error': 'URL parameter is required'}), 400
    
    form_id = google_forms_service.extract_form_id(form_url)
    
    if form_id:
        return jsonify({'valid': True, 'form_id': form_id})
    else:
        return jsonify({'valid': False, 'error': 'Invalid Google Form URL'})


if __name__ == "__main__":
    print("Starting Google Forms Integration Test Server...")
    print("Available endpoints:")
    print("  POST /fetch_google_form")
    print("  POST /submit_to_google_form")
    print("  GET  /extract_form_id")
    app.run(debug=True, port=5000)
