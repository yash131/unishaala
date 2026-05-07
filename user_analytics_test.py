#!/usr/bin/env python3
"""
User Dashboard Analytics Endpoint Testing Script
Testing the enhanced /api/user/analytics endpoint as specified in the review request.

CONTEXT:
- App is at https://dark-mode-theme-2.preview.emergentagent.com (from NEXT_PUBLIC_BASE_URL)
- Auth uses session cookie via /api/auth/login (POST { email, password })
- Use admin credentials: admin@unishaala.com / Shivani@1234

WHAT TO TEST (focus only on /api/user/analytics):
1) Unauthenticated: GET /api/user/analytics WITHOUT auth cookie → expect HTTP 401 and JSON { success:false }
2) Login as admin@unishaala.com / Shivani@1234 (POST /api/auth/login). Save cookie. Then GET /api/user/analytics:
   - Expect HTTP 200 and { success:true, data:{ summary, history, purchases } }
   - data.summary MUST contain ALL these keys: examsAttempted, testsAttempted, totalAttempts, completedAttempts, averagePct, bestPct, accuracy, totalCorrect, totalIncorrect, totalUnanswered, totalTimeMin, hasPass, passExpiresAt, purchasedExams, purchasedDomains, purchasedPyqExams, purchasedPyqDomains
   - data.history MUST be an array. If non-empty, each item MUST include keys: id, mockTestId, testTitle, testType, examId, examName, domainId, domainName, subjectId, subjectName, startTime, endTime, status, score, totalMarks, correct, incorrect, unanswered, timeTakenMin, rank, totalTakers
   - data.purchases MUST be an array; if non-empty each item should have: id, paymentType, itemName, amount, status, completedAt
3) Sanity: averagePct and bestPct must be numbers between 0 and 100. accuracy must be 0-100.
4) Performance/no-crash: even when there are zero attempts, summary numeric fields must equal 0 (not null/undefined) and history must equal []
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://dark-mode-theme-2.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class UserAnalyticsTestRunner:
    def __init__(self):
        self.session = requests.Session()
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

    def test_unauthenticated_access(self):
        """Test 1: GET /api/user/analytics WITHOUT auth cookie → expect HTTP 401 and JSON { success:false }"""
        try:
            # Create a fresh session without cookies
            fresh_session = requests.Session()
            response = fresh_session.get(f"{BASE_URL}/api/user/analytics")
            
            if response.status_code == 401:
                try:
                    data = response.json()
                    if data.get('success') == False:
                        self.log_test("Unauthenticated Access", True, 
                                    f"Correctly returned 401 with success:false - {data}")
                    else:
                        self.log_test("Unauthenticated Access", False, 
                                    f"401 but success is not false",
                                    "success: false",
                                    f"success: {data.get('success')}")
                except json.JSONDecodeError:
                    self.log_test("Unauthenticated Access", False, 
                                f"401 but response is not valid JSON: {response.text}")
            else:
                self.log_test("Unauthenticated Access", False, 
                            f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Unauthenticated Access", False, f"Exception: {str(e)}")

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

    def test_authenticated_analytics_structure(self):
        """Test 2: Authenticated GET /api/user/analytics - check structure and required fields"""
        try:
            response = self.session.get(f"{BASE_URL}/api/user/analytics")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('success') == True and 'data' in data:
                        analytics_data = data['data']
                        
                        # Check main sections
                        required_sections = ['summary', 'history', 'purchases']
                        missing_sections = [s for s in required_sections if s not in analytics_data]
                        
                        if missing_sections:
                            self.log_test("Analytics Structure - Main Sections", False, 
                                        f"Missing sections: {missing_sections}",
                                        f"Required: {required_sections}",
                                        f"Available: {list(analytics_data.keys())}")
                            return False
                        else:
                            self.log_test("Analytics Structure - Main Sections", True, 
                                        f"All main sections present: {required_sections}")
                        
                        # Check summary fields
                        summary = analytics_data['summary']
                        required_summary_fields = [
                            'examsAttempted', 'testsAttempted', 'totalAttempts', 'completedAttempts', 
                            'averagePct', 'bestPct', 'accuracy', 'totalCorrect', 'totalIncorrect', 
                            'totalUnanswered', 'totalTimeMin', 'hasPass', 'passExpiresAt', 
                            'purchasedExams', 'purchasedDomains', 'purchasedPyqExams', 'purchasedPyqDomains'
                        ]
                        
                        missing_summary_fields = [f for f in required_summary_fields if f not in summary]
                        
                        if missing_summary_fields:
                            self.log_test("Analytics Structure - Summary Fields", False, 
                                        f"Missing summary fields: {missing_summary_fields}",
                                        f"Required: {required_summary_fields}",
                                        f"Available: {list(summary.keys())}")
                            return False
                        else:
                            self.log_test("Analytics Structure - Summary Fields", True, 
                                        f"All {len(required_summary_fields)} summary fields present")
                        
                        # Check history structure
                        history = analytics_data['history']
                        if not isinstance(history, list):
                            self.log_test("Analytics Structure - History Array", False, 
                                        f"History is not an array",
                                        "Array",
                                        f"Type: {type(history)}")
                            return False
                        else:
                            self.log_test("Analytics Structure - History Array", True, 
                                        f"History is an array with {len(history)} items")
                        
                        # If history has items, check their structure
                        if len(history) > 0:
                            required_history_fields = [
                                'id', 'mockTestId', 'testTitle', 'testType', 'examId', 'examName', 
                                'domainId', 'domainName', 'subjectId', 'subjectName', 'startTime', 
                                'endTime', 'status', 'score', 'totalMarks', 'correct', 'incorrect', 
                                'unanswered', 'timeTakenMin', 'rank', 'totalTakers'
                            ]
                            
                            first_item = history[0]
                            missing_history_fields = [f for f in required_history_fields if f not in first_item]
                            
                            if missing_history_fields:
                                self.log_test("Analytics Structure - History Item Fields", False, 
                                            f"Missing history item fields: {missing_history_fields}",
                                            f"Required: {required_history_fields}",
                                            f"Available: {list(first_item.keys())}")
                                return False
                            else:
                                self.log_test("Analytics Structure - History Item Fields", True, 
                                            f"All {len(required_history_fields)} history item fields present")
                        
                        # Check purchases structure
                        purchases = analytics_data['purchases']
                        if not isinstance(purchases, list):
                            self.log_test("Analytics Structure - Purchases Array", False, 
                                        f"Purchases is not an array",
                                        "Array",
                                        f"Type: {type(purchases)}")
                            return False
                        else:
                            self.log_test("Analytics Structure - Purchases Array", True, 
                                        f"Purchases is an array with {len(purchases)} items")
                        
                        # If purchases has items, check their structure
                        if len(purchases) > 0:
                            required_purchase_fields = ['id', 'paymentType', 'itemName', 'amount', 'status', 'completedAt']
                            
                            first_purchase = purchases[0]
                            missing_purchase_fields = [f for f in required_purchase_fields if f not in first_purchase]
                            
                            if missing_purchase_fields:
                                self.log_test("Analytics Structure - Purchase Item Fields", False, 
                                            f"Missing purchase item fields: {missing_purchase_fields}",
                                            f"Required: {required_purchase_fields}",
                                            f"Available: {list(first_purchase.keys())}")
                                return False
                            else:
                                self.log_test("Analytics Structure - Purchase Item Fields", True, 
                                            f"All {len(required_purchase_fields)} purchase item fields present")
                        
                        return True
                        
                    else:
                        self.log_test("Analytics Structure", False, 
                                    f"Invalid response structure",
                                    "success: true with data field",
                                    f"Response: {data}")
                        return False
                        
                except json.JSONDecodeError:
                    self.log_test("Analytics Structure", False, 
                                f"Response is not valid JSON: {response.text}")
                    return False
            else:
                self.log_test("Analytics Structure", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Analytics Structure", False, f"Exception: {str(e)}")
            return False

    def test_sanity_checks(self):
        """Test 3: Sanity checks - averagePct and bestPct must be numbers between 0 and 100. accuracy must be 0-100."""
        try:
            response = self.session.get(f"{BASE_URL}/api/user/analytics")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    summary = data['data']['summary']
                    
                    # Check averagePct
                    avg_pct = summary.get('averagePct')
                    if isinstance(avg_pct, (int, float)) and 0 <= avg_pct <= 100:
                        self.log_test("Sanity Check - averagePct", True, 
                                    f"averagePct is valid: {avg_pct}")
                    else:
                        self.log_test("Sanity Check - averagePct", False, 
                                    f"averagePct is invalid",
                                    "Number between 0-100",
                                    f"Value: {avg_pct}, Type: {type(avg_pct)}")
                    
                    # Check bestPct
                    best_pct = summary.get('bestPct')
                    if isinstance(best_pct, (int, float)) and 0 <= best_pct <= 100:
                        self.log_test("Sanity Check - bestPct", True, 
                                    f"bestPct is valid: {best_pct}")
                    else:
                        self.log_test("Sanity Check - bestPct", False, 
                                    f"bestPct is invalid",
                                    "Number between 0-100",
                                    f"Value: {best_pct}, Type: {type(best_pct)}")
                    
                    # Check accuracy
                    accuracy = summary.get('accuracy')
                    if isinstance(accuracy, (int, float)) and 0 <= accuracy <= 100:
                        self.log_test("Sanity Check - accuracy", True, 
                                    f"accuracy is valid: {accuracy}")
                    else:
                        self.log_test("Sanity Check - accuracy", False, 
                                    f"accuracy is invalid",
                                    "Number between 0-100",
                                    f"Value: {accuracy}, Type: {type(accuracy)}")
                        
                else:
                    self.log_test("Sanity Checks", False, "Could not get analytics data for sanity checks")
            else:
                self.log_test("Sanity Checks", False, f"Could not get analytics data: {response.status_code}")
        except Exception as e:
            self.log_test("Sanity Checks", False, f"Exception: {str(e)}")

    def test_zero_attempts_handling(self):
        """Test 4: Performance/no-crash - even when there are zero attempts, summary numeric fields must equal 0 (not null/undefined) and history must equal []"""
        try:
            response = self.session.get(f"{BASE_URL}/api/user/analytics")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    summary = data['data']['summary']
                    history = data['data']['history']
                    
                    # Check numeric fields are not null/undefined
                    numeric_fields = ['examsAttempted', 'testsAttempted', 'totalAttempts', 'completedAttempts', 
                                    'averagePct', 'bestPct', 'accuracy', 'totalCorrect', 'totalIncorrect', 
                                    'totalUnanswered', 'totalTimeMin']
                    
                    null_fields = []
                    for field in numeric_fields:
                        value = summary.get(field)
                        if value is None:
                            null_fields.append(field)
                    
                    if null_fields:
                        self.log_test("Zero Attempts Handling - Null Fields", False, 
                                    f"Found null numeric fields: {null_fields}",
                                    "All numeric fields should be 0, not null",
                                    f"Null fields: {null_fields}")
                    else:
                        self.log_test("Zero Attempts Handling - Null Fields", True, 
                                    "All numeric fields are non-null")
                    
                    # Check history is an array (even if empty)
                    if isinstance(history, list):
                        self.log_test("Zero Attempts Handling - History Array", True, 
                                    f"History is an array with {len(history)} items")
                    else:
                        self.log_test("Zero Attempts Handling - History Array", False, 
                                    f"History is not an array",
                                    "Array (even if empty)",
                                    f"Type: {type(history)}")
                        
                else:
                    self.log_test("Zero Attempts Handling", False, "Could not get analytics data")
            else:
                self.log_test("Zero Attempts Handling", False, f"Could not get analytics data: {response.status_code}")
        except Exception as e:
            self.log_test("Zero Attempts Handling", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("USER DASHBOARD ANALYTICS ENDPOINT TESTING")
        print("=" * 80)
        print(f"Base URL: {BASE_URL}")
        print(f"Admin Credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print("=" * 80)
        print()
        
        # Test 1: Unauthenticated access
        print("--- TEST 1: UNAUTHENTICATED ACCESS ---")
        self.test_unauthenticated_access()
        
        # Login for authenticated tests
        print("--- ADMIN LOGIN FOR AUTHENTICATED TESTS ---")
        if not self.admin_login():
            print("❌ CRITICAL: Admin login failed. Cannot proceed with authenticated tests.")
            return
        
        # Test 2: Authenticated analytics structure
        print("--- TEST 2: AUTHENTICATED ANALYTICS STRUCTURE ---")
        structure_ok = self.test_authenticated_analytics_structure()
        
        if structure_ok:
            # Test 3: Sanity checks
            print("--- TEST 3: SANITY CHECKS ---")
            self.test_sanity_checks()
            
            # Test 4: Zero attempts handling
            print("--- TEST 4: ZERO ATTEMPTS HANDLING ---")
            self.test_zero_attempts_handling()
        else:
            print("⚠️  Skipping sanity checks and zero attempts tests due to structure issues")
        
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
    runner = UserAnalyticsTestRunner()
    passed, failed, total = runner.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(1 if failed > 0 else 0)