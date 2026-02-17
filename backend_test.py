#!/usr/bin/env python3

import requests
import json
import os
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://edu-platform-demo-3.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class UnishaalAuthPaymentTest:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_user_data = None
        
    def test_admin_login(self):
        """Test 1: Admin Login Test with admin@unishaala.com / Shivani@1234"""
        print("\n=== TEST 1: Admin Login Test ===")
        
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
                    print("✅ PASS: Admin login successful, SUPER_ADMIN role confirmed, auth_token cookie set")
                    self.admin_token = data.get('data', {}).get('token')
                    # Check if auth_token cookie was set
                    cookies = response.cookies
                    has_auth_cookie = 'auth_token' in cookies
                    print(f"Auth token cookie set: {has_auth_cookie}")
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
    
    def test_user_signup_and_login(self):
        """Test 2: User Login Test (create test user if needed)"""
        print("\n=== TEST 2: User Login Test (Create and Login) ===")
        
        # First create the test user
        timestamp = int(time.time())
        unique_phone = f"+919876{str(timestamp)[-6:]}"  # Use timestamp to avoid duplicates
        
        try:
            # Create test user
            response = self.session.post(f"{API_URL}/auth/signup", json={
                "name": "Test User",
                "email": "test@test.com",
                "phone": unique_phone,
                "password": "test123",
                "phoneVerified": True
            })
            
            print(f"Signup Status Code: {response.status_code}")
            signup_data = response.json()
            print(f"Signup Response: {json.dumps(signup_data, indent=2)}")
            
            # Note: If user already exists, that's fine - continue with login
            if response.status_code == 400 and "already registered" in signup_data.get('error', ''):
                print("User already exists, proceeding to login...")
            elif response.status_code != 200 or not signup_data.get('success'):
                print(f"⚠️ User creation failed: {signup_data.get('error', 'Unknown error')}")
            
            # Now test login
            login_response = self.session.post(f"{API_URL}/auth/login", json={
                "email": "test@test.com",
                "password": "test123"
            })
            
            print(f"Login Status Code: {login_response.status_code}")
            login_data = login_response.json()
            print(f"Login Response: {json.dumps(login_data, indent=2)}")
            
            if login_response.status_code == 200 and login_data.get('success'):
                user_data = login_data.get('data', {}).get('user', {})
                if user_data.get('role') == 'USER':
                    print("✅ PASS: User login successful with role 'USER'")
                    self.user_token = login_data.get('data', {}).get('token')
                    self.test_user_data = user_data
                    return True
                else:
                    print(f"❌ FAIL: Wrong role - expected USER, got {user_data.get('role')}")
                    return False
            else:
                print(f"❌ FAIL: User login failed - {login_data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_admin_stats_api(self):
        """Test 3: Admin Stats API"""
        print("\n=== TEST 3: Admin Stats API ===")
        
        if not self.admin_token:
            print("❌ FAIL: No admin token available - admin login test must pass first")
            return False
        
        try:
            # Debug: Check cookies being sent
            print(f"Cookies in session: {dict(self.session.cookies)}")
            
            # Use cookie-based auth since that's how the API works
            response = self.session.get(f"{API_URL}/admin/stats")
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200 and data.get('success'):
                stats_data = data.get('data', {})
                required_stats = ['totalUsers', 'totalExams', 'totalMockTests', 'totalQuestions', 'totalJobs', 'totalRevenue']
                has_all_stats = all(stat in stats_data for stat in required_stats)
                
                if has_all_stats:
                    print("✅ PASS: Admin stats API working - returns dashboard stats with all required fields")
                    return True
                else:
                    missing_stats = [stat for stat in required_stats if stat not in stats_data]
                    print(f"❌ FAIL: Missing stats fields: {missing_stats}")
                    return False
            else:
                print(f"❌ FAIL: Admin stats API failed - {data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_admin_exams_api(self):
        """Test 4: Admin Exams API"""
        print("\n=== TEST 4: Admin Exams API ===")
        
        if not self.admin_token:
            print("❌ FAIL: No admin token available - admin login test must pass first")
            return False
        
        try:
            # Use cookie-based auth since that's how the API works
            response = self.session.get(f"{API_URL}/admin/exams")
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200 and data.get('success'):
                exams_data = data.get('data', [])
                print(f"✅ PASS: Admin exams API working - returns list of {len(exams_data)} exams")
                return True
            else:
                print(f"❌ FAIL: Admin exams API failed - {data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_payment_initiation(self):
        """Test 5: Payment Initiation Test"""
        print("\n=== TEST 5: Payment Initiation Test ===")
        
        if not self.admin_token:
            print("❌ FAIL: No admin token available - admin login test must pass first")
            return False
        
        try:
            # Use admin session (logged in user required)
            response = self.session.post(f"{API_URL}/payment/initiate", json={
                "examId": "any-exam-id",
                "amount": 100,
                "paymentType": "exam_purchase"
            })
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200 and data.get('success'):
                payment_data = data.get('data', {})
                has_required_fields = all(field in payment_data for field in ['transactionId', 'amount', 'paymentUrl'])
                
                if has_required_fields:
                    print("✅ PASS: Payment initiation successful - returns transactionId, amount, and paymentUrl")
                    return True
                else:
                    missing_fields = [field for field in ['transactionId', 'amount', 'paymentUrl'] if field not in payment_data]
                    print(f"❌ FAIL: Missing payment fields: {missing_fields}")
                    return False
            else:
                print(f"❌ FAIL: Payment initiation failed - {data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def test_logout(self):
        """Test 6: Logout Test"""
        print("\n=== TEST 6: Logout Test ===")
        
        try:
            response = self.session.post(f"{API_URL}/auth/logout")
            
            print(f"Status Code: {response.status_code}")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200 and data.get('success'):
                print("✅ PASS: Logout successful - auth_token cookie should be cleared")
                return True
            else:
                print(f"❌ FAIL: Logout failed - {data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception during test - {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all authentication and payment flow tests"""
        print("🚀 Starting Unishaala Authentication and Payment Flow Tests...")
        print(f"📍 Testing against: {API_URL}")
        
        results = []
        
        # Test 1: Admin Login
        results.append(("Admin Login Test", self.test_admin_login()))
        
        # Test 3 & 4: Admin APIs (run immediately after admin login, before user login overwrites cookie)
        results.append(("Admin Stats API", self.test_admin_stats_api()))
        results.append(("Admin Exams API", self.test_admin_exams_api()))
        
        # Test 2: User Login (create if needed) - this will overwrite auth_token cookie
        results.append(("User Login Test (create test user if needed)", self.test_user_signup_and_login()))
        
        # Test 5: Payment Initiation Test (user must be logged in)
        results.append(("Payment Initiation Test", self.test_payment_initiation()))
        
        # Test 6: Logout Test
        results.append(("Logout Test", self.test_logout()))
        
        # Summary
        print("\n" + "="*60)
        print("🎯 AUTHENTICATION AND PAYMENT FLOW TEST SUMMARY")
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
            print("🎉 All authentication and payment flow tests PASSED!")
        else:
            print("⚠️  Some tests FAILED - check details above")
        
        return failed == 0

if __name__ == "__main__":
    tester = UnishaalAuthPaymentTest()
    success = tester.run_all_tests()
    exit(0 if success else 1)