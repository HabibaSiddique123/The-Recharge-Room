"""
Helper Utilities for The Recharge Room API
"""

import secrets
import string
import re
from flask import request

def get_client_ip(request_obj):
    """
    Get client IP address from request, considering proxies
    
    Args:
        request_obj: Flask request object
        
    Returns:
        str: Client IP address
    """
    # Check for common proxy headers
    if request_obj.headers.getlist("X-Forwarded-For"):
        ip = request_obj.headers.getlist("X-Forwarded-For")[0].split(',')[0].strip()
    elif request_obj.headers.get("X-Real-IP"):
        ip = request_obj.headers.get("X-Real-IP")
    elif request_obj.headers.get("X-Forwarded-Host"):
        ip = request_obj.headers.get("X-Forwarded-Host")
    else:
        ip = request_obj.remote_addr
    
    return ip or 'Unknown'

def parse_user_agent(user_agent_string):
    """
    Parse user agent string to extract device and browser information
    
    Args:
        user_agent_string (str): User agent string from request
        
    Returns:
        dict: Parsed user agent information
    """
    if not user_agent_string:
        return {
            'device_type': 'unknown',
            'browser': 'unknown',
            'os': 'unknown',
            'is_mobile': False,
            'is_bot': False
        }
    
    user_agent = user_agent_string.lower()
    
    # Determine device type
    device_type = 'desktop'
    is_mobile = False
    
    if any(mobile in user_agent for mobile in ['mobile', 'android', 'iphone', 'ipad', 'ipod']):
        is_mobile = True
        if 'tablet' in user_agent or 'ipad' in user_agent:
            device_type = 'tablet'
        else:
            device_type = 'mobile'
    
    # Determine browser
    browser = 'unknown'
    if 'chrome' in user_agent and 'edg' not in user_agent:
        browser = 'chrome'
    elif 'firefox' in user_agent:
        browser = 'firefox'
    elif 'safari' in user_agent and 'chrome' not in user_agent:
        browser = 'safari'
    elif 'edg' in user_agent:
        browser = 'edge'
    elif 'opera' in user_agent or 'opr' in user_agent:
        browser = 'opera'
    elif 'internet explorer' in user_agent or 'trident' in user_agent:
        browser = 'ie'
    
    # Determine OS
    os_name = 'unknown'
    if 'windows' in user_agent:
        os_name = 'windows'
    elif 'mac' in user_agent:
        os_name = 'macos'
    elif 'linux' in user_agent:
        os_name = 'linux'
    elif 'android' in user_agent:
        os_name = 'android'
    elif 'ios' in user_agent or 'iphone' in user_agent or 'ipad' in user_agent:
        os_name = 'ios'
    
    # Check if it's a bot
    is_bot = any(bot in user_agent for bot in [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests'
    ])
    
    return {
        'device_type': device_type,
        'browser': browser,
        'os': os_name,
        'is_mobile': is_mobile,
        'is_bot': is_bot,
        'raw_user_agent': user_agent_string
    }

def generate_random_string(length=32, include_digits=True, include_symbols=False):
    """
    Generate a random string for tokens, passwords, etc.
    
    Args:
        length (int): Length of the string to generate
        include_digits (bool): Include digits in the string
        include_symbols (bool): Include symbols in the string
        
    Returns:
        str: Random string
    """
    characters = string.ascii_letters  # a-z, A-Z
    
    if include_digits:
        characters += string.digits  # 0-9
    
    if include_symbols:
        characters += "!@#$%^&*"  # Limited set of symbols
    
    return ''.join(secrets.choice(characters) for _ in range(length))

def validate_email(email):
    """
    Validate email format using regex
    
    Args:
        email (str): Email address to validate
        
    Returns:
        bool: True if email is valid format
    """
    if not email:
        return False
    
    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def sanitize_filename(filename):
    """
    Sanitize filename by removing or replacing unsafe characters
    
    Args:
        filename (str): Original filename
        
    Returns:
        str: Sanitized filename
    """
    if not filename:
        return 'unnamed_file'
    
    # Remove or replace unsafe characters
    unsafe_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*']
    sanitized = filename
    
    for char in unsafe_chars:
        sanitized = sanitized.replace(char, '_')
    
    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip(' .')
    
    # Limit length
    if len(sanitized) > 255:
        sanitized = sanitized[:255]
    
    return sanitized or 'unnamed_file'

