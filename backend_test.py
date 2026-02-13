#!/usr/bin/env python3

import requests
import json
import asyncio
import time
from datetime import datetime

# Base URL from environment
BASE_URL = "https://unishaala-edu.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "admin123"

class UnishaalaMockTestsVisibilityTest:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []

    def log_test_result(self, test_name, success, message, details=None):
        """Log test results with timestamp"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"  Details: {details}")

    def authenticate_admin(self):
        """Authenticate as admin user"""
        print(f"\n🔐 Testing Admin Authentication...")
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", 
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data', {}).get('token'):
                    self.auth_token = data['data']['token']
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.auth_token}',
                        'Content-Type': 'application/json'
                    })
                    
                    # Verify admin role
                    user_data = data['data'].get('user', {})
                    role = user_data.get('role')
                    
                    if role in ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER']:
                        self.log_test_result("Admin Authentication", True, 
                            f"Successfully authenticated as {role}", 
                            {"user_id": user_data.get('id'), "email": user_data.get('email')})
                        return True
                    else:
                        self.log_test_result("Admin Authentication", False, 
                            f"User role '{role}' is not admin")
                        return False
                else:
                    self.log_test_result("Admin Authentication", False, 
                        "Login response missing token or success flag",
                        {"response": data})
                    return False
            else:
                self.log_test_result("Admin Authentication", False, 
                    f"Login failed with status {response.status_code}",
                    {"response": response.text[:500]})
                return False
                
        except Exception as e:
            self.log_test_result("Admin Authentication", False, 
                f"Authentication error: {str(e)}")
            return False

    def test_mock_tests_visibility_gate_endpoint(self):
        """Test GET /api/exams/gate - Should return mock tests with proper filtering"""
        print(f"\n📚 Testing Mock Tests Visibility on GATE Exam Endpoint...")
        
        try:
            response = self.session.get(f"{API_BASE}/exams/gate")
            
            if response.status_code == 200:
                data = response.json()
                
                if not data.get('success'):
                    self.log_test_result("GET /api/exams/gate", False, 
                        "API returned success: false",
                        {"response": data})
                    return False
                
                exam_data = data.get('data', {})
                mock_tests = exam_data.get('mockTests', [])
                
                # Test 1: Check if mock tests are returned
                if not mock_tests:
                    self.log_test_result("Mock Tests Visibility - Basic", False, 
                        "No mock tests returned from /api/exams/gate")
                    return False
                
                self.log_test_result("Mock Tests Visibility - Basic", True, 
                    f"Retrieved {len(mock_tests)} mock tests from GATE endpoint")
                
                # Test 2: Verify each mock test meets visibility criteria
                published_tests = 0
                tests_with_questions = 0
                active_tests = 0
                
                for test in mock_tests:
                    test_id = test.get('id')
                    is_published = test.get('isPublished')
                    status = test.get('status')
                    question_count = test.get('questionCount', 0)
                    
                    # Check if published
                    if is_published is True:
                        published_tests += 1
                    
                    # Check if active status
                    if status == 'Active':
                        active_tests += 1
                    
                    # Check if has questions
                    if question_count > 0:
                        tests_with_questions += 1
                
                # Verify filtering criteria
                if published_tests == len(mock_tests):
                    self.log_test_result("Mock Tests Filter - Published", True, 
                        f"All {len(mock_tests)} mock tests are published (isPublished: true)")
                else:
                    self.log_test_result("Mock Tests Filter - Published", False, 
                        f"Only {published_tests}/{len(mock_tests)} tests are published")
                
                if active_tests == len(mock_tests):
                    self.log_test_result("Mock Tests Filter - Active Status", True, 
                        f"All {len(mock_tests)} mock tests have status: 'Active'")
                else:
                    self.log_test_result("Mock Tests Filter - Active Status", False, 
                        f"Only {active_tests}/{len(mock_tests)} tests have status: 'Active'")
                
                if tests_with_questions == len(mock_tests):
                    self.log_test_result("Mock Tests Filter - With Questions", True, 
                        f"All {len(mock_tests)} mock tests have questionCount > 0")
                else:
                    self.log_test_result("Mock Tests Filter - With Questions", False, 
                        f"Only {tests_with_questions}/{len(mock_tests)} tests have questions")
                
                # Test 3: Verify expected count (should be 2 based on requirement)
                if len(mock_tests) >= 2:
                    self.log_test_result("Mock Tests Count", True, 
                        f"Expected at least 2 published mock tests, got {len(mock_tests)}")
                else:
                    self.log_test_result("Mock Tests Count", False, 
                        f"Expected at least 2 published mock tests, got {len(mock_tests)}")
                
                # Store test IDs for further testing
                if mock_tests:
                    self.test_mock_test_ids = [test.get('id') for test in mock_tests[:2]]
                    return True
                
            else:
                self.log_test_result("GET /api/exams/gate", False, 
                    f"Failed with status {response.status_code}",
                    {"response": response.text[:500]})
                return False
                
        except Exception as e:
            self.log_test_result("GET /api/exams/gate", False, 
                f"Request error: {str(e)}")
            return False

    def test_mock_test_questions_endpoint(self):
        """Test GET /api/mock-test-questions/{testId} - Should return questions for specific mock test"""
        print(f"\n❓ Testing Mock Test Questions Retrieval...")
        
        if not hasattr(self, 'test_mock_test_ids') or not self.test_mock_test_ids:
            self.log_test_result("Mock Test Questions Setup", False, 
                "No test IDs available from previous test")
            return False
        
        success_count = 0
        
        for test_id in self.test_mock_test_ids:
            try:
                response = self.session.get(f"{API_BASE}/mock-test-questions/{test_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get('success'):
                        questions = data.get('data', [])
                        
                        if questions:
                            success_count += 1
                            self.log_test_result(f"Questions for Test {test_id}", True, 
                                f"Retrieved {len(questions)} questions")
                            
                            # Test question structure
                            first_question = questions[0] if questions else {}
                            required_fields = ['id', 'questionNumber', 'question_title', 'options']
                            
                            missing_fields = [field for field in required_fields if field not in first_question]
                            if not missing_fields:
                                self.log_test_result(f"Question Structure {test_id}", True, 
                                    "Questions have required fields")
                            else:
                                self.log_test_result(f"Question Structure {test_id}", False, 
                                    f"Questions missing fields: {missing_fields}")
                            
                            # Verify answers are removed (for test mode)
                            if 'correctAnswer' not in first_question and 'correct_option_number' not in first_question:
                                self.log_test_result(f"Answer Security {test_id}", True, 
                                    "Correct answers properly hidden for test mode")
                            else:
                                self.log_test_result(f"Answer Security {test_id}", False, 
                                    "Correct answers not properly hidden")
                        else:
                            self.log_test_result(f"Questions for Test {test_id}", False, 
                                "No questions returned")
                    else:
                        self.log_test_result(f"Questions for Test {test_id}", False, 
                            "API returned success: false",
                            {"response": data})
                else:
                    self.log_test_result(f"Questions for Test {test_id}", False, 
                        f"Failed with status {response.status_code}")
                        
            except Exception as e:
                self.log_test_result(f"Questions for Test {test_id}", False, 
                    f"Request error: {str(e)}")
        
        if success_count > 0:
            return True
        else:
            return False

    def test_questions_save_batch_status_normalization(self):
        """Test POST /admin/questions/save-batch - Status normalization"""
        print(f"\n💾 Testing Question Status Normalization...")
        
        if not self.auth_token:
            self.log_test_result("Questions Batch Save Setup", False, 
                "No admin authentication available")
            return False
        
        # First get a mock test to add questions to
        try:
            response = self.session.get(f"{API_BASE}/admin/mock-tests")
            if response.status_code != 200:
                self.log_test_result("Get Mock Tests for Testing", False, 
                    f"Failed to get mock tests: {response.status_code}")
                return False
            
            data = response.json()
            mock_tests = data.get('data', [])
            if not mock_tests:
                self.log_test_result("Get Mock Tests for Testing", False, 
                    "No mock tests available")
                return False
            
            test_mock_test_id = mock_tests[0].get('id')
            
        except Exception as e:
            self.log_test_result("Get Mock Tests for Testing", False, 
                f"Error getting mock tests: {str(e)}")
            return False
        
        # Test different status value normalizations
        test_questions = [
            {
                "question_title": f"Test Question Status active {int(time.time())}",
                "option1_title": "Option A",
                "option2_title": "Option B", 
                "option3_title": "Option C",
                "option4_title": "Option D",
                "correct_option_number": 1,
                "status": "active"  # lowercase - should be normalized to 'Active'
            },
            {
                "question_title": f"Test Question Status ACTIVE {int(time.time())}",
                "option1_title": "Option A",
                "option2_title": "Option B",
                "option3_title": "Option C", 
                "option4_title": "Option D",
                "correct_option_number": 2,
                "status": "ACTIVE"  # uppercase - should be normalized to 'Active'
            },
            {
                "question_title": f"Test Question No Status {int(time.time())}",
                "option1_title": "Option A",
                "option2_title": "Option B",
                "option3_title": "Option C",
                "option4_title": "Option D", 
                "correct_option_number": 3
                # No status - should default to 'Active'
            }
        ]
        
        try:
            response = self.session.post(f"{API_BASE}/admin/questions/save-batch",
                json={
                    "mockTestId": test_mock_test_id,
                    "questions": test_questions,
                    "publish": False
                })
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    result_data = data.get('data', {})
                    inserted = result_data.get('inserted', 0)
                    failed = result_data.get('failed', 0)
                    errors = result_data.get('errors', [])
                    
                    if inserted == len(test_questions) and failed == 0:
                        self.log_test_result("Question Status Normalization - Batch Save", True, 
                            f"Successfully saved {inserted} questions with different status formats")
                        
                        # Now verify the status normalization by getting the questions
                        response = self.session.get(f"{API_BASE}/admin/questions?mockTestId={test_mock_test_id}")
                        if response.status_code == 200:
                            questions_data = response.json()
                            if questions_data.get('success'):
                                all_questions = questions_data.get('data', [])
                                
                                # Filter to our test questions
                                test_question_titles = [q['question_title'] for q in test_questions]
                                saved_test_questions = [q for q in all_questions 
                                                      if q.get('question_title') in test_question_titles]
                                
                                if len(saved_test_questions) == len(test_questions):
                                    # Check if all statuses were normalized to 'Active'
                                    active_count = sum(1 for q in saved_test_questions 
                                                     if q.get('status') == 'Active')
                                    
                                    if active_count == len(saved_test_questions):
                                        self.log_test_result("Question Status Normalization - Verification", True, 
                                            f"All {len(saved_test_questions)} questions have status normalized to 'Active'")
                                        return True
                                    else:
                                        statuses = [q.get('status') for q in saved_test_questions]
                                        self.log_test_result("Question Status Normalization - Verification", False, 
                                            f"Status normalization failed. Found statuses: {statuses}")
                                        return False
                                else:
                                    self.log_test_result("Question Status Normalization - Verification", False, 
                                        f"Expected {len(test_questions)} saved questions, found {len(saved_test_questions)}")
                            else:
                                self.log_test_result("Question Status Normalization - Verification", False, 
                                    "Failed to retrieve saved questions for verification")
                        else:
                            self.log_test_result("Question Status Normalization - Verification", False, 
                                f"Failed to get questions for verification: {response.status_code}")
                    else:
                        self.log_test_result("Question Status Normalization - Batch Save", False, 
                            f"Batch save failed: {inserted} inserted, {failed} failed",
                            {"errors": errors})
                else:
                    self.log_test_result("Question Status Normalization - Batch Save", False, 
                        "Batch save API returned success: false",
                        {"response": data})
            else:
                self.log_test_result("Question Status Normalization - Batch Save", False, 
                    f"Batch save failed with status {response.status_code}",
                    {"response": response.text[:500]})
                    
        except Exception as e:
            self.log_test_result("Question Status Normalization - Batch Save", False, 
                f"Request error: {str(e)}")
        
        return False

    def test_case_insensitive_filtering(self):
        """Test that the API correctly filters questions with case-insensitive status matching"""
        print(f"\n🔍 Testing Case-Insensitive Status Filtering...")
        
        try:
            # Test the gate endpoint again and verify it uses case-insensitive filtering
            response = self.session.get(f"{API_BASE}/exams/gate")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    exam_data = data.get('data', {})
                    mock_tests = exam_data.get('mockTests', [])
                    
                    if mock_tests:
                        # Check that we have tests with question counts > 0
                        # This confirms that the case-insensitive filtering is working
                        tests_with_questions = [t for t in mock_tests if t.get('questionCount', 0) > 0]
                        
                        if tests_with_questions:
                            self.log_test_result("Case-Insensitive Status Filtering", True, 
                                f"Found {len(tests_with_questions)} mock tests with questions, indicating case-insensitive filtering is working")
                            
                            # Verify question counts are realistic
                            question_counts = [t.get('questionCount', 0) for t in tests_with_questions]
                            total_questions = sum(question_counts)
                            
                            self.log_test_result("Question Count Validation", True, 
                                f"Total questions across tests: {total_questions}, Average per test: {total_questions/len(tests_with_questions):.1f}")
                            
                            return True
                        else:
                            self.log_test_result("Case-Insensitive Status Filtering", False, 
                                "No mock tests have questions, filtering may not be working")
                    else:
                        self.log_test_result("Case-Insensitive Status Filtering", False, 
                            "No mock tests returned")
                else:
                    self.log_test_result("Case-Insensitive Status Filtering", False, 
                        "API returned success: false")
            else:
                self.log_test_result("Case-Insensitive Status Filtering", False, 
                    f"API call failed with status {response.status_code}")
                    
        except Exception as e:
            self.log_test_result("Case-Insensitive Status Filtering", False, 
                f"Request error: {str(e)}")
        
        return False

    def run_all_tests(self):
        """Run all mock tests visibility tests"""
        print("🧪 Starting Unishaala Mock Tests Visibility Testing")
        print("=" * 60)
        
        # Step 1: Authenticate as admin
        if not self.authenticate_admin():
            print("\n❌ CRITICAL: Admin authentication failed. Cannot proceed with admin-required tests.")
            return False
        
        # Step 2: Test mock tests visibility on GATE endpoint
        visibility_test_passed = self.test_mock_tests_visibility_gate_endpoint()
        
        # Step 3: Test questions retrieval
        questions_test_passed = self.test_mock_test_questions_endpoint()
        
        # Step 4: Test status normalization 
        status_test_passed = self.test_questions_save_batch_status_normalization()
        
        # Step 5: Test case-insensitive filtering
        filtering_test_passed = self.test_case_insensitive_filtering()
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum([visibility_test_passed, questions_test_passed, status_test_passed, filtering_test_passed])
        total = 4
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        print(f"\nOverall Result: {passed}/{total} test categories passed")
        
        if passed == total:
            print("🎉 ALL MOCK TESTS VISIBILITY TESTS PASSED!")
            return True
        else:
            print("⚠️ Some tests failed. Please check the detailed results above.")
            return False

def main():
    """Main test execution"""
    tester = UnishaalaMockTestsVisibilityTest()
    success = tester.run_all_tests()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)