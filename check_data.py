#!/usr/bin/env python3
"""
Check test data and fix the API test
"""

import requests
import json

BASE_URL = "https://google-oauth-native.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

def check_test_data():
    """Check the test data and fix the API test"""
    admin_session = requests.Session()
    
    # Admin Login
    admin_login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    response = admin_session.post(f"{BASE_URL}/api/auth/login", json=admin_login_data)
    if response.status_code != 200:
        print("❌ Login failed")
        return
    
    print("✅ Admin logged in")
    
    # Get mock tests
    response = admin_session.get(f"{BASE_URL}/api/admin/mock-tests")
    if response.status_code == 200:
        tests = response.json().get('data', [])
        pyq_tests = [t for t in tests if t.get('testType') == 'previous_year']
        
        print(f"\nFound {len(pyq_tests)} PYQ tests:")
        for test in pyq_tests[:3]:
            print(f"  ID: {test.get('id')}")
            print(f"  Title: {test.get('title')}")
            print(f"  ExamId: {test.get('examId')}")
            print(f"  DomainId: {test.get('domainId')}")
            print(f"  Has PDF: {bool(test.get('pdfFileId'))}")
            print()
        
        # Find a test with examId and domainId
        valid_test = None
        for test in pyq_tests:
            if test.get('examId') and test.get('domainId'):
                valid_test = test
                break
        
        if valid_test:
            print(f"Using test with valid examId/domainId: {valid_test['id']}")
            
            # Test the previous-year-tests API
            exam_id = valid_test['examId']
            domain_id = valid_test['domainId']
            
            response = requests.get(f"{BASE_URL}/api/previous-year-tests?examId={exam_id}&domainId={domain_id}")
            if response.status_code == 200:
                api_tests = response.json().get('data', [])
                print(f"\nPrevious year tests API returned {len(api_tests)} tests")
                
                for test in api_tests:
                    print(f"  ID: {test.get('id')}")
                    print(f"  Title: {test.get('title')}")
                    print(f"  Has PDF metadata: {bool(test.get('pdfFileId'))}")
                    if test.get('pdfFileId'):
                        print(f"    PDF File ID: {test.get('pdfFileId')}")
                        print(f"    PDF Preview ID: {test.get('pdfPreviewFileId')}")
                        print(f"    PDF Filename: {test.get('pdfFileName')}")
                        print(f"    PDF Pages: {test.get('pdfPageCount')}")
                        print(f"    PDF Permission: {test.get('pdfPermission')}")
                    print()
            else:
                print(f"❌ Previous year tests API failed: {response.status_code}")
        else:
            print("❌ No PYQ test found with valid examId and domainId")
    else:
        print(f"❌ Failed to get mock tests: {response.status_code}")

if __name__ == "__main__":
    check_test_data()