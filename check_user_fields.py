#!/usr/bin/env python3

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://unishaala-payments.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

session = requests.Session()

# Login as admin first
response = session.post(f"{API_URL}/auth/login", json={
    "email": "admin@unishaala.com",
    "password": "Shivani@1234"
})

if response.status_code == 200:
    print("✅ Admin logged in successfully")
    
    # Get all users
    users_response = session.get(f"{API_URL}/admin/users")
    
    if users_response.status_code == 200:
        users_data = users_response.json()
        users = users_data.get('data', [])
        
        print(f"\n📊 Found {len(users)} users")
        
        for user in users:
            print(f"\n👤 User: {user.get('name')} ({user.get('email')})")
            print(f"   Role: {user.get('role')}")
            print(f"   phoneVerified: {user.get('phoneVerified', 'N/A')}")
            print(f"   authProvider: {user.get('authProvider', 'MISSING')}")
            print(f"   isVerified: {user.get('isVerified', 'N/A')}")
            
            # Check if this is the new test user
            if user.get('email') == 'test@example.com':
                print("   ⭐ This is the new test user created during testing")
                
    else:
        print("❌ Failed to get users")
else:
    print("❌ Admin login failed")