def truncate_text(text, max_length=100, add_ellipsis=True):
    """
    Truncate text to a maximum length
    
    Args:
        text (str): Text to truncate
        max_length (int): Maximum length
        add_ellipsis (bool): Add '...' to truncated text
        
    Returns:
        str: Truncated text
    """
    if not text:
        return ''
    
    if len(text) <= max_length:
        return text
    
    truncated = text[:max_length]
    
    if add_ellipsis:
        truncated = truncated.rstrip() + '...'
    
    return truncated

def format_file_size(size_bytes):
    """
    Format file size in bytes to human readable format
    
    Args:
        size_bytes (int): Size in bytes
        
    Returns:
        str: Formatted file size
    """
    if not size_bytes:
        return '0 B'
    
    size_bytes = int(size_bytes)
    
    if size_bytes == 0:
        return '0 B'
    
    size_names = ['B', 'KB', 'MB', 'GB', 'TB']
    i = 0
    
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def parse_duration_seconds(duration_str):
    """
    Parse duration string (like "1h 30m 45s") to seconds
    
    Args:
        duration_str (str): Duration string
        
    Returns:
        int: Duration in seconds, or None if invalid
    """
    if not duration_str:
        return None
    
    try:
        # Simple parsing for formats like "1h 30m 45s", "90s", "5m", etc.
        total_seconds = 0
        duration_str = duration_str.lower().strip()
        
        # Find hours
        if 'h' in duration_str:
            hours_match = re.search(r'(\d+)h', duration_str)
            if hours_match:
                total_seconds += int(hours_match.group(1)) * 3600
        
        # Find minutes
        if 'm' in duration_str:
            minutes_match = re.search(r'(\d+)m', duration_str)
            if minutes_match:
                total_seconds += int(minutes_match.group(1)) * 60
        
        # Find seconds
        if 's' in duration_str:
            seconds_match = re.search(r'(\d+)s', duration_str)
            if seconds_match:
                total_seconds += int(seconds_match.group(1))
        
        # If no units found, assume it's seconds
        if total_seconds == 0 and duration_str.isdigit():
            total_seconds = int(duration_str)
        
        return total_seconds if total_seconds > 0 else None
    
    except (ValueError, AttributeError):
        return None

def format_duration(seconds):
    """
    Format duration in seconds to human readable string
    
    Args:
        seconds (int): Duration in seconds
        
    Returns:
        str: Formatted duration string
    """
    if not seconds or seconds <= 0:
        return '0s'
    
    seconds = int(seconds)
    
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    remaining_seconds = seconds % 60
    
    parts = []
    
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if remaining_seconds > 0 or not parts:  # Show seconds if it's the only unit
        parts.append(f"{remaining_seconds}s")
    
    return ' '.join(parts)

def is_safe_url(target_url, host_url):
    """
    Check if a URL is safe for redirects (same domain)
    
    Args:
        target_url (str): URL to check
        host_url (str): Host URL to compare against
        
    Returns:
        bool: True if URL is safe for redirect
    """
    if not target_url:
        return False
    
    try:
        from urllib.parse import urlparse, urljoin
        
        # Parse the target URL
        target_parsed = urlparse(target_url)
        host_parsed = urlparse(host_url)
        
        # Check if it's a relative URL (safe)
        if not target_parsed.netloc:
            return True
        
        # Check if it's the same domain
        return target_parsed.netloc == host_parsed.netloc
    
    except Exception:
        return False

def clean_text(text, remove_html=True, remove_extra_spaces=True):
    """
    Clean text by removing HTML tags and extra spaces
    
    Args:
        text (str): Text to clean
        remove_html (bool): Remove HTML tags
        remove_extra_spaces (bool): Remove extra whitespaces
        
    Returns:
        str: Cleaned text
    """
    if not text:
        return ''
    
    cleaned = text
    
    if remove_html:
        # Remove HTML tags (basic cleaning)
        cleaned = re.sub(r'<[^>]+>', '', cleaned)
        # Remove HTML entities
        cleaned = re.sub(r'&[a-zA-Z0-9#]+;', ' ', cleaned)
    
    if remove_extra_spaces:
        # Replace multiple whitespaces with single space
        cleaned = re.sub(r'\s+', ' ', cleaned)
        # Remove leading/trailing whitespace
        cleaned = cleaned.strip()
    
    return cleaned