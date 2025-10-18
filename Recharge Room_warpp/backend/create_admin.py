"""
Script to create initial admin user
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User

def create_admin_user():
    """Create an admin user"""
    app = create_app()
    
    with app.app_context():
        # Check if admin already exists
        admin_email = 'admin@rechargeroom.com'
        existing_admin = User.query.filter_by(email=admin_email).first()
        
        if existing_admin:
            print(f"Admin user with email {admin_email} already exists!")
            return
        
        # Create admin user
        admin = User(
            email=admin_email,
            is_admin=True,
            is_active=True
        )
        admin.set_password('admin123')  # Change this in production!
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"Admin user created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: admin123")
        print("⚠️  IMPORTANT: Please change the default password after first login!")

if __name__ == '__main__':
    create_admin_user()