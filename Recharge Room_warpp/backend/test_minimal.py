import requests
import json

def test_minimal_auth():
    url = "http://localhost:5002/api/auth/login"
    data = {
        "email": "admin@rechargeroom.com",
        "password": "admin123"
    }
    
    try:
        print("Testing minimal auth server...")
        response = requests.post(url, json=data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Minimal auth working!")
            print(f"User: {result.get('user', {}).get('email')}")
            print(f"Token: {result.get('access_token', '')[:50]}...")
            return True
        else:
            print("❌ Minimal auth failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing minimal auth: {e}")
        return False

if __name__ == "__main__":
    test_minimal_auth()