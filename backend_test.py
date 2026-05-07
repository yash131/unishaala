#!/usr/bin/env python3
"""
Backend test for Mandatory Phone Verification Gating (Twilio Verify)
Tests all scenarios specified in the review request.
"""

import requests
import json
import base64
from datetime import datetime

# Base URL from .env
BASE_URL = "https://dark-mode-theme-2.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

# Admin credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

# Test user credentials (will be created)
import random
timestamp = int(datetime.now().timestamp())
TEST_USER_EMAIL = f"testuser_{timestamp}@test.com"
TEST_USER_PASSWORD = "Test@1234"
TEST_USER_NAME = "Test User"
TEST_USER_PHONE = f"+9198765{random.randint(10000, 99999)}"

def decode_jwt_payload(token):
    """Decode JWT payload without verification (for testing)"""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        # Decode the payload (middle part)
        payload_b64 = parts[1]
        # Add padding if needed
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding
        payload_json = base64.urlsafe_b64decode(payload_b64).decode('utf-8')
        return json.loads(payload_json)
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        return None

def print_test_header(test_name):
    """Print a formatted test header"""
    print("\n" + "="*80)
    print(f"TEST: {test_name}")
    print("="*80)

def print_result(passed, message):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {message}")

# Store test data
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def record_test(name, passed, message):
    """Record test result"""
    test_results["tests"].append({"name": name, "passed": passed, "message": message})
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
    print_result(passed, message)

# ============================================================================
# TEST (a): Anonymous GET /test-series → 302 redirect to / (unauth)
# ============================================================================
print_test_header("(a) Anonymous GET /test-series → 302 redirect")
try:
    response = requests.get(f"{BASE_URL}/test-series", allow_redirects=False)
    if response.status_code == 302 or response.status_code == 307:
        location = response.headers.get('Location', '')
        if '/?auth=required' in location or location.startswith('/?auth=required'):
            record_test("Anonymous /test-series redirect", True, 
                       f"Status {response.status_code}, Location: {location}")
        else:
            record_test("Anonymous /test-series redirect", False, 
                       f"Redirected but wrong location: {location}")
    else:
        record_test("Anonymous /test-series redirect", False, 
                   f"Expected 302/307, got {response.status_code}")
except Exception as e:
    record_test("Anonymous /test-series redirect", False, f"Exception: {e}")

# ============================================================================
# TEST (b): Sign up a brand new user - confirm phoneVerified === false
# ============================================================================
print_test_header("(b) POST /api/auth/signup - new user with phoneVerified:false")
test_user_cookies = None
try:
    signup_data = {
        "name": TEST_USER_NAME,
        "email": TEST_USER_EMAIL,
        "phone": TEST_USER_PHONE,
        "password": TEST_USER_PASSWORD
    }
    response = requests.post(f"{API_URL}/auth/signup", json=signup_data)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            user = data.get('data', {}).get('user', {})
            phone_verified = user.get('phoneVerified')
            
            # Check response includes phoneVerified:false
            if phone_verified == False:
                record_test("Signup response phoneVerified", True, 
                           f"response.data.user.phoneVerified === false ✓")
            else:
                record_test("Signup response phoneVerified", False, 
                           f"Expected phoneVerified:false, got {phone_verified}")
            
            # Check JWT cookie payload
            cookies = response.cookies
            auth_token = cookies.get('auth_token')
            if auth_token:
                payload = decode_jwt_payload(auth_token)
                if payload:
                    jwt_phone_verified = payload.get('phoneVerified')
                    if jwt_phone_verified == False:
                        record_test("Signup JWT phoneVerified", True, 
                                   f"JWT payload phoneVerified:false ✓")
                    else:
                        record_test("Signup JWT phoneVerified", False, 
                                   f"JWT phoneVerified should be false, got {jwt_phone_verified}")
                else:
                    record_test("Signup JWT decode", False, "Failed to decode JWT")
            else:
                record_test("Signup JWT cookie", False, "No auth_token cookie set")
            
            # Check phone field is included
            if 'phone' in user:
                record_test("Signup response includes phone", True, 
                           f"phone field present: {user.get('phone')}")
            else:
                record_test("Signup response includes phone", False, 
                           "phone field missing from response")
            
            # Store cookies for next tests
            test_user_cookies = cookies
        else:
            record_test("Signup success", False, f"API returned success:false - {data.get('error')}")
    else:
        record_test("Signup request", False, f"Status {response.status_code}: {response.text}")
except Exception as e:
    record_test("Signup request", False, f"Exception: {e}")

# ============================================================================
# TEST (c): After signup, GET /api/auth/me → 200 with phoneVerified:false
# ============================================================================
print_test_header("(c) GET /api/auth/me with signup cookie → phoneVerified:false")
if test_user_cookies:
    try:
        response = requests.get(f"{API_URL}/auth/me", cookies=test_user_cookies)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                user_data = data.get('data', {})
                phone_verified = user_data.get('phoneVerified')
                
                if phone_verified == False:
                    record_test("/auth/me phoneVerified", True, 
                               f"phoneVerified:false in /auth/me response ✓")
                else:
                    record_test("/auth/me phoneVerified", False, 
                               f"Expected phoneVerified:false, got {phone_verified}")
            else:
                record_test("/auth/me success", False, f"API returned success:false")
        else:
            record_test("/auth/me request", False, f"Status {response.status_code}")
    except Exception as e:
        record_test("/auth/me request", False, f"Exception: {e}")
