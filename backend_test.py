#!/usr/bin/env python3
"""
Unishaala Backend API Test Suite
Testing authentication, exam CRUD, mock test CRUD with test types, and user-facing APIs
"""

import requests
import json
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://edu-platform-demo-3.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class UnishaalaTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.admin_user = {
            "email": "admin@unishaala.com", 
            "password": "admin123"
        }
        self.created_exam_id = None
        self.created_test_ids = []
        self.gate_exam_id = None
        
    def log_test(self, message, success=True):
        """Log test results"""
        status = "✅" if success else "❌"
        print(f"{status} {message}")
        
    def log_error(self, message):
        """Log error messages"""
        print(f"❌ ERROR: {message}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        try:
            url = f"{API_BASE}{endpoint}"
            
            # Include auth cookie if available
            if self.auth_token:
                if headers is None:
                    headers = {}
                # Cookie is automatically handled by session
                
            response = self.session.request(method, url, json=data, headers=headers, timeout=30)
            return response
        except Exception as e:
            self.log_error(f"Request failed: {str(e)}")
            return None
    
    def test_authentication(self):
        """Test admin authentication"""
        print("\n=== AUTHENTICATION TESTS ===")
        
        try:
            # Test admin login
            response = self.make_request('POST', '/auth/login', self.admin_user)
            
            if not response or response.status_code != 200:
                self.log_test(f"Admin login failed - Status: {response.status_code if response else 'None'}", False)
                return False
                
            data = response.json()
            
            if not data.get('success'):
                self.log_test(f"Admin login failed - {data.get('error', 'Unknown error')}", False)
                return False
                
            # Store auth token from response data
            self.auth_token = data.get('data', {}).get('token')
            user_data = data.get('data', {}).get('user', {})
            
            if not self.auth_token:
                self.log_test("No auth token returned", False)
                return False
                
            # Verify admin role
            if user_data.get('role') != 'SUPER_ADMIN':
                self.log_test(f"Expected SUPER_ADMIN role, got {user_data.get('role')}", False)
                return False
                
            self.log_test("Admin login successful with SUPER_ADMIN role")
            self.log_test(f"Auth token received: {self.auth_token[:20]}...")
            
            return True
            
        except Exception as e:
            self.log_test(f"Authentication test failed: {str(e)}", False)
            return False
    
    def test_exam_crud(self):
        """Test Exam CRUD operations"""
        print("\n=== EXAM CRUD TESTS ===")
        
        if not self.auth_token:
            self.log_test("No auth token available for admin tests", False)
            return False
            
        try:
            # 1. GET all exams first
            response = self.make_request('GET', '/admin/exams')
            
            if not response or response.status_code != 200:
                self.log_test(f"GET /admin/exams failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"GET /admin/exams failed - {data.get('error')}", False)
                return False
                
            existing_exams = data.get('data', [])
            self.log_test(f"GET /admin/exams successful - Found {len(existing_exams)} exams")
            
            # Look for GATE exam ID for later tests
            gate_exam = next((exam for exam in existing_exams if exam.get('slug') == 'gate'), None)
            if gate_exam:
                self.gate_exam_id = gate_exam.get('id')
                self.log_test(f"Found GATE exam with ID: {self.gate_exam_id}")
            
            # 2. POST - Create new exam
            new_exam = {
                "name": "TEST_EXAM",
                "fullName": "Test Examination", 
                "description": "Test exam for backend testing",
                "category": "Engineering",
                "icon": "📝",
                "price": 999,
                "status": "Active"
            }
            
            response = self.make_request('POST', '/admin/exams', new_exam)
            
            if not response or response.status_code != 200:
                self.log_test(f"POST /admin/exams failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"POST /admin/exams failed - {data.get('error')}", False)
                return False
                
            created_exam = data.get('data', {})
            self.created_exam_id = created_exam.get('id')
            
            if not self.created_exam_id:
                self.log_test("No exam ID returned after creation", False)
                return False
                
            self.log_test(f"POST /admin/exams successful - Created exam with ID: {self.created_exam_id}")
            
            # Verify exam data
            if created_exam.get('name') != 'TEST_EXAM' or created_exam.get('price') != 999:
                self.log_test("Created exam data doesn't match input", False)
                return False
                
            # 3. PUT - Update exam price
            update_data = {"price": 1299}
            response = self.make_request('PUT', f'/admin/exams/{self.created_exam_id}', update_data)
            
            if not response or response.status_code != 200:
                self.log_test(f"PUT /admin/exams/{self.created_exam_id} failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"PUT /admin/exams failed - {data.get('error')}", False)
                return False
                
            self.log_test(f"PUT /admin/exams/{self.created_exam_id} successful - Updated price to 1299")
            
            return True
            
        except Exception as e:
            self.log_test(f"Exam CRUD test failed: {str(e)}", False)
            return False
    
    def test_mock_test_crud_with_types(self):
        """Test Mock Test CRUD with different test types"""
        print("\n=== MOCK TEST CRUD WITH TEST TYPES ===")
        
        if not self.auth_token:
            self.log_test("No auth token available for admin tests", False)
            return False
            
        if not self.gate_exam_id:
            self.log_test("No GATE exam ID available for mock test creation", False)
            return False
            
        try:
            # 1. Create mock_test type
            mock_test_data = {
                "title": "Test Mock Test",
                "examId": self.gate_exam_id,
                "testType": "mock_test",
                "duration": 60,
                "isFree": False,
                "price": 99
            }
            
            response = self.make_request('POST', '/admin/mock-tests', mock_test_data)
            
            if not response or response.status_code != 200:
                self.log_test(f"POST /admin/mock-tests (mock_test) failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"POST /admin/mock-tests (mock_test) failed - {data.get('error')}", False)
                return False
                
            mock_test = data.get('data', {})
            mock_test_id = mock_test.get('id')
            self.created_test_ids.append(mock_test_id)
            
            self.log_test(f"Created mock_test type test - ID: {mock_test_id}")
            
            # Verify test type
            if mock_test.get('testType') != 'mock_test':
                self.log_test(f"Expected testType 'mock_test', got '{mock_test.get('testType')}'", False)
                return False
                
            # 2. Create practice_questions type
            practice_data = {
                "title": "Test Practice Questions",
                "examId": self.gate_exam_id,
                "testType": "practice_questions"
            }
            
            response = self.make_request('POST', '/admin/mock-tests', practice_data)
            
            if not response or response.status_code != 200:
                self.log_test(f"POST /admin/mock-tests (practice_questions) failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"POST /admin/mock-tests (practice_questions) failed - {data.get('error')}", False)
                return False
                
            practice_test = data.get('data', {})
            practice_test_id = practice_test.get('id')
            self.created_test_ids.append(practice_test_id)
            
            self.log_test(f"Created practice_questions type test - ID: {practice_test_id}")
            
            # Verify test type
            if practice_test.get('testType') != 'practice_questions':
                self.log_test(f"Expected testType 'practice_questions', got '{practice_test.get('testType')}'", False)
                return False
                
            # 3. Create previous_year type
            previous_year_data = {
                "title": "Previous Year 2024",
                "examId": self.gate_exam_id,
                "testType": "previous_year"
            }
            
            response = self.make_request('POST', '/admin/mock-tests', previous_year_data)
            
            if not response or response.status_code != 200:
                self.log_test(f"POST /admin/mock-tests (previous_year) failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"POST /admin/mock-tests (previous_year) failed - {data.get('error')}", False)
                return False
                
            previous_test = data.get('data', {})
            previous_test_id = previous_test.get('id')
            self.created_test_ids.append(previous_test_id)
            
            self.log_test(f"Created previous_year type test - ID: {previous_test_id}")
            
            # Verify test type
            if previous_test.get('testType') != 'previous_year':
                self.log_test(f"Expected testType 'previous_year', got '{previous_test.get('testType')}'", False)
                return False
                
            # 4. GET all mock tests and verify our created tests are listed
            response = self.make_request('GET', '/admin/mock-tests')
            
            if not response or response.status_code != 200:
                self.log_test(f"GET /admin/mock-tests failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"GET /admin/mock-tests failed - {data.get('error')}", False)
                return False
                
            all_tests = data.get('data', [])
            self.log_test(f"GET /admin/mock-tests successful - Found {len(all_tests)} total tests")
            
            # Verify our created tests are in the list
            created_test_titles = []
            for test in all_tests:
                if test.get('id') in self.created_test_ids:
                    created_test_titles.append(f"{test.get('title')} ({test.get('testType')})")
                    
            if len(created_test_titles) != 3:
                self.log_test(f"Expected 3 created tests in list, found {len(created_test_titles)}", False)
                return False
                
            self.log_test(f"Verified all 3 test types in list: {', '.join(created_test_titles)}")
            
            return True
            
        except Exception as e:
            self.log_test(f"Mock test CRUD test failed: {str(e)}", False)
            return False
    
    def test_user_facing_apis(self):
        """Test user-facing APIs"""
        print("\n=== USER-FACING API TESTS ===")
        
        try:
            # Test GET /api/exams/gate - should return exam details with tests grouped properly
            response = self.make_request('GET', '/exams/gate')
            
            if not response or response.status_code != 200:
                self.log_test(f"GET /api/exams/gate failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"GET /api/exams/gate failed - {data.get('error')}", False)
                return False
                
            exam_data = data.get('data', {})
            exam_info = exam_data.get('exam', {})
            mock_tests = exam_data.get('mockTests', [])
            
            if not exam_info:
                self.log_test("No exam information returned", False)
                return False
                
            self.log_test(f"GET /api/exams/gate successful - Exam: {exam_info.get('name', 'Unknown')}")
            self.log_test(f"Mock tests returned: {len(mock_tests)} tests")
            
            # Verify testType field exists in mock tests
            tests_with_type = []
            for test in mock_tests:
                test_type = test.get('testType', 'unknown')
                tests_with_type.append(f"{test.get('title')} ({test_type})")
                
                if 'testType' not in test:
                    self.log_test(f"Test '{test.get('title')}' missing testType field", False)
                    return False
                    
            if tests_with_type:
                self.log_test(f"Verified testType field in tests: {', '.join(tests_with_type[:3])}{'...' if len(tests_with_type) > 3 else ''}")
            
            # Check other required data
            previous_papers = exam_data.get('previousPapers', [])
            topper_notes = exam_data.get('topperNotes', [])
            question_bank_count = exam_data.get('questionBankCount', 0)
            
            self.log_test(f"Additional data - Previous Papers: {len(previous_papers)}, Topper Notes: {len(topper_notes)}, Question Bank: {question_bank_count}")
            
            return True
            
        except Exception as e:
            self.log_test(f"User-facing API test failed: {str(e)}", False)
            return False
    
    def test_leaderboard_system(self):
        """Test the dynamic ranking/leaderboard system APIs"""
        print("\n=== LEADERBOARD SYSTEM TESTS ===")
        
        try:
            # Test 1: GET /api/leaderboard/gate (Public endpoint - no auth needed)
            print("\n--- Test 1: Public Leaderboard for GATE ---")
            response = self.make_request('GET', '/leaderboard/gate')
            
            if not response:
                self.log_test("GET /api/leaderboard/gate failed - No response", False)
                return False
                
            if response.status_code != 200:
                self.log_test(f"GET /api/leaderboard/gate failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"GET /api/leaderboard/gate failed - {data.get('error', 'Unknown error')}", False)
                return False
                
            leaderboard_data = data.get('data', {})
            exam_info = leaderboard_data.get('exam', {})
            leaderboard = leaderboard_data.get('leaderboard', [])
            total_participants = leaderboard_data.get('totalParticipants', 0)
            
            # Validate exam info
            if not exam_info.get('name') or not exam_info.get('slug'):
                self.log_test("Missing exam info in leaderboard response", False)
                return False
                
            self.log_test(f"✅ GET /api/leaderboard/gate successful - Exam: {exam_info.get('name')}")
            self.log_test(f"   Leaderboard entries: {len(leaderboard)}, Total participants: {total_participants}")
            
            # Validate leaderboard structure
            if leaderboard:
                first_entry = leaderboard[0]
                required_fields = ['rank', 'name', 'bestScore', 'totalMarks', 'accuracy', 'attempts']
                
                missing_fields = []
                for field in required_fields:
                    if field not in first_entry:
                        missing_fields.append(field)
                        
                if missing_fields:
                    self.log_test(f"Missing leaderboard fields: {', '.join(missing_fields)}", False)
                    return False
                    
                self.log_test(f"   Top entry: {first_entry.get('name')} - Score: {first_entry.get('bestScore')}, Rank: {first_entry.get('rank')}")
                
                # Verify ranking order (scores should be descending)
                if len(leaderboard) > 1:
                    for i in range(len(leaderboard) - 1):
                        current_score = leaderboard[i].get('bestScore', 0)
                        next_score = leaderboard[i + 1].get('bestScore', 0)
                        
                        if current_score < next_score:
                            self.log_test("Leaderboard ranking order incorrect - scores not in descending order", False)
                            return False
                            
                    self.log_test("   Verified rankings are in correct descending order by score")
            else:
                self.log_test("   No leaderboard entries found (this may be normal for testing)")
                
            # Test 2: GET /api/leaderboard/invalid-exam (Should return 404)
            print("\n--- Test 2: Invalid Exam Leaderboard ---")
            response = self.make_request('GET', '/leaderboard/invalid-exam-xyz')
            
            if not response:
                self.log_test("GET /api/leaderboard/invalid-exam failed - No response", False)
                return False
                
            if response.status_code != 404:
                self.log_test(f"GET /api/leaderboard/invalid-exam should return 404, got {response.status_code}", False)
                return False
                
            data = response.json()
            if data.get('success'):
                self.log_test("Invalid exam should not return success", False)
                return False
                
            self.log_test("✅ GET /api/leaderboard/invalid-exam correctly returned 404 error")
            
            # Test 3: GET /api/my-rank/gate (Auth required - should fail without auth first)
            print("\n--- Test 3a: My Rank without Authentication ---")
            
            # Temporarily clear auth token
            temp_token = self.auth_token
            self.auth_token = None
            
            response = self.make_request('GET', '/my-rank/gate')
            
            if not response:
                self.log_test("GET /api/my-rank/gate failed - No response", False)
                # Restore token
                self.auth_token = temp_token
                return False
                
            if response.status_code != 401:
                self.log_test(f"GET /api/my-rank/gate should return 401 without auth, got {response.status_code}", False)
                # Restore token
                self.auth_token = temp_token
                return False
                
            data = response.json()
            if data.get('success'):
                self.log_test("My rank without auth should not return success", False)
                # Restore token
                self.auth_token = temp_token
                return False
                
            self.log_test("✅ GET /api/my-rank/gate correctly returned 401 without authentication")
            
            # Restore auth token
            self.auth_token = temp_token
            
            # Test 3b: GET /api/my-rank/gate (Auth required - with valid auth)
            print("\n--- Test 3b: My Rank with Authentication ---")
            
            if not self.auth_token:
                self.log_test("No auth token available for my-rank test", False)
                return False
                
            response = self.make_request('GET', '/my-rank/gate')
            
            if not response:
                self.log_test("GET /api/my-rank/gate failed - No response", False)
                return False
                
            if response.status_code != 200:
                self.log_test(f"GET /api/my-rank/gate failed - Status: {response.status_code}", False)
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log_test(f"GET /api/my-rank/gate failed - {data.get('error', 'Unknown error')}", False)
                return False
                
            rank_data = data.get('data', {})
            
            # Check if user has attempts or not
            if 'message' in rank_data and rank_data.get('message') == 'No attempts yet':
                self.log_test("✅ GET /api/my-rank/gate successful - User has no attempts yet")
                self.log_test(f"   Response data: {rank_data}")
                
                # Verify expected fields for no attempts
                expected_fields = ['rank', 'bestScore', 'totalParticipants']
                for field in expected_fields:
                    if field not in rank_data:
                        self.log_test(f"Missing field '{field}' in no-attempts response", False)
                        return False
                        
            else:
                # User has attempts - verify rank data structure
                required_fields = ['rank', 'bestScore', 'totalParticipants', 'percentile']
                
                missing_fields = []
                for field in required_fields:
                    if field not in rank_data:
                        missing_fields.append(field)
                        
                if missing_fields:
                    self.log_test(f"Missing rank data fields: {', '.join(missing_fields)}", False)
                    return False
                    
                rank = rank_data.get('rank')
                best_score = rank_data.get('bestScore')
                total_participants = rank_data.get('totalParticipants')
                percentile = rank_data.get('percentile')
                
                self.log_test(f"✅ GET /api/my-rank/gate successful - Rank: {rank}, Score: {best_score}")
                self.log_test(f"   Total Participants: {total_participants}, Percentile: {percentile}")
                
                # Validate data types and ranges
                if not isinstance(rank, int) or rank < 1:
                    self.log_test(f"Invalid rank value: {rank}", False)
                    return False
                    
                if not isinstance(best_score, (int, float)) or best_score < 0:
                    self.log_test(f"Invalid bestScore value: {best_score}", False)
                    return False
                    
                if not isinstance(total_participants, int) or total_participants < 1:
                    self.log_test(f"Invalid totalParticipants value: {total_participants}", False)
                    return False
                    
                if not isinstance(percentile, (int, float)) or percentile < 0 or percentile > 100:
                    self.log_test(f"Invalid percentile value: {percentile}", False)
                    return False
                    
                self.log_test("   Verified all rank data fields have valid values and types")
            
            # Test 4: Verify rank calculation consistency
            print("\n--- Test 4: Rank Calculation Consistency ---")
            
            # Compare leaderboard data with my-rank data if user has attempts
            if 'message' not in rank_data:
                user_rank = rank_data.get('rank')
                leaderboard_total = leaderboard_data.get('totalParticipants')
                myrank_total = rank_data.get('totalParticipants')
                
                if leaderboard_total != myrank_total:
                    self.log_test(f"Participant count mismatch - Leaderboard: {leaderboard_total}, My-rank: {myrank_total}", False)
                    return False
                    
                self.log_test(f"✅ Participant count consistent between leaderboard ({leaderboard_total}) and my-rank ({myrank_total})")
                
                # Verify percentile calculation makes sense
                expected_percentile = round(((myrank_total - user_rank) / myrank_total) * 100)
                actual_percentile = rank_data.get('percentile')
                
                # Allow small rounding differences
                if abs(expected_percentile - actual_percentile) > 2:
                    self.log_test(f"Percentile calculation issue - Expected ~{expected_percentile}, Got {actual_percentile}", False)
                    return False
                    
                self.log_test(f"✅ Percentile calculation verified - {actual_percentile}% is reasonable for rank {user_rank}/{myrank_total}")
            
            return True
            
        except Exception as e:
            self.log_test(f"Leaderboard system test failed: {str(e)}", False)
            return False

    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        print("\n=== CLEANUP TEST DATA ===")
        
        if not self.auth_token:
            self.log_test("No auth token available for cleanup", False)
            return
            
        try:
            # Delete created mock tests
            for test_id in self.created_test_ids:
                if test_id:
                    response = self.make_request('DELETE', f'/admin/mock-tests/{test_id}')
                    if response and response.status_code == 200:
                        self.log_test(f"Deleted test: {test_id}")
                    else:
                        self.log_test(f"Failed to delete test: {test_id}", False)
            
            # Delete created exam
            if self.created_exam_id:
                response = self.make_request('DELETE', f'/admin/exams/{self.created_exam_id}')
                if response and response.status_code == 200:
                    self.log_test(f"Deleted exam: {self.created_exam_id}")
                else:
                    self.log_test(f"Failed to delete exam: {self.created_exam_id}", False)
                    
        except Exception as e:
            self.log_test(f"Cleanup failed: {str(e)}", False)
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Unishaala Backend API Tests")
        print(f"🌐 Testing against: {API_BASE}")
        
        test_results = {
            'authentication': False,
            'exam_crud': False, 
            'mock_test_crud': False,
            'user_facing_apis': False
        }
        
        # Run test suites in order
        test_results['authentication'] = self.test_authentication()
        
        if test_results['authentication']:
            test_results['exam_crud'] = self.test_exam_crud()
            test_results['mock_test_crud'] = self.test_mock_test_crud_with_types()
            test_results['user_facing_apis'] = self.test_user_facing_apis()
            
            # Cleanup regardless of test results
            self.cleanup_test_data()
        
        # Print final results
        print("\n" + "="*50)
        print("FINAL TEST RESULTS")
        print("="*50)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name.upper().replace('_', ' ')}: {status}")
            
        total_passed = sum(test_results.values())
        total_tests = len(test_results)
        
        print(f"\nOVERALL RESULT: {total_passed}/{total_tests} tests passed")
        
        if total_passed == total_tests:
            print("🎉 All tests passed successfully!")
            return True
        else:
            print("⚠️  Some tests failed. Please check the logs above.")
            return False

if __name__ == "__main__":
    tester = UnishaalaTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)