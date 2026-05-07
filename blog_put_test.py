#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://dark-mode-theme-2.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class BlogPutTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.created_blog_id = None
        
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
    
    def create_test_blog(self):
        """Create a test blog for PUT testing"""
        print("\n📝 Creating test blog for PUT testing...")
        try:
            blog_data = {
                "title": "Original Test Blog Title",
                "description": "Original description for testing PUT operations",
                "content": "<h1>Original Content</h1><p>This is the original content for testing.</p>",
                "image": "https://example.com/original-image.jpg",
                "publishDate": datetime.now().isoformat(),
                "status": "draft"
            }
            
            response = self.session.post(f"{BASE_URL}/api/admin/blogs", json=blog_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.created_blog_id = data['data']['id']
                    blog = data['data']
                    print(f"✅ Test blog created successfully")
                    print(f"   - ID: {blog['id']}")
                    print(f"   - Title: {blog['title']}")
                    print(f"   - Slug: {blog['slug']}")
                    print(f"   - Status: {blog['status']}")
                    return True
                else:
                    print(f"❌ Blog creation failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Blog creation failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Blog creation error: {str(e)}")
            return False
    
    def test_put_partial_update(self):
        """Test PUT with partial update (e.g., {status: 'published'})"""
        print("\n1️⃣ Testing PUT - Partial Update (status only)...")
        try:
            update_data = {"status": "published"}
            
            response = self.session.put(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    blog = data['data']
                    print(f"✅ Partial update successful")
                    print(f"   - Status updated to: {blog['status']}")
                    print(f"   - Title unchanged: {blog['title']}")
                    print(f"   - Slug unchanged: {blog['slug']}")
                    
                    # Verify only status was updated
                    if blog['status'] == 'published' and blog['title'] == 'Original Test Blog Title':
                        print(f"✅ Partial update working correctly")
                        return True
                    else:
                        print(f"❌ Partial update issue - unexpected changes")
                        return False
                else:
                    print(f"❌ Partial update failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Partial update failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Partial update error: {str(e)}")
            return False
    
    def test_put_title_change_slug_regeneration(self):
        """Test PUT with title change should regenerate slug"""
        print("\n2️⃣ Testing PUT - Title Change with Slug Regeneration...")
        try:
            update_data = {
                "title": "Updated Blog Title for Slug Test",
                "description": "Updated description"
            }
            
            response = self.session.put(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    blog = data['data']
                    print(f"✅ Title update successful")
                    print(f"   - New title: {blog['title']}")
                    print(f"   - New slug: {blog['slug']}")
                    print(f"   - Updated description: {blog['description']}")
                    
                    # Verify slug was regenerated
                    expected_slug = "updated-blog-title-for-slug-test"
                    if blog['slug'] == expected_slug:
                        print(f"✅ Slug regenerated correctly: {blog['slug']}")
                        return True
                    else:
                        print(f"⚠️ Slug regeneration issue. Expected: {expected_slug}, Got: {blog['slug']}")
                        return False
                else:
                    print(f"❌ Title update failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ Title update failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Title update error: {str(e)}")
            return False
    
    def test_put_title_collision_unique_slug(self):
        """Test PUT with title change that would collide with existing slug"""
        print("\n3️⃣ Testing PUT - Title Collision with Unique Slug Generation...")
        try:
            # First create another blog with a specific title/slug
            collision_blog_data = {
                "title": "Collision Test Blog",
                "description": "Blog to test slug collision",
                "content": "<p>Collision test content</p>",
                "status": "draft"
            }
            
            collision_response = self.session.post(f"{BASE_URL}/api/admin/blogs", json=collision_blog_data)
            collision_blog_id = None
            
            if collision_response.status_code == 200:
                collision_data = collision_response.json()
                if collision_data.get('success'):
                    collision_blog_id = collision_data['data']['id']
                    collision_slug = collision_data['data']['slug']
                    print(f"✅ Created collision test blog with slug: {collision_slug}")
                    
                    # Now try to update our main blog to have the same title
                    update_data = {
                        "title": "Collision Test Blog"  # Same title as collision blog
                    }
                    
                    response = self.session.put(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}", json=update_data)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success'):
                            blog = data['data']
                            print(f"✅ Title collision update successful")
                            print(f"   - New title: {blog['title']}")
                            print(f"   - New slug: {blog['slug']}")
                            
                            # Verify slug is unique (should have timestamp suffix)
                            if blog['slug'] != collision_slug and blog['slug'].startswith('collision-test-blog-'):
                                print(f"✅ Unique slug generated to avoid collision: {blog['slug']}")
                                
                                # Cleanup collision blog
                                if collision_blog_id:
                                    self.session.delete(f"{BASE_URL}/api/admin/blogs/{collision_blog_id}")
                                    print(f"✅ Cleaned up collision test blog")
                                
                                return True
                            else:
                                print(f"❌ Slug collision not handled properly. Got: {blog['slug']}")
                                return False
                        else:
                            print(f"❌ Title collision update failed: {data.get('error')}")
                            return False
                    else:
                        print(f"❌ Title collision update failed with status {response.status_code}: {response.text}")
                        return False
                else:
                    print(f"❌ Could not create collision test blog: {collision_data.get('error')}")
                    return False
            else:
                print(f"❌ Could not create collision test blog with status {collision_response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Title collision test error: {str(e)}")
            return False
    
    def test_put_nonexistent_blog(self):
        """Test PUT on non-existent blog ID returns 404"""
        print("\n4️⃣ Testing PUT - Non-existent Blog ID (404)...")
        try:
            fake_id = "non-existent-blog-id-12345"
            update_data = {"title": "Should not work"}
            
            response = self.session.put(f"{BASE_URL}/api/admin/blogs/{fake_id}", json=update_data)
            
            if response.status_code == 404:
                data = response.json()
                if not data.get('success'):
                    print(f"✅ Correctly returned 404 for non-existent blog")
                    print(f"   - Error message: {data.get('error')}")
                    return True
                else:
                    print(f"❌ Should return error for non-existent blog")
                    return False
            else:
                print(f"❌ Expected 404, got {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Non-existent blog test error: {str(e)}")
            return False
    
    def test_put_without_auth(self):
        """Test PUT without auth returns 401"""
        print("\n5️⃣ Testing PUT - Without Authentication (401)...")
        try:
            # Create session without auth cookies
            unauth_session = requests.Session()
            update_data = {"title": "Should not work without auth"}
            
            response = unauth_session.put(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}", json=update_data)
            
            if response.status_code == 401:
                data = response.json()
                if not data.get('success'):
                    print(f"✅ Correctly returned 401 for unauthorized request")
                    print(f"   - Error message: {data.get('error')}")
                    return True
                else:
                    print(f"❌ Should return error for unauthorized request")
                    return False
            else:
                print(f"❌ Expected 401, got {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Unauthorized test error: {str(e)}")
            return False
    
    def test_sanity_regression_check(self):
        """Quick sanity check of other endpoints to ensure no regression"""
        print("\n🔄 Testing Sanity Regression Check...")
        
        # Test POST /api/admin/blogs (create)
        print("\n   📝 Testing POST /api/admin/blogs (create)...")
        try:
            blog_data = {
                "title": "Regression Test Blog",
                "description": "Testing create still works",
                "content": "<p>Regression test content</p>",
                "status": "draft"
            }
            
            response = self.session.post(f"{BASE_URL}/api/admin/blogs", json=blog_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    regression_blog_id = data['data']['id']
                    print(f"✅ POST /api/admin/blogs still working")
                    
                    # Test GET /api/admin/blogs
                    print("\n   📋 Testing GET /api/admin/blogs...")
                    response = self.session.get(f"{BASE_URL}/api/admin/blogs")
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and len(data['data']) > 0:
                            print(f"✅ GET /api/admin/blogs still working - found {len(data['data'])} blogs")
                        else:
                            print(f"❌ GET /api/admin/blogs response invalid")
                            return False
                    else:
                        print(f"❌ GET /api/admin/blogs failed with status {response.status_code}")
                        return False
                    
                    # Test DELETE /api/admin/blogs/:id
                    print("\n   🗑️ Testing DELETE /api/admin/blogs/:id...")
                    response = self.session.delete(f"{BASE_URL}/api/admin/blogs/{regression_blog_id}")
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success'):
                            print(f"✅ DELETE /api/admin/blogs/:id still working")
                        else:
                            print(f"❌ DELETE response invalid")
                            return False
                    else:
                        print(f"❌ DELETE failed with status {response.status_code}")
                        return False
                    
                    # Test POST /api/admin/upload-image
                    print("\n   🖼️ Testing POST /api/admin/upload-image...")
                    image_data = {
                        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                        "filename": "test-regression.png"
                    }
                    response = self.session.post(f"{BASE_URL}/api/admin/upload-image", json=image_data)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and 'url' in data['data']:
                            print(f"✅ POST /api/admin/upload-image still working")
                        else:
                            print(f"❌ Upload image response invalid")
                            return False
                    else:
                        print(f"❌ Upload image failed with status {response.status_code}")
                        return False
                    
                    # Test GET /api/blogs (public)
                    print("\n   🌐 Testing GET /api/blogs (public)...")
                    public_session = requests.Session()
                    response = public_session.get(f"{BASE_URL}/api/blogs")
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success'):
                            print(f"✅ GET /api/blogs (public) still working - found {len(data['data'])} published blogs")
                        else:
                            print(f"❌ Public blogs response invalid")
                            return False
                    else:
                        print(f"❌ Public blogs failed with status {response.status_code}")
                        return False
                    
                    # Test GET /api/blogs/:slug (public) with view increment
                    print("\n   👁️ Testing GET /api/blogs/:slug (public) with view increment...")
                    # First get a published blog slug
                    response = self.session.get(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}")
                    if response.status_code == 200:
                        blog_data = response.json()['data']
                        if blog_data['status'] == 'published':
                            blog_slug = blog_data['slug']
                            initial_views = blog_data['views']
                            
                            # Access via public API
                            response = public_session.get(f"{BASE_URL}/api/blogs/{blog_slug}")
                            if response.status_code == 200:
                                data = response.json()
                                if data.get('success'):
                                    # The public API returns the blog data before incrementing views
                                    # So we need to check the database after the API call
                                    time.sleep(0.5)  # Small delay to ensure update is processed
                                    
                                    # Check actual view count via admin API after public access
                                    response = self.session.get(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}")
                                    if response.status_code == 200:
                                        updated_blog_data = response.json()['data']
                                        final_views = updated_blog_data['views']
                                        
                                        if final_views > initial_views:
                                            print(f"✅ GET /api/blogs/:slug still working with view increment: {initial_views} → {final_views}")
                                        else:
                                            print(f"❌ View increment not working: {initial_views} → {final_views}")
                                            return False
                                    else:
                                        print(f"❌ Could not verify view increment")
                                        return False
                                else:
                                    print(f"❌ Public blog by slug response invalid")
                                    return False
                            else:
                                print(f"❌ Public blog by slug failed with status {response.status_code}")
                                return False
                        else:
                            print(f"⚠️ Test blog not published, skipping public slug test")
                    
                    return True
                else:
                    print(f"❌ POST /api/admin/blogs failed: {data.get('error')}")
                    return False
            else:
                print(f"❌ POST /api/admin/blogs failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Regression test error: {str(e)}")
            return False
    
    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        if self.created_blog_id:
            try:
                response = self.session.delete(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}")
                if response.status_code == 200:
                    print(f"✅ Test blog deleted")
                else:
                    print(f"⚠️ Could not delete test blog: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Error deleting test blog: {str(e)}")
    
    def run_put_tests(self):
        """Run all PUT-focused tests"""
        print("🚀 Starting Blog PUT Handler Tests")
        print("=" * 60)
        
        # Login first
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return False
        
        # Create test blog
        if not self.create_test_blog():
            print("❌ Cannot proceed without test blog")
            return False
        
        # Run PUT-specific tests
        test_results = []
        
        test_results.append(("PUT Partial Update", self.test_put_partial_update()))
        test_results.append(("PUT Title Change Slug Regeneration", self.test_put_title_change_slug_regeneration()))
        test_results.append(("PUT Title Collision Unique Slug", self.test_put_title_collision_unique_slug()))
        test_results.append(("PUT Non-existent Blog 404", self.test_put_nonexistent_blog()))
        test_results.append(("PUT Without Auth 401", self.test_put_without_auth()))
        test_results.append(("Sanity Regression Check", self.test_sanity_regression_check()))
        
        # Cleanup
        self.cleanup()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 PUT HANDLER TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:<35} {status}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\nTotal: {passed + failed} | Passed: {passed} | Failed: {failed}")
        
        if failed == 0:
            print("🎉 All PUT handler tests passed!")
            return True
        else:
            print(f"💥 {failed} test(s) failed!")
            return False

if __name__ == "__main__":
    tester = BlogPutTester()
    success = tester.run_put_tests()
    exit(0 if success else 1)