#!/usr/bin/env python3
"""
Additional Edge Cases Test for Advanced Rank Predictor
Tests specific edge cases mentioned in the review request:
- RANGE with negative numbers (correct=-5 to 5, user=0) → correct
- Status="Not Answered" in HTML → always unattempted regardless of Chosen Option value
"""

import requests
import json
import sys

# Configuration
BASE_URL = "https://rank-predict-test.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class AdditionalEdgeCasesTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        
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
    
    def test_additional_edge_cases(self):
        """Test additional edge cases"""
        self.log("=== Additional Edge Cases Test ===")
        
        try:
            # Create answer key with negative range
            answer_key_data = {
                "title": "Additional Edge Cases Test Key",
                "description": "Test key for additional edge cases",
                "examId": "test-exam-additional-edge",
                "positiveMarks": 1,
                "negativeMarks": 0.25
            }
            
            response = self.session.post(f"{API_BASE}/admin/answer-keys", json=answer_key_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    answer_key_id = data.get('data', {}).get('id')
                    self.success(f"Answer key created with ID: {answer_key_id}")
                    
                    # Upload CSV with negative range
                    csv_data = """question_id,correct_answer
6420084901,-5 to 5
6420084902,A
6420084903,B"""
                    
                    csv_response = self.session.post(f"{API_BASE}/admin/answer-keys/{answer_key_id}/upload-csv", json={"csv": csv_data})
                    
                    if csv_response.status_code == 200:
                        csv_result = csv_response.json()
                        if csv_result.get('success'):
                            self.success(f"CSV data uploaded successfully")
                            
                            # Test cases
                            test_cases = [
                                {
                                    "name": "RANGE with negative numbers - user within range",
                                    "html": """
                                    <html>
                                    <head><title>Response Sheet</title></head>
                                    <body>
                                    <div>
                                        Question ID: 6420084901 Question Type: NAT Status: Answered Given Answer: 0
                                        Question ID: 6420084902 Question Type: MCQ Status: Answered Chosen Option: 1
                                        Question ID: 6420084903 Question Type: MCQ Status: Not Answered Chosen Option: 2
                                    </div>
                                    </body>
                                    </html>
                                    """,
                                    "expected_results": {
                                        "6420084901": {"type": "RANGE", "status": "correct"},
                                        "6420084902": {"type": "MCQ", "status": "correct"},
                                        "6420084903": {"type": "MCQ", "status": "unattempted"}
                                    },
                                    "expected_summary": {"correct": 2, "wrong": 0, "unattempted": 1}
                                },
                                {
                                    "name": "RANGE with negative numbers - user at negative boundary",
                                    "html": """
                                    <html>
                                    <head><title>Response Sheet</title></head>
                                    <body>
                                    <div>
                                        Question ID: 6420084901 Question Type: NAT Status: Answered Given Answer: -5
                                        Question ID: 6420084902 Question Type: MCQ Status: Answered Chosen Option: 1
                                        Question ID: 6420084903 Question Type: MCQ Status: Not Answered Chosen Option: 1
                                    </div>
                                    </body>
                                    </html>
                                    """,
                                    "expected_results": {
                                        "6420084901": {"type": "RANGE", "status": "correct"},
                                        "6420084902": {"type": "MCQ", "status": "correct"},
                                        "6420084903": {"type": "MCQ", "status": "unattempted"}
                                    },
                                    "expected_summary": {"correct": 2, "wrong": 0, "unattempted": 1}
                                },
                                {
                                    "name": "RANGE with negative numbers - user outside range",
                                    "html": """
                                    <html>
                                    <head><title>Response Sheet</title></head>
                                    <body>
                                    <div>
                                        Question ID: 6420084901 Question Type: NAT Status: Answered Given Answer: -6
                                        Question ID: 6420084902 Question Type: MCQ Status: Answered Chosen Option: 1
                                        Question ID: 6420084903 Question Type: MCQ Status: Not Answered Chosen Option: 1
                                    </div>
                                    </body>
                                    </html>
                                    """,
                                    "expected_results": {
                                        "6420084901": {"type": "RANGE", "status": "wrong"},
                                        "6420084902": {"type": "MCQ", "status": "correct"},
                                        "6420084903": {"type": "MCQ", "status": "unattempted"}
                                    },
                                    "expected_summary": {"correct": 1, "wrong": 1, "unattempted": 1}
                                }
                            ]
                            
                            passed_tests = 0
                            total_tests = len(test_cases)
                            
                            for i, test_case in enumerate(test_cases):
                                self.log(f"Test case {i+1}/{total_tests}: {test_case['name']}")
                                
                                prediction_data = {
                                    "answerKeyId": answer_key_id,
                                    "name": f"Additional Edge Test User {i+1}",
                                    "email": f"addledgetest{i+1}@example.com",
                                    "phone": "9876543210",
                                    "category": "General",
                                    "responseHtml": test_case['html']
                                }
                                
                                response = self.session.post(f"{API_BASE}/predict-rank", json=prediction_data)
                                
                                if response.status_code == 200:
                                    data = response.json()
                                    if data.get('success'):
                                        result = data.get('data', {})
                                        details = result.get('details', [])
                                        
                                        # Check summary results
                                        expected_summary = test_case['expected_summary']
                                        actual_correct = result.get('correct', 0)
                                        actual_wrong = result.get('wrong', 0)
                                        actual_unattempted = result.get('unattempted', 0)
                                        
                                        summary_correct = (
                                            actual_correct == expected_summary['correct'] and
                                            actual_wrong == expected_summary['wrong'] and
                                            actual_unattempted == expected_summary['unattempted']
                                        )
                                        
                                        # Check individual question results
                                        details_correct = True
                                        for detail in details:
                                            qid = detail.get('question_id')
                                            actual_type = detail.get('type')
                                            actual_status = detail.get('status')
                                            
                                            if qid in test_case['expected_results']:
                                                expected = test_case['expected_results'][qid]
                                                if (actual_type == expected['type'] and 
                                                    actual_status == expected['status']):
                                                    self.log(f"  ✅ Q{qid}: {actual_type}/{actual_status} (correct)")
                                                else:
                                                    self.error(f"  ❌ Q{qid}: Expected {expected['type']}/{expected['status']}, got {actual_type}/{actual_status}")
                                                    details_correct = False
                                        
                                        if summary_correct and details_correct:
                                            self.success(f"  ✅ {test_case['name']} - PASSED")
                                            passed_tests += 1
                                        else:
                                            self.error(f"  ❌ {test_case['name']} - FAILED")
                                            if not summary_correct:
                                                self.error(f"    Summary mismatch: Expected {expected_summary}, got correct={actual_correct}, wrong={actual_wrong}, unattempted={actual_unattempted}")
                                    else:
                                        self.error(f"  ❌ Prediction failed: {data.get('error')}")
                                else:
                                    self.error(f"  ❌ Request failed with status {response.status_code}")
                            
                            if passed_tests == total_tests:
                                self.success(f"✅ Additional edge cases test PASSED ({passed_tests}/{total_tests})")
                                return True
                            else:
                                self.error(f"❌ Additional edge cases test FAILED ({passed_tests}/{total_tests})")
                                return False
                        else:
                            self.error(f"CSV upload failed: {csv_result.get('error')}")
                            return False
                    else:
                        self.error(f"CSV upload failed with status {csv_response.status_code}")
                        return False
                else:
                    self.error(f"Answer key creation failed: {data.get('error')}")
                    return False
            else:
                self.error(f"Answer key creation failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.error(f"Additional edge cases test error: {str(e)}")
            return False
    
    def run_test(self):
        """Run the additional edge cases test"""
        self.log("Starting Additional Edge Cases Testing")
        self.log("=" * 50)
        
        # Login as admin
        if not self.admin_login():
            self.error("Failed to login as admin. Cannot proceed with tests.")
            return False
        
        # Run test
        success = self.test_additional_edge_cases()
        
        # Summary
        self.log("=" * 50)
        self.log("TEST SUMMARY")
        self.log("=" * 50)
        
        if success:
            self.success("🎉 ADDITIONAL EDGE CASES TEST PASSED")
            self.success("Negative range handling and 'Not Answered' status working correctly!")
            return True
        else:
            self.error("❌ ADDITIONAL EDGE CASES TEST FAILED")
            return False

def main():
    tester = AdditionalEdgeCasesTester()
    success = tester.run_test()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()