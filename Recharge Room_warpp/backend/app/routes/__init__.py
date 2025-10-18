"""
Routes Package for The Recharge Room API
"""

from .auth import auth_bp
from .dashboard import dashboard_bp
from .tasks import tasks_bp
from .mood import mood_bp
from .journal import journal_bp
from .voice import voice_bp
from .rewards import rewards_bp

__all__ = ['auth_bp', 'dashboard_bp', 'tasks_bp', 'mood_bp', 'journal_bp', 'voice_bp', 'rewards_bp']