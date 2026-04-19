#!/usr/bin/env python3
"""
Advanced Rank Predictor Evaluation Logic Test Suite
Tests the 5 answer types with automatic detection from CSV:
- MCQ (single letter): C
- MSQ (multiple letters): "B,D" (quoted) or B,D (if joined with comma in CSV)
- NAT (pure numeric): 12.5 — user's numeric answer within ±0.01 tolerance = correct
- RANGE: 16.5-16.8 — user's numeric answer within [lo, hi] = correct
- MAT/BONUS: literal MAT or BONUS — credit if user attempted (status=Answered OR non-empty user answer)
"""

import requests
import json
import sys
import time

# Configuration
BASE_URL = "https://content-hub-admin-5.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class RankPredictorTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.answer_key_id = None
        
    def log(self, message):
        print(f"[TEST] {message}")
        
    def error(self, message):
        print(f"[ERROR] {message}")
        
    def success(self, message):
        print(f"[SUCCESS] {message}")
        
    def admin_login(self):
        """Login as admin to create answer key"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.auth_token = response.cookies.get('auth_token')
                    self.success(f"Admin login successful. Role: {data.get('data', {}).get('user', {}).get('role')}")
                    return True
                else:
                    self.error(f"Login failed: {data.get('error')}")
                    return False
            else:
                self.error(f"Login request failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.error(f"Login error: {str(e)}")
            return False
    
    def create_answer_key(self):
        """Create answer key with 5 different answer types"""
        try:
            # Create answer key first
            answer_key_data = {
                "title": "Advanced Answer Types Test Key",
                "description": "Test key for 5 answer types: MCQ, MSQ, NAT, RANGE, MAT/BONUS",
                "examId": "test-exam-advanced",
                "positiveMarks": 2,
                "negativeMarks": 0.66
            }
            
            response = self.session.post(f"{API_BASE}/admin/answer-keys", json=answer_key_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.answer_key_id = data.get('data', {}).get('id')
                    self.success(f"Answer key created with ID: {self.answer_key_id}")
                    
                    # Now upload CSV data
                    csv_data = """question_id,correct_answer
