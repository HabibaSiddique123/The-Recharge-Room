"""
Utilities Package for The Recharge Room API
"""

from .email_service import send_login_notification, send_email
from .helpers import get_client_ip, parse_user_agent, generate_random_string
from .init_badges import init_default_badges

__all__ = ['send_login_notification', 'send_email', 'get_client_ip', 'parse_user_agent', 'generate_random_string', 'init_default_badges']