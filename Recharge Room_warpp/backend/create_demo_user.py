"""
Script to create demo users for Quick Demo Access
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User

def create_demo_users():
    """Create demo users for testing"""
    app = create_app()
    
    with app.app_context():
        # Demo users to create
        demo_users = [
            {
                'email': 'demo@rechargeroom.com',
                'password': 'demo123',
                'name': 'Demo User',
                'is_admin': False
            },
            {
                'email': 'test@example.com',
                'password': 'testpassword',
                'name': 'Test User',
                'is_admin': False
            },
            {
                'email': 'user@rechargeroom.com',
                'password': 'user123',
                'name': 'Regular User',
                'is_admin': False
            }
        ]
        
        for user_data in demo_users:
            # Check if user already exists
            existing_user = User.query.filter_by(email=user_data['email']).first()
            
            if existing_user:
                print(f"User with email {user_data['email']} already exists!")
                continue
            
            # Create user
            user = User(
                email=user_data['email'],
                is_admin=user_data['is_admin'],
                is_active=True
            )
            user.set_password(user_data['password'])
            
            db.session.add(user)
            print(f"Created user: {user_data['email']} / {user_data['password']}")
        
        try:
            db.session.commit()
            print("\nDemo users created successfully!")
            print("\n=== Available Test Accounts ===")
            print("1. Admin: admin@rechargeroom.com / admin123")
            print("2. Demo: demo@rechargeroom.com / demo123") 
            print("3. Test: test@example.com / testpassword")
            print("4. User: user@rechargeroom.com / user123")
            print("\nOr use 'Quick Demo Access' button for instant login!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating demo users: {str(e)}")

if __name__ == '__main__':
    create_demo_users()