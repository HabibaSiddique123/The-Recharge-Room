"""
Journal Routes for The Recharge Room API
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.journal import Journal

journal_bp = Blueprint('journal', __name__)

@journal_bp.route('/add', methods=['POST'])
@jwt_required()
def add_journal_entry():
    """Create a new journal entry"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('content'):
            return jsonify({'error': 'Journal content is required'}), 400
        
        # Create new journal entry
        journal_entry = Journal(
            user_id=user_id,
            title=data.get('title', '').strip(),
            content=data['content'].strip(),
            theme=data.get('theme', 'plain'),
            mood_tag=data.get('mood_tag', '').strip(),
            is_private=data.get('is_private', True)
        )
        
        # Validate theme
        if journal_entry.theme not in Journal.THEMES:
            journal_entry.theme = 'plain'
        
        db.session.add(journal_entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Journal entry created successfully',
            'journal': journal_entry.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/', methods=['GET'])
@jwt_required()
def get_journal_entries():
    """Get all journal entries for the user"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get('limit', type=int)
        theme = request.args.get('theme')
        mood_tag = request.args.get('mood_tag')
        
        # Build query
        query = Journal.query.filter_by(user_id=user_id)
        
        if theme:
            query = query.filter_by(theme=theme)
        
        if mood_tag:
            query = query.filter_by(mood_tag=mood_tag)
        
        # Order by most recent first
        query = query.order_by(Journal.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        entries = query.all()
        
        return jsonify({
            'entries': [entry.to_dict() for entry in entries],
            'count': len(entries)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/<int:entry_id>', methods=['GET'])
@jwt_required()
def get_journal_entry(entry_id):
    """Get a specific journal entry"""
    try:
        user_id = get_jwt_identity()
        
        entry = Journal.query.filter_by(id=entry_id, user_id=user_id).first()
        if not entry:
            return jsonify({'error': 'Journal entry not found'}), 404
        
        return jsonify({
            'journal': entry.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_journal_entry(entry_id):
    """Update a journal entry"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        entry = Journal.query.filter_by(id=entry_id, user_id=user_id).first()
        if not entry:
            return jsonify({'error': 'Journal entry not found'}), 404
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields
        if 'title' in data:
            entry.title = data['title'].strip()
        
        if 'content' in data and data['content'].strip():
            entry.content = data['content'].strip()
        
        if 'theme' in data and data['theme'] in Journal.THEMES:
            entry.theme = data['theme']
        
        if 'mood_tag' in data:
            entry.mood_tag = data['mood_tag'].strip()
        
        if 'is_private' in data:
            entry.is_private = bool(data['is_private'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Journal entry updated successfully',
            'journal': entry.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_journal_entry(entry_id):
    """Delete a journal entry"""
    try:
        user_id = get_jwt_identity()
        
        entry = Journal.query.filter_by(id=entry_id, user_id=user_id).first()
        if not entry:
            return jsonify({'error': 'Journal entry not found'}), 404
        
        db.session.delete(entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Journal entry deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_journal_stats():
    """Get journal statistics"""
    try:
        user_id = get_jwt_identity()
        
        stats = Journal.get_user_stats(user_id)
        
        return jsonify({
            'stats': stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_entries():
    """Get recent journal entries"""
    try:
        user_id = get_jwt_identity()
        
        limit = request.args.get('limit', 10, type=int)
        
        recent_entries = Journal.get_recent_entries(user_id, limit)
        
        return jsonify({
            'recent_entries': [entry.to_dict() for entry in recent_entries],
            'count': len(recent_entries)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/search', methods=['GET'])
@jwt_required()
def search_journal_entries():
    """Search journal entries"""
    try:
        user_id = get_jwt_identity()
        query_text = request.args.get('q', '').strip()
        
        if not query_text:
            return jsonify({'error': 'Search query is required'}), 400
        
        entries = Journal.search_entries(user_id, query_text)
        
        return jsonify({
            'entries': [entry.to_dict() for entry in entries],
            'count': len(entries),
            'search_query': query_text
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/themes', methods=['GET'])
def get_available_themes():
    """Get available journal themes"""
    try:
        return jsonify({
            'themes': Journal.THEMES
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/by-theme/<theme>', methods=['GET'])
@jwt_required()
def get_entries_by_theme(theme):
    """Get journal entries by specific theme"""
    try:
        user_id = get_jwt_identity()
        
        if theme not in Journal.THEMES:
            return jsonify({'error': 'Invalid theme'}), 400
        
        entries = Journal.query.filter_by(
            user_id=user_id, 
            theme=theme
        ).order_by(Journal.created_at.desc()).all()
        
        return jsonify({
            'entries': [entry.to_dict() for entry in entries],
            'count': len(entries),
            'theme': theme
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/by-mood/<mood_tag>', methods=['GET'])
@jwt_required()
def get_entries_by_mood(mood_tag):
    """Get journal entries by mood tag"""
    try:
        user_id = get_jwt_identity()
        
        entries = Journal.query.filter_by(
            user_id=user_id, 
            mood_tag=mood_tag
        ).order_by(Journal.created_at.desc()).all()
        
        return jsonify({
            'entries': [entry.to_dict() for entry in entries],
            'count': len(entries),
            'mood_tag': mood_tag
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/word-cloud', methods=['GET'])
@jwt_required()
def get_word_cloud_data():
    """Get word frequency data for word cloud generation"""
    try:
        user_id = get_jwt_identity()
        
        # Get all journal entries
        entries = Journal.query.filter_by(user_id=user_id).all()
        
        if not entries:
            return jsonify({'error': 'No journal entries found'}), 404
        
        # Extract and count words
        word_counts = {}
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'}
        
        for entry in entries:
            if entry.content:
                words = entry.content.lower().split()
                for word in words:
                    # Clean word (remove punctuation)
                    clean_word = ''.join(c for c in word if c.isalnum())
                    if len(clean_word) > 3 and clean_word not in stop_words:
                        word_counts[clean_word] = word_counts.get(clean_word, 0) + 1
        
        # Get top 50 most frequent words
        top_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:50]
        
        return jsonify({
            'word_cloud_data': [{'word': word, 'frequency': freq} for word, freq in top_words],
            'total_entries': len(entries)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500