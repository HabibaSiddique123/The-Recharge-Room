"""
Email Service for The Recharge Room API
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from flask import current_app
import os

def send_email(to_email, subject, body_text, body_html=None):
    """
    Send an email using SMTP configuration
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        body_text (str): Plain text body
        body_html (str, optional): HTML body
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Get email configuration from app config
        smtp_server = current_app.config.get('MAIL_SERVER')
        smtp_port = current_app.config.get('MAIL_PORT', 587)
        smtp_username = current_app.config.get('MAIL_USERNAME')
        smtp_password = current_app.config.get('MAIL_PASSWORD')
        
        # Skip email if no configuration is provided
        if not all([smtp_server, smtp_username, smtp_password]):
            print(f"Email configuration not complete. Would send: {subject} to {to_email}")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = to_email
        
        # Add text part
        text_part = MIMEText(body_text, 'plain')
        msg.attach(text_part)
        
        # Add HTML part if provided
        if body_html:
            html_part = MIMEText(body_html, 'html')
            msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            if current_app.config.get('MAIL_USE_TLS', True):
                server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_username, [to_email], msg.as_string())
        
        return True
    
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_login_notification(user_email, ip_address, user_agent):
    """
    Send login notification to admin
    
    Args:
        user_email (str): Email of the user who logged in
        ip_address (str): IP address of the login
        user_agent (str): User agent string
    
    Returns:
        bool: True if notification sent successfully
    """
    try:
        admin_email = current_app.config.get('ADMIN_EMAIL')
        
        if not admin_email:
            print(f"No admin email configured. Login notification: {user_email} from {ip_address}")
            return False
        
        # Create email content
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        
        subject = f"The Recharge Room - User Login: {user_email}"
        
        body_text = f"""
User Login Notification - The Recharge Room

User Email: {user_email}
Login Time: {timestamp}
IP Address: {ip_address}
User Agent: {user_agent}

This is an automated notification from The Recharge Room application.
        """.strip()
        
        body_html = f"""
<html>
<body style="font-family: Arial, sans-serif; margin: 20px;">
    <h2 style="color: #2c3e50;">User Login Notification</h2>
    <p><strong>The Recharge Room</strong> - User Activity Alert</p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>User Email:</strong> {user_email}</p>
        <p><strong>Login Time:</strong> {timestamp}</p>
        <p><strong>IP Address:</strong> {ip_address}</p>
        <p><strong>User Agent:</strong> {user_agent}</p>
    </div>
    
    <p style="color: #666; font-size: 12px;">
        This is an automated notification from The Recharge Room application.
    </p>
</body>
</html>
        """.strip()
        
        return send_email(admin_email, subject, body_text, body_html)
    
    except Exception as e:
        print(f"Failed to send login notification: {str(e)}")
        return False

def send_password_reset_email(user_email, reset_token):
    """
    Send password reset email to user (for future implementation)
    
    Args:
        user_email (str): User's email address
        reset_token (str): Password reset token
    
    Returns:
        bool: True if email sent successfully
    """
    try:
        subject = "The Recharge Room - Password Reset Request"
        
        # Note: In production, this would be your actual domain
        reset_link = f"https://your-domain.com/reset-password?token={reset_token}"
        
        body_text = f"""
Password Reset Request - The Recharge Room

Hello,

You requested to reset your password for The Recharge Room. Click the link below to reset your password:

{reset_link}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.

Best regards,
The Recharge Room Team
        """.strip()
        
        body_html = f"""
<html>
<body style="font-family: Arial, sans-serif; margin: 20px;">
    <h2 style="color: #2c3e50;">Password Reset Request</h2>
    <p><strong>The Recharge Room</strong></p>
    
    <p>Hello,</p>
    
    <p>You requested to reset your password for The Recharge Room. Click the button below to reset your password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{reset_link}" 
           style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
        </a>
    </div>
    
    <p>Or copy and paste this link into your browser: <br>
    <a href="{reset_link}">{reset_link}</a></p>
    
    <p style="color: #e74c3c; font-weight: bold;">This link will expire in 1 hour for security reasons.</p>
    
    <p>If you didn't request this password reset, please ignore this email.</p>
    
    <p>Best regards,<br>The Recharge Room Team</p>
</body>
</html>
        """.strip()
        
        return send_email(user_email, subject, body_text, body_html)
    
    except Exception as e:
        print(f"Failed to send password reset email: {str(e)}")
        return False

def send_welcome_email(user_email, user_name=None):
    """
    Send welcome email to new user (for future implementation)
    
    Args:
        user_email (str): User's email address
        user_name (str, optional): User's name
    
    Returns:
        bool: True if email sent successfully
    """
    try:
        subject = "Welcome to The Recharge Room! 🌟"
        
        greeting = f"Hello {user_name}!" if user_name else "Hello!"
        
        body_text = f"""
{greeting}

Welcome to The Recharge Room - your personal wellness companion!

We're excited to have you on board. Here's what you can do with The Recharge Room:

✅ Track and complete daily tasks
😊 Log your moods and receive motivational quotes
📝 Write in your personal journal with custom themes
🎙️ Record and save voice notes
🏆 Earn badges and track your progress

Ready to get started? Log in to your account and begin your wellness journey today!

If you have any questions, feel free to reach out to us.

Best regards,
The Recharge Room Team

P.S. Remember, every small step counts towards your well-being! 🌱
        """.strip()
        
        body_html = f"""
<html>
<body style="font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #2c3e50; text-align: center;">Welcome to The Recharge Room! 🌟</h1>
        
        <p style="font-size: 18px; color: #34495e;">{greeting}</p>
        
        <p>We're excited to have you on board. Here's what you can do with <strong>The Recharge Room</strong>:</p>
        
        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>✅ Track and complete daily tasks</strong></p>
            <p style="margin: 10px 0;"><strong>😊 Log your moods and receive motivational quotes</strong></p>
            <p style="margin: 10px 0;"><strong>📝 Write in your personal journal with custom themes</strong></p>
            <p style="margin: 10px 0;"><strong>🎙️ Record and save voice notes</strong></p>
            <p style="margin: 10px 0;"><strong>🏆 Earn badges and track your progress</strong></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://your-domain.com/login" 
               style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
                Get Started Now!
            </a>
        </div>
        
        <p>Ready to get started? Log in to your account and begin your wellness journey today!</p>
        
        <p>If you have any questions, feel free to reach out to us.</p>
        
        <p>Best regards,<br><strong>The Recharge Room Team</strong></p>
        
        <p style="color: #27ae60; font-style: italic; text-align: center; margin-top: 30px;">
            P.S. Remember, every small step counts towards your well-being! 🌱
        </p>
    </div>
</body>
</html>
        """.strip()
        
        return send_email(user_email, subject, body_text, body_html)
    
    except Exception as e:
        print(f"Failed to send welcome email: {str(e)}")
        return False