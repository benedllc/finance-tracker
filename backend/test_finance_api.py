"""
Test the finance API endpoints directly
"""
import requests
import json

# First login to get a token
login_data = {
    "username": "admin",
    "password": "admin123"
}

print("=== Testing Login ===")
try:
    response = requests.post('http://localhost:5000/api/login', json=login_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print(f"✓ Login successful, got token")
        
        # Now test the accounts endpoint
        print("\n=== Testing Get Accounts ===")
        headers = {'Authorization': f'Bearer {token}'}
        accounts_response = requests.get('http://localhost:5000/api/finance/accounts', headers=headers)
        print(f"Status: {accounts_response.status_code}")
        print(f"Response: {accounts_response.text}")
        
        if accounts_response.status_code == 200:
            accounts = accounts_response.json()
            print(f"✓ Accounts fetched successfully:")
            print(json.dumps(accounts, indent=2))
        else:
            print(f"✗ Failed to fetch accounts")
            
    else:
        print(f"✗ Login failed: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")
