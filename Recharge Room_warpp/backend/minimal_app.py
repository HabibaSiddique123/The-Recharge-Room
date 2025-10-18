#!/usr/bin/env python3
"""
Minimal Flask app to test authentication
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)

# Basic configuration
app.config['SECRET_KEY'] = 'test-secret-key'
app.config['JWT_SECRET_KEY'] = 'test-jwt-key'

# Initialize extensions
CORS(app, origins=["http://localhost:3000"])
jwt = JWTManager(app)

# Test data - hardcoded users
TEST_USERS = {
    "admin@rechargeroom.com": {
        "password": "admin123",
        "email": "admin@rechargeroom.com", 
        "is_admin": True,
        "id": 1
    },
    "demo@rechargeroom.com": {
        "password": "demo123",
        "email": "demo@rechargeroom.com",
        "is_admin": False,
        "id": 2
    }
}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Minimal Recharge Room API'
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        print("Login endpoint hit!")
        data = request.get_json()
        print(f"Received data: {data}")
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        print(f"Looking for user: {email}")
        
        # Check if user exists in test data
        user_data = TEST_USERS.get(email)
        if not user_data or user_data['password'] != password:
            print("Invalid credentials")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        print("User found, creating token...")
        
        # Create access token
        access_token = create_access_token(identity=str(user_data['id']))
        
        print("Token created successfully")
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user_data['id'],
                'email': user_data['email'],
                'is_admin': user_data['is_admin']
            },
            'access_token': access_token
        }), 200
    
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Authentication failed: {str(e)}'}), 500

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    return jsonify({'message': 'Signup not implemented in minimal version'}), 501

if __name__ == '__main__':
    print("Starting minimal Flask app for testing...")
    print("Available test users:")
    for email, user in TEST_USERS.items():
        print(f"  - {email} / {user['password']} (admin: {user['is_admin']})")
    
    app.run(host='0.0.0.0', port=5002, debug=True)