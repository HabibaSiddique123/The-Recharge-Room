"""
Mood Model for Mood Tracking
"""

from datetime import datetime
from sqlalchemy.sql import func
from app import db

class Mood(db.Model):
    """Mood model for tracking user emotions and moods"""
    
    __tablename__ = 'moods'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    emoji = db.Column(db.String(10), nullable=False)  # Emoji representation
    label = db.Column(db.String(50), nullable=False)  # Text label (happy, sad, excited, etc.)
    intensity = db.Column(db.Integer, default=5)  # 1-10 scale
    notes = db.Column(db.Text)  # Optional notes about the mood
    created_at = db.Column(db.DateTime, default=func.now())
    
    # Predefined mood types with their motivational quotes
    MOOD_QUOTES = {
        'happy': [
            "Keep shining! Your positive energy is contagious! ✨",
            "Happiness looks good on you! Keep spreading those good vibes! 😊",
            "You're radiating joy today! Keep that beautiful smile! 🌟"
        ],
        'excited': [
            "Your excitement is infectious! Channel that energy into something amazing! 🚀",
            "Excitement is the spark of achievement! Go make things happen! ⚡",
            "That enthusiasm will take you places! Keep that fire burning! 🔥"
        ],
        'calm': [
            "Peace of mind is a beautiful thing. Enjoy this tranquil moment. 🕊️",
            "In calmness, you find clarity. Trust your inner wisdom. 🧘",
            "Serenity is your superpower. Let it guide you forward. 🌊"
        ],
        'motivated': [
            "You've got this! Your motivation is the key to your success! 💪",
            "When motivation meets opportunity, magic happens! ✨",
            "Your drive is unstoppable! Keep pushing towards your dreams! 🎯"
        ],
        'grateful': [
            "Gratitude turns what you have into enough. Beautiful mindset! 🙏",
            "A grateful heart is a magnet for miracles! Keep appreciating! 💖",
            "Your gratitude is creating more reasons to be grateful! 🌻"
        ],
        'anxious': [
            "Breathe. You've overcome challenges before, and you will again. 🌸",
            "Anxiety is temporary, but your strength is permanent. You've got this! 💜",
            "One step at a time. You're stronger than your worries. 🌱"
        ],
        'sad': [
            "It's okay to feel sad. Tomorrow brings new possibilities. 🌅",
            "Even storms pass. Brighter days are ahead, dear friend. 🌈",
            "Your feelings are valid. Take care of yourself today. 💙"
        ],
        'stressed': [
            "Stress is temporary, but your resilience is permanent. Take a deep breath. 🌬️",
            "You're handling more than you know. Be proud of your strength. 🦋",
            "One thing at a time. You don't have to carry it all at once. 🎋"
        ],
        'tired': [
            "Rest is not a luxury, it's a necessity. Be kind to yourself. 😴",
            "Even superheroes need to recharge. Take the rest you deserve. ⚡",
            "Your body and mind are asking for care. Listen to them. 🌙"
        ],
        'angry': [
            "Your anger is valid. Use this energy to create positive change. 🔥",
            "Strong emotions show you care deeply. Channel that passion wisely. ⚡",
            "It's okay to feel angry. Take time to process and heal. 🌱"
        ],
        'confused': [
            "Confusion is the first step to clarity. You're on the right path. 🧭",
            "Not knowing is uncomfortable, but it's also full of possibility. 🌟",
            "It's okay not to have all the answers right now. Trust the process. 🛤️"
        ],
        'lonely': [
            "You are never truly alone. You matter more than you know. 💝",
            "Loneliness is temporary. Connection is always possible. 🌸",
            "Your presence in this world makes a difference. Believe it. ✨"
        ]
    }
    
    def get_motivational_quote(self):
        """Get a motivational quote based on the mood"""
        import random
        quotes = self.MOOD_QUOTES.get(self.label.lower(), [
            "Every moment is a fresh beginning. 🌟",
            "You're exactly where you need to be right now. 💫",
            "Trust yourself. You know more than you think you do. 🦋"
        ])
        return random.choice(quotes)
    
    def to_dict(self):
        """Convert mood to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'emoji': self.emoji,
            'label': self.label,
            'intensity': self.intensity,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'motivational_quote': self.get_motivational_quote()
        }
    
    @staticmethod
    def get_mood_stats(user_id, days=30):
        """Get mood statistics for visualization"""
        from datetime import timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        moods = Mood.query.filter(
            Mood.user_id == user_id,
            Mood.created_at >= start_date,
            Mood.created_at <= end_date
        ).all()
        
        # Count moods by type
        mood_counts = {}
        for mood in moods:
            label = mood.label.lower()
            mood_counts[label] = mood_counts.get(label, 0) + 1
        
        # Calculate average intensity
        if moods:
            avg_intensity = sum(mood.intensity for mood in moods) / len(moods)
        else:
            avg_intensity = 0
        
        return {
            'mood_counts': mood_counts,
            'total_entries': len(moods),
            'average_intensity': round(avg_intensity, 1),
            'period_days': days
        }
    
    @staticmethod
    def get_mood_trends(user_id, days=7):
        """Get recent mood trends for dashboard"""
        from datetime import timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        recent_moods = Mood.query.filter(
            Mood.user_id == user_id,
            Mood.created_at >= start_date
        ).order_by(Mood.created_at.desc()).all()
        
        return [mood.to_dict() for mood in recent_moods]
    
    def __repr__(self):
        return f'<Mood {self.label} - {self.emoji}>'