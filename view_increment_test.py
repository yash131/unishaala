#!/usr/bin/env python3

import requests
import json
import time

# Configuration
BASE_URL = "https://dark-mode-theme-2.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

def test_view_increment():
    """Test view increment functionality specifically"""
    print("🔍 Testing View Increment Functionality...")
    
    # Login as admin
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code != 200:
        print("❌ Admin login failed")
        return False
    
    # Create a published blog
    blog_data = {
        "title": "View Increment Test Blog",
        "description": "Testing view increment",
        "content": "<p>Test content</p>",
        "status": "published"
    }
    
    response = session.post(f"{BASE_URL}/api/admin/blogs", json=blog_data)
    if response.status_code != 200:
        print("❌ Blog creation failed")
        return False
    
    blog_id = response.json()['data']['id']
    blog_slug = response.json()['data']['slug']
    
    print(f"✅ Created test blog with slug: {blog_slug}")
    
    # Get initial view count via admin API
    response = session.get(f"{BASE_URL}/api/admin/blogs/{blog_id}")
    if response.status_code != 200:
        print("❌ Could not get initial blog data")
        return False
    
    initial_views = response.json()['data']['views']
    print(f"📊 Initial view count: {initial_views}")
    
    # Access blog via public API (should increment views)
    public_session = requests.Session()
    response = public_session.get(f"{BASE_URL}/api/blogs/{blog_slug}")
    
    if response.status_code != 200:
        print(f"❌ Public blog access failed: {response.status_code}")
        return False
    
    returned_views = response.json()['data']['views']
    print(f"📊 Views in public API response: {returned_views}")
    
    # Check actual view count via admin API after public access
    time.sleep(0.5)  # Small delay to ensure update is processed
    response = session.get(f"{BASE_URL}/api/admin/blogs/{blog_id}")
    if response.status_code != 200:
        print("❌ Could not get updated blog data")
        return False
    
    final_views = response.json()['data']['views']
    print(f"📊 Final view count (via admin API): {final_views}")
    
    # Cleanup
    session.delete(f"{BASE_URL}/api/admin/blogs/{blog_id}")
    
    # Check if views were incremented
    if final_views > initial_views:
        print(f"✅ View increment working: {initial_views} → {final_views}")
        return True
    else:
        print(f"❌ View increment not working: {initial_views} → {final_views}")
        return False

if __name__ == "__main__":
    test_view_increment()