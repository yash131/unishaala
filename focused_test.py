#!/usr/bin/env python3
"""
Focused test for the specific failing scenarios
"""

import requests
import json
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

BASE_URL = "https://google-oauth-native.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

def create_test_pdf(pages=3):
    """Create a test PDF with specified number of pages"""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    for i in range(pages):
        c.drawString(100, 750, f"Test PDF - Page {i+1}")
        c.drawString(100, 700, f"This is page {i+1} of {pages}")
        if i < pages - 1:
            c.showPage()
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

def print_test_result(test_name, success, details=""):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"   Details: {details}")

def test_specific_scenarios():
    """Test specific failing scenarios"""
    print("🧪 TESTING: Specific PYQ PDF Upload Scenarios")
    print("=" * 60)
    
    admin_session = requests.Session()
    
    try:
        # Admin Login
        print("\n🔐 Admin Authentication")
        admin_login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        response = admin_session.post(f"{BASE_URL}/api/auth/login", json=admin_login_data)
        if response.status_code == 200:
            print_test_result("Admin Login", True, f"Logged in as {ADMIN_EMAIL}")
        else:
            print_test_result("Admin Login", False, f"Status: {response.status_code}")
            return
        
        # Get mock tests
        response = admin_session.get(f"{BASE_URL}/api/admin/mock-tests")
        if response.status_code == 200:
            tests = response.json().get('data', [])
            
            # Find tests
            pyq_tests = [t for t in tests if t.get('testType') == 'previous_year']
            regular_tests = [t for t in tests if t.get('testType') in ['mock_test', 'practice_questions']]
            
            if pyq_tests and regular_tests:
                pyq_test_id = pyq_tests[0]['id']
                regular_test_id = regular_tests[0]['id']
                
                print(f"\nUsing PYQ test: {pyq_test_id}")
                print(f"Using regular test: {regular_test_id}")
                
                # Test 1: Upload to non-PYQ test
                print("\n🚫 Test: Upload to non-PYQ test")
                test_pdf = create_test_pdf(3)
                files = {'pdf': ('test.pdf', test_pdf, 'application/pdf')}
                data = {'permission': 'view'}
                
                response = admin_session.post(f"{BASE_URL}/api/admin/mock-tests/{regular_test_id}/upload-pdf", 
                                            files=files, data=data)
                
                print_test_result("Non-PYQ test upload blocked", 
                                response.status_code == 400 and 'PYQ' in response.text,
                                f"Status: {response.status_code}, Response: {response.text[:200]}")
                
                # Test 2: Upload without PDF field
                print("\n📄 Test: Upload without PDF field")
                data = {'permission': 'view'}
                response = admin_session.post(f"{BASE_URL}/api/admin/mock-tests/{pyq_test_id}/upload-pdf", 
                                            data=data)
                
                print_test_result("Upload without PDF field blocked", 
                                response.status_code == 400,
                                f"Status: {response.status_code}, Response: {response.text[:200]}")
                
                # Test 3: Upload non-PDF file
                print("\n📝 Test: Upload non-PDF file")
                non_pdf = b"This is not a PDF file"
                files = {'pdf': ('test.txt', non_pdf, 'text/plain')}
                data = {'permission': 'view'}
                
                response = admin_session.post(f"{BASE_URL}/api/admin/mock-tests/{pyq_test_id}/upload-pdf", 
                                            files=files, data=data)
                
                print_test_result("Non-PDF file upload blocked", 
                                response.status_code == 400 and 'PDF' in response.text,
                                f"Status: {response.status_code}, Response: {response.text[:200]}")
                
                # Test 4: Check previous-year-tests API
                print("\n📋 Test: Previous year tests API")
                
                # First upload a PDF to a PYQ test
                test_pdf = create_test_pdf(3)
                files = {'pdf': ('api_test.pdf', test_pdf, 'application/pdf')}
                data = {'permission': 'view'}
                
                response = admin_session.post(f"{BASE_URL}/api/admin/mock-tests/{pyq_test_id}/upload-pdf", 
                                            files=files, data=data)
                
                if response.status_code == 200:
                    print_test_result("PDF uploaded for API test", True, "PDF uploaded successfully")
                    
                    # Get the test details to find examId and domainId
                    response = admin_session.get(f"{BASE_URL}/api/admin/mock-tests")
                    if response.status_code == 200:
                        tests = response.json().get('data', [])
                        test = next((t for t in tests if t['id'] == pyq_test_id), None)
                        
                        if test and test.get('examId') and test.get('domainId'):
                            exam_id = test['examId']
                            domain_id = test['domainId']
                            
                            # Test the public API
                            response = requests.get(f"{BASE_URL}/api/previous-year-tests?examId={exam_id}&domainId={domain_id}")
                            
                            if response.status_code == 200:
                                tests_data = response.json().get('data', [])
                                test_with_pdf = next((t for t in tests_data if t.get('id') == pyq_test_id), None)
                                
                                if test_with_pdf:
                                    pdf_metadata_fields = ['pdfFileId', 'pdfPreviewFileId', 'pdfFileName', 
                                                         'pdfSize', 'pdfPageCount', 'pdfPermission']
                                    has_pdf_metadata = all(field in test_with_pdf for field in pdf_metadata_fields)
                                    
                                    print_test_result("Previous year tests include PDF metadata", 
                                                    has_pdf_metadata,
                                                    f"PDF metadata fields present: {has_pdf_metadata}")
                                    
                                    if has_pdf_metadata:
                                        print(f"   PDF metadata: {test_with_pdf.get('pdfFileName')}, "
                                              f"Pages: {test_with_pdf.get('pdfPageCount')}, "
                                              f"Permission: {test_with_pdf.get('pdfPermission')}")
                                else:
                                    print_test_result("Previous year tests include PDF metadata", False, 
                                                    f"Test with PDF not found in API response. Found {len(tests_data)} tests")
                            else:
                                print_test_result("Previous year tests API accessible", False, 
                                                f"Status: {response.status_code}")
                        else:
                            print_test_result("Test has examId and domainId", False, 
                                            f"ExamId: {test.get('examId')}, DomainId: {test.get('domainId')}")
                else:
                    print_test_result("PDF uploaded for API test", False, 
                                    f"Status: {response.status_code}")
            else:
                print("❌ Could not find required test types")
        else:
            print_test_result("Get mock tests", False, f"Status: {response.status_code}")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_specific_scenarios()