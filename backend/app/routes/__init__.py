from app.routes.auth_keycloak import bp as auth_bp
from app.routes.user_keycloak import bp as user_bp
from app.routes.finance import finance_bp

__all__ = ['auth_bp', 'user_bp', 'finance_bp']
