"""
LoginLog Model for Admin Notifications
"""

from datetime import datetime
from sqlalchemy.sql import func
from app import db

class LoginLog(db.Model):
    """LoginLog model for tracking user logins and admin notifications"""
    
    __tablename__ = 'login_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    login_at = db.Column(db.DateTime, default=func.now())
    ip_address = db.Column(db.String(45))  # IPv4 or IPv6
    user_agent = db.Column(db.Text)  # Browser/device information
    is_successful = db.Column(db.Boolean, default=True)
    location = db.Column(db.String(200))  # Optional location info
    device_type = db.Column(db.String(50))  # mobile, desktop, tablet
    
    def to_dict(self):
        """Convert login log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_email': self.user.email if self.user else None,
            'login_at': self.login_at.isoformat() if self.login_at else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'is_successful': self.is_successful,
            'location': self.location,
            'device_type': self.device_type
        }
    
    @staticmethod
    def log_login(user_id, ip_address=None, user_agent=None, location=None, device_type=None):
        """Log a user login"""
        login_log = LoginLog(
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            location=location,
            device_type=device_type,
            is_successful=True
        )
        
        db.session.add(login_log)
        
        try:
            db.session.commit()
            return login_log
        except Exception as e:
            db.session.rollback()
            return None
    
    @staticmethod
    def log_failed_login(user_id=None, ip_address=None, user_agent=None):
        """Log a failed login attempt"""
        login_log = LoginLog(
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            is_successful=False
        )
        
        db.session.add(login_log)
        
        try:
            db.session.commit()
            return login_log
        except Exception as e:
            db.session.rollback()
            return None
    
    @staticmethod
    def get_recent_logins(limit=50):
        """Get recent login logs for admin"""
        return LoginLog.query.order_by(LoginLog.login_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_user_login_history(user_id, limit=20):
        """Get login history for a specific user"""
        return LoginLog.query.filter_by(user_id=user_id).order_by(
            LoginLog.login_at.desc()
        ).limit(limit).all()
    
    @staticmethod
    def get_login_stats(days=30):
        """Get login statistics for the past N days"""
        from datetime import timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        logs = LoginLog.query.filter(
            LoginLog.login_at >= start_date,
            LoginLog.login_at <= end_date
        ).all()
        
        successful_logins = [log for log in logs if log.is_successful]
        failed_logins = [log for log in logs if not log.is_successful]
        
        # Count unique users
        unique_users = set(log.user_id for log in successful_logins if log.user_id)
        
        # Device type breakdown
        device_counts = {}
        for log in successful_logins:
            if log.device_type:
                device_counts[log.device_type] = device_counts.get(log.device_type, 0) + 1
        
        return {
            'total_logins': len(logs),
            'successful_logins': len(successful_logins),
            'failed_logins': len(failed_logins),
            'unique_users': len(unique_users),
            'device_breakdown': device_counts,
            'period_days': days
        }
    
    def __repr__(self):
        return f'<LoginLog {self.user_id} at {self.login_at}>'