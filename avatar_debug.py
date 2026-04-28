#!/usr/bin/env python3
"""
Simple Avatar Debug Test
"""

import requests
import json
import random
from io import BytesIO
from PIL import Image

BASE_URL = "https://analytics-dash-119.preview.emergentagent.com"

def create_test_image():
    """Create a small test PNG image"""
    img = Image.new('RGB', (50, 50), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes.getvalue()

def test_avatar_debug():
    session = requests.Session()
    
    # Create user
    register_data = {
        "name": "AvatarTest",
        "email": f"avatartest{random.randint(1000,9999)}@example.com",
        "password": "test1234"
    }
    
    response = session.post(f"{BASE_URL}/api/auth/signup", json=register_data)
    if response.status_code != 200:
        print(f"Registration failed: {response.status_code} - {response.text}")
        return
    
    user_data = response.json().get('data', {}).get('user', {})
    user_id = user_data.get('id')
    print(f"Created user with ID: {user_id}")
    
    # Upload avatar
    test_image = create_test_image()
    files = {'avatar': ('test.png', test_image, 'image/png')}
    response = session.post(f"{BASE_URL}/api/user/avatar", files=files)
    
    if response.status_code != 200:
        print(f"Avatar upload failed: {response.status_code} - {response.text}")
        return
    
    upload_data = response.json().get('data', {})
    print(f"Avatar uploaded: {upload_data}")
    
    # Try to access avatar immediately
    response = requests.get(f"{BASE_URL}/api/user/{user_id}/avatar")
    print(f"Avatar access: {response.status_code} - Content-Type: {response.headers.get('content-type')}")
    
    if response.status_code != 200:
        print(f"Avatar access failed: {response.text}")
    
    # Check user profile to see if avatarFileId is set
    response = session.get(f"{BASE_URL}/api/profile")
    if response.status_code == 200:
        profile_data = response.json().get('data', {})
        print(f"Profile avatarFileId: {profile_data.get('avatarFileId')}")

if __name__ == "__main__":
    test_avatar_debug()