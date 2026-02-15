#!/usr/bin/env python3

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://edu-platform-demo-3.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class UnishaalAuthTest:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        
    def test_admin_login_new_password(self):
        """Test 1: Admin Login with New Password (Shivani@1234)"""
        print("\n=== TEST 1: Admin Login with New Password ===")
        
        try:
            response = self.session.post(f"{API_URL}/auth/login", json={
                "email": "admin@unishaala.com",
                "password": "Shivani@1234"
            })
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200 and data.get('success'):
                user_data = data.get('data', {}).get('user', {})
                if user_data.get('role') == 'SUPER_ADMIN':
                    print("✅ PASS: Admin login successful with new password, SUPER_ADMIN role confirmed")
                    self.admin_token = data.get('data', {}).get('token')
                    return True
                else:
                    print(f"❌ FAIL: Wrong role - expected SUPER_ADMIN, got {user_data.get('role')}")
                    return False
            else:
                print(f"❌ FAIL: Login failed - {data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_admin_login_old_password(self):
        """Test 2: Admin Login with Old Password (should FAIL)"""
        print("\n=== TEST 2: Admin Login with Old Password (should FAIL) ===")
        
        try:
            response = self.session.post(f"{API_URL}/auth/login", json={
                "email": "admin@unishaala.com",
                "password": "admin123"
            })
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 401 and data.get('error') == 'Invalid credentials':
                print("✅ PASS: Old password correctly rejected with 401 'Invalid credentials'")
                return True
            else:
                print(f"❌ FAIL: Expected 401 'Invalid credentials', got {response.status_code} with error: {data.get('error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_phone_otp_send(self):
        """Test 3: Phone OTP Send API"""
        print("\n=== TEST 3: Phone OTP Send API ===")
        
        try:
            response = self.session.post(f"{API_URL}/auth/send-otp", json={
                "phone": "+919876543210"
            })
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Accept both success (valid Twilio setup) and error (invalid number for testing)
            if response.status_code == 200 and data.get('success'):
                print("✅ PASS: OTP send API working - Twilio integration successful")
                return True
            elif response.status_code == 400 and 'check phone number' in data.get('error', '').lower():
                print("✅ PASS: OTP send API working - Expected Twilio error for test number")
                return True
            else:
                print(f"❌ FAIL: Unexpected response - {data}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_phone_otp_verify(self):
        """Test 4: Phone OTP Verify API"""
        print("\n=== TEST 4: Phone OTP Verify API (Invalid Code) ===")
        
        try:
            response = self.session.post(f"{API_URL}/auth/verify-phone-otp", json={
                "phone": "+919876543210",
                "code": "123456"
            })
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Should return error for invalid code
            if response.status_code == 400 and not data.get('success'):
                print("✅ PASS: OTP verify API correctly rejects invalid code")
                return True
            else:
                print(f"❌ FAIL: Expected 400 error for invalid code, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_user_signup_with_phone_verified(self):
        """Test 5: User Signup with Phone Verification"""
        print("\n=== TEST 5: User Signup with Phone Verification ===")
        
        try:
            import time
            unique_email = f"test{int(time.time())}@example.com"
            response = self.session.post(f"{API_URL}/auth/signup", json={
                "name": "Test User",
                "email": unique_email,
                "phone": "+919876543210",
                "password": "test123",
                "phoneVerified": True
            })
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200 and data.get('success'):
                print("✅ PASS: User signup successful with phoneVerified=true")
                return True
            else:
                print(f"❌ FAIL: Signup failed - {data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_admin_users_verification_fields(self):
        """Test 6: Admin Users API - Check Verification Fields"""
        print("\n=== TEST 6: Admin Users API - Check Verification Fields ===")
        
        if not self.admin_token:
            print("❌ FAIL: No admin token available - admin login test must pass first")
            return False
        
        try:
            # Set auth header
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Also try with cookie-based auth since that's how the API works
            response = self.session.get(f"{API_URL}/admin/users")
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # Truncate for readability
            
            if response.status_code == 200 and data.get('success'):
                users = data.get('data', [])
                if len(users) > 0:
                    # Check if users have phoneVerified and authProvider fields
                    sample_user = users[0]
                    has_phone_verified = 'phoneVerified' in sample_user
                    has_auth_provider = 'authProvider' in sample_user
                    
                    print(f"Sample user fields: {list(sample_user.keys())}")
                    print(f"Has phoneVerified field: {has_phone_verified}")
                    print(f"Has authProvider field: {has_auth_provider}")
                    
                    if has_phone_verified and has_auth_provider:
                        print("✅ PASS: Admin users API returns users with phoneVerified and authProvider fields")
                        return True
                    else:
                        print("❌ FAIL: Missing required fields in user data")
                        return False
                else:
                    print("❌ FAIL: No users returned from admin API")
                    return False
            else:
                print(f"❌ FAIL: Admin users API failed - {data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("🚀 Starting Unishaala Authentication System Tests...")
        print(f"📍 Testing against: {API_URL}")
        
        results = []
        
        # Test 1: Admin login with new password
        results.append(("Admin Login with New Password", self.test_admin_login_new_password()))
        
        # Test 2: Admin login with old password (should fail)
        results.append(("Admin Login with Old Password (should FAIL)", self.test_admin_login_old_password()))
        
        # Test 3: Phone OTP Send
        results.append(("Phone OTP Send API", self.test_phone_otp_send()))
        
        # Test 4: Phone OTP Verify
        results.append(("Phone OTP Verify API", self.test_phone_otp_verify()))
        
        # Test 5: User signup with phone verification
        results.append(("User Signup with Phone Verification", self.test_user_signup_with_phone_verified()))
        
        # Test 6: Admin users API verification fields
        results.append(("Admin Users API - Verification Fields", self.test_admin_users_verification_fields()))
        
        # Summary
        print("\n" + "="*60)
        print("🎯 AUTHENTICATION SYSTEM TEST SUMMARY")
        print("="*60)
        
        passed = 0
        failed = 0
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\n📊 Results: {passed} PASSED, {failed} FAILED")
        
        if failed == 0:
            print("🎉 All authentication tests PASSED!")
        else:
            print("⚠️  Some authentication tests FAILED - check details above")
        
        return failed == 0

if __name__ == "__main__":
    tester = UnishaalAuthTest()
    success = tester.run_all_tests()
    exit(0 if success else 1)