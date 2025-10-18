"""
Journal Model for Journal Entries
"""

from datetime import datetime
from sqlalchemy.sql import func
from app import db

class Journal(db.Model):
    """Journal model for user journal entries"""
    
    __tablename__ = 'journal_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200))  # Optional title
    content = db.Column(db.Text, nullable=False)  # Main journal content
    theme = db.Column(db.String(20), default='plain')  # plain, lined, dark
    mood_tag = db.Column(db.String(50))  # Optional mood associated with entry
    is_private = db.Column(db.Boolean, default=True)  # Privacy setting
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())
    
    # Available themes
    THEMES = ['plain', 'lined', 'dark', 'minimal', 'colorful']
    
    def to_dict(self):
        """Convert journal entry to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'theme': self.theme,
            'mood_tag': self.mood_tag,
            'is_private': self.is_private,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'word_count': len(self.content.split()) if self.content else 0
        }
    
    def get_excerpt(self, words=30):
        """Get an excerpt of the journal entry"""
        if not self.content:
            return ""
        
        content_words = self.content.split()
        if len(content_words) <= words:
            return self.content
        
        return ' '.join(content_words[:words]) + '...'
    
    @staticmethod
    def get_user_stats(user_id):
        """Get journal statistics for a user"""
        entries = Journal.query.filter_by(user_id=user_id).all()
        
        if not entries:
            return {
                'total_entries': 0,
                'total_words': 0,
                'average_words_per_entry': 0,
                'themes_used': [],
                'most_recent_entry': None,
                'longest_entry': None
            }
        
        total_words = sum(len(entry.content.split()) for entry in entries if entry.content)
        themes_used = list(set(entry.theme for entry in entries if entry.theme))
        
        # Find longest entry
        longest_entry = max(entries, key=lambda x: len(x.content.split()) if x.content else 0)
        
        # Most recent entry
        most_recent = max(entries, key=lambda x: x.created_at)
        
        return {
            'total_entries': len(entries),
            'total_words': total_words,
            'average_words_per_entry': round(total_words / len(entries), 1),
            'themes_used': themes_used,
            'most_recent_entry': most_recent.to_dict() if most_recent else None,
            'longest_entry': {
                'id': longest_entry.id,
                'word_count': len(longest_entry.content.split()) if longest_entry.content else 0,
                'title': longest_entry.title,
                'created_at': longest_entry.created_at.isoformat()
            } if longest_entry else None
        }
    
    @staticmethod
    def get_recent_entries(user_id, limit=10):
        """Get recent journal entries for a user"""
        return Journal.query.filter_by(user_id=user_id).order_by(
            Journal.created_at.desc()
        ).limit(limit).all()
    
    @staticmethod
    def search_entries(user_id, query):
        """Search journal entries by content or title"""
        return Journal.query.filter_by(user_id=user_id).filter(
            db.or_(
                Journal.content.contains(query),
                Journal.title.contains(query)
            )
        ).order_by(Journal.created_at.desc()).all()
    
    def __repr__(self):
        return f'<Journal Entry {self.id}: {self.title or "Untitled"}>'