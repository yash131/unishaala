#!/usr/bin/env python3
"""
Comprehensive backend API tests for Unishaala platform
Tests all backend APIs as specified in test_result.md
"""

import requests
import json
import os
import sys
from typing import Dict, Any, Optional

class UnishaalaAPITester:
    def __init__(self):
        # Get base URL from environment
        self.base_url = "https://unishaala-web.preview.emergentagent.com"
        self.api_base = f"{self.base_url}/api"
        
        # Admin credentials for testing
        self.admin_email = "admin@unishaala.com"
        self.admin_password = "admin123"
        
        # Test results tracking
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'tests': []
        }
        
        # Auth token storage
        self.auth_token = None
        self.auth_cookies = None

    def log_test(self, test_name: str, passed: bool, message: str, details: str = ""):
        """Log test result"""
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results['tests'].append({
            'name': test_name,
            'passed': passed,
            'message': message,
            'details': details
        })
        
        if passed:
            self.test_results['passed'] += 1
        else:
            self.test_results['failed'] += 1

    def test_home_api(self):
        """Test GET /api/home - Home page data"""
        try:
            response = requests.get(f"{self.api_base}/home", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    home_data = data['data']
                    required_keys = ['exams', 'notifications', 'testimonials', 'jobs', 'colleges']
                    missing_keys = [key for key in required_keys if key not in home_data]
                    
                    if not missing_keys:
                        self.log_test("Home API", True, "Returns all required sections", 
                                    f"Found {len(home_data)} sections")
                    else:
                        self.log_test("Home API", False, "Missing required sections", 
                                    f"Missing: {missing_keys}")
                else:
                    self.log_test("Home API", False, "Invalid response structure", 
                                f"Response: {data}")
            else:
                self.log_test("Home API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                
        except requests.RequestException as e:
            self.log_test("Home API", False, "Request failed", str(e))

    def test_exams_api(self):
        """Test GET /api/exams - List all exams"""
        try:
            response = requests.get(f"{self.api_base}/exams", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and isinstance(data.get('data'), list):
                    exams = data['data']
                    self.log_test("Exams List API", True, f"Returns {len(exams)} exams", 
                                f"First exam: {exams[0].get('name', 'N/A') if exams else 'No exams'}")
                    return exams
                else:
                    self.log_test("Exams List API", False, "Invalid response structure", 
                                f"Response: {data}")
                    return []
            else:
                self.log_test("Exams List API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                return []
                
        except requests.RequestException as e:
            self.log_test("Exams List API", False, "Request failed", str(e))
            return []

    def test_exam_detail_api(self, exams: list):
        """Test GET /api/exams/[slug] - Get exam by slug"""
        if not exams:
            self.log_test("Exam Detail API", False, "No exams available for testing", "")
            return
            
        try:
            # Test with first exam slug
            exam_slug = exams[0].get('slug', 'gate')  # Default to 'gate' if no slug
            response = requests.get(f"{self.api_base}/exams/{exam_slug}", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    exam_data = data['data']
                    required_keys = ['exam', 'mockTests', 'previousPapers', 'topperNotes']
                    missing_keys = [key for key in required_keys if key not in exam_data]
                    
                    if not missing_keys:
                        self.log_test("Exam Detail API", True, f"Returns complete exam data for {exam_slug}", 
                                    f"Mock tests: {len(exam_data.get('mockTests', []))}")
                    else:
                        self.log_test("Exam Detail API", False, "Missing required sections", 
                                    f"Missing: {missing_keys}")
                else:
                    self.log_test("Exam Detail API", False, "Invalid response structure", 
                                f"Response: {data}")
            else:
                self.log_test("Exam Detail API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                
        except requests.RequestException as e:
            self.log_test("Exam Detail API", False, "Request failed", str(e))

    def test_authentication_api(self):
        """Test POST /api/auth/login - Login with credentials"""
        try:
            login_data = {
                "email": self.admin_email,
                "password": self.admin_password
            }
            
            response = requests.post(f"{self.api_base}/auth/login", 
                                   json=login_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data and 'token' in data['data']:
                    self.auth_token = data['data']['token']
                    self.auth_cookies = response.cookies
                    user_data = data['data'].get('user', {})
                    self.log_test("Authentication API", True, "Login successful", 
                                f"User: {user_data.get('email')} ({user_data.get('role')})")
                    return True
                else:
                    self.log_test("Authentication API", False, "Invalid login response", 
                                f"Response: {data}")
                    return False
            else:
                self.log_test("Authentication API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                return False
                
        except requests.RequestException as e:
            self.log_test("Authentication API", False, "Request failed", str(e))
            return False

    def test_jobs_api(self):
        """Test GET /api/jobs - List all jobs"""
        try:
            response = requests.get(f"{self.api_base}/jobs", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and isinstance(data.get('data'), list):
                    jobs = data['data']
                    self.log_test("Jobs API", True, f"Returns {len(jobs)} jobs", 
                                f"First job: {jobs[0].get('title', 'N/A') if jobs else 'No jobs'}")
                else:
                    self.log_test("Jobs API", False, "Invalid response structure", 
                                f"Response: {data}")
            else:
                self.log_test("Jobs API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                
        except requests.RequestException as e:
            self.log_test("Jobs API", False, "Request failed", str(e))

    def test_rank_predictor_api(self):
        """Test POST /api/rank-predictor - Rank prediction"""
        try:
            predictor_data = {
                "examSlug": "jee-main",
                "score": 180,
                "totalMarks": 200
            }
            
            response = requests.post(f"{self.api_base}/rank-predictor", 
                                   json=predictor_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    result = data['data']
                    required_keys = ['percentage', 'rankRange', 'recommendations']
                    missing_keys = [key for key in required_keys if key not in result]
                    
                    if not missing_keys:
                        self.log_test("Rank Predictor API", True, "Returns complete prediction", 
                                    f"Percentage: {result['percentage']}%, Rank: {result['rankRange']}")
                    else:
                        self.log_test("Rank Predictor API", False, "Missing required fields", 
                                    f"Missing: {missing_keys}")
                else:
                    self.log_test("Rank Predictor API", False, "Invalid response structure", 
                                f"Response: {data}")
            else:
                self.log_test("Rank Predictor API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                
        except requests.RequestException as e:
            self.log_test("Rank Predictor API", False, "Request failed", str(e))

    def test_contact_api(self):
        """Test POST /api/contact - Contact form submission"""
        try:
            contact_data = {
                "name": "Test User",
                "email": "testuser@example.com",
                "phone": "+91-9876543210",
                "subject": "Testing Contact Form",
                "message": "This is a test message from automated testing system."
            }
            
            response = requests.post(f"{self.api_base}/contact", 
                                   json=contact_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("Contact Form API", True, "Contact form submission successful", 
                                f"Message: {data.get('message')}")
                else:
                    self.log_test("Contact Form API", False, "Contact form failed", 
                                f"Response: {data}")
            else:
                self.log_test("Contact Form API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                
        except requests.RequestException as e:
            self.log_test("Contact Form API", False, "Request failed", str(e))

    def test_admin_stats_api(self):
        """Test GET /api/admin/stats - Admin dashboard stats (requires auth)"""
        if not self.auth_token:
            self.log_test("Admin Stats API", False, "No authentication token available", "")
            return
            
        try:
            headers = {
                'Authorization': f'Bearer {self.auth_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(f"{self.api_base}/admin/stats", 
                                  headers=headers, 
                                  cookies=self.auth_cookies,
                                  timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    stats = data['data']
                    expected_stats = ['totalUsers', 'totalExams', 'totalMockTests', 
                                    'totalQuestions', 'totalJobs']
                    missing_stats = [stat for stat in expected_stats if stat not in stats]
                    
                    if not missing_stats:
                        self.log_test("Admin Stats API", True, "Returns complete dashboard stats", 
                                    f"Users: {stats['totalUsers']}, Exams: {stats['totalExams']}")
                    else:
                        self.log_test("Admin Stats API", False, "Missing required stats", 
                                    f"Missing: {missing_stats}")
                else:
                    self.log_test("Admin Stats API", False, "Invalid response structure", 
                                f"Response: {data}")
            elif response.status_code == 401:
                self.log_test("Admin Stats API", False, "Authentication failed", 
                            "Auth token might be invalid or expired")
            else:
                self.log_test("Admin Stats API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                
        except requests.RequestException as e:
            self.log_test("Admin Stats API", False, "Request failed", str(e))

    def test_admin_crud_apis(self):
        """Test Admin CRUD APIs (requires auth)"""
        if not self.auth_token:
            self.log_test("Admin CRUD APIs", False, "No authentication token available", "")
            return
            
        try:
            headers = {
                'Authorization': f'Bearer {self.auth_token}',
                'Content-Type': 'application/json'
            }
            
            # Test GET endpoints
            admin_endpoints = [
                '/admin/users',
                '/admin/exams', 
                '/admin/mock-tests',
                '/admin/questions',
                '/admin/jobs',
                '/admin/colleges',
                '/admin/testimonials',
                '/admin/contacts'
            ]
            
            passed_endpoints = []
            failed_endpoints = []
            
            for endpoint in admin_endpoints:
                try:
                    response = requests.get(f"{self.api_base}{endpoint}", 
                                          headers=headers, 
                                          cookies=self.auth_cookies,
                                          timeout=30)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and isinstance(data.get('data'), list):
                            passed_endpoints.append(f"{endpoint} ({len(data['data'])} items)")
                        else:
                            failed_endpoints.append(f"{endpoint} (invalid structure)")
                    else:
                        failed_endpoints.append(f"{endpoint} (HTTP {response.status_code})")
                        
                except requests.RequestException as e:
                    failed_endpoints.append(f"{endpoint} (Request failed: {str(e)[:50]})")
            
            if not failed_endpoints:
                self.log_test("Admin CRUD APIs", True, f"All {len(passed_endpoints)} admin endpoints working", 
                            f"Working: {', '.join(passed_endpoints[:3])}...")
            else:
                self.log_test("Admin CRUD APIs", False, f"{len(failed_endpoints)} admin endpoints failed", 
                            f"Failed: {', '.join(failed_endpoints)}")
                
        except Exception as e:
            self.log_test("Admin CRUD APIs", False, "Test setup failed", str(e))

    def test_mock_tests_api(self):
        """Test Mock Tests API endpoints"""
        try:
            # First get available mock tests
            response = requests.get(f"{self.api_base}/admin/mock-tests", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and isinstance(data.get('data'), list):
                    mock_tests = data['data']
                    
                    if mock_tests:
                        # Test individual mock test endpoint
                        test_id = mock_tests[0].get('id')
                        if test_id:
                            test_response = requests.get(f"{self.api_base}/mock-test/{test_id}", 
                                                       timeout=30)
                            
                            if test_response.status_code == 200:
                                test_data = test_response.json()
                                if test_data.get('success') and 'data' in test_data:
                                    self.log_test("Mock Tests API", True, 
                                                f"Mock test endpoint working", 
                                                f"Retrieved test: {test_data['data'].get('title', 'N/A')}")
                                else:
                                    self.log_test("Mock Tests API", False, 
                                                "Invalid mock test response structure", 
                                                f"Response: {test_data}")
                            else:
                                self.log_test("Mock Tests API", False, 
                                            f"Mock test endpoint HTTP {test_response.status_code}", 
                                            f"Response: {test_response.text[:200]}")
                        else:
                            self.log_test("Mock Tests API", False, "No test ID found in mock tests", "")
                    else:
                        self.log_test("Mock Tests API", True, "Mock tests endpoint returns empty array", 
                                    "No mock tests available but API is working")
                else:
                    self.log_test("Mock Tests API", False, "Invalid response structure", 
                                f"Response: {data}")
            else:
                self.log_test("Mock Tests API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                
        except requests.RequestException as e:
            self.log_test("Mock Tests API", False, "Request failed", str(e))

    def test_csv_bulk_upload_api(self):
        """Test CSV Bulk Upload API (requires auth)"""
        if not self.auth_token:
            self.log_test("CSV Bulk Upload API", False, "No authentication token available", "")
            return
            
        try:
            headers = {
                'Authorization': f'Bearer {self.auth_token}',
                'Content-Type': 'application/json'
            }
            
            # Test bulk questions upload
            sample_questions = [
                {
                    "questionText": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correctOption": 1,
                    "marks": 2,
                    "negativeMarks": 0.5,
                    "solution": "Basic addition",
                    "topic": "Mathematics",
                    "difficulty": "Easy"
                }
            ]
            
            bulk_data = {
                "questions": sample_questions,
                "mockTestId": "test-mock-id"
            }
            
            response = requests.post(f"{self.api_base}/admin/questions/bulk",
                                   json=bulk_data,
                                   headers=headers,
                                   cookies=self.auth_cookies,
                                   timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    result = data['data']
                    expected_keys = ['total', 'success', 'failed']
                    missing_keys = [key for key in expected_keys if key not in result]
                    
                    if not missing_keys:
                        self.log_test("CSV Bulk Upload API", True, "Bulk upload endpoint working", 
                                    f"Processed: {result['total']}, Success: {result['success']}")
                    else:
                        self.log_test("CSV Bulk Upload API", False, "Missing required fields", 
                                    f"Missing: {missing_keys}")
                else:
                    self.log_test("CSV Bulk Upload API", False, "Invalid response structure", 
                                f"Response: {data}")
            elif response.status_code == 401:
                self.log_test("CSV Bulk Upload API", False, "Authentication failed", 
                            "Auth token might be invalid")
            else:
                self.log_test("CSV Bulk Upload API", False, f"HTTP {response.status_code}", 
                            f"Response: {response.text[:200]}")
                
        except requests.RequestException as e:
            self.log_test("CSV Bulk Upload API", False, "Request failed", str(e))

    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 80)
        print("STARTING UNISHAALA BACKEND API TESTS")
        print("=" * 80)
        print(f"Base URL: {self.base_url}")
        print(f"API Base: {self.api_base}")
        print()
        
        # Test public APIs first
        print("🔍 Testing Public APIs...")
        self.test_home_api()
        exams = self.test_exams_api()
        self.test_exam_detail_api(exams)
        self.test_jobs_api()
        self.test_rank_predictor_api()
        self.test_contact_api()
        
        print()
        print("🔐 Testing Authentication...")
        auth_success = self.test_authentication_api()
        
        if auth_success:
            print()
            print("🔒 Testing Admin APIs...")
            self.test_admin_stats_api()
            self.test_admin_crud_apis()
            self.test_csv_bulk_upload_api()
        else:
            print("⚠️  Skipping admin API tests due to authentication failure")
        
        print()
        print("🧪 Testing Mock Test APIs...")
        self.test_mock_tests_api()
        
        # Print final summary
        print()
        print("=" * 80)
        print("BACKEND API TEST RESULTS SUMMARY")
        print("=" * 80)
        print(f"✅ PASSED: {self.test_results['passed']}")
        print(f"❌ FAILED: {self.test_results['failed']}")
        print(f"📊 TOTAL:  {self.test_results['passed'] + self.test_results['failed']}")
        
        if self.test_results['failed'] > 0:
            print()
            print("❌ FAILED TESTS:")
            for test in self.test_results['tests']:
                if not test['passed']:
                    print(f"   - {test['name']}: {test['message']}")
                    if test['details']:
                        print(f"     Details: {test['details']}")
        
        print("=" * 80)
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = UnishaalaAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)