"""
Quick test script to verify response optimization is working correctly.
Run this after starting the Flask server.
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_endpoint(endpoint, payload, include_context=False):
    """Test an endpoint and show response size."""
    url = f"{BASE_URL}{endpoint}"
    if include_context:
        url += "?include_context=true"
    
    try:
        response = requests.post(url, json=payload, headers={
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip"
        }, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            size = len(json.dumps(data))
            compressed_size = len(response.content)
            
            print(f"\n{'='*60}")
            print(f"Endpoint: {endpoint}")
            print(f"Minimal Mode: {minimal}")
            print("Status: ✅ SUCCESS")
            print(f"Uncompressed Size: {size} bytes ({size/1024:.2f} KB)")
            print(f"Compressed Size: {compressed_size} bytes ({compressed_size/1024:.2f} KB)")
            print(f"Compression Ratio: {(1 - compressed_size/size)*100:.1f}%")
            print(f"Content-Encoding: {response.headers.get('Content-Encoding', 'none')}")
            
            # Show sample of response structure
            if "output" in data:
                output = data["output"]
                if isinstance(output, list) and len(output) > 0:
                    print("\nSample Question Fields:")
                    print(f"  {list(output[0].keys())}")  
            elif "output_mcq" in data:
                # Handle combined endpoint response
                print(f"\nCombined Response Structure:")
                for key in ["output_mcq", "output_boolq", "output_shortq"]:
                    if key in data and "output" in data[key]:
                        output = data[key]["output"]
                        if output:
                            print(f"  {key}: {list(output[0].keys())}")
                    
                    # Check for removed fields
                    removed_fields = ["statement", "Text", "time_taken", "options_algorithm", "extra_options", "Count"]
                    found_removed = [f for f in removed_fields if f in str(data)]
                    if found_removed:
                        print(f"  ⚠️  WARNING: Found removed fields: {found_removed}")
                    else:
                        print("  ✅ No unnecessary fields found")
            
            return True
        else:
            print(f"\n❌ ERROR: {endpoint} returned {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Cannot connect to {BASE_URL}")
        print("Make sure the Flask server is running: python server.py")
        return False
    except Exception as e:
        print(f"\n❌ ERROR testing {endpoint}: {type(e).__name__}: {e!r}")
        return False


def main():
    print("="*60)
    print("API Response Optimization Test Suite")
    print("="*60)
    
    test_text = "Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models."
    
    # Test MCQ endpoint
    test_endpoint("/get_mcq", {
        "input_text": test_text,
        "max_questions": 2
    })
    
    test_endpoint("/get_mcq", {
        "input_text": test_text,
        "max_questions": 2
    }, minimal=True)
    
    # Test Short Q endpoint
    test_endpoint("/get_shortq", {
        "input_text": test_text,
        "max_questions": 2
    })
    
    # Test Bool Q endpoint
    test_endpoint("/get_boolq", {
        "input_text": test_text,
        "max_questions": 2
    })
    
    # Test combined endpoint
    test_endpoint("/get_problems", {
        "input_text": test_text,
        "max_questions_mcq": 1,
        "max_questions_boolq": 1,
        "max_questions_shortq": 1
    })
    
    print(f"\n{'='*60}")
    print("Test Suite Complete!")
    print("="*60)


if __name__ == "__main__":
    main()
