"""
User Model for Authentication
"""

from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.sql import func
from app import db

class User(db.Model):
    """User model for authentication and profile management"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Relationships
    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    moods = db.relationship('Mood', backref='user', lazy=True, cascade='all, delete-orphan')
    journal_entries = db.relationship('Journal', backref='user', lazy=True, cascade='all, delete-orphan')
    voice_notes = db.relationship('VoiceNote', backref='user', lazy=True, cascade='all, delete-orphan')
    user_badges = db.relationship('UserBadge', backref='user', lazy=True, cascade='all, delete-orphan')
    login_logs = db.relationship('LoginLog', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set user password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def get_task_stats(self):
        """Get user's task completion statistics"""
        total_tasks = len(self.tasks)
        completed_tasks = len([task for task in self.tasks if task.is_completed])
        
        # Calculate current streak
        current_streak = 0
        sorted_tasks = sorted(
            [task for task in self.tasks if task.is_completed], 
            key=lambda x: x.completed_at, 
            reverse=True
        )
        
        for task in sorted_tasks:
            if task.completed_at and (datetime.utcnow() - task.completed_at).days == current_streak:
                current_streak += 1
            else:
                break
        
        return {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'current_streak': current_streak,
            'completion_rate': round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0
        }
    
    def get_recent_moods(self, limit=5):
        """Get user's recent mood entries"""
        return Mood.query.filter_by(user_id=self.id).order_by(Mood.created_at.desc()).limit(limit).all()
    
    def get_recent_journal_entries(self, limit=3):
        """Get user's recent journal entries"""
        return Journal.query.filter_by(user_id=self.id).order_by(Journal.created_at.desc()).limit(limit).all()
    
    def get_unlocked_badges(self):
        """Get all badges unlocked by user"""
        return [ub.badge for ub in self.user_badges]
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active,
            'is_admin': self.is_admin
        }
    
    def __repr__(self):
        return f'<User {self.email}>'