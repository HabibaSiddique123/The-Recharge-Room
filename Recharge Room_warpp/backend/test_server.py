#!/usr/bin/env python3
"""
Simple server test to check basic functionality
"""

from flask import Flask, jsonify, request
import requests
import time

# Test if we can create a simple Flask app
def test_simple_server():
    app = Flask(__name__)
    
    @app.route('/test', methods=['GET'])
    def test():
        return jsonify({"status": "ok", "message": "Simple server working"})
    
    @app.route('/test-login', methods=['POST'])
    def test_login():
        data = request.get_json()
        return jsonify({
            "message": "Test login successful",
            "received": data,
            "status": "working"
        })
    
    print("Starting simple test server on port 5001...")
    try:
        app.run(host='0.0.0.0', port=5001, debug=False)
    except Exception as e:
        print(f"Error starting simple server: {e}")

# Test connection to existing server
def test_existing_server():
    try:
        print("Testing connection to main server...")
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        print(f"Health check status: {response.status_code}")
        print(f"Health check response: {response.text}")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to main server on port 5000")
        return False
    except Exception as e:
        print(f"❌ Error testing server: {e}")
        return False

if __name__ == "__main__":
    if test_existing_server():
        print("✅ Main server is accessible")
    else:
        print("Starting simple test server as fallback...")
        test_simple_server()