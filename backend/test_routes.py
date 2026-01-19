"""Test script to check if routes are registered"""
from app import create_app

app = create_app()

print("=" * 80)
print("REGISTERED ROUTES:")
print("=" * 80)

with app.app_context():
    for rule in app.url_map.iter_rules():
        if 'receipt' in rule.rule:
            print(f"{rule.rule:50s} {str(rule.methods):30s} {rule.endpoint}")

print("=" * 80)