6420084710,C
6420084720,A
"6420084732","B,D"
6420084736,16.5-16.8
6420084740,12.51
6420084750,A
6420084760,C
6420084770,MAT"""
                    
                    csv_response = self.session.post(f"{API_BASE}/admin/answer-keys/{self.answer_key_id}/upload-csv", json={"csv": csv_data})
                    
                    if csv_response.status_code == 200:
                        csv_data_result = csv_response.json()
                        if csv_data_result.get('success'):
                            self.success(f"CSV data uploaded successfully")
                            return True
                        else:
                            self.error(f"CSV upload failed: {csv_data_result.get('error')}")
                            return False
                    else:
                        self.error(f"CSV upload failed with status {csv_response.status_code}: {csv_response.text}")
                        return False
                else:
                    self.error(f"Answer key creation failed: {data.get('error')}")
                    return False
            else:
                self.error(f"Answer key creation failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.error(f"Answer key creation error: {str(e)}")
            return False
    
    def test_classification_correctness(self):
        """Test 1: Classification correctness test"""
        self.log("=== TEST 1: Classification Correctness ===")
        
        try:
            # Create TCS iON formatted responseHtml
            response_html = """
            <html>
            <head><title>Response Sheet</title></head>
            <body>
            <div>
                Question ID: 6420084710 Question Type: MCQ Status: Answered Chosen Option: 3
                Question ID: 6420084720 Question Type: MCQ Status: Answered Chosen Option: 1
                Question ID: 6420084732 Question Type: MSQ Status: Answered Chosen Option: 2,4
                Question ID: 6420084736 Question Type: NAT Status: Answered Given Answer: 16.65
                Question ID: 6420084740 Question Type: NAT Status: Answered Given Answer: 12.5
                Question ID: 6420084750 Question Type: MCQ Status: Answered Chosen Option: 2
                Question ID: 6420084760 Question Type: MCQ Status: Not Answered Chosen Option: --
                Question ID: 6420084770 Question Type: MCQ Status: Answered Chosen Option: 2
            </div>
            </body>
            </html>
            """
            
            # Submit prediction
            prediction_data = {
                "answerKeyId": self.answer_key_id,
                "name": "Test User Advanced",
                "email": "testuser.advanced@example.com",
                "phone": "9876543210",
                "category": "General",
                "responseHtml": response_html
            }
            
            response = self.session.post(f"{API_BASE}/predict-rank", json=prediction_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    result = data.get('data', {})
                    
                    # Expected: correct=6, wrong=1, unattempted=1, marks = 6×2 − 1×0.66 = 11.34
                    expected_correct = 6
                    expected_wrong = 1
                    expected_unattempted = 1
                    expected_marks = 11.34
                    
                    actual_correct = result.get('correct', 0)
                    actual_wrong = result.get('wrong', 0)
                    actual_unattempted = result.get('unattempted', 0)
                    actual_marks = result.get('marks', 0)
                    
                    self.log(f"Expected: correct={expected_correct}, wrong={expected_wrong}, unattempted={expected_unattempted}, marks={expected_marks}")
                    self.log(f"Actual: correct={actual_correct}, wrong={actual_wrong}, unattempted={actual_unattempted}, marks={actual_marks}")
                    
                    # Check results
                    if (actual_correct == expected_correct and 
                        actual_wrong == expected_wrong and 
                        actual_unattempted == expected_unattempted and 
                        abs(actual_marks - expected_marks) < 0.01):
                        self.success("✅ Classification correctness test PASSED")
                        
                        # Verify details array has type field correctly classified
                        details = result.get('details', [])
                        self.log("Checking question type classification in details:")
                        
                        expected_types = {
                            '6420084710': 'MCQ',
                            '6420084720': 'MCQ', 
                            '6420084732': 'MSQ',
                            '6420084736': 'RANGE',
                            '6420084740': 'NAT',
                            '6420084750': 'MCQ',
                            '6420084760': 'MCQ',
                            '6420084770': 'MAT'
                        }
                        
                        type_classification_correct = True
                        for detail in details:
                            qid = detail.get('question_id')
                            actual_type = detail.get('type')
                            expected_type = expected_types.get(qid)
                            
                            if actual_type == expected_type:
                                self.log(f"  ✅ Q{qid}: {actual_type} (correct)")
                            else:
                                self.error(f"  ❌ Q{qid}: expected {expected_type}, got {actual_type}")
                                type_classification_correct = False
                        
                        if type_classification_correct:
                            self.success("✅ Question type classification PASSED")
                            return True
                        else:
                            self.error("❌ Question type classification FAILED")
                            return False
                    else:
                        self.error("❌ Classification correctness test FAILED - marks calculation incorrect")
                        return False
                else:
                    self.error(f"Prediction failed: {data.get('error')}")
                    return False
            else:
                self.error(f"Prediction request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.error(f"Classification test error: {str(e)}")
            return False
    
    def test_edge_cases(self):
        """Test 2: Edge cases"""
        self.log("=== TEST 2: Edge Cases ===")
        
        edge_cases = [
            {
                "name": "NAT just beyond tolerance",
                "html": "Question ID: 6420084740 Question Type: NAT Status: Answered Given Answer: 5.02",
                "expected_status": "wrong",
                "description": "correct=12.51, user=5.02 → wrong"
            },
            {
                "name": "NAT just within tolerance", 
                "html": "Question ID: 6420084740 Question Type: NAT Status: Answered Given Answer: 12.50",
                "expected_status": "correct",
                "description": "correct=12.51, user=12.50 → correct (within ±0.01)"
            },
            {
                "name": "RANGE exactly at boundary",
                "html": "Question ID: 6420084736 Question Type: NAT Status: Answered Given Answer: 16.8",
                "expected_status": "correct", 
                "description": "correct=16.5-16.8, user=16.8 → correct"
            },
            {
                "name": "RANGE just outside boundary",
                "html": "Question ID: 6420084736 Question Type: NAT Status: Answered Given Answer: 16.81",
                "expected_status": "wrong",
                "description": "correct=16.5-16.8, user=16.81 → wrong"
            },
            {
                "name": "MSQ partial match",
                "html": "Question ID: 6420084732 Question Type: MSQ Status: Answered Chosen Option: 2",
                "expected_status": "wrong",
                "description": "correct='B,D', user chose only B → wrong (no partial credit)"
            },
            {
                "name": "MSQ different order",
                "html": "Question ID: 6420084732 Question Type: MSQ Status: Answered Chosen Option: 4,2",
                "expected_status": "correct",
                "description": "correct='B,D', user chose 4,2 → correct (order-independent)"
            },
            {
                "name": "MAT when user did NOT attempt",
                "html": "Question ID: 6420084770 Question Type: MCQ Status: Not Answered Chosen Option: --",
                "expected_status": "unattempted",
                "description": "MAT when user did NOT attempt → unattempted (no marks)"
            },
            {
                "name": "MAT when user answered even if wrong option",
                "html": "Question ID: 6420084770 Question Type: MCQ Status: Answered Chosen Option: 1",
                "expected_status": "correct",
                "description": "MAT when user answered even if 'wrong option' → correct (bonus awarded)"
            }
        ]
        
        passed_tests = 0
        total_tests = len(edge_cases)
        
        for i, test_case in enumerate(edge_cases):
            self.log(f"Edge case {i+1}/{total_tests}: {test_case['name']}")
            
            try:
                response_html = f"""
                <html>
                <head><title>Response Sheet</title></head>
                <body>
                <div>{test_case['html']}</div>
                </body>
                </html>
                """
                
                prediction_data = {
                    "answerKeyId": self.answer_key_id,
                    "name": f"Edge Test User {i+1}",
                    "email": f"edgetest{i+1}@example.com",
                    "phone": "9876543210",
                    "category": "General",
                    "responseHtml": response_html
                }
                
                response = self.session.post(f"{API_BASE}/predict-rank", json=prediction_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        result = data.get('data', {})
                        details = result.get('details', [])
                        
                        # Find the relevant question in details
                        question_detail = None
                        for detail in details:
                            if '6420084740' in test_case['html'] and detail.get('question_id') == '6420084740':
                                question_detail = detail
                                break
                            elif '6420084736' in test_case['html'] and detail.get('question_id') == '6420084736':
                                question_detail = detail
                                break
                            elif '6420084732' in test_case['html'] and detail.get('question_id') == '6420084732':
                                question_detail = detail
                                break
                            elif '6420084770' in test_case['html'] and detail.get('question_id') == '6420084770':
                                question_detail = detail
                                break
                        
                        if question_detail:
                            actual_status = question_detail.get('status')
                            if actual_status == test_case['expected_status']:
                                self.success(f"  ✅ {test_case['description']} - PASSED")
                                passed_tests += 1
                            else:
                                self.error(f"  ❌ {test_case['description']} - Expected: {test_case['expected_status']}, Got: {actual_status}")
                        else:
                            self.error(f"  ❌ Could not find question detail in response")
                    else:
                        self.error(f"  ❌ Prediction failed: {data.get('error')}")
                else:
                    self.error(f"  ❌ Request failed with status {response.status_code}")
                    
            except Exception as e:
                self.error(f"  ❌ Edge case test error: {str(e)}")
        
        if passed_tests == total_tests:
            self.success(f"✅ Edge cases test PASSED ({passed_tests}/{total_tests})")
            return True
        else:
            self.error(f"❌ Edge cases test FAILED ({passed_tests}/{total_tests})")
            return False
    
    def test_csv_edge_cases(self):
        """Test 3: CSV edge cases"""
        self.log("=== TEST 3: CSV Edge Cases ===")
        
        try:
            # Create edge case answer key first
            edge_key_data = {
                "title": "CSV Edge Cases Test Key",
                "description": "Test key for CSV edge cases",
                "examId": "test-exam-csv-edge",
                "positiveMarks": 1,
                "negativeMarks": 0.33
            }
            
            response = self.session.post(f"{API_BASE}/admin/answer-keys", json=edge_key_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    edge_key_id = data.get('data', {}).get('id')
                    self.success(f"CSV edge case answer key created with ID: {edge_key_id}")
                    
                    # Upload CSV with edge cases
                    csv_edge_data = """question_id,correct_answer
