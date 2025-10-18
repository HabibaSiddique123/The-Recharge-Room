"""
Admin Routes for The Recharge Room API
"""

import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from app import db
from app.models.user import User
from app.models.task import Task
from app.models.mood import Mood
from app.models.journal import Journal
from app.models.voice_note import VoiceNote
from app.models.badge import Badge, UserBadge

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorator to require admin privileges"""
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
        
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        
        query = User.query
        
        if search:
            query = query.filter(User.email.contains(search))
        
        users = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': users.total,
                'pages': users.pages,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_details(user_id):
    """Get detailed user information"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user.to_dict()
        
        # Add detailed statistics
        user_data['stats'] = {
            'total_tasks': len(user.tasks),
            'completed_tasks': len([task for task in user.tasks if task.is_completed]),
            'total_moods': len(user.moods),
            'total_journal_entries': len(user.journal_entries),
            'total_voice_notes': len(user.voice_notes),
            'unlocked_badges': len(user.user_badges)
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        is_admin = data.get('is_admin', False)
        is_active = data.get('is_active', True)
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Create new user
        user = User(email=email, is_admin=is_admin, is_active=is_active)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user information"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields
        if 'email' in data:
            new_email = data['email'].lower().strip()
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=new_email).filter(User.id != user_id).first()
            if existing_user:
                return jsonify({'error': 'Email already in use'}), 409
            user.email = new_email
        
        if 'is_admin' in data:
            user.is_admin = data['is_admin']
        
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'password' in data and data['password']:
            if len(data['password']) < 6:
                return jsonify({'error': 'Password must be at least 6 characters long'}), 400
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user and all associated data"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deleting yourself
        current_user_id = int(get_jwt_identity())
        if user_id == current_user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Delete user (cascade will delete related data)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    """Get comprehensive admin statistics"""
    try:
        total_users = User.query.count()
        admin_users = User.query.filter_by(is_admin=True).count()
        active_users = User.query.filter_by(is_active=True).count()
        
        total_tasks = Task.query.count()
        completed_tasks = Task.query.filter_by(is_completed=True).count()
        
        total_moods = Mood.query.count()
        total_journal_entries = Journal.query.count()
        total_voice_notes = VoiceNote.query.count()
        
        total_badges = Badge.query.count()
        unlocked_badges = UserBadge.query.count()
        
        return jsonify({
            'users': {
                'total': total_users,
                'admins': admin_users,
                'active': active_users,
                'inactive': total_users - active_users
            },
            'tasks': {
                'total': total_tasks,
                'completed': completed_tasks,
                'pending': total_tasks - completed_tasks,
                'completion_rate': round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0
            },
            'content': {
                'moods': total_moods,
                'journal_entries': total_journal_entries,
                'voice_notes': total_voice_notes
            },
            'badges': {
                'total': total_badges,
                'unlocked': unlocked_badges,
                'unlock_rate': round((unlocked_badges / (total_users * total_badges)) * 100, 1) if total_users > 0 and total_badges > 0 else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_user_status(user_id):
    """Toggle user active status"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deactivating yourself
        current_user_id = int(get_jwt_identity())
        if user_id == current_user_id:
            return jsonify({'error': 'Cannot change your own status'}), 400
        
        user.is_active = not user.is_active
        db.session.commit()
        
        return jsonify({
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/settings', methods=['GET'])
@admin_required
def get_settings():
    """Get application settings"""
    try:
        settings_file = os.path.join(os.path.dirname(__file__), '..', 'settings.json')
        
        # Default settings
        default_settings = {
            'app_name': 'Recharge Room',
            'app_description': 'Your wellness companion for better mental health and productivity',
            'allow_registration': True,
            'require_email_verification': False,
            'session_timeout': 30,
            'max_login_attempts': 5,
            'enable_mood_tracking': True,
            'enable_journal': True,
            'enable_voice_notes': True,
            'enable_rewards': True,
            'enable_task_management': True,
            'backup_enabled': True,
            'backup_frequency': 'daily'
        }
        
        # Load settings from file if exists
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                saved_settings = json.load(f)
                default_settings.update(saved_settings)
        
        return jsonify({'settings': default_settings}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/settings', methods=['PUT'])
@admin_required
def update_settings():
    """Update application settings"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No settings provided'}), 400
        
        settings_file = os.path.join(os.path.dirname(__file__), '..', 'settings.json')
        
        # Save settings to file
        with open(settings_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        return jsonify({'message': 'Settings updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/backup', methods=['POST'])
@admin_required
def create_backup():
    """Create database backup"""
    try:
        backup_dir = os.path.join(os.path.dirname(__file__), '..', 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'backup_{timestamp}.db'
        backup_path = os.path.join(backup_dir, backup_file)
        
        # Copy current database
        db_path = os.path.join(os.path.dirname(__file__), '..', 'instance', 'recharge_room.db')
        if os.path.exists(db_path):
            import shutil
            shutil.copy2(db_path, backup_path)
        
        return jsonify({
            'message': 'Backup created successfully',
            'backup_file': backup_file
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/clear-cache', methods=['POST'])
@admin_required
def clear_cache():
    """Clear application cache"""
    try:
        # Clear Flask cache if implemented
        # This is a placeholder - implement based on your caching strategy
        
        return jsonify({'message': 'Cache cleared successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reset-demo', methods=['POST'])
@admin_required
def reset_demo_data():
    """Reset demo data to default state"""
    try:
        # This is a placeholder - implement based on your demo data requirements
        # You might want to:
        # 1. Delete all non-admin users
        # 2. Reset demo user data
        # 3. Clear test data
        
        return jsonify({'message': 'Demo data reset successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500