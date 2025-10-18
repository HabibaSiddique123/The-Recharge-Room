"""
Task Model for Task Management
"""

from datetime import datetime, timedelta
from sqlalchemy.sql import func
from app import db

class Task(db.Model):
    """Task model for user task management"""
    
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=func.now())
    completed_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    
    def mark_completed(self):
        """Mark task as completed"""
        self.is_completed = True
        self.completed_at = func.now()
        self.updated_at = func.now()
    
    def mark_incomplete(self):
        """Mark task as incomplete"""
        self.is_completed = False
        self.completed_at = None
        self.updated_at = func.now()
    
    def to_dict(self):
        """Convert task to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'priority': self.priority
        }
    
    @staticmethod
    def get_user_streak(user_id):
        """Calculate user's current completion streak"""
        completed_tasks = Task.query.filter_by(
            user_id=user_id, 
            is_completed=True
        ).order_by(Task.completed_at.desc()).all()
        
        if not completed_tasks:
            return 0
        
        streak = 0
        today = datetime.utcnow().date()
        
        for task in completed_tasks:
            if task.completed_at:
                task_date = task.completed_at.date()
                expected_date = today - timedelta(days=streak)
                
                if task_date == expected_date:
                    streak += 1
                else:
                    break
        
        return streak
    
    @staticmethod
    def get_user_completion_stats(user_id):
        """Get comprehensive completion statistics for user"""
        user_tasks = Task.query.filter_by(user_id=user_id).all()
        completed_tasks = [task for task in user_tasks if task.is_completed]
        
        total_tasks = len(user_tasks)
        completed_count = len(completed_tasks)
        
        # Calculate completion rate
        completion_rate = (completed_count / total_tasks * 100) if total_tasks > 0 else 0
        
        # Get current streak
        current_streak = Task.get_user_streak(user_id)
        
        return {
            'total_tasks': total_tasks,
            'completed_tasks': completed_count,
            'pending_tasks': total_tasks - completed_count,
            'completion_rate': round(completion_rate, 1),
            'current_streak': current_streak
        }
    
    def __repr__(self):
        return f'<Task {self.title}>'