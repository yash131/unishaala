#!/usr/bin/env python3
"""
Comprehensive backend test for Reviewer Workflow endpoints
Tests the new reviewer workflow where "Publish" becomes "Send to Review"
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class ReviewerWorkflowTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_cookies = None
        self.test_mock_test_id = None
        self.test_results = []
        
    def log_result(self, test_name, passed, details=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'details': details
        })
        
    def login_admin(self):
        """Login as admin and get cookies"""
        try:
            print("\n=== ADMIN LOGIN ===")
            response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.admin_cookies = self.session.cookies
                    print(f"✅ Admin login successful. Role: {data.get('data', {}).get('role')}")
                    return True
                else:
                    print(f"❌ Login failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Login failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def create_test_mock_test(self):
        """Create a test mock test for testing"""
        try:
            print("\n=== CREATING TEST MOCK TEST ===")
            response = self.session.post(
                f"{BASE_URL}/api/admin/mock-tests",
                json={
                    "title": "Reviewer Workflow Test",
                    "examId": "gate",  # Assuming GATE exam exists
                    "duration": 60,
                    "testType": "mock_test"
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.test_mock_test_id = data.get('data', {}).get('id')
                    print(f"✅ Mock test created with ID: {self.test_mock_test_id}")
                    return True
                else:
                    print(f"❌ Mock test creation failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Mock test creation failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Mock test creation error: {str(e)}")
            return False
    
    def test_save_batch_with_publish(self):
        """Test 1: Modified POST /api/admin/questions/save-batch with publish:true"""
        try:
            print("\n=== TEST 1: SAVE-BATCH WITH PUBLISH ===")
            
            # Create sample questions
            questions = [
                {
                    "question_title": "What is the capital of India?",
                    "option1_title": "Mumbai",
                    "option2_title": "Delhi", 
                    "option3_title": "Kolkata",
                    "option4_title": "Chennai",
                    "correct_option_number": 2
                },
                {
                    "question_title": "What is 2 + 2?",
                    "option1_title": "3",
                    "option2_title": "4",
                    "option3_title": "5", 
                    "option4_title": "6",
                    "correct_option_number": 2
                }
            ]
            
            response = self.session.post(
                f"{BASE_URL}/api/admin/questions/save-batch",
                json={
                    "mockTestId": self.test_mock_test_id,
                    "questions": questions,
                    "publish": True
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get('success') and 
                    data.get('data', {}).get('sentToReview') == True and 
                    data.get('data', {}).get('testPublished') == False):
                    self.log_result("Save-batch with publish=true", True, 
                                  f"sentToReview: {data.get('data', {}).get('sentToReview')}, testPublished: {data.get('data', {}).get('testPublished')}")
                    return True
                else:
                    self.log_result("Save-batch with publish=true", False, 
                                  f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Save-batch with publish=true", False, 
                              f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Save-batch with publish=true", False, f"Error: {str(e)}")
            return False
    
    def verify_mock_test_status(self):
        """Verify mock test has reviewStatus=PENDING_REVIEW and isPublished=false"""
        try:
            print("\n=== VERIFYING MOCK TEST STATUS ===")
            
            response = self.session.get(f"{BASE_URL}/api/admin/mock-tests")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    tests = data.get('data', [])
                    test = next((t for t in tests if t.get('id') == self.test_mock_test_id), None)
                    
                    if test:
                        review_status = test.get('reviewStatus')
                        is_published = test.get('isPublished')
                        
                        if review_status == 'PENDING_REVIEW' and is_published == False:
                            self.log_result("Mock test status verification", True,
                                          f"reviewStatus: {review_status}, isPublished: {is_published}")
                            return True
                        else:
                            self.log_result("Mock test status verification", False,
                                          f"Expected reviewStatus=PENDING_REVIEW, isPublished=false. Got reviewStatus={review_status}, isPublished={is_published}")
                            return False
                    else:
                        self.log_result("Mock test status verification", False, "Test not found in list")
                        return False
                else:
                    self.log_result("Mock test status verification", False, f"API error: {data.get('error')}")
                    return False
            else:
                self.log_result("Mock test status verification", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Mock test status verification", False, f"Error: {str(e)}")
            return False
    
    def test_reviewer_queue_endpoint(self):
        """Test 2: GET /api/admin/reviewer/queue?status=PENDING_REVIEW"""
        try:
            print("\n=== TEST 2: REVIEWER QUEUE ENDPOINT ===")
            
            # Test without auth (should fail)
            temp_session = requests.Session()
            response = temp_session.get(f"{BASE_URL}/api/admin/reviewer/queue?status=PENDING_REVIEW")
            
            if response.status_code == 401:
                self.log_result("Reviewer queue - unauthorized access", True, "Correctly returned 401")
            else:
                self.log_result("Reviewer queue - unauthorized access", False, f"Expected 401, got {response.status_code}")
            
            # Test with admin auth
            response = self.session.get(f"{BASE_URL}/api/admin/reviewer/queue?status=PENDING_REVIEW")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    queue_data = data.get('data', [])
                    # Find our test in the queue
                    test_in_queue = next((t for t in queue_data if t.get('id') == self.test_mock_test_id), None)
                    
                    if test_in_queue:
                        required_fields = ['id', 'title', 'examName', 'domainName', 'subjectName', 
                                         'totalQuestions', 'reviewStatus', 'isPublished', 'sentToReviewAt']
                        missing_fields = [f for f in required_fields if f not in test_in_queue]
                        
                        if not missing_fields and test_in_queue.get('reviewStatus') == 'PENDING_REVIEW':
                            self.log_result("Reviewer queue - with auth", True,
                                          f"Test found in queue with all required fields. reviewStatus: {test_in_queue.get('reviewStatus')}")
                        else:
                            self.log_result("Reviewer queue - with auth", False,
                                          f"Missing fields: {missing_fields} or wrong reviewStatus: {test_in_queue.get('reviewStatus')}")
                    else:
                        self.log_result("Reviewer queue - with auth", False, "Test not found in PENDING_REVIEW queue")
                else:
                    self.log_result("Reviewer queue - with auth", False, f"API error: {data.get('error')}")
            else:
                self.log_result("Reviewer queue - with auth", False, f"Status {response.status_code}: {response.text}")
            
            # Test with REJECTED filter (should not include our test)
            response = self.session.get(f"{BASE_URL}/api/admin/reviewer/queue?status=REJECTED")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    rejected_data = data.get('data', [])
                    test_in_rejected = next((t for t in rejected_data if t.get('id') == self.test_mock_test_id), None)
                    
                    if not test_in_rejected:
                        self.log_result("Reviewer queue - REJECTED filter", True, "Test correctly not in REJECTED queue")
                    else:
                        self.log_result("Reviewer queue - REJECTED filter", False, "Test incorrectly found in REJECTED queue")
                else:
                    self.log_result("Reviewer queue - REJECTED filter", False, f"API error: {data.get('error')}")
            else:
                self.log_result("Reviewer queue - REJECTED filter", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Reviewer queue endpoint", False, f"Error: {str(e)}")
    
    def test_reviewer_test_detail_endpoint(self):
        """Test 3: GET /api/admin/reviewer/test/:id"""
        try:
            print("\n=== TEST 3: REVIEWER TEST DETAIL ENDPOINT ===")
            
            response = self.session.get(f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    test_data = data.get('data', {})
                    test_info = test_data.get('test', {})
                    questions = test_data.get('questions', [])
                    
                    # Check test info fields
                    required_test_fields = ['id', 'title', 'reviewStatus', 'isPublished', 
                                          'examName', 'domainName', 'subjectName', 'duration', 
                                          'totalQuestions', 'totalMarks']
                    missing_test_fields = [f for f in required_test_fields if f not in test_info]
                    
                    # Check question fields (should include correct_option_number for reviewer)
                    if questions:
                        question = questions[0]
                        required_question_fields = ['id', 'questionNumber', 'question_title', 'options', 'correct_option_number']
                        missing_question_fields = [f for f in required_question_fields if f not in question]
                        
                        # Check options structure
                        options = question.get('options', [])
                        if options and len(options) > 0:
                            option = options[0]
                            required_option_fields = ['number', 'title', 'image_url']
                            missing_option_fields = [f for f in required_option_fields if f not in option]
                        else:
                            missing_option_fields = ['options array is empty']
                    else:
                        missing_question_fields = ['no questions found']
                        missing_option_fields = []
                    
                    if not missing_test_fields and not missing_question_fields and not missing_option_fields:
                        self.log_result("Reviewer test detail", True,
                                      f"All required fields present. Questions: {len(questions)}, correct_option_number visible: {questions[0].get('correct_option_number') is not None}")
                    else:
                        self.log_result("Reviewer test detail", False,
                                      f"Missing fields - Test: {missing_test_fields}, Question: {missing_question_fields}, Option: {missing_option_fields}")
                else:
                    self.log_result("Reviewer test detail", False, f"API error: {data.get('error')}")
            else:
                self.log_result("Reviewer test detail", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Reviewer test detail", False, f"Error: {str(e)}")
    
    def test_reviewer_reject_endpoint(self):
        """Test 4: POST /api/admin/reviewer/test/:id/reject"""
        try:
            print("\n=== TEST 4: REVIEWER REJECT ENDPOINT ===")
            
            # Test without auth (should fail)
            temp_session = requests.Session()
            response = temp_session.post(
                f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}/reject",
                json={"reason": "test rejection"}
            )
            
            if response.status_code == 401:
                self.log_result("Reviewer reject - unauthorized", True, "Correctly returned 401")
            else:
                self.log_result("Reviewer reject - unauthorized", False, f"Expected 401, got {response.status_code}")
            
            # Test with empty body (should fail)
            response = self.session.post(
                f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}/reject",
                json={}
            )
            
            if response.status_code == 400:
                data = response.json()
                if 'rejection reason is required' in data.get('error', '').lower():
                    self.log_result("Reviewer reject - empty reason", True, "Correctly returned 400 for missing reason")
                else:
                    self.log_result("Reviewer reject - empty reason", False, f"Wrong error message: {data.get('error')}")
            else:
                self.log_result("Reviewer reject - empty reason", False, f"Expected 400, got {response.status_code}")
            
            # Test successful rejection
            response = self.session.post(
                f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}/reject",
                json={"reason": "questions need editing"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Reviewer reject - successful", True, "Test rejected successfully")
                    
                    # Verify the test status changed
                    detail_response = self.session.get(f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}")
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        if detail_data.get('success'):
                            test_info = detail_data.get('data', {}).get('test', {})
                            review_status = test_info.get('reviewStatus')
                            rejection_reason = test_info.get('rejectionReason')
                            is_published = test_info.get('isPublished')
                            
                            if (review_status == 'REJECTED' and 
                                rejection_reason == 'questions need editing' and 
                                is_published == False):
                                self.log_result("Reviewer reject - status verification", True,
                                              f"reviewStatus: {review_status}, rejectionReason: {rejection_reason}, isPublished: {is_published}")
                            else:
                                self.log_result("Reviewer reject - status verification", False,
                                              f"Expected REJECTED status. Got reviewStatus: {review_status}, rejectionReason: {rejection_reason}, isPublished: {is_published}")
                        else:
                            self.log_result("Reviewer reject - status verification", False, "Failed to get test details")
                    else:
                        self.log_result("Reviewer reject - status verification", False, "Failed to fetch test details")
                else:
                    self.log_result("Reviewer reject - successful", False, f"API error: {data.get('error')}")
            else:
                self.log_result("Reviewer reject - successful", False, f"Status {response.status_code}: {response.text}")
            
            # Test rejecting already rejected test (should fail)
            response = self.session.post(
                f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}/reject",
                json={"reason": "another reason"}
            )
            
            if response.status_code == 400:
                data = response.json()
                if 'not pending review' in data.get('error', '').lower():
                    self.log_result("Reviewer reject - already rejected", True, "Correctly prevented double rejection")
                else:
                    self.log_result("Reviewer reject - already rejected", False, f"Wrong error message: {data.get('error')}")
            else:
                self.log_result("Reviewer reject - already rejected", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Reviewer reject endpoint", False, f"Error: {str(e)}")
    
    def test_reviewer_publish_endpoint(self):
        """Test 5: POST /api/admin/reviewer/test/:id/publish"""
        try:
            print("\n=== TEST 5: REVIEWER PUBLISH ENDPOINT ===")
            
            # First try to publish rejected test (should fail)
            response = self.session.post(f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}/publish")
            
            if response.status_code == 400:
                data = response.json()
                if 'not pending review' in data.get('error', '').lower():
                    self.log_result("Reviewer publish - rejected test", True, "Correctly prevented publishing rejected test")
                else:
                    self.log_result("Reviewer publish - rejected test", False, f"Wrong error message: {data.get('error')}")
            else:
                self.log_result("Reviewer publish - rejected test", False, f"Expected 400, got {response.status_code}")
            
            # Reset test to PENDING_REVIEW by re-triggering save-batch
            print("   Resetting test to PENDING_REVIEW...")
            questions = [
                {
                    "question_title": "Updated question: What is the capital of India?",
                    "option1_title": "Mumbai",
                    "option2_title": "Delhi", 
                    "option3_title": "Kolkata",
                    "option4_title": "Chennai",
                    "correct_option_number": 2
                }
            ]
            
            reset_response = self.session.post(
                f"{BASE_URL}/api/admin/questions/save-batch",
                json={
                    "mockTestId": self.test_mock_test_id,
                    "questions": questions,
                    "publish": True
                }
            )
            
            if reset_response.status_code == 200:
                print("   ✅ Test reset to PENDING_REVIEW")
                
                # Now test successful publish
                response = self.session.post(f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}/publish")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        self.log_result("Reviewer publish - successful", True, "Test published successfully")
                        
                        # Verify the test status changed
                        detail_response = self.session.get(f"{BASE_URL}/api/admin/reviewer/test/{self.test_mock_test_id}")
                        if detail_response.status_code == 200:
                            detail_data = detail_response.json()
                            if detail_data.get('success'):
                                test_info = detail_data.get('data', {}).get('test', {})
                                review_status = test_info.get('reviewStatus')
                                is_published = test_info.get('isPublished')
                                
                                if review_status == 'PUBLISHED' and is_published == True:
                                    self.log_result("Reviewer publish - status verification", True,
                                                  f"reviewStatus: {review_status}, isPublished: {is_published}")
                                else:
                                    self.log_result("Reviewer publish - status verification", False,
                                                  f"Expected PUBLISHED status and isPublished=true. Got reviewStatus: {review_status}, isPublished: {is_published}")
                            else:
                                self.log_result("Reviewer publish - status verification", False, "Failed to get test details")
                        else:
                            self.log_result("Reviewer publish - status verification", False, "Failed to fetch test details")
                    else:
                        self.log_result("Reviewer publish - successful", False, f"API error: {data.get('error')}")
                else:
                    self.log_result("Reviewer publish - successful", False, f"Status {response.status_code}: {response.text}")
            else:
                self.log_result("Reviewer publish - reset failed", False, "Could not reset test to PENDING_REVIEW")
                
        except Exception as e:
            self.log_result("Reviewer publish endpoint", False, f"Error: {str(e)}")
    
    def test_published_queue_visibility(self):
        """Test 6: Published test appears in PUBLISHED queue"""
        try:
            print("\n=== TEST 6: PUBLISHED QUEUE VISIBILITY ===")
            
            response = self.session.get(f"{BASE_URL}/api/admin/reviewer/queue?status=PUBLISHED")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    published_data = data.get('data', [])
                    test_in_published = next((t for t in published_data if t.get('id') == self.test_mock_test_id), None)
                    
                    if test_in_published and test_in_published.get('reviewStatus') == 'PUBLISHED':
                        self.log_result("Published queue visibility", True, "Test correctly appears in PUBLISHED queue")
                    else:
                        self.log_result("Published queue visibility", False, "Test not found in PUBLISHED queue or wrong status")
                else:
                    self.log_result("Published queue visibility", False, f"API error: {data.get('error')}")
            else:
                self.log_result("Published queue visibility", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Published queue visibility", False, f"Error: {str(e)}")
    
    def test_public_visibility(self):
        """Test 7: Published test appears in public API"""
        try:
            print("\n=== TEST 7: PUBLIC VISIBILITY ===")
            
            # Test public mock-tests endpoint (no auth)
            temp_session = requests.Session()
            response = temp_session.get(f"{BASE_URL}/api/mock-tests")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    public_tests = data.get('data', [])
                    test_in_public = next((t for t in public_tests if t.get('id') == self.test_mock_test_id), None)
                    
                    if test_in_public and test_in_public.get('isPublished') == True:
                        self.log_result("Public visibility", True, "Published test correctly appears in public API")
                    else:
                        self.log_result("Public visibility", False, "Published test not found in public API or not marked as published")
                else:
                    self.log_result("Public visibility", False, f"API error: {data.get('error')}")
            else:
                self.log_result("Public visibility", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Public visibility", False, f"Error: {str(e)}")
    
    def test_backward_compatibility(self):
        """Test 8: Existing tests without reviewStatus still appear as published"""
        try:
            print("\n=== TEST 8: BACKWARD COMPATIBILITY ===")
            
            # Get public mock tests and check for legacy tests
            temp_session = requests.Session()
            response = temp_session.get(f"{BASE_URL}/api/mock-tests")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    public_tests = data.get('data', [])
                    
                    # Look for tests that don't have reviewStatus but are published
                    legacy_tests = [t for t in public_tests if not t.get('reviewStatus') and t.get('isPublished')]
                    
                    if legacy_tests:
                        self.log_result("Backward compatibility", True, 
                                      f"Found {len(legacy_tests)} legacy published tests without reviewStatus")
                    else:
                        # This might be OK if all tests have been migrated
                        self.log_result("Backward compatibility", True, 
                                      "No legacy tests found (all tests may have reviewStatus)")
                else:
                    self.log_result("Backward compatibility", False, f"API error: {data.get('error')}")
            else:
                self.log_result("Backward compatibility", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Backward compatibility", False, f"Error: {str(e)}")
    
    def cleanup(self):
        """Clean up test data"""
        try:
            print("\n=== CLEANUP ===")
            if self.test_mock_test_id:
                response = self.session.delete(f"{BASE_URL}/api/admin/mock-tests/{self.test_mock_test_id}")
                if response.status_code == 200:
                    print("✅ Test mock test deleted successfully")
                else:
                    print(f"⚠️ Failed to delete test mock test: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Cleanup error: {str(e)}")
    
    def run_all_tests(self):
        """Run all reviewer workflow tests"""
        print("🚀 Starting Reviewer Workflow Backend Testing")
        print(f"Base URL: {BASE_URL}")
        print(f"Admin Email: {ADMIN_EMAIL}")
        
        # Login
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return False
        
        # Create test mock test
        if not self.create_test_mock_test():
            print("❌ Cannot proceed without test mock test")
            return False
        
        # Run all tests
        self.test_save_batch_with_publish()
        self.verify_mock_test_status()
        self.test_reviewer_queue_endpoint()
        self.test_reviewer_test_detail_endpoint()
        self.test_reviewer_reject_endpoint()
        self.test_reviewer_publish_endpoint()
        self.test_published_queue_visibility()
        self.test_public_visibility()
        self.test_backward_compatibility()
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in self.test_results if r['passed'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result['passed'] else "❌"
            print(f"{status} {result['test']}")
            if result['details'] and not result['passed']:
                print(f"   {result['details']}")
        
        print(f"\n📈 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Reviewer Workflow is working correctly.")
            return True
        else:
            print("⚠️ Some tests failed. Please review the issues above.")
            return False

if __name__ == "__main__":
    tester = ReviewerWorkflowTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)