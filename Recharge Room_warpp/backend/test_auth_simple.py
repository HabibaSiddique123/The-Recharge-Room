#!/usr/bin/env python3
"""
Simple authentication test without complex dependencies
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from flask_jwt_extended import create_access_token

def test_direct_auth():
    """Test authentication directly"""
    app = create_app()
    
    with app.app_context():
        # Test finding user
        email = "admin@rechargeroom.com"
        password = "admin123"
        
        print(f"Looking for user: {email}")
        user = User.query.filter_by(email=email, is_active=True).first()
        
        if not user:
            print("❌ User not found")
            return False
        
        print(f"✅ User found: {user.email}")
        print(f"✅ User active: {user.is_active}")
        print(f"✅ User admin: {user.is_admin}")
        
        # Test password
        if not user.check_password(password):
            print("❌ Password check failed")
            return False
        
        print("✅ Password check passed")
        
        # Test token creation
        try:
            access_token = create_access_token(identity=str(user.id))
            print("✅ Token creation successful")
            print(f"Token: {access_token[:50]}...")
        except Exception as e:
            print(f"❌ Token creation failed: {e}")
            return False
        
        # Test user.to_dict()
        try:
            user_dict = user.to_dict()
            print("✅ User serialization successful")
            print(f"User dict: {user_dict}")
        except Exception as e:
            print(f"❌ User serialization failed: {e}")
            return False
        
        return True

if __name__ == '__main__':
    if test_direct_auth():
        print("\n🎉 Direct auth test passed!")
    else:
        print("\n❌ Direct auth test failed!")