#!/usr/bin/env python3
"""
Debug the previous-year-tests API issue
"""

import requests
import json

BASE_URL = "https://reviewer-workflow.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

def debug_api_issue():
    """Debug why the previous-year-tests API is not returning tests"""
    admin_session = requests.Session()
    
    # Admin Login
    admin_login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    response = admin_session.post(f"{BASE_URL}/api/auth/login", json=admin_login_data)
    if response.status_code != 200:
        print("❌ Login failed")
        return
    
    print("✅ Admin logged in")
    
    # Get the specific test
    test_id = "e1baa6e1-cadf-4a65-b6f5-fb10ef8d86a9"
    exam_id = "e9f43709-a1e0-495f-b537-d577b0bb1bc2"
    domain_id = "61f3afca-b13f-45cd-9831-17c81fa92cf6"
    
    # Get mock tests and check the specific test details
    response = admin_session.get(f"{BASE_URL}/api/admin/mock-tests")
    if response.status_code == 200:
        tests = response.json().get('data', [])
        target_test = next((t for t in tests if t.get('id') == test_id), None)
        
        if target_test:
            print(f"\nTarget test details:")
            print(f"  ID: {target_test.get('id')}")
            print(f"  Title: {target_test.get('title')}")
            print(f"  TestType: {target_test.get('testType')}")
            print(f"  ExamId: {target_test.get('examId')}")
            print(f"  DomainId: {target_test.get('domainId')}")
            print(f"  IsPublished: {target_test.get('isPublished')}")
            print(f"  Status: {target_test.get('status')}")
            print(f"  Has PDF: {bool(target_test.get('pdfFileId'))}")
            
            # Check if we need to publish the test
            if not target_test.get('isPublished'):
                print("\n🔄 Publishing the test...")
                update_data = {"isPublished": True, "status": "Active"}
                response = admin_session.put(f"{BASE_URL}/api/admin/mock-tests/{test_id}", json=update_data)
                if response.status_code == 200:
                    print("✅ Test published")
                else:
                    print(f"❌ Failed to publish test: {response.status_code}")
            
            # Now test the API again
            print(f"\n🔍 Testing previous-year-tests API...")
            response = requests.get(f"{BASE_URL}/api/previous-year-tests?examId={exam_id}&domainId={domain_id}")
            if response.status_code == 200:
                api_tests = response.json().get('data', [])
                print(f"API returned {len(api_tests)} tests")
                
                target_in_api = next((t for t in api_tests if t.get('id') == test_id), None)
                if target_in_api:
                    print("✅ Target test found in API response")
                    print(f"  Has PDF metadata: {bool(target_in_api.get('pdfFileId'))}")
                    if target_in_api.get('pdfFileId'):
                        print(f"    PDF File ID: {target_in_api.get('pdfFileId')}")
                        print(f"    PDF Preview ID: {target_in_api.get('pdfPreviewFileId')}")
                        print(f"    PDF Filename: {target_in_api.get('pdfFileName')}")
                        print(f"    PDF Pages: {target_in_api.get('pdfPageCount')}")
                        print(f"    PDF Permission: {target_in_api.get('pdfPermission')}")
                else:
                    print("❌ Target test NOT found in API response")
                    print("Available tests in API:")
                    for test in api_tests:
                        print(f"  - {test.get('id')}: {test.get('title')}")
            else:
                print(f"❌ API call failed: {response.status_code}")
                print(f"Response: {response.text}")
        else:
            print("❌ Target test not found")
    else:
        print(f"❌ Failed to get mock tests: {response.status_code}")

if __name__ == "__main__":
    debug_api_issue()