"""
Voice Notes Routes for The Recharge Room API
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.voice_note import VoiceNote

voice_bp = Blueprint('voice', __name__)

@voice_bp.route('/save', methods=['POST'])
@jwt_required()
def save_voice_note():
    """Save a transcribed voice note"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('transcription'):
            return jsonify({'error': 'Transcription text is required'}), 400
        
        # Create new voice note
        voice_note = VoiceNote(
            user_id=user_id,
            title=data.get('title', '').strip(),
            transcription=data['transcription'].strip(),
            duration_seconds=data.get('duration_seconds'),
            language=data.get('language', 'en'),
            confidence_score=data.get('confidence_score'),
            tags=data.get('tags', '')
        )
        
        # Validate confidence score (0-1)
        if voice_note.confidence_score is not None:
            if not 0 <= voice_note.confidence_score <= 1:
                voice_note.confidence_score = None
        
        # Validate duration
        if voice_note.duration_seconds is not None:
            if voice_note.duration_seconds < 0:
                voice_note.duration_seconds = None
        
        # Handle tags if provided as list
        if isinstance(data.get('tags'), list):
            voice_note.set_tags_list(data['tags'])
        
        db.session.add(voice_note)
        db.session.commit()
        
        return jsonify({
            'message': 'Voice note saved successfully',
            'voice_note': voice_note.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/', methods=['GET'])
@jwt_required()
def get_voice_notes():
    """Get all voice notes for the user"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get('limit', type=int)
        language = request.args.get('language')
        tag = request.args.get('tag')
        
        # Build query
        query = VoiceNote.query.filter_by(user_id=user_id)
        
        if language:
            query = query.filter_by(language=language)
        
        if tag:
            query = query.filter(VoiceNote.tags.contains(tag))
        
        # Order by most recent first
        query = query.order_by(VoiceNote.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        notes = query.all()
        
        return jsonify({
            'voice_notes': [note.to_dict() for note in notes],
            'count': len(notes)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/<int:note_id>', methods=['GET'])
@jwt_required()
def get_voice_note(note_id):
    """Get a specific voice note"""
    try:
        user_id = get_jwt_identity()
        
        note = VoiceNote.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return jsonify({'error': 'Voice note not found'}), 404
        
        return jsonify({
            'voice_note': note.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/<int:note_id>', methods=['PUT'])
@jwt_required()
def update_voice_note(note_id):
    """Update a voice note"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        note = VoiceNote.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return jsonify({'error': 'Voice note not found'}), 404
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields
        if 'title' in data:
            note.title = data['title'].strip()
        
        if 'transcription' in data and data['transcription'].strip():
            note.transcription = data['transcription'].strip()
        
        if 'tags' in data:
            if isinstance(data['tags'], list):
                note.set_tags_list(data['tags'])
            else:
                note.tags = data['tags'].strip()
        
        if 'duration_seconds' in data:
            duration = data['duration_seconds']
            if duration is None or duration >= 0:
                note.duration_seconds = duration
        
        if 'confidence_score' in data:
            confidence = data['confidence_score']
            if confidence is None or (0 <= confidence <= 1):
                note.confidence_score = confidence
        
        if 'language' in data and data['language'].strip():
            note.language = data['language'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Voice note updated successfully',
            'voice_note': note.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_voice_note(note_id):
    """Delete a voice note"""
    try:
        user_id = get_jwt_identity()
        
        note = VoiceNote.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return jsonify({'error': 'Voice note not found'}), 404
        
        db.session.delete(note)
        db.session.commit()
        
        return jsonify({
            'message': 'Voice note deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_voice_note_stats():
    """Get voice note statistics"""
    try:
        user_id = get_jwt_identity()
        
        stats = VoiceNote.get_user_stats(user_id)
        
        return jsonify({
            'stats': stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/search', methods=['GET'])
@jwt_required()
def search_voice_notes():
    """Search voice notes by transcription, title, or tags"""
    try:
        user_id = get_jwt_identity()
        query_text = request.args.get('q', '').strip()
        
        if not query_text:
            return jsonify({'error': 'Search query is required'}), 400
        
        notes = VoiceNote.search_notes(user_id, query_text)
        
        return jsonify({
            'voice_notes': [note.to_dict() for note in notes],
            'count': len(notes),
            'search_query': query_text
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/by-tag/<tag>', methods=['GET'])
@jwt_required()
def get_notes_by_tag(tag):
    """Get voice notes by specific tag"""
    try:
        user_id = get_jwt_identity()
        
        notes = VoiceNote.get_notes_by_tag(user_id, tag)
        
        return jsonify({
            'voice_notes': [note.to_dict() for note in notes],
            'count': len(notes),
            'tag': tag
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_notes():
    """Get recent voice notes"""
    try:
        user_id = get_jwt_identity()
        
        limit = request.args.get('limit', 10, type=int)
        
        recent_notes = VoiceNote.get_recent_notes(user_id, limit)
        
        return jsonify({
            'recent_notes': [note.to_dict() for note in recent_notes],
            'count': len(recent_notes)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/by-language/<language>', methods=['GET'])
@jwt_required()
def get_notes_by_language(language):
    """Get voice notes by language"""
    try:
        user_id = get_jwt_identity()
        
        notes = VoiceNote.query.filter_by(
            user_id=user_id, 
            language=language
        ).order_by(VoiceNote.created_at.desc()).all()
        
        return jsonify({
            'voice_notes': [note.to_dict() for note in notes],
            'count': len(notes),
            'language': language
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/languages', methods=['GET'])
@jwt_required()
def get_used_languages():
    """Get list of languages used in voice notes"""
    try:
        user_id = get_jwt_identity()
        
        # Get distinct languages
        languages = db.session.query(VoiceNote.language.distinct()).filter_by(
            user_id=user_id
        ).all()
        
        language_list = [lang[0] for lang in languages if lang[0]]
        
        return jsonify({
            'languages': language_list,
            'count': len(language_list)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/tags', methods=['GET'])
@jwt_required()
def get_all_tags():
    """Get all tags used in voice notes"""
    try:
        user_id = get_jwt_identity()
        
        # Get all notes with tags
        notes_with_tags = VoiceNote.query.filter_by(user_id=user_id).filter(
            VoiceNote.tags != '',
            VoiceNote.tags.isnot(None)
        ).all()
        
        # Extract unique tags
        all_tags = set()
        for note in notes_with_tags:
            tags = note.get_tags_list()
            all_tags.update(tags)
        
        return jsonify({
            'tags': sorted(list(all_tags)),
            'count': len(all_tags)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/bulk-tag', methods=['POST'])
@jwt_required()
def bulk_tag_notes():
    """Add tags to multiple voice notes"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('note_ids') or not data.get('tags'):
            return jsonify({'error': 'Note IDs and tags are required'}), 400
        
        note_ids = data['note_ids']
        new_tags = data['tags']
        
        if not isinstance(note_ids, list) or not isinstance(new_tags, list):
            return jsonify({'error': 'Note IDs and tags must be lists'}), 400
        
        # Get notes
        notes = VoiceNote.query.filter(
            VoiceNote.id.in_(note_ids),
            VoiceNote.user_id == user_id
        ).all()
        
        if not notes:
            return jsonify({'error': 'No notes found'}), 404
        
        # Update tags
        updated_notes = []
        for note in notes:
            existing_tags = note.get_tags_list()
            combined_tags = list(set(existing_tags + new_tags))
            note.set_tags_list(combined_tags)
            updated_notes.append(note.to_dict())
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully tagged {len(updated_notes)} notes',
            'updated_notes': updated_notes,
            'added_tags': new_tags
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@voice_bp.route('/export-transcriptions', methods=['GET'])
@jwt_required()
def export_transcriptions():
    """Export all transcriptions as plain text"""
    try:
        user_id = get_jwt_identity()
        
        notes = VoiceNote.query.filter_by(user_id=user_id).order_by(
            VoiceNote.created_at.desc()
        ).all()
        
        if not notes:
            return jsonify({'error': 'No voice notes to export'}), 404
        
        # Create text content
        text_content = []
        text_content.append("Voice Notes Transcriptions Export")
        text_content.append("=" * 50)
        text_content.append("")
        
        for note in notes:
            text_content.append(f"Title: {note.title or 'Untitled'}")
            text_content.append(f"Date: {note.created_at.strftime('%Y-%m-%d %H:%M:%S') if note.created_at else 'Unknown'}")
            text_content.append(f"Duration: {note.format_duration()}")
            text_content.append(f"Language: {note.language or 'Unknown'}")
            if note.get_tags_list():
                text_content.append(f"Tags: {', '.join(note.get_tags_list())}")
            text_content.append("")
            text_content.append("Transcription:")
            text_content.append(note.transcription)
            text_content.append("")
            text_content.append("-" * 30)
            text_content.append("")
        
        # Join all content
        export_text = "\n".join(text_content)
        
        return jsonify({
            'export_data': export_text,
            'total_notes': len(notes),
            'filename': 'voice_notes_transcriptions.txt'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500