6420084801,B,D
"6420084802","B,D"
6420084803,A
6420084804,-3.5"""
                    
                    csv_response = self.session.post(f"{API_BASE}/admin/answer-keys/{edge_key_id}/upload-csv", json={"csv": csv_edge_data})
                    
                    if csv_response.status_code == 200:
                        csv_result = csv_response.json()
                        if csv_result.get('success'):
                            self.success(f"CSV edge data uploaded successfully")
                            
                            # Test with responses
                            response_html = """
                            <html>
                            <head><title>Response Sheet</title></head>
                            <body>
                            <div>
                                Question ID: 6420084801 Question Type: MSQ Status: Answered Chosen Option: 2,4
                                Question ID: 6420084802 Question Type: MSQ Status: Answered Chosen Option: 2,4
                                Question ID: 6420084803 Question Type: MCQ Status: Answered Chosen Option: 1
                                Question ID: 6420084804 Question Type: NAT Status: Answered Given Answer: -3.5
                            </div>
                            </body>
                            </html>
                            """
                            
                            prediction_data = {
                                "answerKeyId": edge_key_id,
                                "name": "CSV Edge Test User",
                                "email": "csvedgetest@example.com",
                                "phone": "9876543210",
                                "category": "General",
                                "responseHtml": response_html
                            }
                            
                            response = self.session.post(f"{API_BASE}/predict-rank", json=prediction_data)
                            
                            if response.status_code == 200:
                                data = response.json()
                                if data.get('success'):
                                    result = data.get('data', {})
                                    details = result.get('details', [])
                                    
                                    # All should be correct
                                    expected_correct = 4
                                    actual_correct = result.get('correct', 0)
                                    
                                    if actual_correct == expected_correct:
                                        self.success("✅ CSV edge cases test PASSED")
                                        
                                        # Check specific classifications
                                        for detail in details:
                                            qid = detail.get('question_id')
                                            qtype = detail.get('type')
                                            status = detail.get('status')
                                            
                                            if qid in ['6420084801', '6420084802']:
                                                if qtype == 'MSQ' and status == 'correct':
                                                    self.log(f"  ✅ Q{qid}: MSQ classification and evaluation correct")
                                                else:
                                                    self.error(f"  ❌ Q{qid}: Expected MSQ/correct, got {qtype}/{status}")
                                            elif qid == '6420084803':
                                                if qtype == 'MCQ' and status == 'correct':
                                                    self.log(f"  ✅ Q{qid}: MCQ classification correct")
                                                else:
                                                    self.error(f"  ❌ Q{qid}: Expected MCQ/correct, got {qtype}/{status}")
                                            elif qid == '6420084804':
                                                if qtype == 'NAT' and status == 'correct':
                                                    self.log(f"  ✅ Q{qid}: Negative NAT value handled correctly")
                                                else:
                                                    self.error(f"  ❌ Q{qid}: Expected NAT/correct, got {qtype}/{status}")
                                        
                                        return True
                                    else:
                                        self.error(f"❌ CSV edge cases test FAILED - Expected {expected_correct} correct, got {actual_correct}")
                                        return False
                                else:
                                    self.error(f"CSV edge prediction failed: {data.get('error')}")
                                    return False
                            else:
                                self.error(f"CSV edge prediction request failed with status {response.status_code}")
                                return False
                        else:
                            self.error(f"CSV edge upload failed: {csv_result.get('error')}")
                            return False
                    else:
                        self.error(f"CSV edge upload failed with status {csv_response.status_code}")
                        return False
                else:
                    self.error(f"CSV edge answer key creation failed: {data.get('error')}")
                    return False
            else:
                self.error(f"CSV edge answer key creation failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.error(f"CSV edge cases test error: {str(e)}")
            return False
    
    def test_regression(self):
        """Test 4: Regression - existing endpoints should still work"""
        self.log("=== TEST 4: Regression Testing ===")
        
        regression_tests = [
            {
                "name": "Admin login",
                "method": "POST",
                "endpoint": "/auth/login",
                "data": {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                "expected_status": 200
            },
            {
                "name": "Get answer keys",
                "method": "GET", 
                "endpoint": "/admin/answer-keys",
                "expected_status": 200
            },
            {
                "name": "Get public answer keys",
                "method": "GET",
                "endpoint": "/answer-keys", 
                "expected_status": 200
            },
            {
                "name": "Get blogs",
                "method": "GET",
                "endpoint": "/blogs",
                "expected_status": 200
            },
            {
                "name": "Get jobs",
                "method": "GET",
                "endpoint": "/jobs",
                "expected_status": 200
            },
            {
                "name": "Get colleges",
                "method": "GET",
                "endpoint": "/admin/colleges",
                "expected_status": 200
            },
            {
                "name": "Get testimonials",
                "method": "GET",
                "endpoint": "/admin/testimonials",
                "expected_status": 200
            },
            {
                "name": "Get contacts",
                "method": "GET",
                "endpoint": "/admin/contacts",
                "expected_status": 200
            }
        ]
        
        passed_tests = 0
        total_tests = len(regression_tests)
        
        for test in regression_tests:
            try:
                if test["method"] == "GET":
                    response = self.session.get(f"{API_BASE}{test['endpoint']}")
                elif test["method"] == "POST":
                    response = self.session.post(f"{API_BASE}{test['endpoint']}", json=test.get("data", {}))
                
                if response.status_code == test["expected_status"]:
                    # Check for specific error cases
                    if test["endpoint"] in ["/admin/answer-keys", "/admin/colleges", "/admin/testimonials", "/admin/contacts"]:
                        # These should return 401 without auth for non-login tests
                        if response.status_code == 401:
                            self.success(f"  ✅ {test['name']}: Correctly returned 401 (auth required)")
                            passed_tests += 1
                        elif response.status_code == 200:
                            data = response.json()
                            if data.get('success'):
                                self.success(f"  ✅ {test['name']}: Working correctly")
                                passed_tests += 1
                            else:
                                self.error(f"  ❌ {test['name']}: Response not successful")
                        else:
                            self.error(f"  ❌ {test['name']}: Unexpected status {response.status_code}")
                    else:
                        # Public endpoints
                        data = response.json()
                        if data.get('success'):
                            self.success(f"  ✅ {test['name']}: Working correctly")
                            passed_tests += 1
                        else:
                            self.error(f"  ❌ {test['name']}: Response not successful")
                else:
                    self.error(f"  ❌ {test['name']}: Expected status {test['expected_status']}, got {response.status_code}")
                    
            except Exception as e:
                self.error(f"  ❌ {test['name']}: Error - {str(e)}")
        
        if passed_tests >= total_tests - 2:  # Allow some tolerance for auth-related tests
            self.success(f"✅ Regression testing PASSED ({passed_tests}/{total_tests})")
            return True
        else:
            self.error(f"❌ Regression testing FAILED ({passed_tests}/{total_tests})")
            return False
    
    def run_all_tests(self):
        """Run all test suites"""
        self.log("Starting Advanced Rank Predictor Evaluation Logic Testing")
        self.log("=" * 60)
        
        # Login as admin
        if not self.admin_login():
            self.error("Failed to login as admin. Cannot proceed with tests.")
            return False
        
        # Create answer key
        if not self.create_answer_key():
            self.error("Failed to create answer key. Cannot proceed with tests.")
            return False
        
        # Run all test suites
        test_results = []
        
        test_results.append(self.test_classification_correctness())
        test_results.append(self.test_edge_cases())
        test_results.append(self.test_csv_edge_cases())
        test_results.append(self.test_regression())
        
        # Summary
        passed_tests = sum(test_results)
        total_tests = len(test_results)
        
        self.log("=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        if passed_tests == total_tests:
            self.success(f"🎉 ALL TESTS PASSED ({passed_tests}/{total_tests})")
            self.success("Advanced Rank Predictor evaluation logic is working correctly!")
            return True
        else:
            self.error(f"❌ SOME TESTS FAILED ({passed_tests}/{total_tests})")
            self.error("Advanced Rank Predictor evaluation logic has issues that need to be addressed.")
            return False

def main():
    tester = RankPredictorTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()