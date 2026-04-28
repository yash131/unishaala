#!/usr/bin/env python3
"""
Backend Test Suite for Manage Account Endpoints
Tests all user account management endpoints including profile, security, notifications, support, and avatar features.
"""

import requests
import json
import random
import string
import os
from io import BytesIO
from PIL import Image

# Configuration
BASE_URL = "https://analytics-dash-119.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

def generate_random_email():
    """Generate a random email for testing"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"tester_{random_str}@example.com"

def create_test_image():
    """Create a small test PNG image"""
    img = Image.new('RGB', (50, 50), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes.getvalue()

def print_test_result(test_name, success, details=""):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"   Details: {details}")

def test_manage_account_endpoints():
    """Test all Manage Account backend endpoints"""
    print("🧪 TESTING: Manage Account Backend Endpoints")
    print("=" * 60)
    
    session_a = requests.Session()
    session_b = requests.Session()
    admin_session = requests.Session()
    
    # Test data
    test_user_a_email = generate_random_email()
    test_user_b_email = generate_random_email()
    test_password = "test1234"
    
    try:
        # Create test user A via POST /api/auth/signup
        print("\n📝 Creating test user A...")
        register_data = {
            "name": "TestUser",
            "email": test_user_a_email,
            "password": test_password
        }
        
        response = session_a.post(f"{BASE_URL}/api/auth/signup", json=register_data)
        if response.status_code == 200:
            print_test_result("User A Registration", True, f"Created user: {test_user_a_email}")
            session_a_cookies = session_a.cookies
        else:
            print_test_result("User A Registration", False, f"Status: {response.status_code}, Response: {response.text}")
            return
        
        # Test 1: GET /api/profile
        print("\n🔍 Test 1: GET /api/profile")
        
        # Without cookie → 401
        response = requests.get(f"{BASE_URL}/api/profile")
        print_test_result("Profile without auth", response.status_code == 401, f"Status: {response.status_code}")
        
        # With SESSION_A cookie → 200 and correct data
        response = session_a.get(f"{BASE_URL}/api/profile")
        if response.status_code == 200:
            data = response.json().get('data', {})
            has_required_fields = all(field in data for field in ['id', 'name', 'email', 'role', 'notificationPrefs'])
            no_password = 'password' not in data
            correct_defaults = data.get('notificationPrefs', {}).get('emailEnabled') == True
            
            print_test_result("Profile with auth", 
                            has_required_fields and no_password and correct_defaults,
                            f"Fields present: {list(data.keys())}, No password: {no_password}")
        else:
            print_test_result("Profile with auth", False, f"Status: {response.status_code}, Response: {response.text}")
        
        # Test 2: PUT /api/profile
        print("\n✏️ Test 2: PUT /api/profile")
        
        # Update name
        update_data = {"name": "Updated Name"}
        response = session_a.put(f"{BASE_URL}/api/profile", json=update_data)
        if response.status_code == 200:
            updated_name = response.json().get('data', {}).get('name')
            print_test_result("Profile name update", updated_name == "Updated Name", f"New name: {updated_name}")
        else:
            print_test_result("Profile name update", False, f"Status: {response.status_code}")
        
        # Verify persistence
        response = session_a.get(f"{BASE_URL}/api/profile")
        if response.status_code == 200:
            persisted_name = response.json().get('data', {}).get('name')
            print_test_result("Profile name persistence", persisted_name == "Updated Name", f"Persisted name: {persisted_name}")
        
        # Test 3: Create second user and test email uniqueness
        print("\n👥 Test 3: Email uniqueness validation")
        
        # Create TESTER_B
        register_data_b = {
            "name": "TesterB",
            "email": test_user_b_email,
            "password": test_password
        }
        
        response = session_b.post(f"{BASE_URL}/api/auth/signup", json=register_data_b)
        if response.status_code == 200:
            print_test_result("User B Registration", True, f"Created user: {test_user_b_email}")
        else:
            print_test_result("User B Registration", False, f"Status: {response.status_code}")
            return
        
        # Try to update SESSION_A email to TESTER_B email
        update_data = {"email": test_user_b_email}
        response = session_a.put(f"{BASE_URL}/api/profile", json=update_data)
        print_test_result("Email uniqueness validation", 
                        response.status_code == 400,
                        f"Status: {response.status_code}, Response: {response.json().get('error', '')}")
        
        # Test 4: POST /api/user/change-password
        print("\n🔐 Test 4: POST /api/user/change-password")
        
        # Wrong old password
        change_data = {"oldPassword": "wrongpass", "newPassword": "newpass123"}
        response = session_a.post(f"{BASE_URL}/api/user/change-password", json=change_data)
        print_test_result("Change password - wrong old password", 
                        response.status_code == 400,
                        f"Status: {response.status_code}")
        
        # Too short new password
        change_data = {"oldPassword": test_password, "newPassword": "abc"}
        response = session_a.post(f"{BASE_URL}/api/user/change-password", json=change_data)
        print_test_result("Change password - too short", 
                        response.status_code == 400,
                        f"Status: {response.status_code}")
        
        # Valid password change
        new_password = "newpass123"
        change_data = {"oldPassword": test_password, "newPassword": new_password}
        response = session_a.post(f"{BASE_URL}/api/user/change-password", json=change_data)
        if response.status_code == 200:
            print_test_result("Change password - valid", True, "Password changed successfully")
            
            # Save old cookies before they get updated
            old_cookies = dict(session_a.cookies)
            
            # Save new session cookies
            session_a_new = requests.Session()
            session_a_new.cookies.update(response.cookies)
            
            # Test old cookie is invalid using a fresh session with old cookies
            old_session = requests.Session()
            old_session.cookies.update(old_cookies)
            response = old_session.get(f"{BASE_URL}/api/profile")
            print_test_result("Old token invalidated", 
                            response.status_code == 401,
                            f"Old session status: {response.status_code}")
            
            # Test new cookie works
            response = session_a_new.get(f"{BASE_URL}/api/profile")
            print_test_result("New token valid", 
                            response.status_code == 200,
                            f"New session status: {response.status_code}")
            
            # Update session_a to use new cookies
            session_a = session_a_new
            test_password = new_password  # Update for future tests
        else:
            print_test_result("Change password - valid", False, f"Status: {response.status_code}")
        
        # Test 5: POST /api/user/logout-all-devices
        print("\n🚪 Test 5: POST /api/user/logout-all-devices")
        
        response = session_a.post(f"{BASE_URL}/api/user/logout-all-devices")
        if response.status_code == 200:
            print_test_result("Logout all devices", True, "Logout successful")
            
            # Test that session is now invalid
            response = session_a.get(f"{BASE_URL}/api/profile")
            print_test_result("Session invalidated after logout", 
                            response.status_code == 401,
                            f"Status after logout: {response.status_code}")
        else:
            print_test_result("Logout all devices", False, f"Status: {response.status_code}")
        
        # Test 6: POST /api/user/notification-prefs
        print("\n🔔 Test 6: POST /api/user/notification-prefs")
        
        # Login TESTER_B for notification tests
        login_data = {"email": test_user_b_email, "password": test_password}
        response = session_b.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            print_test_result("User B Login", True, "Logged in successfully")
        else:
            print_test_result("User B Login", False, f"Status: {response.status_code}")
            # Try with original password since user B hasn't changed password
            login_data = {"email": test_user_b_email, "password": "test1234"}
            response = session_b.post(f"{BASE_URL}/api/auth/login", json=login_data)
            if response.status_code == 200:
                print_test_result("User B Login (retry)", True, "Logged in successfully")
            else:
                print_test_result("User B Login (retry)", False, f"Status: {response.status_code}")
                return
        
        # Update notification preferences
        prefs_data = {
            "emailEnabled": False,
            "examReminders": False,
            "productUpdates": True
        }
        response = session_b.post(f"{BASE_URL}/api/user/notification-prefs", json=prefs_data)
        if response.status_code == 200:
            print_test_result("Update notification prefs", True, "Preferences updated")
            
            # Verify preferences were saved
            response = session_b.get(f"{BASE_URL}/api/profile")
            if response.status_code == 200:
                saved_prefs = response.json().get('data', {}).get('notificationPrefs', {})
                prefs_match = (saved_prefs.get('emailEnabled') == False and 
                             saved_prefs.get('examReminders') == False and 
                             saved_prefs.get('productUpdates') == True)
                print_test_result("Notification prefs persistence", prefs_match, f"Saved prefs: {saved_prefs}")
        else:
            print_test_result("Update notification prefs", False, f"Status: {response.status_code}")
        
        # Test 7: POST /api/user/support-ticket
        print("\n🎫 Test 7: POST /api/user/support-ticket")
        
        # Empty request
        response = session_b.post(f"{BASE_URL}/api/user/support-ticket", json={})
        print_test_result("Support ticket - empty request", 
                        response.status_code == 400,
                        f"Status: {response.status_code}")
        
        # Valid support ticket
        ticket_data = {
            "subject": "Issue with tests",
            "message": "Score calculation seems wrong",
            "category": "test"
        }
        response = session_b.post(f"{BASE_URL}/api/user/support-ticket", json=ticket_data)
        if response.status_code == 200:
            ticket_id = response.json().get('data', {}).get('id')
            print_test_result("Support ticket - valid", 
                            bool(ticket_id),
                            f"Ticket ID: {ticket_id}")
        else:
            print_test_result("Support ticket - valid", False, f"Status: {response.status_code}")
        
        # Test 8: POST /api/user/delete-account
        print("\n🗑️ Test 8: POST /api/user/delete-account")
        
        # Login admin first
        admin_login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        response = admin_session.post(f"{BASE_URL}/api/auth/login", json=admin_login_data)
        if response.status_code == 200:
            print_test_result("Admin Login", True, "Admin logged in successfully")
        else:
            print_test_result("Admin Login", False, f"Status: {response.status_code}")
            return
        
        # Try to delete admin account
        delete_data = {"password": ADMIN_PASSWORD, "confirm": "DELETE"}
        response = admin_session.post(f"{BASE_URL}/api/user/delete-account", json=delete_data)
        print_test_result("Admin account deletion blocked", 
                        response.status_code == 403,
                        f"Status: {response.status_code}")
        
        # Test TESTER_B deletion with wrong password
        delete_data = {"password": "WRONG", "confirm": "DELETE"}
        response = session_b.post(f"{BASE_URL}/api/user/delete-account", json=delete_data)
        print_test_result("Delete account - wrong password", 
                        response.status_code == 400,
                        f"Status: {response.status_code}")
        
        # Test TESTER_B deletion with wrong confirmation
        delete_data = {"password": test_password, "confirm": "nope"}
        response = session_b.post(f"{BASE_URL}/api/user/delete-account", json=delete_data)
        print_test_result("Delete account - wrong confirmation", 
                        response.status_code == 400,
                        f"Status: {response.status_code}")
        
        # Test TESTER_B deletion with correct data
        delete_data = {"password": "test1234", "confirm": "DELETE"}  # Use original password for user B
        response = session_b.post(f"{BASE_URL}/api/user/delete-account", json=delete_data)
        if response.status_code == 200:
            print_test_result("Delete account - valid", True, "Account deleted successfully")
            
            # Test that session is now invalid
            response = session_b.get(f"{BASE_URL}/api/profile")
            print_test_result("Session invalidated after deletion", 
                            response.status_code == 401,
                            f"Status after deletion: {response.status_code}")
        else:
            print_test_result("Delete account - valid", False, f"Status: {response.status_code}")
        
        # Test 9: Avatar upload endpoints
        print("\n🖼️ Test 9: Avatar upload endpoints")
        
        # Create TESTER_C for avatar tests
        test_user_c_email = generate_random_email()
        session_c = requests.Session()
        
        register_data_c = {
            "name": "TesterC",
            "email": test_user_c_email,
            "password": "test1234"  # Use original password
        }
        
        response = session_c.post(f"{BASE_URL}/api/auth/signup", json=register_data_c)
        if response.status_code == 200:
            print_test_result("User C Registration", True, f"Created user: {test_user_c_email}")
            user_c_id = response.json().get('data', {}).get('user', {}).get('id')
        else:
            print_test_result("User C Registration", False, f"Status: {response.status_code}")
            return
        
        # Test avatar upload without cookie
        test_image = create_test_image()
        files = {'avatar': ('test.png', test_image, 'image/png')}
        response = requests.post(f"{BASE_URL}/api/user/avatar", files=files)
        print_test_result("Avatar upload - no auth", 
                        response.status_code == 401,
                        f"Status: {response.status_code}")
        
        # Test avatar upload without file
        response = session_c.post(f"{BASE_URL}/api/user/avatar")
        print_test_result("Avatar upload - no file", 
                        response.status_code == 400,
                        f"Status: {response.status_code}")
        
        # Test valid avatar upload
        files = {'avatar': ('test.png', test_image, 'image/png')}
        response = session_c.post(f"{BASE_URL}/api/user/avatar", files=files)
        if response.status_code == 200:
            data = response.json().get('data', {})
            avatar_file_id = data.get('avatarFileId')
            avatar_url = data.get('avatarUrl')
            print_test_result("Avatar upload - valid", 
                            bool(avatar_file_id and avatar_url),
                            f"File ID: {avatar_file_id}, URL: {avatar_url}")
        else:
            print_test_result("Avatar upload - valid", False, f"Status: {response.status_code}")
            return
        
        # Test public avatar access
        response = requests.get(f"{BASE_URL}/api/user/{user_c_id}/avatar")
        is_image = response.headers.get('content-type', '').startswith('image/')
        print_test_result("Avatar public access", 
                        response.status_code == 200 and is_image,
                        f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
        
        # Test avatar deletion
        response = session_c.delete(f"{BASE_URL}/api/user/avatar")
        if response.status_code == 200:
            print_test_result("Avatar deletion", True, "Avatar deleted successfully")
            
            # Test that avatar is no longer accessible
            response = requests.get(f"{BASE_URL}/api/user/{user_c_id}/avatar")
            print_test_result("Avatar not found after deletion", 
                            response.status_code == 404,
                            f"Status: {response.status_code}")
        else:
            print_test_result("Avatar deletion", False, f"Status: {response.status_code}")
        
        print("\n" + "=" * 60)
        print("🎉 MANAGE ACCOUNT ENDPOINTS TESTING COMPLETE")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_manage_account_endpoints()