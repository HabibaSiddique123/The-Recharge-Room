import requests
import json

def test_login():
    url = "http://localhost:5000/api/auth/login"
    data = {
        "email": "admin@rechargeroom.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            json_response = response.json()
            print("✅ Login successful!")
            print(f"User: {json_response.get('user', {}).get('email')}")
            print(f"Admin: {json_response.get('user', {}).get('is_admin')}")
            print(f"Token: {json_response.get('access_token', '')[:50]}...")
            return True
        else:
            print("❌ Login failed!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on port 5000.")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"Raw response: {response.text}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("Testing login endpoint...")
    test_login()