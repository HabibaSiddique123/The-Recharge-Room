"""
Mood Tracker Routes for The Recharge Room API
"""

from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.mood import Mood
from datetime import datetime
import csv
import io

mood_bp = Blueprint('mood', __name__)

@mood_bp.route('/add', methods=['POST'])
@jwt_required()
def add_mood():
    """Add a new mood entry"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('emoji') or not data.get('label'):
            return jsonify({'error': 'Emoji and label are required'}), 400
        
        # Create new mood entry
        mood = Mood(
            user_id=user_id,
            emoji=data['emoji'].strip(),
            label=data['label'].strip().lower(),
            intensity=data.get('intensity', 5),
            notes=data.get('notes', '').strip()
        )
        
        # Validate intensity (1-10)
        if not 1 <= mood.intensity <= 10:
            mood.intensity = 5
        
        db.session.add(mood)
        db.session.commit()
        
        # Get motivational quote
        motivational_quote = mood.get_motivational_quote()
        
        mood_dict = mood.to_dict()
        
        return jsonify({
            'message': 'Mood saved successfully',
            'mood': mood_dict,
            'motivational_quote': motivational_quote
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/history', methods=['GET'])
@jwt_required()
def get_mood_history():
    """Get mood history for the user"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        days = request.args.get('days', type=int)
        
        # Build query
        query = Mood.query.filter_by(user_id=user_id)
        
        if days:
            from datetime import timedelta
            start_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Mood.created_at >= start_date)
        
        # Order by most recent first
        moods = query.order_by(Mood.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'moods': [mood.to_dict() for mood in moods],
            'count': len(moods)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/<int:mood_id>', methods=['GET'])
@jwt_required()
def get_mood(mood_id):
    """Get a specific mood entry"""
    try:
        user_id = get_jwt_identity()
        
        mood = Mood.query.filter_by(id=mood_id, user_id=user_id).first()
        if not mood:
            return jsonify({'error': 'Mood entry not found'}), 404
        
        return jsonify({
            'mood': mood.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/<int:mood_id>', methods=['PUT'])
@jwt_required()
def update_mood(mood_id):
    """Update a mood entry"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        mood = Mood.query.filter_by(id=mood_id, user_id=user_id).first()
        if not mood:
            return jsonify({'error': 'Mood entry not found'}), 404
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields
        if 'emoji' in data and data['emoji'].strip():
            mood.emoji = data['emoji'].strip()
        
        if 'label' in data and data['label'].strip():
            mood.label = data['label'].strip().lower()
        
        if 'intensity' in data:
            intensity = data['intensity']
            if 1 <= intensity <= 10:
                mood.intensity = intensity
        
        if 'notes' in data:
            mood.notes = data['notes'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Mood updated successfully',
            'mood': mood.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/<int:mood_id>', methods=['DELETE'])
@jwt_required()
def delete_mood(mood_id):
    """Delete a mood entry"""
    try:
        user_id = get_jwt_identity()
        
        mood = Mood.query.filter_by(id=mood_id, user_id=user_id).first()
        if not mood:
            return jsonify({'error': 'Mood entry not found'}), 404
        
        db.session.delete(mood)
        db.session.commit()
        
        return jsonify({
            'message': 'Mood entry deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_mood_stats():
    """Get mood statistics for visualization"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        
        stats = Mood.get_mood_stats(user_id, days)
        
        return jsonify({
            'stats': stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/graph', methods=['GET'])
@jwt_required()
def get_mood_graph_data():
    """Get mood data for graph visualization"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        
        stats = Mood.get_mood_stats(user_id, days)
        trends = Mood.get_mood_trends(user_id, days)
        
        # Prepare data for visualization
        graph_data = {
            'mood_distribution': stats['mood_counts'],
            'recent_trends': trends,
            'total_entries': stats['total_entries'],
            'average_intensity': stats['average_intensity'],
            'period_days': days
        }
        
        return jsonify({
            'graph_data': graph_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/export', methods=['GET'])
@jwt_required()
def export_mood_history():
    """Export mood history as CSV"""
    try:
        user_id = get_jwt_identity()
        
        # Get all mood entries
        moods = Mood.query.filter_by(user_id=user_id).order_by(Mood.created_at.desc()).all()
        
        if not moods:
            return jsonify({'error': 'No mood entries to export'}), 404
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Date', 'Time', 'Emoji', 'Label', 'Intensity', 'Notes'])
        
        # Write mood data
        for mood in moods:
            created_date = mood.created_at.strftime('%Y-%m-%d') if mood.created_at else ''
            created_time = mood.created_at.strftime('%H:%M:%S') if mood.created_at else ''
            
            writer.writerow([
                created_date,
                created_time,
                mood.emoji,
                mood.label.title(),
                mood.intensity,
                mood.notes or ''
            ])
        
        # Prepare response
        output.seek(0)
        csv_data = output.getvalue()
        output.close()
        
        # Create response with CSV content
        response = Response(
            csv_data,
            mimetype='text/csv',
            headers={
                'Content-Disposition': 'attachment; filename=mood_history.csv',
                'Content-Type': 'text/csv'
            }
        )
        
        return response
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_moods():
    """Get recent mood entries for dashboard"""
    try:
        user_id = get_jwt_identity()
        
        limit = request.args.get('limit', 5, type=int)
        
        recent_moods = Mood.query.filter_by(user_id=user_id).order_by(
            Mood.created_at.desc()
        ).limit(limit).all()
        
        return jsonify({
            'recent_moods': [mood.to_dict() for mood in recent_moods],
            'count': len(recent_moods)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/random-quote', methods=['GET'])
@jwt_required()
def get_random_motivational_quote():
    """Get a random motivational quote based on mood type"""
    try:
        mood_type = request.args.get('mood_type', 'happy')
        
        # Create a temporary mood object to get quote
        temp_mood = Mood(label=mood_type.lower())
        quote = temp_mood.get_motivational_quote()
        
        return jsonify({
            'quote': quote,
            'mood_type': mood_type
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/available-moods', methods=['GET'])
def get_available_moods():
    """Get list of available mood types with their quotes"""
    try:
        # Return available mood types and sample quotes
        mood_data = {}
        
        for mood_type, quotes in Mood.MOOD_QUOTES.items():
            mood_data[mood_type] = {
                'sample_quote': quotes[0] if quotes else '',
                'total_quotes': len(quotes)
            }
        
        return jsonify({
            'available_moods': mood_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mood_bp.route('/search', methods=['GET'])
@jwt_required()
def search_moods():
    """Search mood entries by label or notes"""
    try:
        user_id = get_jwt_identity()
        query_text = request.args.get('q', '').strip()
        
        if not query_text:
            return jsonify({'error': 'Search query is required'}), 400
        
        # Search in label and notes
        moods = Mood.query.filter_by(user_id=user_id).filter(
            db.or_(
                Mood.label.contains(query_text.lower()),
                Mood.notes.contains(query_text)
            )
        ).order_by(Mood.created_at.desc()).all()
        
        return jsonify({
            'moods': [mood.to_dict() for mood in moods],
            'count': len(moods),
            'search_query': query_text
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500