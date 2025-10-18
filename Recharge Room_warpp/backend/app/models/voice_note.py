"""
Voice Note Model for Transcribed Voice Recordings
"""

from datetime import datetime
from sqlalchemy.sql import func
from app import db

class VoiceNote(db.Model):
    """Voice note model for storing transcribed voice recordings"""
    
    __tablename__ = 'voice_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200))  # Optional title
    transcription = db.Column(db.Text, nullable=False)  # Transcribed text
    duration_seconds = db.Column(db.Integer)  # Duration of original recording
    language = db.Column(db.String(10), default='en')  # Language code
    confidence_score = db.Column(db.Float)  # Transcription confidence (0-1)
    tags = db.Column(db.String(500))  # Comma-separated tags
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())
    
    def to_dict(self):
        """Convert voice note to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'transcription': self.transcription,
            'duration_seconds': self.duration_seconds,
            'language': self.language,
            'confidence_score': self.confidence_score,
            'tags': self.get_tags_list(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'word_count': len(self.transcription.split()) if self.transcription else 0,
            'excerpt': self.get_excerpt()
        }
    
    def get_tags_list(self):
        """Get tags as a list"""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
    
    def set_tags_list(self, tags_list):
        """Set tags from a list"""
        if isinstance(tags_list, list):
            self.tags = ', '.join(tags_list)
        else:
            self.tags = tags_list
    
    def get_excerpt(self, words=20):
        """Get an excerpt of the transcription"""
        if not self.transcription:
            return ""
        
        words_list = self.transcription.split()
        if len(words_list) <= words:
            return self.transcription
        
        return ' '.join(words_list[:words]) + '...'
    
    def format_duration(self):
        """Format duration in human-readable format"""
        if not self.duration_seconds:
            return "Unknown duration"
        
        minutes = self.duration_seconds // 60
        seconds = self.duration_seconds % 60
        
        if minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    @staticmethod
    def get_user_stats(user_id):
        """Get voice note statistics for a user"""
        notes = VoiceNote.query.filter_by(user_id=user_id).all()
        
        if not notes:
            return {
                'total_notes': 0,
                'total_duration': 0,
                'total_words': 0,
                'average_duration': 0,
                'average_words_per_note': 0,
                'languages_used': [],
                'most_recent_note': None
            }
        
        total_duration = sum(note.duration_seconds for note in notes if note.duration_seconds)
        total_words = sum(len(note.transcription.split()) for note in notes if note.transcription)
        languages = list(set(note.language for note in notes if note.language))
        
        # Most recent note
        most_recent = max(notes, key=lambda x: x.created_at)
        
        return {
            'total_notes': len(notes),
            'total_duration': total_duration,
            'total_words': total_words,
            'average_duration': round(total_duration / len(notes), 1) if notes else 0,
            'average_words_per_note': round(total_words / len(notes), 1) if notes else 0,
            'languages_used': languages,
            'most_recent_note': most_recent.to_dict() if most_recent else None
        }
    
    @staticmethod
    def search_notes(user_id, query):
        """Search voice notes by transcription or title"""
        return VoiceNote.query.filter_by(user_id=user_id).filter(
            db.or_(
                VoiceNote.transcription.contains(query),
                VoiceNote.title.contains(query),
                VoiceNote.tags.contains(query)
            )
        ).order_by(VoiceNote.created_at.desc()).all()
    
    @staticmethod
    def get_notes_by_tag(user_id, tag):
        """Get voice notes by specific tag"""
        return VoiceNote.query.filter_by(user_id=user_id).filter(
            VoiceNote.tags.contains(tag)
        ).order_by(VoiceNote.created_at.desc()).all()
    
    @staticmethod
    def get_recent_notes(user_id, limit=10):
        """Get recent voice notes for a user"""
        return VoiceNote.query.filter_by(user_id=user_id).order_by(
            VoiceNote.created_at.desc()
        ).limit(limit).all()
    
    def __repr__(self):
        return f'<VoiceNote {self.id}: {self.title or "Untitled"}>'