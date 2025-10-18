"""
Dashboard Routes for The Recharge Room API
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.task import Task
from app.models.mood import Mood
from app.models.journal import Journal
from app.models.voice_note import VoiceNote
from app.models.badge import Badge, UserBadge
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    """Get comprehensive dashboard summary for the user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get task statistics
        task_stats = Task.get_user_completion_stats(user_id)
        
        # Get recent moods (last 5)
        recent_moods = Mood.query.filter_by(user_id=user_id).order_by(
            Mood.created_at.desc()
        ).limit(5).all()
        
        # Get recent journal entries (last 3)
        recent_journals = Journal.query.filter_by(user_id=user_id).order_by(
            Journal.created_at.desc()
        ).limit(3).all()
        
        # Get recent voice notes (last 3)
        recent_voice_notes = VoiceNote.query.filter_by(user_id=user_id).order_by(
            VoiceNote.created_at.desc()
        ).limit(3).all()
        
        # Get unlocked badges (last 5)
        recent_badges = UserBadge.query.filter_by(user_id=user_id).join(Badge).order_by(
            UserBadge.earned_at.desc()
        ).limit(5).all()
        
        # Get badge stats
        badge_stats = UserBadge.get_user_badge_stats(user_id)
        
        # Construct dashboard data
        dashboard_data = {
            'user_info': user.to_dict(),
            'task_summary': {
                'total_tasks': task_stats['total_tasks'],
                'completed_tasks': task_stats['completed_tasks'],
                'pending_tasks': task_stats['pending_tasks'],
                'completion_rate': task_stats['completion_rate'],
                'current_streak': task_stats['current_streak']
            },
            'recent_moods': [mood.to_dict() for mood in recent_moods],
            'recent_journal_entries': [
                {
                    'id': entry.id,
                    'title': entry.title,
                    'excerpt': entry.get_excerpt(20),
                    'theme': entry.theme,
                    'word_count': len(entry.content.split()) if entry.content else 0,
                    'created_at': entry.created_at.isoformat() if entry.created_at else None
                } for entry in recent_journals
            ],
            'recent_voice_notes': [
                {
                    'id': note.id,
                    'title': note.title,
                    'excerpt': note.get_excerpt(15),
                    'duration': note.format_duration(),
                    'language': note.language,
                    'created_at': note.created_at.isoformat() if note.created_at else None
                } for note in recent_voice_notes
            ],
            'unlocked_rewards': [
                {
                    'badge': ub.badge.to_dict(),
                    'earned_at': ub.earned_at.isoformat() if ub.earned_at else None,
                    'is_featured': ub.is_featured
                } for ub in recent_badges
            ],
            'badge_summary': {
                'total_badges': badge_stats['total_badges'],
                'total_points': badge_stats['total_points'],
                'categories': badge_stats['categories']
            }
        }
        
        return jsonify({
            'dashboard': dashboard_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/quick-stats', methods=['GET'])
@jwt_required()
def get_quick_stats():
    """Get quick statistics for dashboard cards"""
    try:
        user_id = get_jwt_identity()
        
        # Get counts for each module
        total_tasks = Task.query.filter_by(user_id=user_id).count()
        completed_tasks = Task.query.filter_by(user_id=user_id, is_completed=True).count()
        total_moods = Mood.query.filter_by(user_id=user_id).count()
        total_journal_entries = Journal.query.filter_by(user_id=user_id).count()
        total_voice_notes = VoiceNote.query.filter_by(user_id=user_id).count()
        total_badges = UserBadge.query.filter_by(user_id=user_id).count()
        
        # Get current streak
        current_streak = Task.get_user_streak(user_id)
        
        # Get today's activity
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        today_tasks_completed = Task.query.filter_by(user_id=user_id, is_completed=True).filter(
            Task.completed_at >= today_start,
            Task.completed_at <= today_end
        ).count()
        
        today_moods = Mood.query.filter_by(user_id=user_id).filter(
            Mood.created_at >= today_start,
            Mood.created_at <= today_end
        ).count()
        
        today_journal_entries = Journal.query.filter_by(user_id=user_id).filter(
            Journal.created_at >= today_start,
            Journal.created_at <= today_end
        ).count()
        
        stats = {
            'totals': {
                'tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'moods': total_moods,
                'journal_entries': total_journal_entries,
                'voice_notes': total_voice_notes,
                'badges': total_badges
            },
            'today': {
                'tasks_completed': today_tasks_completed,
                'moods_logged': today_moods,
                'journal_entries': today_journal_entries
            },
            'streaks': {
                'current_task_streak': current_streak
            },
            'completion_rate': round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
        }
        
        return jsonify({
            'quick_stats': stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/activity-feed', methods=['GET'])
@jwt_required()
def get_activity_feed():
    """Get recent activity across all modules"""
    try:
        user_id = get_jwt_identity()
        
        limit = request.args.get('limit', 20, type=int)
        days = request.args.get('days', 7, type=int)
        
        # Get date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        activities = []
        
        # Recent task completions
        completed_tasks = Task.query.filter_by(user_id=user_id, is_completed=True).filter(
            Task.completed_at >= start_date,
            Task.completed_at <= end_date
        ).order_by(Task.completed_at.desc()).limit(limit//4).all()
        
        for task in completed_tasks:
            activities.append({
                'type': 'task_completed',
                'title': f'Completed task: {task.title}',
                'timestamp': task.completed_at.isoformat() if task.completed_at else None,
                'data': {'task_id': task.id, 'task_title': task.title}
            })
        
        # Recent moods
        recent_moods = Mood.query.filter_by(user_id=user_id).filter(
            Mood.created_at >= start_date,
            Mood.created_at <= end_date
        ).order_by(Mood.created_at.desc()).limit(limit//4).all()
        
        for mood in recent_moods:
            activities.append({
                'type': 'mood_logged',
                'title': f'Logged mood: {mood.emoji} {mood.label.title()}',
                'timestamp': mood.created_at.isoformat() if mood.created_at else None,
                'data': {'mood_id': mood.id, 'emoji': mood.emoji, 'label': mood.label}
            })
        
        # Recent journal entries
        recent_journals = Journal.query.filter_by(user_id=user_id).filter(
            Journal.created_at >= start_date,
            Journal.created_at <= end_date
        ).order_by(Journal.created_at.desc()).limit(limit//4).all()
        
        for entry in recent_journals:
            activities.append({
                'type': 'journal_entry',
                'title': f'New journal entry: {entry.title or "Untitled"}',
                'timestamp': entry.created_at.isoformat() if entry.created_at else None,
                'data': {'entry_id': entry.id, 'title': entry.title, 'theme': entry.theme}
            })
        
        # Recent badges
        recent_badges = UserBadge.query.filter_by(user_id=user_id).filter(
            UserBadge.earned_at >= start_date,
            UserBadge.earned_at <= end_date
        ).join(Badge).order_by(UserBadge.earned_at.desc()).limit(limit//4).all()
        
        for ub in recent_badges:
            activities.append({
                'type': 'badge_earned',
                'title': f'Earned badge: {ub.badge.name}',
                'timestamp': ub.earned_at.isoformat() if ub.earned_at else None,
                'data': {'badge_id': ub.badge.id, 'badge_name': ub.badge.name, 'badge_type': ub.badge.type}
            })
        
        # Sort all activities by timestamp
        activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        
        # Limit the results
        activities = activities[:limit]
        
        return jsonify({
            'activity_feed': activities,
            'count': len(activities),
            'period_days': days
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/weekly-summary', methods=['GET'])
@jwt_required()
def get_weekly_summary():
    """Get weekly summary statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Get date range for this week
        today = datetime.utcnow().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        week_start_dt = datetime.combine(week_start, datetime.min.time())
        week_end_dt = datetime.combine(week_end, datetime.max.time())
        
        # Tasks completed this week
        weekly_tasks = Task.query.filter_by(user_id=user_id, is_completed=True).filter(
            Task.completed_at >= week_start_dt,
            Task.completed_at <= week_end_dt
        ).count()
        
        # Moods logged this week
        weekly_moods = Mood.query.filter_by(user_id=user_id).filter(
            Mood.created_at >= week_start_dt,
            Mood.created_at <= week_end_dt
        ).count()
        
        # Journal entries this week
        weekly_journals = Journal.query.filter_by(user_id=user_id).filter(
            Journal.created_at >= week_start_dt,
            Journal.created_at <= week_end_dt
        ).count()
        
        # Voice notes this week
        weekly_voice_notes = VoiceNote.query.filter_by(user_id=user_id).filter(
            VoiceNote.created_at >= week_start_dt,
            VoiceNote.created_at <= week_end_dt
        ).count()
        
        # Badges earned this week
        weekly_badges = UserBadge.query.filter_by(user_id=user_id).filter(
            UserBadge.earned_at >= week_start_dt,
            UserBadge.earned_at <= week_end_dt
        ).count()
        
        # Daily breakdown for the week
        daily_breakdown = []
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            day_start = datetime.combine(day_date, datetime.min.time())
            day_end = datetime.combine(day_date, datetime.max.time())
            
            day_tasks = Task.query.filter_by(user_id=user_id, is_completed=True).filter(
                Task.completed_at >= day_start,
                Task.completed_at <= day_end
            ).count()
            
            day_moods = Mood.query.filter_by(user_id=user_id).filter(
                Mood.created_at >= day_start,
                Mood.created_at <= day_end
            ).count()
            
            daily_breakdown.append({
                'date': day_date.isoformat(),
                'day_name': day_date.strftime('%A'),
                'tasks_completed': day_tasks,
                'moods_logged': day_moods,
                'is_today': day_date == today
            })
        
        weekly_summary = {
            'week_range': {
                'start': week_start.isoformat(),
                'end': week_end.isoformat()
            },
            'totals': {
                'tasks_completed': weekly_tasks,
                'moods_logged': weekly_moods,
                'journal_entries': weekly_journals,
                'voice_notes': weekly_voice_notes,
                'badges_earned': weekly_badges
            },
            'daily_breakdown': daily_breakdown,
            'week_score': weekly_tasks + weekly_moods + weekly_journals + weekly_badges  # Simple scoring
        }
        
        return jsonify({
            'weekly_summary': weekly_summary
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/motivation', methods=['GET'])
@jwt_required()
def get_daily_motivation():
    """Get daily motivational content based on user's recent activity"""
    try:
        user_id = get_jwt_identity()
        
        # Get today's activity
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        today_tasks = Task.query.filter_by(user_id=user_id, is_completed=True).filter(
            Task.completed_at >= today_start,
            Task.completed_at <= today_end
        ).count()
        
        today_moods = Mood.query.filter_by(user_id=user_id).filter(
            Mood.created_at >= today_start,
            Mood.created_at <= today_end
        ).first()
        
        # Get current streak
        current_streak = Task.get_user_streak(user_id)
        
        # Generate motivational message based on activity
        if today_tasks >= 3:
            motivation_message = "You're crushing it today! 🚀 Keep up the amazing momentum!"
        elif today_tasks >= 1:
            motivation_message = "Great start! 💪 You're building positive momentum one task at a time."
        elif current_streak >= 7:
            motivation_message = f"Incredible! You're on a {current_streak}-day streak! 🔥 Don't break the chain!"
        elif current_streak >= 3:
            motivation_message = f"Awesome {current_streak}-day streak! 🌟 You're building great habits!"
        else:
            motivation_message = "Every small step counts! 🌱 What will you accomplish today?"
        
        # Add mood-based message if available
        mood_message = ""
        if today_moods:
            mood_message = today_moods.get_motivational_quote()
        
        motivation_data = {
            'daily_message': motivation_message,
            'mood_quote': mood_message,
            'today_stats': {
                'tasks_completed': today_tasks,
                'current_streak': current_streak,
                'has_mood_logged': bool(today_moods)
            },
            'next_goal': {
                'type': 'task_completion',
                'target': max(today_tasks + 1, 1),
                'message': f"Complete {max(today_tasks + 1, 1)} task{'s' if max(today_tasks + 1, 1) != 1 else ''} today!"
            }
        }
        
        return jsonify({
            'motivation': motivation_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_user_insights():
    """Get personalized insights based on user data"""
    try:
        user_id = get_jwt_identity()
        
        insights = []
        
        # Task completion insights
        task_stats = Task.get_user_completion_stats(user_id)
        if task_stats['completion_rate'] >= 80:
            insights.append({
                'type': 'achievement',
                'title': 'Task Master!',
                'message': f"You have an impressive {task_stats['completion_rate']}% task completion rate!",
                'icon': '🎯'
            })
        elif task_stats['completion_rate'] >= 50:
            insights.append({
                'type': 'progress',
                'title': 'Great Progress',
                'message': f"You're completing {task_stats['completion_rate']}% of your tasks. Keep it up!",
                'icon': '📈'
            })
        
        # Streak insights
        if task_stats['current_streak'] >= 7:
            insights.append({
                'type': 'streak',
                'title': 'Streak Champion!',
                'message': f"Amazing {task_stats['current_streak']}-day streak! You're on fire! 🔥",
                'icon': '🔥'
            })
        
        # Mood insights
        mood_stats = Mood.get_mood_stats(user_id, days=30)
        if mood_stats['total_entries'] >= 20:
            most_common_mood = max(mood_stats['mood_counts'], key=mood_stats['mood_counts'].get) if mood_stats['mood_counts'] else None
            if most_common_mood:
                insights.append({
                    'type': 'mood_pattern',
                    'title': 'Mood Pattern',
                    'message': f"Your most frequent mood this month has been '{most_common_mood.title()}'. Great self-awareness!",
                    'icon': '😊'
                })
        
        # Journal insights
        journal_stats = Journal.get_user_stats(user_id)
        if journal_stats['total_entries'] >= 10:
            insights.append({
                'type': 'journaling',
                'title': 'Reflective Writer',
                'message': f"You've written {journal_stats['total_entries']} journal entries with {journal_stats['total_words']} total words!",
                'icon': '📝'
            })
        
        # Badge insights
        badge_stats = UserBadge.get_user_badge_stats(user_id)
        if badge_stats['total_badges'] >= 5:
            insights.append({
                'type': 'achievements',
                'title': 'Achievement Hunter',
                'message': f"You've earned {badge_stats['total_badges']} badges and {badge_stats['total_points']} points!",
                'icon': '🏆'
            })
        
        # Add general encouragement if no specific insights
        if not insights:
            insights.append({
                'type': 'encouragement',
                'title': 'Getting Started',
                'message': "You're on your wellness journey! Every step forward is progress worth celebrating.",
                'icon': '🌟'
            })
        
        return jsonify({
            'insights': insights,
            'count': len(insights)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500