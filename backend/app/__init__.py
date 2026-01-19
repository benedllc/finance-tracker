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
    from app.routes.auth_keycloak import bp as auth_bp
    from app.routes.user_keycloak import bp as user_bp
    from app.routes.admin import bp as admin_bp
    from app.routes.finance import finance_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}, 200
    
    return app
