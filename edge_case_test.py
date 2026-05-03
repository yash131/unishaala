#!/usr/bin/env python3
"""
Additional Edge Case Tests for Unishaala CRUD Endpoints
"""

import requests
import json
import sys

# Configuration
BASE_URL = "https://pdf-button-feature.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class EdgeCaseTestRunner:
    def __init__(self):
        self.session = requests.Session()
        self.auth_cookie = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
    
    def authenticate(self):
        """Login and get auth cookie"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'auth_token' in response.cookies:
                    self.auth_cookie = response.cookies['auth_token']
                    return True
            return False
        except Exception as e:
            return False
    
    def test_jobs_edge_cases(self):
        """Test Jobs edge cases"""
        print("=== JOBS EDGE CASE TESTS ===")
        
        try:
            # Test POST with missing title and organization (should still create per requirements)
            job_data = {
                "location": "Remote",
                "category": "Software",
                "vacancies": "invalid_number",  # Test string to int conversion
                "description": "Test job without title/org"
            }
            
            response = self.session.post(f"{API_BASE}/admin/jobs", json=job_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    job_id = data['data']['id']
                    vacancies = data['data'].get('vacancies')
                    status = data['data'].get('status')
                    self.log_test("POST /api/admin/jobs (missing title/org)", True, 
                                f"Job created without title/org, vacancies={vacancies}, status={status}")
                    
                    # Clean up
                    self.session.delete(f"{API_BASE}/admin/jobs/{job_id}")
                else:
                    self.log_test("POST /api/admin/jobs (missing title/org)", False, f"Failed: {data}")
            else:
                self.log_test("POST /api/admin/jobs (missing title/org)", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Jobs Edge Cases", False, f"Exception: {str(e)}")
    
    def test_colleges_edge_cases(self):
        """Test Colleges edge cases"""
        print("=== COLLEGES EDGE CASE TESTS ===")
        
        try:
            # Test with comma-separated strings for courses and acceptedExams
            college_data = {
                "name": "Edge Case College",
                "courses": "Computer Science, Mechanical Engineering, Electrical Engineering",
                "acceptedExams": "JEE Main, JEE Advanced, BITSAT, VITEEE",
                "ranking": "not_a_number",  # Test invalid ranking
                "rating": "4.7"  # Test string to float conversion
            }
            
            response = self.session.post(f"{API_BASE}/admin/colleges", json=college_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    college_id = data['data']['id']
                    courses = data['data'].get('courses', [])
                    exams = data['data'].get('acceptedExams', [])
                    ranking = data['data'].get('ranking')
                    rating = data['data'].get('rating')
                    
                    courses_parsed = len(courses) == 3 and "Computer Science" in courses
                    exams_parsed = len(exams) == 4 and "JEE Main" in exams
                    rating_converted = isinstance(rating, float) and rating == 4.7
                    
                    self.log_test("POST /api/admin/colleges (string parsing)", 
                                courses_parsed and exams_parsed and rating_converted,
                                f"Courses: {courses}, Exams: {exams}, Rating: {rating}, Ranking: {ranking}")
                    
                    # Clean up
                    self.session.delete(f"{API_BASE}/admin/colleges/{college_id}")
                else:
                    self.log_test("POST /api/admin/colleges (string parsing)", False, f"Failed: {data}")
            else:
                self.log_test("POST /api/admin/colleges (string parsing)", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Colleges Edge Cases", False, f"Exception: {str(e)}")
    
    def test_testimonials_edge_cases(self):
        """Test Testimonials edge cases"""
        print("=== TESTIMONIALS EDGE CASE TESTS ===")
        
        try:
            # Test with empty rating (should default to 5)
            testimonial_data = {
                "name": "Test User",
                "testimonial": "Great platform!",
                "rating": ""  # Empty rating
            }
            
            response = self.session.post(f"{API_BASE}/admin/testimonials", json=testimonial_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    testimonial_id = data['data']['id']
                    rating = data['data'].get('rating')
                    
                    self.log_test("POST /api/admin/testimonials (empty rating)", rating == 5,
                                f"Empty rating defaulted to: {rating}")
                    
                    # Clean up
                    self.session.delete(f"{API_BASE}/admin/testimonials/{testimonial_id}")
                else:
                    self.log_test("POST /api/admin/testimonials (empty rating)", False, f"Failed: {data}")
            else:
                self.log_test("POST /api/admin/testimonials (empty rating)", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Testimonials Edge Cases", False, f"Exception: {str(e)}")
    
    def run_edge_case_tests(self):
        """Run all edge case tests"""
        print("Starting Unishaala CRUD Edge Case Tests...")
        print("=" * 50)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Run edge case tests
        self.test_jobs_edge_cases()
        self.test_colleges_edge_cases()
        self.test_testimonials_edge_cases()
        
        # Summary
        print("=" * 50)
        print("EDGE CASE TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    runner = EdgeCaseTestRunner()
    success = runner.run_edge_case_tests()
    sys.exit(0 if success else 1)