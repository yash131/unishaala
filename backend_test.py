#!/usr/bin/env python3
"""
Premium Notes Feature End-to-End Testing
Tests all scenarios specified in the review request.
"""

import requests
import json
import os
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://admin-cleanup-18.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Admin credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class TestSession:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_data = {}
        
    def login_admin(self):
        """Login as admin to get auth cookie"""
        print("🔐 Logging in as admin...")
        response = self.session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Admin login successful. Role: {data['data']['user']['role']}")
                return True
            else:
                print(f"❌ Admin login failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Admin login failed with status {response.status_code}: {response.text}")
            return False
    
    def get_or_create_test_data(self):
        """Get existing exam/domain/subject or create them for testing"""
        print("\n📋 Setting up test data...")
        
        # Get exams
        response = self.session.get(f"{API_BASE}/admin/exams")
        if response.status_code == 200:
            exams = response.json()['data']
            if exams:
                exam = exams[0]
                self.test_data['examId'] = exam['id']
                print(f"✅ Using existing exam: {exam['name']} (ID: {exam['id']})")
            else:
                print("❌ No exams found. Please create an exam first.")
                return False
        else:
            print(f"❌ Failed to get exams: {response.status_code}")
            return False
        
        # Get domains for this exam
        response = self.session.get(f"{API_BASE}/admin/domains?examId={self.test_data['examId']}")
        if response.status_code == 200:
            domains = response.json()['data']
            if domains:
                domain = domains[0]
                self.test_data['domainId'] = domain['id']
                print(f"✅ Using existing domain: {domain['name']} (ID: {domain['id']})")
            else:
                print("❌ No domains found for this exam. Please create a domain first.")
                return False
        else:
            print(f"❌ Failed to get domains: {response.status_code}")
            return False
        
        # Get subjects for this exam+domain
        response = self.session.get(f"{API_BASE}/admin/subjects?examId={self.test_data['examId']}&domainId={self.test_data['domainId']}")
        if response.status_code == 200:
            subjects = response.json()['data']
            if subjects:
                subject = subjects[0]
                self.test_data['subjectId'] = subject['id']
                print(f"✅ Using existing subject: {subject['name']} (ID: {subject['id']})")
            else:
                # Create a test subject
                print("📝 Creating test subject...")
                response = self.session.post(f"{API_BASE}/admin/subjects", json={
                    "examId": self.test_data['examId'],
                    "domainId": self.test_data['domainId'],
                    "name": "Test Subject for Notes"
                })
                if response.status_code == 200:
                    subject = response.json()['data']
                    self.test_data['subjectId'] = subject['id']
                    print(f"✅ Created test subject: {subject['name']} (ID: {subject['id']})")
                else:
                    print(f"❌ Failed to create subject: {response.status_code} - {response.text}")
                    return False
        else:
            print(f"❌ Failed to get subjects: {response.status_code}")
            return False
        
        return True
    
    def create_test_pdf(self, pages=3):
        """Create a test PDF with specified number of pages"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        for page_num in range(1, pages + 1):
            c.drawString(100, 750, f"Test PDF - Page {page_num}")
            c.drawString(100, 700, f"This is a test PDF for Premium Notes feature testing.")
            c.drawString(100, 650, f"Created for automated testing purposes.")
            c.drawString(100, 600, f"Page {page_num} of {pages}")
            if page_num < pages:
                c.showPage()
        
        c.save()
        buffer.seek(0)
        return buffer.getvalue()
    
    def test_create_note_metadata(self):
        """Test 1: Create note metadata"""
        print("\n🧪 Test 1: Create note metadata")
        
        response = self.session.post(f"{API_BASE}/admin/notes", json={
            "examId": self.test_data['examId'],
            "domainId": self.test_data['domainId'],
            "subjectId": self.test_data['subjectId'],
            "title": "Test Note",
            "description": "desc"
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                note = data['data']
                self.test_data['noteId'] = note['id']
                print(f"✅ Note created successfully. ID: {note['id']}")
                print(f"   - pdfPermission: {note.get('pdfPermission', 'view')} (expected: view)")
                print(f"   - status: {note.get('status', 'Active')} (expected: Active)")
                return True
            else:
                print(f"❌ Note creation failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Note creation failed with status {response.status_code}: {response.text}")
            return False
    
    def test_create_note_missing_fields(self):
        """Test 2: Create note with missing fields"""
        print("\n🧪 Test 2: Create note with missing fields")
        
        response = self.session.post(f"{API_BASE}/admin/notes", json={
            "examId": self.test_data['examId'],
            "domainId": self.test_data['domainId'],
            # Missing subjectId
            "title": "Test Note Missing Fields",
            "description": "desc"
        })
        
        if response.status_code == 400:
            data = response.json()
            print(f"✅ Correctly rejected with 400: {data.get('error')}")
            return True
        else:
            print(f"❌ Expected 400 but got {response.status_code}: {response.text}")
            return False
    
    def test_create_note_unauthorized(self):
        """Test 3: Create note without admin cookie"""
        print("\n🧪 Test 3: Create note without admin cookie")
        
        # Create a new session without admin cookie
        temp_session = requests.Session()
        response = temp_session.post(f"{API_BASE}/admin/notes", json={
            "examId": self.test_data['examId'],
            "domainId": self.test_data['domainId'],
            "subjectId": self.test_data['subjectId'],
            "title": "Unauthorized Test",
            "description": "desc"
        })
        
        if response.status_code == 401:
            print("✅ Correctly rejected with 401 (Unauthorized)")
            return True
        else:
            print(f"❌ Expected 401 but got {response.status_code}: {response.text}")
            return False
    
    def test_upload_pdf(self):
        """Test 4: Upload PDF"""
        print("\n🧪 Test 4: Upload PDF")
        
        if 'noteId' not in self.test_data:
            print("❌ No noteId available for PDF upload")
            return False
        
        # Create a test PDF
        pdf_bytes = self.create_test_pdf(3)
        
        files = {
            'pdf': ('test.pdf', pdf_bytes, 'application/pdf'),
            'permission': (None, 'view')
        }
        
        response = self.session.post(
            f"{API_BASE}/admin/notes/{self.test_data['noteId']}/upload-pdf",
            files=files
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                note = data['data']
                self.test_data['pdfFileId'] = note.get('pdfFileId')
                self.test_data['pdfPreviewFileId'] = note.get('pdfPreviewFileId')
                print(f"✅ PDF uploaded successfully")
                print(f"   - pdfFileId: {note.get('pdfFileId')}")
                print(f"   - pdfPreviewFileId: {note.get('pdfPreviewFileId')}")
                print(f"   - pdfFileName: {note.get('pdfFileName')}")
                print(f"   - pdfPermission: {note.get('pdfPermission')} (expected: view)")
                print(f"   - pdfPageCount: {note.get('pdfPageCount')}")
                return True
            else:
                print(f"❌ PDF upload failed: {data.get('error')}")
                return False
        else:
            print(f"❌ PDF upload failed with status {response.status_code}: {response.text}")
            return False
    
    def test_list_admin_notes(self):
        """Test 5: List admin notes"""
        print("\n🧪 Test 5: List admin notes")
        
        response = self.session.get(f"{API_BASE}/admin/notes")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                notes = data['data']
                print(f"✅ Retrieved {len(notes)} notes")
                
                # Check if our created note is in the list
                our_note = next((n for n in notes if n['id'] == self.test_data.get('noteId')), None)
                if our_note and our_note.get('pdfFileId'):
                    print(f"   - Our test note found with pdfFileId: {our_note['pdfFileId']}")
                    return True
                else:
                    print("❌ Our test note not found or missing pdfFileId")
                    return False
            else:
                print(f"❌ Failed to list notes: {data.get('error')}")
                return False
        else:
            print(f"❌ Failed to list notes with status {response.status_code}: {response.text}")
            return False
    
    def test_filter_admin_notes(self):
        """Test 6: Filter admin notes"""
        print("\n🧪 Test 6: Filter admin notes")
        
        response = self.session.get(f"{API_BASE}/admin/notes?examId={self.test_data['examId']}&domainId={self.test_data['domainId']}&subjectId={self.test_data['subjectId']}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                notes = data['data']
                print(f"✅ Retrieved {len(notes)} filtered notes")
                
                # Check if our created note is in the filtered list
                our_note = next((n for n in notes if n['id'] == self.test_data.get('noteId')), None)
                if our_note:
                    print(f"   - Our test note found in filtered results")
                    return True
                else:
                    print("❌ Our test note not found in filtered results")
                    return False
            else:
                print(f"❌ Failed to filter notes: {data.get('error')}")
                return False
        else:
            print(f"❌ Failed to filter notes with status {response.status_code}: {response.text}")
            return False
    
    def test_get_single_admin_note(self):
        """Test 7: GET single admin note"""
        print("\n🧪 Test 7: GET single admin note")
        
        if 'noteId' not in self.test_data:
            print("❌ No noteId available")
            return False
        
        response = self.session.get(f"{API_BASE}/admin/notes/{self.test_data['noteId']}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                note = data['data']
                print(f"✅ Retrieved single note: {note['title']}")
                print(f"   - ID matches: {note['id'] == self.test_data['noteId']}")
                return True
            else:
                print(f"❌ Failed to get single note: {data.get('error')}")
                return False
        else:
            print(f"❌ Failed to get single note with status {response.status_code}: {response.text}")
            return False
    
    def test_public_notes_list(self):
        """Test 8: Public notes list"""
        print("\n🧪 Test 8: Public notes list")
        
        response = self.session.get(f"{API_BASE}/notes")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                notes = data['data']
                print(f"✅ Retrieved {len(notes)} public notes")
                
                # Check if our note appears (should have pdfFileId and status != 'Inactive')
                our_note = next((n for n in notes if n['id'] == self.test_data.get('noteId')), None)
                if our_note:
                    print(f"   - Our test note found in public list")
                    print(f"   - Has pdfFileId: {bool(our_note.get('pdfFileId'))}")
                    print(f"   - Status: {our_note.get('status')}")
                    return True
                else:
                    print("❌ Our test note not found in public list")
                    return False
            else:
                print(f"❌ Failed to get public notes: {data.get('error')}")
                return False
        else:
            print(f"❌ Failed to get public notes with status {response.status_code}: {response.text}")
            return False
    
    def test_filtered_public_notes(self):
        """Test 9: Filtered public notes"""
        print("\n🧪 Test 9: Filtered public notes")
        
        response = self.session.get(f"{API_BASE}/notes?examId={self.test_data['examId']}&domainId={self.test_data['domainId']}&subjectId={self.test_data['subjectId']}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                notes = data['data']
                print(f"✅ Retrieved {len(notes)} filtered public notes")
                
                # Check if our note appears
                our_note = next((n for n in notes if n['id'] == self.test_data.get('noteId')), None)
                if our_note:
                    print(f"   - Our test note found in filtered public list")
                    return True
                else:
                    print("❌ Our test note not found in filtered public list")
                    return False
            else:
                print(f"❌ Failed to get filtered public notes: {data.get('error')}")
                return False
        else:
            print(f"❌ Failed to get filtered public notes with status {response.status_code}: {response.text}")
            return False
    
    def test_notes_subjects_aggregation(self):
        """Test 10: Notes-subjects aggregation"""
        print("\n🧪 Test 10: Notes-subjects aggregation")
        
        response = self.session.get(f"{API_BASE}/notes-subjects?examId={self.test_data['examId']}&domainId={self.test_data['domainId']}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                subjects = data['data']
                print(f"✅ Retrieved {len(subjects)} subjects with note counts")
                
                # Find our subject and check noteCount
                our_subject = next((s for s in subjects if s['id'] == self.test_data.get('subjectId')), None)
                if our_subject:
                    note_count = our_subject.get('noteCount', 0)
                    print(f"   - Our subject found with noteCount: {note_count}")
                    if note_count >= 1:
                        print("   - ✅ noteCount >= 1 as expected")
                        return True
                    else:
                        print("   - ❌ noteCount < 1")
                        return False
                else:
                    print("❌ Our subject not found in aggregation")
                    return False
            else:
                print(f"❌ Failed to get notes-subjects: {data.get('error')}")
                return False
        else:
            print(f"❌ Failed to get notes-subjects with status {response.status_code}: {response.text}")
            return False
    
    def test_stream_full_pdf(self):
        """Test 11: Stream full PDF"""
        print("\n🧪 Test 11: Stream full PDF")
        
        if 'pdfFileId' not in self.test_data:
            print("❌ No pdfFileId available")
            return False
        
        response = self.session.get(f"{API_BASE}/pdfs/{self.test_data['pdfFileId']}/full")
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            content_length = len(response.content)
            print(f"✅ Full PDF streamed successfully")
            print(f"   - Content-Type: {content_type}")
            print(f"   - Content length: {content_length} bytes")
            
            if 'application/pdf' in content_type and content_length > 0:
                return True
            else:
                print("❌ Invalid content type or empty content")
                return False
        else:
            print(f"❌ Failed to stream full PDF with status {response.status_code}: {response.text}")
            return False
    
    def test_download_blocked_when_view_only(self):
        """Test 12: Download blocked when permission='view'"""
        print("\n🧪 Test 12: Download blocked when permission='view'")
        
        if 'pdfFileId' not in self.test_data:
            print("❌ No pdfFileId available")
            return False
        
        response = self.session.get(f"{API_BASE}/pdfs/{self.test_data['pdfFileId']}/download")
        
        if response.status_code == 403:
            data = response.json()
            if data.get('code') == 'DOWNLOAD_FORBIDDEN':
                print("✅ Download correctly blocked with 403 DOWNLOAD_FORBIDDEN")
                return True
            else:
                print(f"❌ Got 403 but wrong code: {data.get('code')}")
                return False
        else:
            print(f"❌ Expected 403 but got {response.status_code}: {response.text}")
            return False
    
    def test_change_permission_to_view_download(self):
        """Test 13: Change permission to view_download"""
        print("\n🧪 Test 13: Change permission to view_download")
        
        if 'noteId' not in self.test_data:
            print("❌ No noteId available")
            return False
        
        response = self.session.put(f"{API_BASE}/admin/notes/{self.test_data['noteId']}", json={
            "pdfPermission": "view_download"
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                note = data['data']
                permission = note.get('pdfPermission')
                print(f"✅ Permission updated successfully")
                print(f"   - pdfPermission: {permission} (expected: view_download)")
                
                if permission == 'view_download':
                    return True
                else:
                    print("❌ Permission not updated correctly")
                    return False
            else:
                print(f"❌ Failed to update permission: {data.get('error')}")
                return False
        else:
            print(f"❌ Failed to update permission with status {response.status_code}: {response.text}")
            return False
    
    def test_download_allowed_now(self):
        """Test 14: Download allowed now"""
        print("\n🧪 Test 14: Download allowed now")
        
        if 'pdfFileId' not in self.test_data:
            print("❌ No pdfFileId available")
            return False
        
        response = self.session.get(f"{API_BASE}/pdfs/{self.test_data['pdfFileId']}/download")
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            content_disposition = response.headers.get('content-disposition', '')
            content_length = len(response.content)
            
            print(f"✅ Download allowed successfully")
            print(f"   - Content-Type: {content_type}")
            print(f"   - Content-Disposition: {content_disposition}")
            print(f"   - Content length: {content_length} bytes")
            
            if 'application/pdf' in content_type and 'attachment' in content_disposition and content_length > 0:
                return True
            else:
                print("❌ Invalid headers or empty content")
                return False
        else:
            print(f"❌ Download failed with status {response.status_code}: {response.text}")
            return False
    
    def test_unauthorized_stream(self):
        """Test 15: Unauthorized stream"""
        print("\n🧪 Test 15: Unauthorized stream")
        
        if 'pdfFileId' not in self.test_data:
            print("❌ No pdfFileId available")
            return False
        
        # Create a new session without auth cookie
        temp_session = requests.Session()
        response = temp_session.get(f"{API_BASE}/pdfs/{self.test_data['pdfFileId']}/full")
        
        if response.status_code == 401:
            print("✅ Unauthorized access correctly blocked with 401")
            return True
        else:
            print(f"❌ Expected 401 but got {response.status_code}: {response.text}")
            return False
    
    def test_delete_note(self):
        """Test 16: Delete note"""
        print("\n🧪 Test 16: Delete note")
        
        if 'noteId' not in self.test_data:
            print("❌ No noteId available")
            return False
        
        response = self.session.delete(f"{API_BASE}/admin/notes/{self.test_data['noteId']}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Note deleted successfully")
                return True
            else:
                print(f"❌ Note deletion failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Note deletion failed with status {response.status_code}: {response.text}")
            return False
    
    def test_verify_pdf_cleanup(self):
        """Test 17: Verify PDF cleanup"""
        print("\n🧪 Test 17: Verify PDF cleanup")
        
        if 'pdfFileId' not in self.test_data:
            print("❌ No pdfFileId available")
            return False
        
        response = self.session.get(f"{API_BASE}/pdfs/{self.test_data['pdfFileId']}/full")
        
        if response.status_code == 404:
            print("✅ PDF correctly cleaned up (404 not found)")
            return True
        else:
            print(f"❌ Expected 404 but got {response.status_code}: {response.text}")
            return False
    
    def test_verify_note_removed(self):
        """Test 18: Verify note removed"""
        print("\n🧪 Test 18: Verify note removed")
        
        response = self.session.get(f"{API_BASE}/admin/notes")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                notes = data['data']
                
                # Check if our deleted note is NOT in the list
                our_note = next((n for n in notes if n['id'] == self.test_data.get('noteId')), None)
                if our_note is None:
                    print("✅ Deleted note no longer appears in admin notes list")
                    return True
                else:
                    print("❌ Deleted note still appears in admin notes list")
                    return False
            else:
                print(f"❌ Failed to list notes: {data.get('error')}")
                return False
        else:
            print(f"❌ Failed to list notes with status {response.status_code}: {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting Premium Notes Feature End-to-End Testing")
        print("=" * 60)
        
        # Setup
        if not self.login_admin():
            return False
        
        if not self.get_or_create_test_data():
            return False
        
        # Test scenarios
        tests = [
            self.test_create_note_metadata,
            self.test_create_note_missing_fields,
            self.test_create_note_unauthorized,
            self.test_upload_pdf,
            self.test_list_admin_notes,
            self.test_filter_admin_notes,
            self.test_get_single_admin_note,
            self.test_public_notes_list,
            self.test_filtered_public_notes,
            self.test_notes_subjects_aggregation,
            self.test_stream_full_pdf,
            self.test_download_blocked_when_view_only,
            self.test_change_permission_to_view_download,
            self.test_download_allowed_now,
            self.test_unauthorized_stream,
            self.test_delete_note,
            self.test_verify_pdf_cleanup,
            self.test_verify_note_removed,
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"🏁 Testing Complete: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {failed} tests failed")
            return False

if __name__ == "__main__":
    test_session = TestSession()
    success = test_session.run_all_tests()
    exit(0 if success else 1)