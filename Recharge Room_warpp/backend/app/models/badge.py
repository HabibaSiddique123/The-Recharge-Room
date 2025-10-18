"""
Badge and UserBadge Models for Rewards System
"""

from datetime import datetime
from sqlalchemy.sql import func
from app import db

class Badge(db.Model):
    """Badge model for available achievements and rewards"""
    
    __tablename__ = 'badges'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(100))  # Icon identifier or emoji
    category = db.Column(db.String(50), nullable=False)  # task, mood, journal, voice, streak, etc.
    type = db.Column(db.String(20), default='bronze')  # bronze, silver, gold, platinum
    condition_type = db.Column(db.String(50), nullable=False)  # count, streak, milestone
    condition_value = db.Column(db.Integer, nullable=False)  # Required value to unlock
    points = db.Column(db.Integer, default=10)  # Points awarded for earning badge
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=func.now())
    
    # Relationship with user badges
    user_badges = db.relationship('UserBadge', backref='badge', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert badge to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'category': self.category,
            'type': self.type,
            'condition_type': self.condition_type,
            'condition_value': self.condition_value,
            'points': self.points,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_badges_by_category(category):
        """Get all badges in a specific category"""
        return Badge.query.filter_by(category=category, is_active=True).order_by(
            Badge.condition_value.asc()
        ).all()
    
    @staticmethod
    def check_task_badges(user_id, completed_tasks_count, current_streak):
        """Check which task-related badges user should unlock"""
        from .user_badge import UserBadge
        
        task_badges = Badge.get_badges_by_category('task')
        streak_badges = Badge.get_badges_by_category('streak')
        
        unlocked_badges = []
        
        # Check task count badges
        for badge in task_badges:
            # Skip if user already has this badge
            existing = UserBadge.query.filter_by(user_id=user_id, badge_id=badge.id).first()
            if existing:
                continue
            
            if badge.condition_type == 'count' and completed_tasks_count >= badge.condition_value:
                unlocked_badges.append(badge)
        
        # Check streak badges
        for badge in streak_badges:
            existing = UserBadge.query.filter_by(user_id=user_id, badge_id=badge.id).first()
            if existing:
                continue
            
            if badge.condition_type == 'streak' and current_streak >= badge.condition_value:
                unlocked_badges.append(badge)
        
        return unlocked_badges
    
    def __repr__(self):
        return f'<Badge {self.name}>'


class UserBadge(db.Model):
    """UserBadge model for tracking user-earned badges"""
    
    __tablename__ = 'user_badges'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badges.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=func.now())
    is_featured = db.Column(db.Boolean, default=False)  # Whether to highlight on profile
    
    # Unique constraint to prevent duplicate badge awards
    __table_args__ = (
        db.UniqueConstraint('user_id', 'badge_id', name='unique_user_badge'),
    )
    
    def to_dict(self):
        """Convert user badge to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'badge_id': self.badge_id,
            'badge': self.badge.to_dict() if self.badge else None,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None,
            'is_featured': self.is_featured
        }
    
    @staticmethod
    def award_badge(user_id, badge_id):
        """Award a badge to a user"""
        # Check if user already has this badge
        existing = UserBadge.query.filter_by(user_id=user_id, badge_id=badge_id).first()
        if existing:
            return existing, False  # Already exists
        
        # Create new user badge
        user_badge = UserBadge(user_id=user_id, badge_id=badge_id)
        db.session.add(user_badge)
        
        try:
            db.session.commit()
            return user_badge, True  # Successfully awarded
        except Exception as e:
            db.session.rollback()
            return None, False
    
    @staticmethod
    def get_user_badges(user_id, category=None):
        """Get all badges earned by a user, optionally filtered by category"""
        query = UserBadge.query.filter_by(user_id=user_id).join(Badge)
        
        if category:
            query = query.filter(Badge.category == category)
        
        return query.order_by(UserBadge.earned_at.desc()).all()
    
    @staticmethod
    def get_user_badge_stats(user_id):
        """Get badge statistics for a user"""
        user_badges = UserBadge.query.filter_by(user_id=user_id).join(Badge).all()
        
        if not user_badges:
            return {
                'total_badges': 0,
                'total_points': 0,
                'categories': {},
                'badge_types': {},
                'recent_badges': []
            }
        
        total_points = sum(ub.badge.points for ub in user_badges if ub.badge)
        
        # Group by categories
        categories = {}
        badge_types = {}
        
        for ub in user_badges:
            if ub.badge:
                # Count by category
                cat = ub.badge.category
                categories[cat] = categories.get(cat, 0) + 1
                
                # Count by type
                badge_type = ub.badge.type
                badge_types[badge_type] = badge_types.get(badge_type, 0) + 1
        
        # Get recent badges
        recent_badges = sorted(user_badges, key=lambda x: x.earned_at, reverse=True)[:5]
        
        return {
            'total_badges': len(user_badges),
            'total_points': total_points,
            'categories': categories,
            'badge_types': badge_types,
            'recent_badges': [ub.to_dict() for ub in recent_badges]
        }
    
    def __repr__(self):
        return f'<UserBadge User:{self.user_id} Badge:{self.badge_id}>'