from app import create_app
import os

# Create Flask app
app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # Allow an environment variable PORT to override the default 5000
    port = int(os.getenv('PORT', 5000))
    print("=" * 50)
    print("Flask Backend Server Starting...")
    print(f"API available at: http://localhost:{port}/api")
    print("Press CTRL+C to stop")
    print("=" * 50)
    try:
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print("\nShutting down server...")
