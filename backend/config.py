import os
from datetime import timedelta
from dotenv import load_dotenv
import pytesseract

# Load environment variables
load_dotenv()

# Configure Tesseract OCR path (Windows)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class Config:
    """Base configuration class"""
    
    # Secret key for JWT encoding
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database configuration
    DATABASE_PATH = os.getenv('DATABASE_PATH', 'database.db')
    
    # OpenAI API Key for Vision OCR
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    
    # JWT configuration
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    JWT_ALGORITHM = 'HS256'
    
    # Flask configuration
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    
    # CORS configuration
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:19006']
    
    @staticmethod
    def init_app(app):
        """Initialize application with this configuration"""
        pass


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        # Add production-specific initialization here


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