else:
    record_test("/auth/me request", False, "Skipped - no test user cookies from signup")

# ============================================================================
# TEST (d): After signup, GET /test-series → 302 to /verify-otp?next=/test-series
# ============================================================================
print_test_header("(d) GET /test-series with unverified user → redirect to /verify-otp")
if test_user_cookies:
    try:
        response = requests.get(f"{BASE_URL}/test-series", cookies=test_user_cookies, 
                               allow_redirects=False)
        
        if response.status_code == 302 or response.status_code == 307:
            location = response.headers.get('Location', '')
            if '/verify-otp' in location and 'next=' in location:
                record_test("Unverified user /test-series redirect", True, 
                           f"Status {response.status_code}, Location: {location}")
            else:
                record_test("Unverified user /test-series redirect", False, 
                           f"Wrong redirect location: {location}")
        else:
            record_test("Unverified user /test-series redirect", False, 
                       f"Expected 302/307, got {response.status_code}")
    except Exception as e:
        record_test("Unverified user /test-series redirect", False, f"Exception: {e}")
else:
    record_test("Unverified user /test-series redirect", False, "Skipped - no test user cookies from signup")

# ============================================================================
# TEST (e): Admin login → phoneVerified:true, GET /admin → 200 (no redirect)
# ============================================================================
print_test_header("(e) Admin login → phoneVerified:true, /admin accessible")
try:
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    response = requests.post(f"{API_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            user = data.get('data', {}).get('user', {})
            phone_verified = user.get('phoneVerified')
            
            if phone_verified == True:
                record_test("Admin login phoneVerified", True, 
                           f"Admin user.phoneVerified === true ✓")
            else:
                record_test("Admin login phoneVerified", False, 
                           f"Expected phoneVerified:true, got {phone_verified}")
            
            # Check JWT
            admin_cookies = response.cookies
            auth_token = admin_cookies.get('auth_token')
            if auth_token:
                payload = decode_jwt_payload(auth_token)
                if payload:
                    jwt_phone_verified = payload.get('phoneVerified')
                    if jwt_phone_verified == True:
                        record_test("Admin JWT phoneVerified", True, 
                                   f"JWT payload phoneVerified:true ✓")
                    else:
                        record_test("Admin JWT phoneVerified", False, 
                                   f"JWT phoneVerified should be true, got {jwt_phone_verified}")
            
            # Test admin can access /admin without redirect
            admin_response = requests.get(f"{BASE_URL}/admin", cookies=admin_cookies, 
                                         allow_redirects=False)
            if admin_response.status_code == 200:
                record_test("Admin /admin access", True, 
                           "Admin can access /admin without redirect ✓")
            else:
                record_test("Admin /admin access", False, 
                           f"Expected 200, got {admin_response.status_code}")
        else:
            record_test("Admin login success", False, f"Login failed: {data.get('error')}")
    else:
        record_test("Admin login request", False, f"Status {response.status_code}")
except Exception as e:
    record_test("Admin login request", False, f"Exception: {e}")

# ============================================================================
# TEST (f): /api/auth/send-otp without phone → 400
# ============================================================================
print_test_header("(f) POST /api/auth/send-otp without phone → 400")
try:
    response = requests.post(f"{API_URL}/auth/send-otp", json={})
    
    if response.status_code == 400:
        data = response.json()
        error = data.get('error', '')
        if 'phone' in error.lower() or 'required' in error.lower():
            record_test("send-otp without phone", True, 
                       f"400 with error: {error}")
        else:
            record_test("send-otp without phone", False, 
                       f"400 but unexpected error: {error}")
    else:
        record_test("send-otp without phone", False, 
                   f"Expected 400, got {response.status_code}")
except Exception as e:
    record_test("send-otp without phone", False, f"Exception: {e}")

# ============================================================================
# TEST (f2): /api/auth/send-otp with fake phone → check contract (ONE REQUEST ONLY)
# ============================================================================
print_test_header("(f2) POST /api/auth/send-otp with fake phone → check contract")
try:
    # Using a fake but formatted number as instructed
    response = requests.post(f"{API_URL}/auth/send-otp", 
                            json={"phone": "+919999999999"})
    
    # Just record what Twilio returns - could be 200 or 400
    if response.status_code in [200, 400]:
        data = response.json()
        record_test("send-otp contract check", True, 
                   f"Status {response.status_code}, response: {json.dumps(data)}")
    else:
        record_test("send-otp contract check", False, 
                   f"Unexpected status {response.status_code}")
except Exception as e:
    record_test("send-otp contract check", False, f"Exception: {e}")

# ============================================================================
# TEST (g): /api/auth/verify-my-phone without auth → 401
# ============================================================================
print_test_header("(g) POST /api/auth/verify-my-phone without auth → 401")
try:
    response = requests.post(f"{API_URL}/auth/verify-my-phone", 
                            json={"phone": "+919999999999", "code": "123456"})
    
    if response.status_code == 401:
        record_test("verify-my-phone without auth", True, 
                   f"401 Unauthorized as expected")
    else:
        record_test("verify-my-phone without auth", False, 
                   f"Expected 401, got {response.status_code}")
except Exception as e:
    record_test("verify-my-phone without auth", False, f"Exception: {e}")

# ============================================================================
# TEST (h): /api/auth/verify-my-phone with auth + missing fields → 400
# ============================================================================
print_test_header("(h) POST /api/auth/verify-my-phone with auth + missing fields → 400")
if test_user_cookies:
    try:
        # Missing code field
        response = requests.post(f"{API_URL}/auth/verify-my-phone", 
                                json={"phone": "+919999999999"},
                                cookies=test_user_cookies)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get('error', '')
            record_test("verify-my-phone missing fields", True, 
                       f"400 with error: {error}")
        else:
            record_test("verify-my-phone missing fields", False, 
                       f"Expected 400, got {response.status_code}")
    except Exception as e:
        record_test("verify-my-phone missing fields", False, f"Exception: {e}")
else:
    record_test("verify-my-phone missing fields", False, "Skipped - no test user cookies from signup")

# ============================================================================
# TEST (i): Confirm migration ran - existing users have phoneVerified:false
# ============================================================================
print_test_header("(i) Check migration: existing non-admin users have phoneVerified:false")
try:
    # Need admin auth to access /api/admin/users
    response = requests.get(f"{API_URL}/admin/users", cookies=admin_cookies)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            users = data.get('data', [])
            # Find non-admin users
            non_admin_users = [u for u in users if u.get('role') not in ['SUPER_ADMIN', 'ADMIN']]
            
            if len(non_admin_users) > 0:
                # Check first 2 non-admin users
                sample_users = non_admin_users[:2]
                all_have_false = all(u.get('phoneVerified') == False for u in sample_users)
                
                if all_have_false:
                    record_test("Migration check", True, 
                               f"Checked {len(sample_users)} non-admin users, all have phoneVerified:false ✓")
                else:
                    record_test("Migration check", False, 
                               f"Some non-admin users don't have phoneVerified:false")
            else:
                record_test("Migration check", True, 
                           "No non-admin users found (migration may not have affected any)")
        else:
            record_test("Migration check", False, f"API error: {data.get('error')}")
    else:
        record_test("Migration check", False, f"Status {response.status_code}")
except Exception as e:
    record_test("Migration check", False, f"Exception: {e}")

# ============================================================================
# TEST (j): /api/admin/users includes phone and phoneVerified fields
# ============================================================================
print_test_header("(j) /api/admin/users response includes phone and phoneVerified")
try:
    response = requests.get(f"{API_URL}/admin/users", cookies=admin_cookies)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            users = data.get('data', [])
            if len(users) > 0:
                sample_user = users[0]
                has_phone = 'phone' in sample_user
                has_phone_verified = 'phoneVerified' in sample_user
                
                if has_phone and has_phone_verified:
                    record_test("Admin users fields", True, 
                               f"Both 'phone' and 'phoneVerified' fields present ✓")
                else:
                    record_test("Admin users fields", False, 
                               f"Missing fields - phone:{has_phone}, phoneVerified:{has_phone_verified}")
            else:
                record_test("Admin users fields", False, "No users returned")
        else:
            record_test("Admin users fields", False, f"API error: {data.get('error')}")
    else:
        record_test("Admin users fields", False, f"Status {response.status_code}")
except Exception as e:
    record_test("Admin users fields", False, f"Exception: {e}")

# ============================================================================
# TEST (k): Login response for non-admin includes phone and phoneVerified
# ============================================================================
print_test_header("(k) Non-admin login response includes phone and phoneVerified")
if test_user_cookies:
    try:
        # Login with the test user we created
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                user = data.get('data', {}).get('user', {})
                has_phone = 'phone' in user
                has_phone_verified = 'phoneVerified' in user
                
                if has_phone and has_phone_verified:
                    record_test("Login response fields", True, 
                               f"Login response includes both 'phone' and 'phoneVerified' ✓")
                else:
                    record_test("Login response fields", False, 
                               f"Missing fields - phone:{has_phone}, phoneVerified:{has_phone_verified}")
            else:
                record_test("Login response fields", False, f"Login failed: {data.get('error')}")
        else:
            record_test("Login response fields", False, f"Status {response.status_code}")
    except Exception as e:
        record_test("Login response fields", False, f"Exception: {e}")
else:
    record_test("Login response fields", False, "Skipped - no test user created in signup")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print(f"Total Tests: {test_results['passed'] + test_results['failed']}")
print(f"Passed: {test_results['passed']}")
print(f"Failed: {test_results['failed']}")
print("="*80)

if test_results['failed'] > 0:
    print("\nFailed Tests:")
    for test in test_results['tests']:
        if not test['passed']:
            print(f"  ❌ {test['name']}: {test['message']}")

print("\n✅ Testing complete!")
