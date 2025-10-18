"""
Tasks Routes for The Recharge Room API
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.task import Task
from app.models.badge import Badge, UserBadge
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    """Get all tasks for the current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        status = request.args.get('status')  # 'completed', 'pending', or None for all
        priority = request.args.get('priority')  # 'low', 'medium', 'high'
        limit = request.args.get('limit', type=int)
        
        # Build query
        query = Task.query.filter_by(user_id=user_id)
        
        if status == 'completed':
            query = query.filter_by(is_completed=True)
        elif status == 'pending':
            query = query.filter_by(is_completed=False)
        
        if priority:
            query = query.filter_by(priority=priority)
        
        # Order by created_at desc
        query = query.order_by(Task.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        tasks = query.all()
        
        return jsonify({
            'tasks': [task.to_dict() for task in tasks],
            'count': len(tasks)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/create', methods=['POST'])
@jwt_required()
def create_task():
    """Create a new task"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('title'):
            return jsonify({'error': 'Task title is required'}), 400
        
        # Create new task
        task = Task(
            user_id=user_id,
            title=data['title'].strip(),
            description=data.get('description', '').strip(),
            priority=data.get('priority', 'medium')
        )
        
        # Validate priority
        if task.priority not in ['low', 'medium', 'high']:
            task.priority = 'medium'
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify({
            'message': 'Task created successfully',
            'task': task.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Get a specific task"""
    try:
        user_id = get_jwt_identity()
        
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        return jsonify({
            'task': task.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """Update a specific task"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields
        if 'title' in data and data['title'].strip():
            task.title = data['title'].strip()
        
        if 'description' in data:
            task.description = data['description'].strip()
        
        if 'priority' in data and data['priority'] in ['low', 'medium', 'high']:
            task.priority = data['priority']
        
        if 'is_completed' in data:
            was_completed = task.is_completed
            task.is_completed = bool(data['is_completed'])
            
            # Handle completion status change
            if not was_completed and task.is_completed:
                task.completed_at = datetime.utcnow()
            elif was_completed and not task.is_completed:
                task.completed_at = None
        
        db.session.commit()
        
        # Check for badges if task was just completed
        unlocked_badges = []
        confetti_trigger = False
        
        if 'is_completed' in data and data['is_completed'] and not was_completed:
            # Task was just completed
            task_stats = Task.get_user_completion_stats(user_id)
            potential_badges = Badge.check_task_badges(
                user_id, 
                task_stats['completed_tasks'], 
                task_stats['current_streak']
            )
            
            # Award badges
            for badge in potential_badges:
                user_badge, awarded = UserBadge.award_badge(user_id, badge.id)
                if awarded:
                    unlocked_badges.append(badge.to_dict())
                    confetti_trigger = True
        
        return jsonify({
            'message': 'Task updated successfully',
            'task': task.to_dict(),
            'badges_unlocked': unlocked_badges,
            'confetti': confetti_trigger,
            'streak_count': Task.get_user_streak(user_id)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete a specific task"""
    try:
        user_id = get_jwt_identity()
        
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({
            'message': 'Task deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/complete/<int:task_id>', methods=['POST'])
@jwt_required()
def complete_task(task_id):
    """Mark a task as completed"""
    try:
        user_id = get_jwt_identity()
        
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        if task.is_completed:
            return jsonify({'error': 'Task is already completed'}), 400
        
        # Mark as completed
        task.is_completed = True
        task.completed_at = datetime.utcnow()
        db.session.commit()
        
        # Get updated stats
        task_stats = Task.get_user_completion_stats(user_id)
        
        # Check for new badges
        potential_badges = Badge.check_task_badges(
            user_id, 
            task_stats['completed_tasks'], 
            task_stats['current_streak']
        )
        
        unlocked_badges = []
        for badge in potential_badges:
            user_badge, awarded = UserBadge.award_badge(user_id, badge.id)
            if awarded:
                unlocked_badges.append(badge.to_dict())
        
        return jsonify({
            'message': 'Task completed successfully',
            'task': task.to_dict(),
            'stats': task_stats,
            'badges_unlocked': unlocked_badges,
            'confetti': len(unlocked_badges) > 0
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/clear', methods=['POST'])
@jwt_required()
def clear_all_tasks():
    """Clear all tasks for the user"""
    try:
        user_id = get_jwt_identity()
        
        # Get confirmation from request body
        data = request.get_json()
        if not data or not data.get('confirm'):
            return jsonify({'error': 'Confirmation required'}), 400
        
        # Delete all user tasks
        deleted_count = Task.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {deleted_count} tasks',
            'deleted_count': deleted_count
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_task_stats():
    """Get task completion statistics"""
    try:
        user_id = get_jwt_identity()
        
        stats = Task.get_user_completion_stats(user_id)
        
        return jsonify({
            'stats': stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/bulk-complete', methods=['POST'])
@jwt_required()
def bulk_complete_tasks():
    """Mark multiple tasks as completed"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('task_ids'):
            return jsonify({'error': 'Task IDs are required'}), 400
        
        task_ids = data['task_ids']
        if not isinstance(task_ids, list):
            return jsonify({'error': 'Task IDs must be a list'}), 400
        
        # Get tasks
        tasks = Task.query.filter(
            Task.id.in_(task_ids),
            Task.user_id == user_id,
            Task.is_completed == False
        ).all()
        
        if not tasks:
            return jsonify({'error': 'No pending tasks found'}), 404
        
        # Mark all as completed
        completed_tasks = []
        for task in tasks:
            task.is_completed = True
            task.completed_at = datetime.utcnow()
            completed_tasks.append(task.to_dict())
        
        db.session.commit()
        
        # Get updated stats and check badges
        task_stats = Task.get_user_completion_stats(user_id)
        potential_badges = Badge.check_task_badges(
            user_id, 
            task_stats['completed_tasks'], 
            task_stats['current_streak']
        )
        
        unlocked_badges = []
        for badge in potential_badges:
            user_badge, awarded = UserBadge.award_badge(user_id, badge.id)
            if awarded:
                unlocked_badges.append(badge.to_dict())
        
        return jsonify({
            'message': f'Successfully completed {len(completed_tasks)} tasks',
            'completed_tasks': completed_tasks,
            'stats': task_stats,
            'badges_unlocked': unlocked_badges,
            'confetti': len(unlocked_badges) > 0
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500