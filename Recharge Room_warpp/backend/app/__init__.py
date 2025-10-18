"""
Flask App Factory for The Recharge Room Backend
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///recharge_room.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)  # Token expires in 7 days
    
    # Email configuration for notifications
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['ADMIN_EMAIL'] = os.environ.get('ADMIN_EMAIL', 'admin@rechargeroom.com')
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:3000", "http://localhost:3001"])  # Allow React frontend
    
    # Register blueprints with error handling
    try:
        from .routes.auth import auth_bp
        from .routes.dashboard import dashboard_bp
        from .routes.tasks import tasks_bp
        from .routes.mood import mood_bp
        from .routes.journal import journal_bp
        from .routes.voice import voice_bp
        from .routes.rewards import rewards_bp
        from .routes.admin import admin_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
        app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
        app.register_blueprint(mood_bp, url_prefix='/api/mood')
        app.register_blueprint(journal_bp, url_prefix='/api/journal')
        app.register_blueprint(voice_bp, url_prefix='/api/voice')
        app.register_blueprint(rewards_bp, url_prefix='/api/rewards')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        print("✅ All blueprints registered successfully")
        
    except Exception as e:
        print(f"⚠️ Blueprint registration error: {e}")
        # Register minimal auth blueprint as fallback
        from flask import Blueprint
        minimal_auth = Blueprint('minimal_auth', __name__)
        
        @minimal_auth.route('/login', methods=['POST'])
        def minimal_login():
            from flask import request, jsonify
            return jsonify({'error': 'Backend not fully initialized', 'status': 'minimal_mode'}), 503
        
        app.register_blueprint(minimal_auth, url_prefix='/api/auth')
    
    # Create database tables with error handling
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
            # Initialize default badges
            from .utils.init_badges import init_default_badges
            init_default_badges()
            print("✅ Default badges initialized")
        except Exception as e:
            print(f"⚠️ Database initialization warning: {e}")
            # Continue anyway for demo purposes
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'The Recharge Room API'}
    
    return app