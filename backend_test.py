#!/usr/bin/env python3
"""
Backend Test Suite for Blog PDF Management
Tests the NEW Blog PDF Management backend endpoints only as specified in review request.
"""

import requests
import json
import sys
import os
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Get base URL from environment
BASE_URL = "https://admin-suite-46.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class BlogPDFManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_blog_id = None
        self.pdf_file_id = None
        self.pdf_preview_file_id = None
        
    def generate_test_pdf(self, pages=3):
        """Generate a test PDF with specified number of pages using reportlab"""
        try:
            buffer = io.BytesIO()
            p = canvas.Canvas(buffer, pagesize=letter)
            
            for page_num in range(1, pages + 1):
                p.drawString(100, 750, f"Test PDF - Page {page_num}")
                p.drawString(100, 700, f"This is page {page_num} of {pages}")
                p.drawString(100, 650, "Generated for Blog PDF Management Testing")
                if page_num < pages:
                    p.showPage()
            
            p.save()
            buffer.seek(0)
            return buffer.getvalue()
        except Exception as e:
            print(f"❌ Error generating test PDF: {str(e)}")
            return None
    
    def login_admin(self):
        """Login as admin with the specified credentials"""
        try:
            print("🔐 Testing admin login...")
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": "admin@unishaala.com",
                "password": "Shivani@1234"
            })
            
            if response.status_code == 200:
                data = response.json()
                user_data = data.get('data', {}).get('user', {}) or data.get('user', {})
                if user_data.get('role') == 'SUPER_ADMIN':
                    print("✅ Admin login successful - SUPER_ADMIN role confirmed")
                    # Auth token should be in cookies
                    self.auth_token = self.session.cookies.get('auth_token')
                    if self.auth_token:
                        print(f"✅ Auth token received: {self.auth_token[:20]}...")
                    return True
                else:
                    print(f"❌ Admin login failed - wrong role: {user_data.get('role')}")
                    return False
            else:
                print(f"❌ Admin login failed - status: {response.status_code}, response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return False
    
    def test_auth_me_endpoint(self):
        """Test GET /api/auth/me endpoint"""
        try:
            print("👤 Testing GET /api/auth/me...")
            
            # Test anonymous access (should return 401)
            anon_session = requests.Session()
            response = anon_session.get(f"{API_BASE}/auth/me")
            if response.status_code == 401:
                print("✅ Anonymous access correctly returns 401")
            else:
                print(f"❌ Anonymous access should return 401, got {response.status_code}")
                return False
            
            # Test authenticated access
            response = self.session.get(f"{API_BASE}/auth/me")
            if response.status_code == 200:
                data = response.json()
                user_data = data.get('data', {})
                if user_data.get('role') == 'SUPER_ADMIN' and user_data.get('phoneVerified') == True:
                    print("✅ Authenticated access returns correct user data")
                    print(f"   - Role: {user_data.get('role')}")
                    print(f"   - Phone Verified: {user_data.get('phoneVerified')}")
                    # Ensure no password field
                    if 'password' not in user_data:
                        print("✅ Password field correctly excluded from response")
                        return True
                    else:
                        print("❌ Password field should not be in response")
                        return False
                else:
                    print(f"❌ Incorrect user data: role={user_data.get('role')}, phoneVerified={user_data.get('phoneVerified')}")
                    return False
            else:
                print(f"❌ Authenticated access failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing auth/me endpoint: {str(e)}")
            return False
    
    def create_test_blog(self):
        """Create a test blog for PDF attachment"""
        try:
            print("📝 Creating test blog...")
            
            # First check if test blog already exists
            response = self.session.get(f"{API_BASE}/admin/blogs")
            if response.status_code == 200:
                existing_blogs = response.json().get('data', [])
                for blog in existing_blogs:
                    if blog.get('title') == 'PDF Test Blog':
                        print(f"✅ Found existing test blog: {blog['id']}")
                        self.test_blog_id = blog['id']
                        return True
            
            # Create new test blog
            response = self.session.post(f"{API_BASE}/admin/blogs", json={
                "title": "PDF Test Blog",
                "description": "Test blog for PDF management testing",
                "content": "<p>This is a test blog for PDF management functionality.</p>",
                "status": "published"
            })
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                self.test_blog_id = data.get('data', {}).get('id') or data.get('id')
                print(f"✅ Test blog created successfully: {self.test_blog_id}")
                return True
            else:
                print(f"❌ Failed to create test blog - status: {response.status_code}, response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating test blog: {str(e)}")
            return False
    
    def test_pdf_upload(self):
        """Test POST /api/admin/blogs/:id/upload-pdf endpoint"""
        try:
            print("📤 Testing PDF upload...")
            
            # Generate test PDF
            pdf_bytes = self.generate_test_pdf(3)
            if not pdf_bytes:
                return False
            
            # Test unauthenticated access (should return 401)
            anon_session = requests.Session()
            files = {'pdf': ('test.pdf', pdf_bytes, 'application/pdf')}
            data = {'permission': 'view_download'}
            response = anon_session.post(f"{API_BASE}/admin/blogs/{self.test_blog_id}/upload-pdf", 
                                       files=files, data=data)
            if response.status_code == 401:
                print("✅ Unauthenticated access correctly returns 401")
            else:
                print(f"❌ Unauthenticated access should return 401, got {response.status_code}")
                return False
            
            # Test non-PDF file (should return 400)
            files = {'pdf': ('test.txt', b'This is not a PDF', 'text/plain')}
            data = {'permission': 'view_download'}
            response = self.session.post(f"{API_BASE}/admin/blogs/{self.test_blog_id}/upload-pdf", 
                                       files=files, data=data)
            if response.status_code == 400:
                print("✅ Non-PDF file correctly rejected with 400")
            else:
                print(f"❌ Non-PDF file should return 400, got {response.status_code}")
                return False
            
            # Test file too large (generate 26MB file)
            large_pdf = b'%PDF-1.4\n' + b'x' * (26 * 1024 * 1024)  # 26MB
            files = {'pdf': ('large.pdf', large_pdf, 'application/pdf')}
            data = {'permission': 'view_download'}
            response = self.session.post(f"{API_BASE}/admin/blogs/{self.test_blog_id}/upload-pdf", 
                                       files=files, data=data)
            if response.status_code == 400:
                print("✅ Large file correctly rejected with 400")
            else:
                print(f"❌ Large file should return 400, got {response.status_code}")
                return False
            
            # Test successful upload
            files = {'pdf': ('test.pdf', pdf_bytes, 'application/pdf')}
            data = {'permission': 'view_download'}
            response = self.session.post(f"{API_BASE}/admin/blogs/{self.test_blog_id}/upload-pdf", 
                                       files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                blog_data = result.get('data', {})
                
                # Verify all PDF metadata fields are set
                required_fields = ['pdfFileId', 'pdfPreviewFileId', 'pdfFileName', 'pdfSize', 
                                 'pdfPageCount', 'pdfPermission', 'pdfUploadedAt']
                
                for field in required_fields:
                    if field not in blog_data or blog_data[field] is None:
                        print(f"❌ Missing or null PDF field: {field}")
                        return False
                
                self.pdf_file_id = blog_data['pdfFileId']
                self.pdf_preview_file_id = blog_data['pdfPreviewFileId']
                
                print("✅ PDF upload successful with all metadata:")
                print(f"   - File ID: {self.pdf_file_id}")
                print(f"   - Preview ID: {self.pdf_preview_file_id}")
                print(f"   - Filename: {blog_data['pdfFileName']}")
                print(f"   - Size: {blog_data['pdfSize']} bytes")
                print(f"   - Page Count: {blog_data['pdfPageCount']}")
                print(f"   - Permission: {blog_data['pdfPermission']}")
                
                # Test replacing PDF (upload second PDF)
                print("🔄 Testing PDF replacement...")
                new_pdf_bytes = self.generate_test_pdf(2)
                files = {'pdf': ('replacement.pdf', new_pdf_bytes, 'application/pdf')}
                data = {'permission': 'view'}
                response = self.session.post(f"{API_BASE}/admin/blogs/{self.test_blog_id}/upload-pdf", 
                                           files=files, data=data)
                
                if response.status_code == 200:
                    new_result = response.json()
                    new_blog_data = new_result.get('data', {})
                    
                    # Verify IDs changed (previous files should be deleted)
                    if (new_blog_data['pdfFileId'] != self.pdf_file_id and 
                        new_blog_data['pdfPreviewFileId'] != self.pdf_preview_file_id):
                        print("✅ PDF replacement successful - new file IDs generated")
                        self.pdf_file_id = new_blog_data['pdfFileId']
                        self.pdf_preview_file_id = new_blog_data['pdfPreviewFileId']
                        return True
                    else:
                        print("❌ PDF replacement failed - file IDs should change")
                        return False
                else:
                    print(f"❌ PDF replacement failed: {response.status_code}")
                    return False
                
            else:
                print(f"❌ PDF upload failed - status: {response.status_code}, response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing PDF upload: {str(e)}")
            return False
    
    def test_pdf_preview_route(self):
        """Test GET /api/pdfs/:id/preview endpoint (PUBLIC)"""
        try:
            print("👁️ Testing PDF preview route...")
            
            # Test with preview file ID (should return 200)
            anon_session = requests.Session()
            response = anon_session.get(f"{API_BASE}/pdfs/{self.pdf_preview_file_id}/preview")
            if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
                print("✅ Preview route returns 200 with correct content-type")
            else:
                print(f"❌ Preview route failed: {response.status_code}, content-type: {response.headers.get('content-type')}")
                return False
            
            # Test with full file ID (should return 403)
            response = anon_session.get(f"{API_BASE}/pdfs/{self.pdf_file_id}/preview")
            if response.status_code == 403:
                print("✅ Preview route correctly rejects full file ID with 403")
            else:
                print(f"❌ Preview route should return 403 for full file ID, got {response.status_code}")
                return False
            
            # Test with invalid ID (should return 404)
            response = anon_session.get(f"{API_BASE}/pdfs/507f1f77bcf86cd799439011/preview")
            if response.status_code == 404:
                print("✅ Preview route correctly returns 404 for invalid ID")
                return True
            else:
                print(f"❌ Preview route should return 404 for invalid ID, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing PDF preview route: {str(e)}")
            return False
    
    def test_pdf_full_route(self):
        """Test GET /api/pdfs/:id/full endpoint (auth + phoneVerified required)"""
        try:
            print("📄 Testing PDF full route...")
            
            # Test anonymous access (should return 401)
            anon_session = requests.Session()
            response = anon_session.get(f"{API_BASE}/pdfs/{self.pdf_file_id}/full")
            if response.status_code == 401:
                data = response.json()
                if data.get('code') == 'AUTH_REQUIRED':
                    print("✅ Anonymous access correctly returns 401 with AUTH_REQUIRED code")
                else:
                    print(f"❌ Anonymous access should return AUTH_REQUIRED code, got {data.get('code')}")
                    return False
            else:
                print(f"❌ Anonymous access should return 401, got {response.status_code}")
                return False
            
            # Test authenticated admin (phoneVerified=true) access (should return 200)
            response = self.session.get(f"{API_BASE}/pdfs/{self.pdf_file_id}/full")
            if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
                print("✅ Authenticated admin access returns 200 with correct content-type")
            else:
                print(f"❌ Authenticated admin access failed: {response.status_code}, content-type: {response.headers.get('content-type')}")
                return False
            
            # Test with preview file ID (should return 403)
            response = self.session.get(f"{API_BASE}/pdfs/{self.pdf_preview_file_id}/full")
            if response.status_code == 403:
                print("✅ Full route correctly rejects preview file ID with 403")
                return True
            else:
                print(f"❌ Full route should return 403 for preview file ID, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing PDF full route: {str(e)}")
            return False
    
    def test_pdf_download_route(self):
        """Test GET /api/pdfs/:id/download endpoint (auth + phoneVerified + permission=view_download)"""
        try:
            print("⬇️ Testing PDF download route...")
            
            # Test anonymous access (should return 401)
            anon_session = requests.Session()
            response = anon_session.get(f"{API_BASE}/pdfs/{self.pdf_file_id}/download")
            if response.status_code == 401:
                print("✅ Anonymous access correctly returns 401")
            else:
                print(f"❌ Anonymous access should return 401, got {response.status_code}")
                return False
            
            # First set permission to 'view_download'
            response = self.session.put(f"{API_BASE}/admin/blogs/{self.test_blog_id}", json={
                "pdfPermission": "view_download"
            })
            if response.status_code != 200:
                print(f"❌ Failed to set permission to view_download: {response.status_code}")
                return False
            
            # Test authenticated admin with view_download permission (should return 200)
            response = self.session.get(f"{API_BASE}/pdfs/{self.pdf_file_id}/download")
            if response.status_code == 200:
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' in content_disposition:
                    print("✅ Download route returns 200 with attachment disposition")
                else:
                    print(f"❌ Download route should have attachment disposition, got: {content_disposition}")
                    return False
            else:
                print(f"❌ Download route failed with view_download permission: {response.status_code}")
                return False
            
            # Change permission to 'view' and test again (should return 403)
            response = self.session.put(f"{API_BASE}/admin/blogs/{self.test_blog_id}", json={
                "pdfPermission": "view"
            })
            if response.status_code != 200:
                print(f"❌ Failed to set permission to view: {response.status_code}")
                return False
            
            response = self.session.get(f"{API_BASE}/pdfs/{self.pdf_file_id}/download")
            if response.status_code == 403:
                data = response.json()
                if data.get('code') == 'DOWNLOAD_FORBIDDEN':
                    print("✅ Download route correctly returns 403 with DOWNLOAD_FORBIDDEN code when permission is 'view'")
                    return True
                else:
                    print(f"❌ Download route should return DOWNLOAD_FORBIDDEN code, got {data.get('code')}")
                    return False
            else:
                print(f"❌ Download route should return 403 when permission is 'view', got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing PDF download route: {str(e)}")
            return False
    
    def test_blog_pdf_permission_update(self):
        """Test PUT /api/admin/blogs/:id with pdfPermission updates"""
        try:
            print("🔧 Testing blog PDF permission updates...")
            
            # Test updating to 'view_download'
            response = self.session.put(f"{API_BASE}/admin/blogs/{self.test_blog_id}", json={
                "pdfPermission": "view_download"
            })
            
            if response.status_code == 200:
                # Verify the permission was updated
                response = self.session.get(f"{API_BASE}/admin/blogs/{self.test_blog_id}")
                if response.status_code == 200:
                    blog_data = response.json().get('data', {})
                    if blog_data.get('pdfPermission') == 'view_download':
                        print("✅ PDF permission updated to 'view_download'")
                    else:
                        print(f"❌ PDF permission not updated correctly: {blog_data.get('pdfPermission')}")
                        return False
                else:
                    print(f"❌ Failed to retrieve updated blog: {response.status_code}")
                    return False
            else:
                print(f"❌ Failed to update PDF permission: {response.status_code}")
                return False
            
            # Test updating to 'view'
            response = self.session.put(f"{API_BASE}/admin/blogs/{self.test_blog_id}", json={
                "pdfPermission": "view"
            })
            
            if response.status_code == 200:
                # Verify the permission was updated
                response = self.session.get(f"{API_BASE}/admin/blogs/{self.test_blog_id}")
                if response.status_code == 200:
                    blog_data = response.json().get('data', {})
                    if blog_data.get('pdfPermission') == 'view':
                        print("✅ PDF permission updated to 'view'")
                    else:
                        print(f"❌ PDF permission not updated correctly: {blog_data.get('pdfPermission')}")
                        return False
                else:
                    print(f"❌ Failed to retrieve updated blog: {response.status_code}")
                    return False
            else:
                print(f"❌ Failed to update PDF permission: {response.status_code}")
                return False
            
            # Test invalid permission value (should be ignored)
            response = self.session.put(f"{API_BASE}/admin/blogs/{self.test_blog_id}", json={
                "pdfPermission": "invalid_permission"
            })
            
            if response.status_code == 200:
                # Verify the permission remained unchanged
                response = self.session.get(f"{API_BASE}/admin/blogs/{self.test_blog_id}")
                if response.status_code == 200:
                    blog_data = response.json().get('data', {})
                    if blog_data.get('pdfPermission') == 'view':  # Should remain 'view'
                        print("✅ Invalid PDF permission value correctly ignored")
                        return True
                    else:
                        print(f"❌ Invalid permission should be ignored, got: {blog_data.get('pdfPermission')}")
                        return False
                else:
                    print(f"❌ Failed to retrieve updated blog: {response.status_code}")
                    return False
            else:
                print(f"❌ Failed to update with invalid permission: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing PDF permission updates: {str(e)}")
            return False
    
    def test_public_blog_with_pdf_metadata(self):
        """Test GET /api/blogs/:slug includes PDF metadata"""
        try:
            print("🌐 Testing public blog with PDF metadata...")
            
            # First get the blog slug
            response = self.session.get(f"{API_BASE}/admin/blogs/{self.test_blog_id}")
            if response.status_code != 200:
                print(f"❌ Failed to get blog details: {response.status_code}")
                return False
            
            blog_data = response.json().get('data', {})
            blog_slug = blog_data.get('slug')
            if not blog_slug:
                print("❌ Blog slug not found")
                return False
            
            # Test public blog endpoint
            anon_session = requests.Session()
            response = anon_session.get(f"{API_BASE}/blogs/{blog_slug}")
            
            if response.status_code == 200:
                public_blog_data = response.json().get('data', {})
                
                # Verify PDF metadata is included
                pdf_fields = ['pdfFileId', 'pdfPreviewFileId', 'pdfFileName', 'pdfSize', 
                             'pdfPageCount', 'pdfPermission']
                
                for field in pdf_fields:
                    if field not in public_blog_data:
                        print(f"❌ Missing PDF metadata field in public blog: {field}")
                        return False
                
                print("✅ Public blog includes all PDF metadata fields:")
                print(f"   - PDF File ID: {public_blog_data.get('pdfFileId')}")
                print(f"   - PDF Preview ID: {public_blog_data.get('pdfPreviewFileId')}")
                print(f"   - PDF Permission: {public_blog_data.get('pdfPermission')}")
                return True
            else:
                print(f"❌ Failed to get public blog: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing public blog with PDF metadata: {str(e)}")
            return False
    
    def test_pdf_delete(self):
        """Test DELETE /api/admin/blogs/:id/upload-pdf endpoint"""
        try:
            print("🗑️ Testing PDF delete...")
            
            # Test unauthenticated access (should return 401)
            anon_session = requests.Session()
            response = anon_session.delete(f"{API_BASE}/admin/blogs/{self.test_blog_id}/upload-pdf")
            if response.status_code == 401:
                print("✅ Unauthenticated delete correctly returns 401")
            else:
                print(f"❌ Unauthenticated delete should return 401, got {response.status_code}")
                return False
            
            # Test authenticated delete
            response = self.session.delete(f"{API_BASE}/admin/blogs/{self.test_blog_id}/upload-pdf")
            
            if response.status_code == 200:
                result = response.json()
                blog_data = result.get('data', {})
                
                # Verify all PDF fields are unset
                pdf_fields = ['pdfFileId', 'pdfPreviewFileId', 'pdfFileName', 'pdfSize', 
                             'pdfPageCount', 'pdfUploadedAt']
                
                for field in pdf_fields:
                    if field in blog_data and blog_data[field] is not None:
                        print(f"❌ PDF field should be unset after delete: {field} = {blog_data[field]}")
                        return False
                
                print("✅ PDF delete successful - all metadata fields unset")
                
                # Verify GridFS files are deleted by trying to access them
                anon_session = requests.Session()
                
                # Try to access preview (should return 404)
                response = anon_session.get(f"{API_BASE}/pdfs/{self.pdf_preview_file_id}/preview")
                if response.status_code == 404:
                    print("✅ Preview file correctly deleted from GridFS")
                else:
                    print(f"❌ Preview file should return 404 after delete, got {response.status_code}")
                    return False
                
                # Try to access full file (should return 404)
                response = self.session.get(f"{API_BASE}/pdfs/{self.pdf_file_id}/full")
                if response.status_code == 404:
                    print("✅ Full file correctly deleted from GridFS")
                    return True
                else:
                    print(f"❌ Full file should return 404 after delete, got {response.status_code}")
                    return False
                
            else:
                print(f"❌ PDF delete failed - status: {response.status_code}, response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing PDF delete: {str(e)}")
            return False
    
    def test_blog_delete_cascade(self):
        """Test DELETE /api/admin/blogs/:id cascades to GridFS files"""
        try:
            print("🗑️ Testing blog delete cascade...")
            
            # First upload a new PDF to test cascade
            pdf_bytes = self.generate_test_pdf(2)
            if not pdf_bytes:
                return False
            
            files = {'pdf': ('cascade_test.pdf', pdf_bytes, 'application/pdf')}
            data = {'permission': 'view_download'}
            response = self.session.post(f"{API_BASE}/admin/blogs/{self.test_blog_id}/upload-pdf", 
                                       files=files, data=data)
            
            if response.status_code != 200:
                print(f"❌ Failed to upload PDF for cascade test: {response.status_code}")
                return False
            
            result = response.json()
            blog_data = result.get('data', {})
            cascade_file_id = blog_data['pdfFileId']
            cascade_preview_id = blog_data['pdfPreviewFileId']
            
            # Delete the blog
            response = self.session.delete(f"{API_BASE}/admin/blogs/{self.test_blog_id}")
            
            if response.status_code == 200:
                print("✅ Blog deleted successfully")
                
                # Verify GridFS files are also deleted
                anon_session = requests.Session()
                
                # Try to access preview (should return 404)
                response = anon_session.get(f"{API_BASE}/pdfs/{cascade_preview_id}/preview")
                if response.status_code == 404:
                    print("✅ Preview file correctly deleted in cascade")
                else:
                    print(f"❌ Preview file should return 404 after blog delete, got {response.status_code}")
                    return False
                
                # Try to access full file (should return 404)
                response = self.session.get(f"{API_BASE}/pdfs/{cascade_file_id}/full")
                if response.status_code == 404:
                    print("✅ Full file correctly deleted in cascade")
                    return True
                else:
                    print(f"❌ Full file should return 404 after blog delete, got {response.status_code}")
                    return False
                
            else:
                print(f"❌ Blog delete failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing blog delete cascade: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Blog PDF Management Testing...")
        print("=" * 60)
        
        # Step 1: Login as admin
        if not self.login_admin():
            return False
        
        # Step 2: Test auth/me endpoint
        if not self.test_auth_me_endpoint():
            return False
        
        # Step 3: Create test blog
        if not self.create_test_blog():
            return False
        
        # Step 4: Test PDF upload
        if not self.test_pdf_upload():
            return False
        
        # Step 5: Test PDF preview route
        if not self.test_pdf_preview_route():
            return False
        
        # Step 6: Test PDF full route
        if not self.test_pdf_full_route():
            return False
        
        # Step 7: Test PDF download route
        if not self.test_pdf_download_route():
            return False
        
        # Step 8: Test PDF permission updates
        if not self.test_blog_pdf_permission_update():
            return False
        
        # Step 9: Test public blog with PDF metadata
        if not self.test_public_blog_with_pdf_metadata():
            return False
        
        # Step 10: Test PDF delete
        if not self.test_pdf_delete():
            return False
        
        # Step 11: Test blog delete cascade
        if not self.test_blog_delete_cascade():
            return False
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED - Blog PDF Management Testing Complete!")
        return True

def main():
    """Main test execution"""
    tester = BlogPDFManagementTester()
    
    try:
        success = tester.run_all_tests()
        if success:
            print("\n✅ BLOG PDF MANAGEMENT TESTING: ALL TESTS PASSED")
            sys.exit(0)
        else:
            print("\n❌ BLOG PDF MANAGEMENT TESTING: SOME TESTS FAILED")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 CRITICAL ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()