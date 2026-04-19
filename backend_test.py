#!/usr/bin/env python3
"""
Backend API Testing Script for Unishaala CRUD Endpoints
Tests Jobs, Colleges, Testimonials, and Contact Leads CRUD operations
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://content-hub-admin-5.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class TestRunner:
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
        print("=== AUTHENTICATION TEST ===")
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'auth_token' in response.cookies:
                    self.auth_cookie = response.cookies['auth_token']
                    user_role = data.get('user', {}).get('role', 'Unknown')
                    self.log_test("Admin Authentication", True, f"Login successful, role: {user_role}")
                    return True
                else:
                    self.log_test("Admin Authentication", False, f"Login failed: {data}")
                    return False
            else:
                self.log_test("Admin Authentication", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False
    
    def test_jobs_crud(self):
        """Test Jobs CRUD operations"""
        print("=== JOBS CRUD TESTS ===")
        
        # Test POST /api/admin/jobs
        job_data = {
            "title": "Senior Software Engineer",
            "organization": "Tech Corp India",
            "location": "Bangalore, Karnataka",
            "category": "Software Development",
            "vacancies": 5,
            "salary": "15-25 LPA",
            "qualification": "B.Tech/M.Tech in Computer Science",
            "description": "Looking for experienced software engineers with expertise in full-stack development.",
            "applyLink": "https://techcorp.com/careers/senior-engineer",
            "lastDate": "2024-02-15",
            "status": "Active"
        }
        
        try:
            # CREATE
            response = self.session.post(f"{API_BASE}/admin/jobs", json=job_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    job_id = data['data']['id']
                    vacancies_stored = data['data'].get('vacancies')
                    if isinstance(vacancies_stored, int) and vacancies_stored == 5:
                        self.log_test("POST /api/admin/jobs", True, f"Job created with ID: {job_id}, vacancies stored as integer: {vacancies_stored}")
                    else:
                        self.log_test("POST /api/admin/jobs", False, f"Vacancies not stored as integer: {vacancies_stored}")
                        return
                else:
                    self.log_test("POST /api/admin/jobs", False, f"Unexpected response: {data}")
                    return
            else:
                self.log_test("POST /api/admin/jobs", False, f"HTTP {response.status_code}: {response.text}")
                return
            
            # READ - GET list
            response = self.session.get(f"{API_BASE}/admin/jobs")
            if response.status_code == 200:
                data = response.json()
                jobs = data.get('data', [])
                found_job = any(job.get('id') == job_id for job in jobs)
                self.log_test("GET /api/admin/jobs", found_job, f"Found {len(jobs)} jobs, new job in list: {found_job}")
            else:
                self.log_test("GET /api/admin/jobs", False, f"HTTP {response.status_code}: {response.text}")
            
            # UPDATE
            update_data = {
                "salary": "20-30 LPA",
                "vacancies": 3
            }
            response = self.session.put(f"{API_BASE}/admin/jobs/{job_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    updated_job = data['data']
                    salary_updated = updated_job.get('salary') == "20-30 LPA"
                    vacancies_updated = updated_job.get('vacancies') == 3
                    self.log_test("PUT /api/admin/jobs/:id", salary_updated and vacancies_updated, 
                                f"Updated job returned: salary={updated_job.get('salary')}, vacancies={updated_job.get('vacancies')}")
                else:
                    self.log_test("PUT /api/admin/jobs/:id", False, f"Expected updated object, got: {data}")
            else:
                self.log_test("PUT /api/admin/jobs/:id", False, f"HTTP {response.status_code}: {response.text}")
            
            # DELETE
            response = self.session.delete(f"{API_BASE}/admin/jobs/{job_id}")
            if response.status_code == 200:
                data = response.json()
                self.log_test("DELETE /api/admin/jobs/:id", data.get('success', False), f"Delete response: {data}")
            else:
                self.log_test("DELETE /api/admin/jobs/:id", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Jobs CRUD", False, f"Exception: {str(e)}")
    
    def test_colleges_crud(self):
        """Test Colleges CRUD operations"""
        print("=== COLLEGES CRUD TESTS ===")
        
        # Test POST /api/admin/colleges
        college_data = {
            "name": "Test Engineering College",
            "location": "Mumbai, Maharashtra",
            "ranking": 50,
            "type": "Private",
            "courses": "B.Tech, M.Tech, MBA",
            "acceptedExams": "GATE, JEE, CAT",
            "fees": "2.5 Lakhs per year",
            "rating": 4.2,
            "description": "Premier engineering college with excellent placement record.",
            "website": "https://testcollege.edu.in",
            "image": "https://example.com/college.jpg"
        }
        
        try:
            # CREATE
            response = self.session.post(f"{API_BASE}/admin/colleges", json=college_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    college_id = data['data']['id']
                    courses = data['data'].get('courses', [])
                    accepted_exams = data['data'].get('acceptedExams', [])
                    ranking = data['data'].get('ranking')
                    rating = data['data'].get('rating')
                    
                    courses_array = isinstance(courses, list) and len(courses) == 3
                    exams_array = isinstance(accepted_exams, list) and len(accepted_exams) == 3
                    ranking_int = isinstance(ranking, int) and ranking == 50
                    rating_float = isinstance(rating, float) and rating == 4.2
                    
                    self.log_test("POST /api/admin/colleges", courses_array and exams_array and ranking_int and rating_float,
                                f"College created: courses={courses}, exams={accepted_exams}, ranking={ranking} (int: {ranking_int}), rating={rating} (float: {rating_float})")
                else:
                    self.log_test("POST /api/admin/colleges", False, f"Unexpected response: {data}")
                    return
            else:
                self.log_test("POST /api/admin/colleges", False, f"HTTP {response.status_code}: {response.text}")
                return
            
            # Test missing name (should return 400)
            response = self.session.post(f"{API_BASE}/admin/colleges", json={"location": "Test"})
            if response.status_code == 400:
                self.log_test("POST /api/admin/colleges (missing name)", True, "Correctly returned 400 for missing name")
            else:
                self.log_test("POST /api/admin/colleges (missing name)", False, f"Expected 400, got {response.status_code}")
            
            # UPDATE
            update_data = {"rating": 4.5}
            response = self.session.put(f"{API_BASE}/admin/colleges/{college_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    updated_rating = data['data'].get('rating')
                    self.log_test("PUT /api/admin/colleges/:id", updated_rating == 4.5, f"Updated rating: {updated_rating}")
                else:
                    self.log_test("PUT /api/admin/colleges/:id", False, f"Expected updated object: {data}")
            else:
                self.log_test("PUT /api/admin/colleges/:id", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test PUT on non-existent ID
            response = self.session.put(f"{API_BASE}/admin/colleges/non-existent-id", json={"rating": 3.0})
            if response.status_code == 404:
                self.log_test("PUT /api/admin/colleges/:id (non-existent)", True, "Correctly returned 404 for non-existent college")
            else:
                self.log_test("PUT /api/admin/colleges/:id (non-existent)", False, f"Expected 404, got {response.status_code}")
            
            # DELETE
            response = self.session.delete(f"{API_BASE}/admin/colleges/{college_id}")
            if response.status_code == 200:
                data = response.json()
                self.log_test("DELETE /api/admin/colleges/:id", data.get('success', False), f"Delete response: {data}")
            else:
                self.log_test("DELETE /api/admin/colleges/:id", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Colleges CRUD", False, f"Exception: {str(e)}")
    
    def test_testimonials_crud(self):
        """Test Testimonials CRUD operations"""
        print("=== TESTIMONIALS CRUD TESTS ===")
        
        # Test POST /api/admin/testimonials
        testimonial_data = {
            "name": "Rajesh Kumar",
            "testimonial": "Unishaala helped me crack GATE with AIR 15. The mock tests were excellent!",
            "exam": "GATE",
            "rank": "AIR 15",
            "image": "https://example.com/rajesh.jpg",
            "rating": 5
        }
        
        try:
            # CREATE
            response = self.session.post(f"{API_BASE}/admin/testimonials", json=testimonial_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    testimonial_id = data['data']['id']
                    rating = data['data'].get('rating')
                    self.log_test("POST /api/admin/testimonials", True, f"Testimonial created with ID: {testimonial_id}, rating: {rating}")
                else:
                    self.log_test("POST /api/admin/testimonials", False, f"Unexpected response: {data}")
                    return
            else:
                self.log_test("POST /api/admin/testimonials", False, f"HTTP {response.status_code}: {response.text}")
                return
            
            # Test missing required fields
            response = self.session.post(f"{API_BASE}/admin/testimonials", json={"exam": "GATE"})
            if response.status_code == 400:
                self.log_test("POST /api/admin/testimonials (missing required)", True, "Correctly returned 400 for missing name/testimonial")
            else:
                self.log_test("POST /api/admin/testimonials (missing required)", False, f"Expected 400, got {response.status_code}")
            
            # Test default rating
            response = self.session.post(f"{API_BASE}/admin/testimonials", json={
                "name": "Test User",
                "testimonial": "Great platform!"
            })
            if response.status_code == 200:
                data = response.json()
                default_rating = data.get('data', {}).get('rating')
                self.log_test("POST /api/admin/testimonials (default rating)", default_rating == 5, f"Default rating: {default_rating}")
                # Clean up
                test_id = data.get('data', {}).get('id')
                if test_id:
                    self.session.delete(f"{API_BASE}/admin/testimonials/{test_id}")
            else:
                self.log_test("POST /api/admin/testimonials (default rating)", False, f"HTTP {response.status_code}")
            
            # UPDATE
            update_data = {"rating": 4, "rank": "AIR 10"}
            response = self.session.put(f"{API_BASE}/admin/testimonials/{testimonial_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    updated_testimonial = data['data']
                    rating_updated = updated_testimonial.get('rating') == 4
                    rank_updated = updated_testimonial.get('rank') == "AIR 10"
                    self.log_test("PUT /api/admin/testimonials/:id", rating_updated and rank_updated,
                                f"Updated testimonial: rating={updated_testimonial.get('rating')}, rank={updated_testimonial.get('rank')}")
                else:
                    self.log_test("PUT /api/admin/testimonials/:id", False, f"Expected updated object: {data}")
            else:
                self.log_test("PUT /api/admin/testimonials/:id", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test PUT on non-existent ID
            response = self.session.put(f"{API_BASE}/admin/testimonials/non-existent-id", json={"rating": 3})
            if response.status_code == 404:
                self.log_test("PUT /api/admin/testimonials/:id (non-existent)", True, "Correctly returned 404 for non-existent testimonial")
            else:
                self.log_test("PUT /api/admin/testimonials/:id (non-existent)", False, f"Expected 404, got {response.status_code}")
            
            # DELETE
            response = self.session.delete(f"{API_BASE}/admin/testimonials/{testimonial_id}")
            if response.status_code == 200:
                data = response.json()
                self.log_test("DELETE /api/admin/testimonials/:id", data.get('success', False), f"Delete response: {data}")
            else:
                self.log_test("DELETE /api/admin/testimonials/:id", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Testimonials CRUD", False, f"Exception: {str(e)}")
    
    def test_contact_leads_crud(self):
        """Test Contact Leads CRUD operations"""
        print("=== CONTACT LEADS CRUD TESTS ===")
        
        try:
            # First create a contact lead via public API
            contact_data = {
                "name": "Priya Sharma",
                "email": "priya.sharma@example.com",
                "phone": "+91-9876543210",
                "subject": "Course Inquiry",
                "message": "I am interested in GATE preparation courses. Please provide more details."
            }
            
            # CREATE via public endpoint
            response = self.session.post(f"{API_BASE}/contact", json=contact_data)
            if response.status_code == 200:
                data = response.json()
                self.log_test("POST /api/contact (public)", data.get('success', False), f"Contact form submission: {data}")
            else:
                self.log_test("POST /api/contact (public)", False, f"HTTP {response.status_code}: {response.text}")
                return
            
            # READ - GET all contacts via admin API
            response = self.session.get(f"{API_BASE}/admin/contacts")
            if response.status_code == 200:
                data = response.json()
                contacts = data.get('data', [])
                if contacts:
                    # Find our contact
                    our_contact = None
                    for contact in contacts:
                        if contact.get('email') == contact_data['email']:
                            our_contact = contact
                            break
                    
                    if our_contact:
                        contact_id = our_contact['id']
                        # Check all 5 fields are present
                        required_fields = ['name', 'email', 'phone', 'subject', 'message']
                        all_fields_present = all(field in our_contact for field in required_fields)
                        has_status = 'status' in our_contact
                        has_created_at = 'createdAt' in our_contact
                        
                        self.log_test("GET /api/admin/contacts", all_fields_present and has_status and has_created_at,
                                    f"Found contact with all fields: {list(our_contact.keys())}")
                    else:
                        self.log_test("GET /api/admin/contacts", False, "Could not find our test contact")
                        return
                else:
                    self.log_test("GET /api/admin/contacts", False, "No contacts found")
                    return
            else:
                self.log_test("GET /api/admin/contacts", False, f"HTTP {response.status_code}: {response.text}")
                return
            
            # UPDATE
            update_data = {
                "status": "Contacted",
                "notes": "Spoke on phone, interested in GATE course"
            }
            response = self.session.put(f"{API_BASE}/admin/contacts/{contact_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    updated_contact = data['data']
                    status_updated = updated_contact.get('status') == "Contacted"
                    notes_updated = updated_contact.get('notes') == "Spoke on phone, interested in GATE course"
                    self.log_test("PUT /api/admin/contacts/:id", status_updated and notes_updated,
                                f"Updated contact: status={updated_contact.get('status')}, notes={updated_contact.get('notes')}")
                else:
                    self.log_test("PUT /api/admin/contacts/:id", False, f"Expected updated object: {data}")
            else:
                self.log_test("PUT /api/admin/contacts/:id", False, f"HTTP {response.status_code}: {response.text}")
            
            # DELETE
            response = self.session.delete(f"{API_BASE}/admin/contacts/{contact_id}")
            if response.status_code == 200:
                data = response.json()
                self.log_test("DELETE /api/admin/contacts/:id", data.get('success', False), f"Delete response: {data}")
            else:
                self.log_test("DELETE /api/admin/contacts/:id", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Contact Leads CRUD", False, f"Exception: {str(e)}")
    
    def test_auth_security(self):
        """Test authentication security for admin endpoints"""
        print("=== AUTHENTICATION SECURITY TESTS ===")
        
        # Create a session without auth cookie
        unauth_session = requests.Session()
        
        endpoints_to_test = [
            ("POST", "/admin/jobs", {"title": "Test Job"}),
            ("PUT", "/admin/jobs/test-id", {"title": "Updated"}),
            ("DELETE", "/admin/jobs/test-id", {}),
            ("POST", "/admin/colleges", {"name": "Test College"}),
            ("PUT", "/admin/colleges/test-id", {"name": "Updated"}),
            ("DELETE", "/admin/colleges/test-id", {}),
            ("POST", "/admin/testimonials", {"name": "Test", "testimonial": "Great"}),
            ("PUT", "/admin/testimonials/test-id", {"rating": 4}),
            ("DELETE", "/admin/testimonials/test-id", {}),
            ("PUT", "/admin/contacts/test-id", {"status": "Contacted"}),
            ("DELETE", "/admin/contacts/test-id", {})
        ]
        
        all_protected = True
        for method, endpoint, data in endpoints_to_test:
            try:
                if method == "POST":
                    response = unauth_session.post(f"{API_BASE}{endpoint}", json=data)
                elif method == "PUT":
                    response = unauth_session.put(f"{API_BASE}{endpoint}", json=data)
                elif method == "DELETE":
                    response = unauth_session.delete(f"{API_BASE}{endpoint}")
                
                if response.status_code != 401:
                    all_protected = False
                    self.log_test(f"Auth Security - {method} {endpoint}", False, f"Expected 401, got {response.status_code}")
                    break
                    
            except Exception as e:
                all_protected = False
                self.log_test(f"Auth Security - {method} {endpoint}", False, f"Exception: {str(e)}")
                break
        
        if all_protected:
            self.log_test("Authentication Security", True, f"All {len(endpoints_to_test)} admin endpoints properly protected with 401")
    
    def run_all_tests(self):
        """Run all tests"""
        print("Starting Unishaala CRUD API Tests...")
        print("=" * 50)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Run all CRUD tests
        self.test_jobs_crud()
        self.test_colleges_crud()
        self.test_testimonials_crud()
        self.test_contact_leads_crud()
        self.test_auth_security()
        
        # Summary
        print("=" * 50)
        print("TEST SUMMARY")
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
    runner = TestRunner()
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)