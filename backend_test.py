#!/usr/bin/env python3

import requests
import json
import time
import base64
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://content-hub-admin-5.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

# Test data
SAMPLE_BLOG_DATA = {
    "title": "Complete Guide to GATE 2024 Preparation",
    "description": "A comprehensive guide covering all aspects of GATE exam preparation including study plan, important topics, and exam strategy.",
    "content": "<h1>GATE 2024 Preparation Guide</h1><p>The Graduate Aptitude Test in Engineering (GATE) is one of the most competitive exams in India. This comprehensive guide will help you prepare effectively for GATE 2024.</p><h2>Study Plan</h2><p>A well-structured study plan is crucial for GATE success. Here's a recommended approach:</p><ul><li>Start preparation at least 6-8 months before the exam</li><li>Allocate time for each subject based on weightage</li><li>Regular revision and practice tests</li></ul>",
    "image": "https://example.com/gate-preparation.jpg",
    "publishDate": (datetime.now() + timedelta(days=1)).isoformat(),
    "status": "draft"
}

SAMPLE_IMAGE_DATA = {
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "filename": "test-image.png"
}

class BlogAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.created_blog_id = None
        self.created_image_id = None
        
    def login_admin(self):
        """Login as admin and get auth token"""
        print("🔐 Testing Admin Login...")
        try:
            response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.auth_token = data['data']['token']
                    print(f"✅ Admin login successful. Role: {data['data']['user']['role']}")
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
    
    def test_admin_blog_crud(self):
        """Test all admin blog CRUD operations"""
        print("\n📝 Testing Admin Blog CRUD APIs...")
        
        # Test 1: Create Blog (POST /api/admin/blogs)
        print("\n1️⃣ Testing Blog Creation...")
        try:
            response = self.session.post(f"{BASE_URL}/api/admin/blogs", json=SAMPLE_BLOG_DATA)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.created_blog_id = data['data']['id']
                    blog = data['data']
                    print(f"✅ Blog created successfully")
                    print(f"   - ID: {blog['id']}")
                    print(f"   - Title: {blog['title']}")
                    print(f"   - Slug: {blog['slug']}")
                    print(f"   - Status: {blog['status']}")
                    print(f"   - Views: {blog['views']}")
                    
                    # Verify slug auto-generation
                    expected_slug = "complete-guide-to-gate-2024-preparation"
                    if blog['slug'] == expected_slug:
                        print(f"✅ Slug auto-generation working correctly: {blog['slug']}")
                    else:
                        print(f"⚠️ Slug generation issue. Expected: {expected_slug}, Got: {blog['slug']}")
                else:
                    print(f"❌ Blog creation failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Blog creation failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Blog creation error: {str(e)}")
            return False
        
        # Test 2: Get All Blogs (GET /api/admin/blogs)
        print("\n2️⃣ Testing Get All Blogs...")
        try:
            response = self.session.get(f"{BASE_URL}/api/admin/blogs")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    blogs = data['data']
                    print(f"✅ Retrieved {len(blogs)} blogs")
                    
                    # Find our created blog
                    created_blog = next((b for b in blogs if b['id'] == self.created_blog_id), None)
                    if created_blog:
                        print(f"✅ Created blog found in list")
                    else:
                        print(f"❌ Created blog not found in list")
                        return False
                else:
                    print(f"❌ Get blogs failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Get blogs failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Get blogs error: {str(e)}")
            return False
        
        # Test 3: Get Single Blog (GET /api/admin/blogs/:id)
        print("\n3️⃣ Testing Get Single Blog...")
        try:
            response = self.session.get(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    blog = data['data']
                    print(f"✅ Retrieved single blog: {blog['title']}")
                    print(f"   - Content length: {len(blog['content'])} characters")
                else:
                    print(f"❌ Get single blog failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Get single blog failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Get single blog error: {str(e)}")
            return False
        
        # Test 4: Update Blog (PUT /api/admin/blogs/:id)
        print("\n4️⃣ Testing Blog Update...")
        try:
            update_data = {
                "title": "Updated GATE 2024 Preparation Guide",
                "status": "published",
                "publishDate": datetime.now().isoformat()
            }
            
            response = self.session.put(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    blog = data['data']
                    print(f"✅ Blog updated successfully")
                    print(f"   - New title: {blog['title']}")
                    print(f"   - New status: {blog['status']}")
                    
                    # Check if slug was regenerated due to title change
                    expected_new_slug = "updated-gate-2024-preparation-guide"
                    if blog['slug'] == expected_new_slug:
                        print(f"✅ Slug regenerated correctly: {blog['slug']}")
                    else:
                        print(f"⚠️ Slug regeneration issue. Expected: {expected_new_slug}, Got: {blog['slug']}")
                else:
                    print(f"❌ Blog update failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Blog update failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Blog update error: {str(e)}")
            return False
        
        return True
    
    def test_public_blog_api(self):
        """Test public blog APIs"""
        print("\n🌐 Testing Public Blog APIs...")
        
        # Test 1: Get Published Blogs (GET /api/blogs)
        print("\n1️⃣ Testing Get Published Blogs...")
        try:
            # Use a new session without auth cookies for public API
            public_session = requests.Session()
            response = public_session.get(f"{BASE_URL}/api/blogs")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    blogs = data['data']
                    print(f"✅ Retrieved {len(blogs)} published blogs")
                    
                    # Check if our published blog appears
                    published_blog = next((b for b in blogs if b['id'] == self.created_blog_id), None)
                    if published_blog:
                        print(f"✅ Our published blog appears in public list")
                        print(f"   - Title: {published_blog['title']}")
                        print(f"   - Status: {published_blog['status']}")
                        print(f"   - Publish Date: {published_blog['publishDate']}")
                    else:
                        print(f"⚠️ Our published blog not found in public list (may be due to publishDate filter)")
                    
                    # Verify only published blogs are returned
                    draft_blogs = [b for b in blogs if b['status'] != 'published']
                    if len(draft_blogs) == 0:
                        print(f"✅ Only published blogs returned")
                    else:
                        print(f"❌ Found {len(draft_blogs)} non-published blogs in public API")
                        return False
                else:
                    print(f"❌ Get published blogs failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Get published blogs failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Get published blogs error: {str(e)}")
            return False
        
        # Test 2: Get Blog by Slug (GET /api/blogs/:slug)
        print("\n2️⃣ Testing Get Blog by Slug...")
        try:
            # First get the current slug of our blog
            response = self.session.get(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}")
            if response.status_code == 200:
                blog_data = response.json()['data']
                blog_slug = blog_data['slug']
                initial_views = blog_data['views']
                
                # Now test public access by slug
                public_session = requests.Session()
                response = public_session.get(f"{BASE_URL}/api/blogs/{blog_slug}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        blog = data['data']
                        print(f"✅ Retrieved blog by slug: {blog['title']}")
                        print(f"   - Slug: {blog['slug']}")
                        print(f"   - Views: {blog['views']}")
                        
                        # Test views increment
                        time.sleep(1)  # Small delay
                        response2 = public_session.get(f"{BASE_URL}/api/blogs/{blog_slug}")
                        if response2.status_code == 200:
                            blog2 = response2.json()['data']
                            if blog2['views'] > blog['views']:
                                print(f"✅ Views counter incremented: {blog['views']} → {blog2['views']}")
                            else:
                                print(f"❌ Views counter not incremented")
                                return False
                    else:
                        print(f"❌ Get blog by slug failed: {data.get('error')}")
                        return False
                else:
                    print(f"❌ Get blog by slug failed with status {response.status_code}: {response.text}")
                    return False
            else:
                print(f"❌ Could not get blog slug for testing")
                return False
        except Exception as e:
            print(f"❌ Get blog by slug error: {str(e)}")
            return False
        
        # Test 3: Test 404 for non-existent slug
        print("\n3️⃣ Testing 404 for Non-existent Slug...")
        try:
            public_session = requests.Session()
            response = public_session.get(f"{BASE_URL}/api/blogs/non-existent-blog-slug")
            
            if response.status_code == 404:
                data = response.json()
                if not data.get('success'):
                    print(f"✅ Correctly returned 404 for non-existent slug")
                else:
                    print(f"❌ Should return error for non-existent slug")
                    return False
            else:
                print(f"❌ Expected 404, got {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Test 404 error: {str(e)}")
            return False
        
        return True
    
    def test_image_upload_api(self):
        """Test image upload API"""
        print("\n🖼️ Testing Image Upload API...")
        
        # Test 1: Upload Image (POST /api/admin/upload-image)
        print("\n1️⃣ Testing Image Upload...")
        try:
            response = self.session.post(f"{BASE_URL}/api/admin/upload-image", json=SAMPLE_IMAGE_DATA)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.created_image_id = data['data']['id']
                    image_url = data['data']['url']
                    print(f"✅ Image uploaded successfully")
                    print(f"   - ID: {self.created_image_id}")
                    print(f"   - URL: {image_url}")
                    
                    # Verify URL format
                    expected_url = f"/api/images/{self.created_image_id}"
                    if image_url == expected_url:
                        print(f"✅ Image URL format correct")
                    else:
                        print(f"❌ Image URL format incorrect. Expected: {expected_url}, Got: {image_url}")
                        return False
                else:
                    print(f"❌ Image upload failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Image upload failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Image upload error: {str(e)}")
            return False
        
        # Test 2: Test Invalid Data URI
        print("\n2️⃣ Testing Invalid Data URI...")
        try:
            invalid_data = {
                "image": "invalid-data-uri",
                "filename": "test.png"
            }
            
            response = self.session.post(f"{BASE_URL}/api/admin/upload-image", json=invalid_data)
            
            if response.status_code == 400:
                data = response.json()
                if not data.get('success'):
                    print(f"✅ Correctly rejected invalid data URI")
                else:
                    print(f"❌ Should reject invalid data URI")
                    return False
            else:
                print(f"❌ Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Test invalid data URI error: {str(e)}")
            return False
        
        # Test 3: Test Image Retrieval (GET /api/images/:id)
        print("\n3️⃣ Testing Image Retrieval...")
        try:
            if self.created_image_id:
                response = self.session.get(f"{BASE_URL}/api/images/{self.created_image_id}")
                
                if response.status_code == 200:
                    content_type = response.headers.get('Content-Type', '')
                    if content_type.startswith('image/'):
                        print(f"✅ Image retrieved successfully")
                        print(f"   - Content-Type: {content_type}")
                        print(f"   - Content-Length: {len(response.content)} bytes")
                    else:
                        print(f"❌ Invalid Content-Type: {content_type}")
                        return False
                else:
                    print(f"❌ Image retrieval failed with status {response.status_code}")
                    print(f"   This might indicate the GET /api/images/:id endpoint is not implemented")
                    return False
            else:
                print(f"❌ No image ID to test retrieval")
                return False
        except Exception as e:
            print(f"❌ Image retrieval error: {str(e)}")
            return False
        
        return True
    
    def test_auth_requirements(self):
        """Test authentication requirements"""
        print("\n🔒 Testing Authentication Requirements...")
        
        # Test admin endpoints without auth
        print("\n1️⃣ Testing Admin Endpoints Without Auth...")
        try:
            unauth_session = requests.Session()
            
            endpoints_to_test = [
                ("GET", "/api/admin/blogs"),
                ("POST", "/api/admin/blogs"),
                ("GET", f"/api/admin/blogs/{self.created_blog_id or 'test-id'}"),
                ("PUT", f"/api/admin/blogs/{self.created_blog_id or 'test-id'}"),
                ("DELETE", f"/api/admin/blogs/{self.created_blog_id or 'test-id'}"),
                ("POST", "/api/admin/upload-image")
            ]
            
            all_unauthorized = True
            for method, endpoint in endpoints_to_test:
                if method == "GET":
                    response = unauth_session.get(f"{BASE_URL}{endpoint}")
                elif method == "POST":
                    response = unauth_session.post(f"{BASE_URL}{endpoint}", json={})
                elif method == "PUT":
                    response = unauth_session.put(f"{BASE_URL}{endpoint}", json={})
                elif method == "DELETE":
                    response = unauth_session.delete(f"{BASE_URL}{endpoint}")
                
                if response.status_code == 401:
                    print(f"✅ {method} {endpoint} correctly requires auth (401)")
                else:
                    print(f"❌ {method} {endpoint} should require auth, got {response.status_code}")
                    all_unauthorized = False
            
            if all_unauthorized:
                print(f"✅ All admin endpoints correctly require authentication")
            else:
                print(f"❌ Some admin endpoints don't require authentication")
                return False
                
        except Exception as e:
            print(f"❌ Auth test error: {str(e)}")
            return False
        
        return True
    
    def test_regression_check(self):
        """Test existing endpoints to ensure they still work"""
        print("\n🔄 Testing Regression Check...")
        
        # Test 1: Home API
        print("\n1️⃣ Testing Home API...")
        try:
            response = self.session.get(f"{BASE_URL}/api/home")
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'exams' in data['data']:
                    print(f"✅ Home API working")
                else:
                    print(f"❌ Home API response invalid")
                    return False
            else:
                print(f"❌ Home API failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Home API error: {str(e)}")
            return False
        
        # Test 2: Auth API
        print("\n2️⃣ Testing Auth API...")
        try:
            # We already tested login, so just verify the token works
            response = self.session.get(f"{BASE_URL}/api/admin/stats")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print(f"✅ Auth API working (admin stats accessible)")
                else:
                    print(f"❌ Auth API response invalid")
                    return False
            else:
                print(f"❌ Auth API failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Auth API error: {str(e)}")
            return False
        
        return True
    
    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created blog
        if self.created_blog_id:
            try:
                response = self.session.delete(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}")
                if response.status_code == 200:
                    print(f"✅ Test blog deleted")
                else:
                    print(f"⚠️ Could not delete test blog: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting test blog: {str(e)}")
    
    def run_all_tests(self):
        """Run all blog management tests"""
        print("🚀 Starting Blog Management API Tests")
        print("=" * 60)
        
        # Login first
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return False
        
        # Run all test suites
        test_results = []
        
        test_results.append(("Admin Blog CRUD", self.test_admin_blog_crud()))
        test_results.append(("Public Blog API", self.test_public_blog_api()))
        test_results.append(("Image Upload API", self.test_image_upload_api()))
        test_results.append(("Authentication Requirements", self.test_auth_requirements()))
        test_results.append(("Regression Check", self.test_regression_check()))
        
        # Cleanup
        self.cleanup()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:<30} {status}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\nTotal: {passed + failed} | Passed: {passed} | Failed: {failed}")
        
        if failed == 0:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"💥 {failed} test(s) failed!")
            return False

if __name__ == "__main__":
    tester = BlogAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)