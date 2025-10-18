"""
Badge Initialization for The Recharge Room API
"""

from app import db
from app.models.badge import Badge

def init_default_badges():
    """
    Initialize default badges in the database
    This should be called once when the app starts
    """
    try:
        # Check if badges already exist
        if Badge.query.count() > 0:
            return  # Badges already initialized
        
        # Define default badges
        default_badges = [
            # Task Completion Badges
            {
                'name': 'First Step',
                'description': 'Complete your first task',
                'icon': '🎯',
                'category': 'task',
                'type': 'bronze',
                'condition_type': 'count',
                'condition_value': 1,
                'points': 10
            },
            {
                'name': 'Getting Started',
                'description': 'Complete 5 tasks',
                'icon': '✅',
                'category': 'task',
                'type': 'bronze',
                'condition_type': 'count',
                'condition_value': 5,
                'points': 25
            },
            {
                'name': 'Task Warrior',
                'description': 'Complete 10 tasks',
                'icon': '🏹',
                'category': 'task',
                'type': 'silver',
                'condition_type': 'count',
                'condition_value': 10,
                'points': 50
            },
            {
                'name': 'Productivity Champion',
                'description': 'Complete 25 tasks',
                'icon': '🏆',
                'category': 'task',
                'type': 'gold',
                'condition_type': 'count',
                'condition_value': 25,
                'points': 100
            },
            {
                'name': 'Task Master',
                'description': 'Complete 50 tasks',
                'icon': '👑',
                'category': 'task',
                'type': 'platinum',
                'condition_type': 'count',
                'condition_value': 50,
                'points': 200
            },
            {
                'name': 'Century Club',
                'description': 'Complete 100 tasks',
                'icon': '💯',
                'category': 'task',
                'type': 'platinum',
                'condition_type': 'count',
                'condition_value': 100,
                'points': 500
            },
            
            # Streak Badges
            {
                'name': 'Consistency',
                'description': 'Complete tasks for 3 days in a row',
                'icon': '🔥',
                'category': 'streak',
                'type': 'bronze',
                'condition_type': 'streak',
                'condition_value': 3,
                'points': 30
            },
            {
                'name': 'Week Warrior',
                'description': 'Complete tasks for 7 days in a row',
                'icon': '⚡',
                'category': 'streak',
                'type': 'silver',
                'condition_type': 'streak',
                'condition_value': 7,
                'points': 75
            },
            {
                'name': 'Habit Builder',
                'description': 'Complete tasks for 14 days in a row',
                'icon': '🌟',
                'category': 'streak',
                'type': 'gold',
                'condition_type': 'streak',
                'condition_value': 14,
                'points': 150
            },
            {
                'name': 'Unstoppable',
                'description': 'Complete tasks for 30 days in a row',
                'icon': '🚀',
                'category': 'streak',
                'type': 'platinum',
                'condition_type': 'streak',
                'condition_value': 30,
                'points': 300
            },
            
            # Mood Tracking Badges
            {
                'name': 'Mood Tracker',
                'description': 'Log your first mood',
                'icon': '😊',
                'category': 'mood',
                'type': 'bronze',
                'condition_type': 'count',
                'condition_value': 1,
                'points': 10
            },
            {
                'name': 'Emotional Awareness',
                'description': 'Log 10 moods',
                'icon': '🎭',
                'category': 'mood',
                'type': 'silver',
                'condition_type': 'count',
                'condition_value': 10,
                'points': 50
            },
            {
                'name': 'Mood Master',
                'description': 'Log 30 moods',
                'icon': '🌈',
                'category': 'mood',
                'type': 'gold',
                'condition_type': 'count',
                'condition_value': 30,
                'points': 100
            },
            {
                'name': 'Mindful Soul',
                'description': 'Log 100 moods',
                'icon': '🧘',
                'category': 'mood',
                'type': 'platinum',
                'condition_type': 'count',
                'condition_value': 100,
                'points': 250
            },
            
            # Journal Badges
            {
                'name': 'First Thoughts',
                'description': 'Write your first journal entry',
                'icon': '📝',
                'category': 'journal',
                'type': 'bronze',
                'condition_type': 'count',
                'condition_value': 1,
                'points': 15
            },
            {
                'name': 'Reflective Writer',
                'description': 'Write 5 journal entries',
                'icon': '✍️',
                'category': 'journal',
                'type': 'silver',
                'condition_type': 'count',
                'condition_value': 5,
                'points': 50
            },
            {
                'name': 'Journal Keeper',
                'description': 'Write 15 journal entries',
                'icon': '📖',
                'category': 'journal',
                'type': 'gold',
                'condition_type': 'count',
                'condition_value': 15,
                'points': 100
            },
            {
                'name': 'Master Storyteller',
                'description': 'Write 50 journal entries',
                'icon': '📚',
                'category': 'journal',
                'type': 'platinum',
                'condition_type': 'count',
                'condition_value': 50,
                'points': 300
            },
            
            # Voice Notes Badges
            {
                'name': 'Voice Recorder',
                'description': 'Save your first voice note',
                'icon': '🎙️',
                'category': 'voice',
                'type': 'bronze',
                'condition_type': 'count',
                'condition_value': 1,
                'points': 15
            },
            {
                'name': 'Speaker',
                'description': 'Save 10 voice notes',
                'icon': '🗣️',
                'category': 'voice',
                'type': 'silver',
                'condition_type': 'count',
                'condition_value': 10,
                'points': 75
            },
            {
                'name': 'Voice Master',
                'description': 'Save 25 voice notes',
                'icon': '🎵',
                'category': 'voice',
                'type': 'gold',
                'condition_type': 'count',
                'condition_value': 25,
                'points': 150
            },
            
            # Special Achievement Badges
            {
                'name': 'Early Adopter',
                'description': 'One of the first users of The Recharge Room',
                'icon': '🌱',
                'category': 'special',
                'type': 'gold',
                'condition_type': 'milestone',
                'condition_value': 1,
                'points': 100
            },
            {
                'name': 'Wellness Explorer',
                'description': 'Use all features: tasks, moods, journal, and voice notes',
                'icon': '🧭',
                'category': 'special',
                'type': 'gold',
                'condition_type': 'milestone',
                'condition_value': 4,
                'points': 200
            },
            {
                'name': 'Badge Collector',
                'description': 'Earn 10 different badges',
                'icon': '🏅',
                'category': 'special',
                'type': 'platinum',
                'condition_type': 'count',
                'condition_value': 10,
                'points': 250
            },
            {
                'name': 'Completionist',
                'description': 'Earn all available badges',
                'icon': '💎',
                'category': 'special',
                'type': 'platinum',
                'condition_type': 'milestone',
                'condition_value': 100,
                'points': 1000
            },
            
            # Daily Activity Badges
            {
                'name': 'Daily Warrior',
                'description': 'Complete a task, log a mood, and write a journal entry in one day',
                'icon': '⭐',
                'category': 'daily',
                'type': 'silver',
                'condition_type': 'milestone',
                'condition_value': 1,
                'points': 75
            },
            {
                'name': 'Perfect Day',
                'description': 'Use all four features (task, mood, journal, voice) in one day',
                'icon': '🌟',
                'category': 'daily',
                'type': 'gold',
                'condition_type': 'milestone',
                'condition_value': 1,
                'points': 125
            },
        ]
        
        # Create badges
        for badge_data in default_badges:
            badge = Badge(**badge_data)
            db.session.add(badge)
        
        db.session.commit()
        print(f"Successfully initialized {len(default_badges)} default badges")
        
    except Exception as e:
        db.session.rollback()
        print(f"Error initializing badges: {str(e)}")

