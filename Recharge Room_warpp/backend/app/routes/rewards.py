"""
Rewards and Badges Routes for The Recharge Room API
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.badge import Badge, UserBadge
from app.models.task import Task

rewards_bp = Blueprint('rewards', __name__)

@rewards_bp.route('/list', methods=['GET'])
@jwt_required()
def get_user_rewards():
    """Get all rewards (badges) for the user - both unlocked and locked"""
    try:
        user_id = get_jwt_identity()
        
        # Get all available badges
        all_badges = Badge.query.filter_by(is_active=True).order_by(
            Badge.category.asc(), 
            Badge.condition_value.asc()
        ).all()
        
        # Get user's earned badges
        user_badge_ids = set()
        user_badges = UserBadge.query.filter_by(user_id=user_id).all()
        for ub in user_badges:
            user_badge_ids.add(ub.badge_id)
        
        # Separate unlocked and locked badges
        unlocked_badges = []
        locked_badges = []
        
        for badge in all_badges:
            badge_dict = badge.to_dict()
            
            if badge.id in user_badge_ids:
                # Badge is unlocked
                user_badge = next((ub for ub in user_badges if ub.badge_id == badge.id), None)
                if user_badge:
                    badge_dict['earned_at'] = user_badge.earned_at.isoformat()
                    badge_dict['is_featured'] = user_badge.is_featured
                badge_dict['status'] = 'unlocked'
                unlocked_badges.append(badge_dict)
            else:
                # Badge is locked
                badge_dict['status'] = 'locked'
                badge_dict['earned_at'] = None
                badge_dict['is_featured'] = False
                locked_badges.append(badge_dict)
        
        return jsonify({
            'unlocked_badges': unlocked_badges,
            'locked_badges': locked_badges,
            'total_unlocked': len(unlocked_badges),
            'total_locked': len(locked_badges),
            'total_badges': len(all_badges)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/unlocked', methods=['GET'])
@jwt_required()
def get_unlocked_badges():
    """Get only unlocked badges for the user"""
    try:
        user_id = get_jwt_identity()
        
        # Get user badges with badge details
        user_badges = UserBadge.query.filter_by(user_id=user_id).join(Badge).order_by(
            UserBadge.earned_at.desc()
        ).all()
        
        unlocked_badges = []
        for user_badge in user_badges:
            badge_dict = user_badge.badge.to_dict()
            badge_dict['earned_at'] = user_badge.earned_at.isoformat()
            badge_dict['is_featured'] = user_badge.is_featured
            badge_dict['status'] = 'unlocked'
            unlocked_badges.append(badge_dict)
        
        return jsonify({
            'unlocked_badges': unlocked_badges,
            'count': len(unlocked_badges)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_badge_stats():
    """Get badge statistics for the user"""
    try:
        user_id = get_jwt_identity()
        
        stats = UserBadge.get_user_badge_stats(user_id)
        
        return jsonify({
            'stats': stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/categories', methods=['GET'])
def get_badge_categories():
    """Get all badge categories with their counts"""
    try:
        # Get all active badges grouped by category
        badges = Badge.query.filter_by(is_active=True).all()
        
        categories = {}
        for badge in badges:
            if badge.category not in categories:
                categories[badge.category] = {
                    'total_badges': 0,
                    'badge_types': {},
                    'description': f"Badges related to {badge.category}"
                }
            
            categories[badge.category]['total_badges'] += 1
            
            # Count by type
            badge_type = badge.type
            if badge_type not in categories[badge.category]['badge_types']:
                categories[badge.category]['badge_types'][badge_type] = 0
            categories[badge.category]['badge_types'][badge_type] += 1
        
        return jsonify({
            'categories': categories,
            'total_categories': len(categories)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/category/<category>', methods=['GET'])
@jwt_required()
def get_badges_by_category(category):
    """Get badges in a specific category with user progress"""
    try:
        user_id = get_jwt_identity()
        
        # Get badges in this category
        category_badges = Badge.query.filter_by(
            category=category, 
            is_active=True
        ).order_by(Badge.condition_value.asc()).all()
        
        if not category_badges:
            return jsonify({'error': f'No badges found in category: {category}'}), 404
        
        # Get user's badges in this category
        user_badges = UserBadge.query.filter_by(user_id=user_id).join(Badge).filter(
            Badge.category == category
        ).all()
        
        user_badge_ids = {ub.badge_id for ub in user_badges}
        
        badges_data = []
        for badge in category_badges:
            badge_dict = badge.to_dict()
            
            if badge.id in user_badge_ids:
                user_badge = next((ub for ub in user_badges if ub.badge_id == badge.id), None)
                badge_dict['status'] = 'unlocked'
                badge_dict['earned_at'] = user_badge.earned_at.isoformat() if user_badge else None
                badge_dict['is_featured'] = user_badge.is_featured if user_badge else False
            else:
                badge_dict['status'] = 'locked'
                badge_dict['earned_at'] = None
                badge_dict['is_featured'] = False
            
            badges_data.append(badge_dict)
        
        return jsonify({
            'category': category,
            'badges': badges_data,
            'total_badges': len(badges_data),
            'unlocked_count': len([b for b in badges_data if b['status'] == 'unlocked'])
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/check-eligibility', methods=['POST'])
@jwt_required()
def check_badge_eligibility():
    """Check what badges the user is eligible for but hasn't earned"""
    try:
        user_id = get_jwt_identity()
        
        # Get current user stats
        task_stats = Task.get_user_completion_stats(user_id)
        
        # Check task and streak badges
        eligible_badges = Badge.check_task_badges(
            user_id, 
            task_stats['completed_tasks'], 
            task_stats['current_streak']
        )
        
        # TODO: Add checks for other badge types (mood, journal, voice, etc.)
        # This can be extended based on requirements
        
        return jsonify({
            'eligible_badges': [badge.to_dict() for badge in eligible_badges],
            'count': len(eligible_badges),
            'current_stats': task_stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/featured', methods=['GET'])
@jwt_required()
def get_featured_badges():
    """Get user's featured badges"""
    try:
        user_id = get_jwt_identity()
        
        # Get featured user badges
        featured_badges = UserBadge.query.filter_by(
            user_id=user_id, 
            is_featured=True
        ).join(Badge).order_by(UserBadge.earned_at.desc()).all()
        
        featured_data = []
        for user_badge in featured_badges:
            badge_dict = user_badge.badge.to_dict()
            badge_dict['earned_at'] = user_badge.earned_at.isoformat()
            badge_dict['is_featured'] = True
            badge_dict['status'] = 'unlocked'
            featured_data.append(badge_dict)
        
        return jsonify({
            'featured_badges': featured_data,
            'count': len(featured_data)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/feature/<int:badge_id>', methods=['POST'])
@jwt_required()
def toggle_badge_featured(badge_id):
    """Toggle featured status of a user badge"""
    try:
        user_id = get_jwt_identity()
        
        # Find the user badge
        user_badge = UserBadge.query.filter_by(
            user_id=user_id, 
            badge_id=badge_id
        ).first()
        
        if not user_badge:
            return jsonify({'error': 'Badge not found or not earned by user'}), 404
        
        # Toggle featured status
        user_badge.is_featured = not user_badge.is_featured
        db.session.commit()
        
        action = 'featured' if user_badge.is_featured else 'unfeatured'
        
        return jsonify({
            'message': f'Badge {action} successfully',
            'badge': user_badge.to_dict(),
            'is_featured': user_badge.is_featured
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_badges():
    """Get recently earned badges"""
    try:
        user_id = get_jwt_identity()
        
        limit = request.args.get('limit', 5, type=int)
        
        # Get recent user badges
        recent_badges = UserBadge.query.filter_by(user_id=user_id).join(Badge).order_by(
            UserBadge.earned_at.desc()
        ).limit(limit).all()
        
        recent_data = []
        for user_badge in recent_badges:
            badge_dict = user_badge.badge.to_dict()
            badge_dict['earned_at'] = user_badge.earned_at.isoformat()
            badge_dict['is_featured'] = user_badge.is_featured
            badge_dict['status'] = 'unlocked'
            recent_data.append(badge_dict)
        
        return jsonify({
            'recent_badges': recent_data,
            'count': len(recent_data)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_points_leaderboard():
    """Get points leaderboard (anonymized)"""
    try:
        # Get user badge stats with points
        leaderboard_query = db.session.query(
            UserBadge.user_id,
            db.func.sum(Badge.points).label('total_points'),
            db.func.count(UserBadge.badge_id).label('total_badges')
        ).join(Badge).group_by(UserBadge.user_id).order_by(
            db.func.sum(Badge.points).desc()
        ).limit(50).all()
        
        # Anonymize the data
        leaderboard = []
        for i, (user_id, total_points, total_badges) in enumerate(leaderboard_query):
            leaderboard.append({
                'rank': i + 1,
                'user_id': f"User{user_id}",  # Anonymized
                'total_points': int(total_points) if total_points else 0,
                'total_badges': int(total_badges) if total_badges else 0
            })
        
        # Get current user's position
        current_user_id = get_jwt_identity()
        current_user_stats = UserBadge.get_user_badge_stats(current_user_id)
        
        current_user_rank = None
        for entry in leaderboard:
            if entry['user_id'] == f"User{current_user_id}":
                current_user_rank = entry['rank']
                break
        
        return jsonify({
            'leaderboard': leaderboard,
            'current_user': {
                'rank': current_user_rank,
                'total_points': current_user_stats['total_points'],
                'total_badges': current_user_stats['total_badges']
            },
            'total_entries': len(leaderboard)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_progress_overview():
    """Get overall progress overview"""
    try:
        user_id = get_jwt_identity()
        
        # Get total available badges
        total_badges = Badge.query.filter_by(is_active=True).count()
        
        # Get user's badge stats
        user_stats = UserBadge.get_user_badge_stats(user_id)
        
        # Get task completion stats for progress tracking
        task_stats = Task.get_user_completion_stats(user_id)
        
        # Calculate progress percentages
        progress_data = {
            'badge_progress': {
                'earned': user_stats['total_badges'],
                'total': total_badges,
                'percentage': round((user_stats['total_badges'] / total_badges * 100), 1) if total_badges > 0 else 0
            },
            'points_earned': user_stats['total_points'],
            'categories_progress': user_stats['categories'],
            'badge_types': user_stats['badge_types'],
            'recent_achievements': user_stats['recent_badges'],
            'task_stats': task_stats
        }
        
        return jsonify({
            'progress': progress_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rewards_bp.route('/all-badges', methods=['GET'])
def get_all_available_badges():
    """Get all available badges (public endpoint for reference)"""
    try:
        badges = Badge.query.filter_by(is_active=True).order_by(
            Badge.category.asc(), 
            Badge.type.asc(), 
            Badge.condition_value.asc()
        ).all()
        
        return jsonify({
            'badges': [badge.to_dict() for badge in badges],
            'count': len(badges)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500