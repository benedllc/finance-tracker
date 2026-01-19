from flask import Flask
from flask_cors import CORS
from config import config
import os


def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize CORS - allow all origins for development
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize database
    from app.database import init_db
    init_db(app.config['DATABASE_PATH'])
    
    # Register blueprints
    from app.routes import auth, user, admin
    from app.routes.finance import finance_bp
    app.register_blueprint(auth.bp)
    app.register_blueprint(user.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}, 200
    
    return app