def add_custom_badge(name, description, icon, category, badge_type, condition_type, condition_value, points):
    """
    Add a custom badge to the database
    
    Args:
        name (str): Badge name
        description (str): Badge description
        icon (str): Badge icon (emoji or identifier)
        category (str): Badge category
        badge_type (str): Badge type (bronze, silver, gold, platinum)
        condition_type (str): Condition type (count, streak, milestone)
        condition_value (int): Value required to unlock
        points (int): Points awarded for earning
        
    Returns:
        Badge: Created badge object or None if error
    """
    try:
        # Check if badge with same name exists
        existing = Badge.query.filter_by(name=name).first()
        if existing:
            print(f"Badge '{name}' already exists")
            return existing
        
        badge = Badge(
            name=name,
            description=description,
            icon=icon,
            category=category,
            type=badge_type,
            condition_type=condition_type,
            condition_value=condition_value,
            points=points
        )
        
        db.session.add(badge)
        db.session.commit()
        
        print(f"Successfully added custom badge: {name}")
        return badge
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding custom badge: {str(e)}")
        return None

def update_badge(badge_id, **kwargs):
    """
    Update an existing badge
    
    Args:
        badge_id (int): Badge ID to update
        **kwargs: Fields to update
        
    Returns:
        Badge: Updated badge object or None if error
    """
    try:
        badge = Badge.query.get(badge_id)
        if not badge:
            print(f"Badge with ID {badge_id} not found")
            return None
        
        # Update provided fields
        for key, value in kwargs.items():
            if hasattr(badge, key):
                setattr(badge, key, value)
        
        db.session.commit()
        print(f"Successfully updated badge: {badge.name}")
        return badge
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating badge: {str(e)}")
        return None

def disable_badge(badge_id):
    """
    Disable a badge (set is_active to False)
    
    Args:
        badge_id (int): Badge ID to disable
        
    Returns:
        bool: True if successful
    """
    try:
        badge = Badge.query.get(badge_id)
        if not badge:
            print(f"Badge with ID {badge_id} not found")
            return False
        
        badge.is_active = False
        db.session.commit()
        
        print(f"Successfully disabled badge: {badge.name}")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"Error disabling badge: {str(e)}")
        return False

def get_badge_stats():
    """
    Get statistics about badges in the system
    
    Returns:
        dict: Badge statistics
    """
    try:
        total_badges = Badge.query.count()
        active_badges = Badge.query.filter_by(is_active=True).count()
        
        # Count by category
        categories = db.session.query(Badge.category, db.func.count(Badge.id)).group_by(Badge.category).all()
        category_counts = {cat: count for cat, count in categories}
        
        # Count by type
        types = db.session.query(Badge.type, db.func.count(Badge.id)).group_by(Badge.type).all()
        type_counts = {badge_type: count for badge_type, count in types}
        
        return {
            'total_badges': total_badges,
            'active_badges': active_badges,
            'inactive_badges': total_badges - active_badges,
            'categories': category_counts,
            'types': type_counts
        }
        
    except Exception as e:
        print(f"Error getting badge stats: {str(e)}")
        return {}