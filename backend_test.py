#!/usr/bin/env python3
"""
Updated Backend Testing Script for Unishaala Pricing + Get Pass + Unified Access Flow
Testing the review request scenarios with admin credentials: admin@unishaala.com / Shivani@1234
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://admin-cleanup-18.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class TestRunner:
    def __init__(self):
        self.session = requests.Session()
        self.admin_cookies = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", expected="", actual=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'success': success,
            'details': details,
            'expected': expected,
            'actual': actual
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and expected:
            print(f"   Expected: {expected}")
            print(f"   Actual: {actual}")
        print()

    def admin_login(self):
        """Login as admin and get auth cookies"""
        try:
            response = self.session.post(f"{BASE_URL}/api/auth/login", 
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.admin_cookies = self.session.cookies
                    self.log_test("Admin Login", True, f"Logged in as {ADMIN_EMAIL}")
                    return True
                else:
                    self.log_test("Admin Login", False, f"Login failed: {data.get('error', 'Unknown error')}")
                    return False
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_public_pricing_api(self):
        """Test GET /api/pricing (public)"""
        try:
            response = requests.get(f"{BASE_URL}/api/pricing")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    pricing_data = data['data']
                    has_get_pass_price = 'getPassPrice' in pricing_data
                    has_get_pass_enabled = 'getPassEnabled' in pricing_data
                    
                    if has_get_pass_price and has_get_pass_enabled:
                        self.log_test("GET /api/pricing (public)", True, 
                                    f"getPassPrice: {pricing_data['getPassPrice']}, getPassEnabled: {pricing_data['getPassEnabled']}")
                    else:
                        self.log_test("GET /api/pricing (public)", False, 
                                    f"Missing required fields", 
                                    "getPassPrice and getPassEnabled fields",
                                    f"Available fields: {list(pricing_data.keys())}")
                else:
                    self.log_test("GET /api/pricing (public)", False, 
                                f"Invalid response structure", 
                                "success=true with data field",
                                f"Response: {data}")
            else:
                self.log_test("GET /api/pricing (public)", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/pricing (public)", False, f"Exception: {str(e)}")

    def test_admin_pricing_api_without_auth(self):
        """Test GET /api/admin/pricing without admin cookie → should return 401"""
        try:
            response = requests.get(f"{BASE_URL}/api/admin/pricing")
            
            if response.status_code == 401:
                self.log_test("GET /api/admin/pricing (no auth)", True, "Correctly returned 401 Unauthorized")
            else:
                self.log_test("GET /api/admin/pricing (no auth)", False, 
                            f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/admin/pricing (no auth)", False, f"Exception: {str(e)}")

    def test_admin_pricing_api_with_auth(self):
        """Test GET /api/admin/pricing with admin cookie → should return 200"""
        try:
            response = self.session.get(f"{BASE_URL}/api/admin/pricing")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    pricing_data = data['data']
                    required_fields = ['getPassPrice', 'getPassEnabled', 'updatedAt']
                    has_all_fields = all(field in pricing_data for field in required_fields)
                    
                    if has_all_fields:
                        self.log_test("GET /api/admin/pricing (with auth)", True, 
                                    f"All fields present: {pricing_data}")
                    else:
                        missing_fields = [f for f in required_fields if f not in pricing_data]
                        self.log_test("GET /api/admin/pricing (with auth)", False, 
                                    f"Missing fields: {missing_fields}",
                                    f"Fields: {required_fields}",
                                    f"Available: {list(pricing_data.keys())}")
                else:
                    self.log_test("GET /api/admin/pricing (with auth)", False, 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("GET /api/admin/pricing (with auth)", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/admin/pricing (with auth)", False, f"Exception: {str(e)}")

    def test_admin_pricing_update(self):
        """Test PUT /api/admin/pricing with body {getPassPrice: 4999, getPassEnabled: true}"""
        try:
            response = self.session.put(f"{BASE_URL}/api/admin/pricing", 
                json={
                    "getPassPrice": 4999,
                    "getPassEnabled": True
                })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    pricing_data = data['data']
                    price_correct = pricing_data.get('getPassPrice') == 4999
                    enabled_correct = pricing_data.get('getPassEnabled') == True
                    
                    if price_correct and enabled_correct:
                        self.log_test("PUT /api/admin/pricing", True, 
                                    f"Updated successfully: {pricing_data}")
                        
                        # Verify the update by checking public API
                        public_response = requests.get(f"{BASE_URL}/api/pricing")
                        if public_response.status_code == 200:
                            public_data = public_response.json()
                            if public_data.get('success'):
                                public_pricing = public_data['data']
                                if (public_pricing.get('getPassPrice') == 4999 and 
                                    public_pricing.get('getPassEnabled') == True):
                                    self.log_test("PUT /api/admin/pricing verification", True, 
                                                "Public API reflects the update")
                                else:
                                    self.log_test("PUT /api/admin/pricing verification", False, 
                                                f"Public API doesn't reflect update: {public_pricing}")
                    else:
                        self.log_test("PUT /api/admin/pricing", False, 
                                    f"Incorrect values returned",
                                    "getPassPrice=4999, getPassEnabled=true",
                                    f"getPassPrice={pricing_data.get('getPassPrice')}, getPassEnabled={pricing_data.get('getPassEnabled')}")
                else:
                    self.log_test("PUT /api/admin/pricing", False, 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("PUT /api/admin/pricing", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("PUT /api/admin/pricing", False, f"Exception: {str(e)}")

    def test_payment_create_order_endpoints(self):
        """Test POST /api/payment/create-order with various paymentTypes"""
        
        print(f"\n--- Testing /api/payment/create-order ---")
        
        # Test 1: paymentType='test_purchase' → should return 400
        try:
            response = self.session.post(f"{BASE_URL}/api/payment/create-order", 
                json={
                    "paymentType": "test_purchase",
                    "amount": 999
                })
            
            if response.status_code == 400:
                self.log_test("POST /api/payment/create-order test_purchase rejection", True, 
                            "Correctly rejected test_purchase with 400")
            else:
                self.log_test("POST /api/payment/create-order test_purchase rejection", False, 
                            f"Expected 400, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /api/payment/create-order test_purchase rejection", False, f"Exception: {str(e)}")

        # Test 2: paymentType='invalid' → should return 400
        try:
            response = self.session.post(f"{BASE_URL}/api/payment/create-order", 
                json={
                    "paymentType": "invalid",
                    "amount": 999
                })
            
            if response.status_code == 400:
                self.log_test("POST /api/payment/create-order invalid paymentType rejection", True, 
                            "Correctly rejected invalid paymentType with 400")
            else:
                self.log_test("POST /api/payment/create-order invalid paymentType rejection", False, 
                            f"Expected 400, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /api/payment/create-order invalid paymentType rejection", False, f"Exception: {str(e)}")

        # Test 3: paymentType='get_pass' → should return 200 with orderId + keyId
        try:
            response = self.session.post(f"{BASE_URL}/api/payment/create-order", 
                json={
                    "paymentType": "get_pass",
                    "amount": 4999
                })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    # Check for order/transaction ID and key ID
                    has_order_id = 'orderId' in data
                    has_key_id = 'keyId' in data
                    
                    if has_order_id and has_key_id:
                        self.log_test("POST /api/payment/create-order get_pass success", True, 
                                    f"Successfully created get_pass order: orderId={data.get('orderId')}, keyId={data.get('keyId')}")
                    else:
                        self.log_test("POST /api/payment/create-order get_pass success", False, 
                                    f"Missing required fields in response",
                                    "orderId and keyId fields",
                                    f"Available fields: {list(data.keys())}")
                else:
                    self.log_test("POST /api/payment/create-order get_pass success", False, 
                                f"Response not successful: {data}")
            else:
                self.log_test("POST /api/payment/create-order get_pass success", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /api/payment/create-order get_pass success", False, f"Exception: {str(e)}")

    def test_start_test_access_control(self):
        """Test /api/start-test access control based on purchases"""
        # First, we need to get/create a paid mock test
        try:
            # Get exams to find one with mock tests
            exams_response = self.session.get(f"{BASE_URL}/api/admin/exams")
            if exams_response.status_code != 200:
                self.log_test("Setup: Get exams for start-test testing", False, 
                            f"Failed to get exams: {exams_response.status_code}")
                return
            
            exams_data = exams_response.json()
            if not exams_data.get('success') or not exams_data.get('data'):
                self.log_test("Setup: Get exams for start-test testing", False, 
                            f"No exams data: {exams_data}")
                return
            
            exams = exams_data['data']
            if not exams:
                self.log_test("Setup: Get exams for start-test testing", False, "No exams found")
                return
            
            exam = exams[0]  # Use first exam
            exam_id = exam.get('id')
            
            # Get mock tests for this exam
            mock_tests_response = self.session.get(f"{BASE_URL}/api/admin/mock-tests")
            if mock_tests_response.status_code != 200:
                self.log_test("Setup: Get mock tests for start-test testing", False, 
                            f"Failed to get mock tests: {mock_tests_response.status_code}")
                return
            
            mock_tests_data = mock_tests_response.json()
            if not mock_tests_data.get('success'):
                self.log_test("Setup: Get mock tests for start-test testing", False, 
                            f"No mock tests data: {mock_tests_data}")
                return
            
            mock_tests = mock_tests_data.get('data', [])
            
            # Find or create a paid mock test
            paid_test = None
            for test in mock_tests:
                if (test.get('examId') == exam_id and 
                    not test.get('isFree', True) and 
                    test.get('price', 0) > 0 and
                    test.get('testType') != 'practice_questions'):
                    paid_test = test
                    break
            
            if not paid_test:
                # Create a paid mock test
                create_response = self.session.post(f"{BASE_URL}/api/admin/mock-tests", 
                    json={
                        "title": "Test Paid Mock Test",
                        "examId": exam_id,
                        "isFree": False,
                        "price": 999,
                        "testType": "mock_test",
                        "isPublished": True,
                        "status": "Active"
                    })
                
                if create_response.status_code == 200:
                    create_data = create_response.json()
                    if create_data.get('success'):
                        paid_test = create_data.get('data')
                        self.log_test("Setup: Create paid mock test", True, 
                                    f"Created test: {paid_test.get('title')}")
                    else:
                        self.log_test("Setup: Create paid mock test", False, 
                                    f"Failed to create: {create_data}")
                        return
                else:
                    self.log_test("Setup: Create paid mock test", False, 
                                f"HTTP {create_response.status_code}: {create_response.text}")
                    return
            
            mock_test_id = paid_test.get('id')
            
            # Test 1: No purchase + paid mock_test → 402 with requirePayment=true
            try:
                response = self.session.post(f"{BASE_URL}/api/start-test", 
                    json={"mockTestId": mock_test_id})
                
                if response.status_code == 402:
                    data = response.json()
                    if (data.get('requirePayment') == True and 
                        'examId' in data and 'domainId' in data):
                        self.log_test("start-test: No purchase → 402", True, 
                                    f"Correctly returned 402 with payment requirement: {data}")
                    else:
                        self.log_test("start-test: No purchase → 402", False, 
                                    f"402 but missing required fields",
                                    "requirePayment=true, examId, domainId",
                                    f"Response: {data}")
                else:
                    self.log_test("start-test: No purchase → 402", False, 
                                f"Expected 402, got {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("start-test: No purchase → 402", False, f"Exception: {str(e)}")
            
            # Test 2: Practice questions are free
            # Create a practice questions test
            try:
                practice_response = self.session.post(f"{BASE_URL}/api/admin/mock-tests", 
                    json={
                        "title": "Test Practice Questions",
                        "examId": exam_id,
                        "isFree": False,  # Even though isFree=false
                        "price": 500,    # Even though price > 0
                        "testType": "practice_questions",  # This should bypass paywall
                        "isPublished": True,
                        "status": "Active"
                    })
                
                if practice_response.status_code == 200:
                    practice_data = practice_response.json()
                    if practice_data.get('success'):
                        practice_test = practice_data.get('data')
                        practice_test_id = practice_test.get('id')
                        
                        # Try to start this practice test without purchase
                        start_response = self.session.post(f"{BASE_URL}/api/start-test", 
                            json={"mockTestId": practice_test_id})
                        
                        if start_response.status_code == 200:
                            start_data = start_response.json()
                            if start_data.get('success'):
                                self.log_test("start-test: Practice questions bypass paywall", True, 
                                            f"Practice questions are free despite price: {start_data}")
                            else:
                                self.log_test("start-test: Practice questions bypass paywall", False, 
                                            f"200 but not successful: {start_data}")
                        else:
                            self.log_test("start-test: Practice questions bypass paywall", False, 
                                        f"Expected 200, got {start_response.status_code}: {start_response.text}")
                    else:
                        self.log_test("start-test: Practice questions bypass paywall", False, 
                                    f"Failed to create practice test: {practice_data}")
                else:
                    self.log_test("start-test: Practice questions bypass paywall", False, 
                                f"Failed to create practice test: {practice_response.status_code}")
            except Exception as e:
                self.log_test("start-test: Practice questions bypass paywall", False, f"Exception: {str(e)}")
                
        except Exception as e:
            self.log_test("start-test access control testing", False, f"Exception: {str(e)}")

    def test_user_analytics_api(self):
        """Test GET /api/user/analytics"""
        try:
            response = self.session.get(f"{BASE_URL}/api/user/analytics")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    analytics_data = data['data']
                    required_sections = ['summary', 'history', 'purchases']
                    has_all_sections = all(section in analytics_data for section in required_sections)
                    
                    if has_all_sections:
                        summary = analytics_data['summary']
                        required_summary_fields = [
                            'examsAttempted', 'testsAttempted', 'averagePct', 'bestPct', 
                            'hasPass', 'purchasedExams', 'purchasedDomains'
                        ]
                        has_summary_fields = all(field in summary for field in required_summary_fields)
                        
                        if has_summary_fields:
                            self.log_test("GET /api/user/analytics", True, 
                                        f"All required fields present. Summary: {summary}")
                        else:
                            missing_fields = [f for f in required_summary_fields if f not in summary]
                            self.log_test("GET /api/user/analytics", False, 
                                        f"Missing summary fields: {missing_fields}")
                    else:
                        missing_sections = [s for s in required_sections if s not in analytics_data]
                        self.log_test("GET /api/user/analytics", False, 
                                    f"Missing sections: {missing_sections}")
                else:
                    self.log_test("GET /api/user/analytics", False, 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("GET /api/user/analytics", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/user/analytics", False, f"Exception: {str(e)}")

    def test_admin_exam_price_update(self):
        """Test PUT /api/admin/exams/<examId> with price update"""
        try:
            # Get exams first
            exams_response = self.session.get(f"{BASE_URL}/api/admin/exams")
            if exams_response.status_code != 200:
                self.log_test("Admin exam price update", False, 
                            f"Failed to get exams: {exams_response.status_code}")
                return
            
            exams_data = exams_response.json()
            if not exams_data.get('success') or not exams_data.get('data'):
                self.log_test("Admin exam price update", False, 
                            f"No exams data: {exams_data}")
                return
            
            exams = exams_data['data']
            if not exams:
                self.log_test("Admin exam price update", False, "No exams found")
                return
            
            exam = exams[0]  # Use first exam
            exam_id = exam.get('id')
            
            # Update exam price
            response = self.session.put(f"{BASE_URL}/api/admin/exams/{exam_id}", 
                json={"price": 1299})
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    updated_exam = data['data']
                    if updated_exam.get('price') == 1299:
                        self.log_test("Admin exam price update", True, 
                                    f"Successfully updated exam price to 1299")
                    else:
                        self.log_test("Admin exam price update", False, 
                                    f"Price not updated correctly",
                                    "price=1299",
                                    f"price={updated_exam.get('price')}")
                else:
                    self.log_test("Admin exam price update", False, 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("Admin exam price update", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Admin exam price update", False, f"Exception: {str(e)}")

    def test_admin_domain_price_update(self):
        """Test PUT /api/admin/domains/<domainId> with price update"""
        try:
            # Get domains first
            domains_response = self.session.get(f"{BASE_URL}/api/admin/domains")
            if domains_response.status_code == 404:
                self.log_test("Admin domain price update", False, 
                            "Domains endpoint not found - domains feature may not be implemented")
                return
            elif domains_response.status_code != 200:
                self.log_test("Admin domain price update", False, 
                            f"Failed to get domains: {domains_response.status_code}")
                return
            
            domains_data = domains_response.json()
            if not domains_data.get('success') or not domains_data.get('data'):
                self.log_test("Admin domain price update", False, 
                            f"No domains data: {domains_data}")
                return
            
            domains = domains_data['data']
            if not domains:
                self.log_test("Admin domain price update", False, "No domains found")
                return
            
            domain = domains[0]  # Use first domain
            domain_id = domain.get('id')
            
            # Update domain price
            response = self.session.put(f"{BASE_URL}/api/admin/domains/{domain_id}", 
                json={"price": 599})
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    updated_domain = data['data']
                    if updated_domain.get('price') == 599:
                        self.log_test("Admin domain price update", True, 
                                    f"Successfully updated domain price to 599")
                    else:
                        self.log_test("Admin domain price update", False, 
                                    f"Price not updated correctly",
                                    "price=599",
                                    f"price={updated_domain.get('price')}")
                else:
                    self.log_test("Admin domain price update", False, 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("Admin domain price update", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Admin domain price update", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("UNISHAALA PRICING + GET PASS + UNIFIED ACCESS FLOW TESTING")
        print("=" * 80)
        print(f"Base URL: {BASE_URL}")
        print(f"Admin Credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print("=" * 80)
        print()
        
        # Step 1: Admin login
        if not self.admin_login():
            print("❌ CRITICAL: Admin login failed. Cannot proceed with authenticated tests.")
            return
        
        # Step 2: Test pricing endpoints
        print("\n--- PRICING ENDPOINTS ---")
        self.test_public_pricing_api()
        self.test_admin_pricing_api_without_auth()
        self.test_admin_pricing_api_with_auth()
        self.test_admin_pricing_update()
        
        # Step 3: Test payment endpoints
        print("\n--- PAYMENT ENDPOINTS ---")
        self.test_payment_create_order_endpoints()
        
        # Step 4: Test access control
        print("\n--- ACCESS CONTROL ---")
        self.test_start_test_access_control()
        
        # Step 5: Test analytics
        print("\n--- USER ANALYTICS ---")
        self.test_user_analytics_api()
        
        # Step 6: Test admin price updates
        print("\n--- ADMIN PRICE UPDATES ---")
        self.test_admin_exam_price_update()
        self.test_admin_domain_price_update()
        
        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.test_results if r['success'])
        failed = sum(1 for r in self.test_results if not r['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        print()
        
        if failed > 0:
            print("FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['details']}")
            print()
        
        print("PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"✅ {result['test']}")
        
        return passed, failed, total

if __name__ == "__main__":
    runner = TestRunner()
    passed, failed, total = runner.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(1 if failed > 0 else 0)