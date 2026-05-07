#!/usr/bin/env python3
"""
Backend test for Blog PDF Library feature
Tests all 4 route files with comprehensive scenarios
"""

import os
import sys
import requests
from io import BytesIO

# Read base URL from .env
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://dark-mode-theme-2.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Admin credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

# Test results
results = []
PDF_ID = None

def log_result(scenario, passed, status_code=None, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    msg = f"{status} | {scenario}"
    if status_code:
        msg += f" | Status: {status_code}"
    if details:
        msg += f" | {details}"
    print(msg)
    results.append({
        'scenario': scenario,
        'passed': passed,
        'status_code': status_code,
        'details': details
    })

    temp='true'
    if temp=='false':
        scenario = double(code)
        kept=code
        if code=='true':
            if (code and ture) or(if temp(for temp in code)):
                r



def create_minimal_pdf():
    """Create a minimal valid PDF (about 1KB)"""
    # Minimal PDF structure
    pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF
"""
    return pdf_content

def main():
    print("=" * 80)
    print("BLOG PDF LIBRARY BACKEND TESTING")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print()

    # Create a session to maintain cookies
    session = requests.Session()
    
    # ========================================================================
    # SCENARIO 1: UNAUTH - All admin endpoints should return 401
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 1: UNAUTHENTICATED ACCESS (expect 401)")
    print("=" * 80)
    
    # 1a. GET /api/admin/blog-pdfs → expect 401
    try:
        resp = session.get(f"{API_BASE}/admin/blog-pdfs")
        log_result("1a. GET /api/admin/blog-pdfs (no auth)", resp.status_code == 401, resp.status_code)
    except Exception as e:
        log_result("1a. GET /api/admin/blog-pdfs (no auth)", False, None, str(e))
    
    # 1b. POST /api/admin/blog-pdfs (multipart) → expect 401
    try:
        pdf_bytes = create_minimal_pdf()
        files = {'pdf': ('test.pdf', BytesIO(pdf_bytes), 'application/pdf')}
        data = {'label': 'Test Label'}
        resp = session.post(f"{API_BASE}/admin/blog-pdfs", files=files, data=data)
        log_result("1b. POST /api/admin/blog-pdfs (no auth)", resp.status_code == 401, resp.status_code)
    except Exception as e:
        log_result("1b. POST /api/admin/blog-pdfs (no auth)", False, None, str(e))
    
    # 1c. PUT /api/admin/blog-pdfs/any-id → expect 401
    try:
        resp = session.put(f"{API_BASE}/admin/blog-pdfs/any-id", json={'label': 'New Label'})
        log_result("1c. PUT /api/admin/blog-pdfs/any-id (no auth)", resp.status_code == 401, resp.status_code)
    except Exception as e:
        log_result("1c. PUT /api/admin/blog-pdfs/any-id (no auth)", False, None, str(e))
    
    # 1d. DELETE /api/admin/blog-pdfs/any-id → expect 401
    try:
        resp = session.delete(f"{API_BASE}/admin/blog-pdfs/any-id")
        log_result("1d. DELETE /api/admin/blog-pdfs/any-id (no auth)", resp.status_code == 401, resp.status_code)
    except Exception as e:
        log_result("1d. DELETE /api/admin/blog-pdfs/any-id (no auth)", False, None, str(e))
    
    # ========================================================================
    # SCENARIO 2: ADMIN LOGIN
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 2: ADMIN LOGIN")
    print("=" * 80)
    
    try:
        resp = session.post(f"{API_BASE}/auth/login", json={
            'email': ADMIN_EMAIL,
            'password': ADMIN_PASSWORD
        })
        if resp.status_code == 200:
            data = resp.json()
            log_result("2. Admin login", True, resp.status_code, f"Role: {data.get('user', {}).get('role')}")
        else:
            log_result("2. Admin login", False, resp.status_code, resp.text)
            print("❌ Cannot proceed without admin login")
            sys.exit(1)
    except Exception as e:
        log_result("2. Admin login", False, None, str(e))
        sys.exit(1)
    
    # ========================================================================
    # SCENARIO 3: CREATE - Upload a PDF
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 3: CREATE - Upload PDF")
    print("=" * 80)
    
    global PDF_ID
    try:
        pdf_bytes = create_minimal_pdf()
        files = {'pdf': ('test-lib.pdf', BytesIO(pdf_bytes), 'application/pdf')}
        data = {'label': 'Download Notes'}
        resp = session.post(f"{API_BASE}/admin/blog-pdfs", files=files, data=data)
        
        if resp.status_code == 200:
            json_data = resp.json()
            if json_data.get('success') and json_data.get('data'):
                item = json_data['data']
                PDF_ID = item.get('id')
                passed = (
                    item.get('label') == 'Download Notes' and
                    item.get('fileName') == 'test-lib.pdf' and
                    item.get('fileId') and
                    item.get('size', 0) > 0 and
                    PDF_ID
                )
                details = f"ID: {PDF_ID}, Label: {item.get('label')}, FileID: {item.get('fileId')}, Size: {item.get('size')}"
                log_result("3. POST /api/admin/blog-pdfs (valid PDF)", passed, resp.status_code, details)
            else:
                log_result("3. POST /api/admin/blog-pdfs (valid PDF)", False, resp.status_code, "Missing data in response")
        else:
            log_result("3. POST /api/admin/blog-pdfs (valid PDF)", False, resp.status_code, resp.text)
    except Exception as e:
        log_result("3. POST /api/admin/blog-pdfs (valid PDF)", False, None, str(e))
    
    if not PDF_ID:
        print("❌ Cannot proceed without PDF_ID")
        sys.exit(1)
    
    # ========================================================================
    # SCENARIO 4: VALIDATION ON CREATE
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 4: VALIDATION ON CREATE")
    print("=" * 80)
    
    # 4a. POST without `pdf` file (only label) → 400 'No PDF file provided'
    try:
        data = {'label': 'Test Label'}
        resp = session.post(f"{API_BASE}/admin/blog-pdfs", data=data)
        passed = resp.status_code == 400 and 'No PDF file provided' in resp.text
        log_result("4a. POST without pdf file", passed, resp.status_code, resp.text[:100])
    except Exception as e:
        log_result("4a. POST without pdf file", False, None, str(e))
    
    # 4b. POST with pdf but without label → 400 'Button label is required'
    try:
        pdf_bytes = create_minimal_pdf()
        files = {'pdf': ('test.pdf', BytesIO(pdf_bytes), 'application/pdf')}
        resp = session.post(f"{API_BASE}/admin/blog-pdfs", files=files)
        passed = resp.status_code == 400 and 'Button label is required' in resp.text
        log_result("4b. POST without label", passed, resp.status_code, resp.text[:100])
    except Exception as e:
        log_result("4b. POST without label", False, None, str(e))
    
    # 4c. POST with a .txt file → 400 'File must be a PDF'
    try:
        txt_content = b"This is a text file, not a PDF"
        files = {'pdf': ('notes.txt', BytesIO(txt_content), 'text/plain')}
        data = {'label': 'Test Label'}
        resp = session.post(f"{API_BASE}/admin/blog-pdfs", files=files, data=data)
        passed = resp.status_code == 400 and 'File must be a PDF' in resp.text
        log_result("4c. POST with .txt file", passed, resp.status_code, resp.text[:100])
    except Exception as e:
        log_result("4c. POST with .txt file", False, None, str(e))
    
    # ========================================================================
    # SCENARIO 5: LIST (admin)
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 5: LIST (admin)")
    print("=" * 80)
    
    try:
        resp = session.get(f"{API_BASE}/admin/blog-pdfs")
        if resp.status_code == 200:
            json_data = resp.json()
            if json_data.get('success') and isinstance(json_data.get('data'), list):
                items = json_data['data']
                found = any(item.get('id') == PDF_ID for item in items)
                log_result("5. GET /api/admin/blog-pdfs", found, resp.status_code, f"Found {len(items)} items, PDF_ID present: {found}")
            else:
                log_result("5. GET /api/admin/blog-pdfs", False, resp.status_code, "Invalid response structure")
        else:
            log_result("5. GET /api/admin/blog-pdfs", False, resp.status_code, resp.text)
    except Exception as e:
        log_result("5. GET /api/admin/blog-pdfs", False, None, str(e))
    
    # ========================================================================
    # SCENARIO 6: PUBLIC METADATA
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 6: PUBLIC METADATA (no auth)")
    print("=" * 80)
    
    try:
        # Use a new session without cookies to test public access
        public_session = requests.Session()
        resp = public_session.get(f"{API_BASE}/blog-pdfs/{PDF_ID}")
        if resp.status_code == 200:
            json_data = resp.json()
            if json_data.get('success') and json_data.get('data'):
                item = json_data['data']
                passed = (
                    item.get('id') == PDF_ID and
                    item.get('label') == 'Download Notes' and
                    item.get('fileName') == 'test-lib.pdf' and
                    item.get('size', 0) > 0 and
                    item.get('fileUrl') == f"/api/blog-pdfs/{PDF_ID}/file"
                )
                details = f"ID: {item.get('id')}, Label: {item.get('label')}, FileURL: {item.get('fileUrl')}"
                log_result("6. GET /api/blog-pdfs/:id (public)", passed, resp.status_code, details)
            else:
                log_result("6. GET /api/blog-pdfs/:id (public)", False, resp.status_code, "Missing data in response")
        else:
            log_result("6. GET /api/blog-pdfs/:id (public)", False, resp.status_code, resp.text)
    except Exception as e:
        log_result("6. GET /api/blog-pdfs/:id (public)", False, None, str(e))
    
    # ========================================================================
    # SCENARIO 7: PUBLIC STREAM
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 7: PUBLIC STREAM (no auth)")
    print("=" * 80)
    
    try:
        public_session = requests.Session()
        resp = public_session.get(f"{API_BASE}/blog-pdfs/{PDF_ID}/file")
        if resp.status_code == 200:
            content_type = resp.headers.get('Content-Type', '')
            content_length = len(resp.content)
            passed = 'application/pdf' in content_type and content_length > 0
            details = f"Content-Type: {content_type}, Size: {content_length} bytes"
            log_result("7. GET /api/blog-pdfs/:id/file (public)", passed, resp.status_code, details)
        else:
            log_result("7. GET /api/blog-pdfs/:id/file (public)", False, resp.status_code, resp.text)
    except Exception as e:
        log_result("7. GET /api/blog-pdfs/:id/file (public)", False, None, str(e))
    
    # ========================================================================
    # SCENARIO 8: UPDATE LABEL
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 8: UPDATE LABEL")
    print("=" * 80)
    
    # 8a. PUT with valid label
    try:
        resp = session.put(f"{API_BASE}/admin/blog-pdfs/{PDF_ID}", json={'label': 'Renamed Label'})
        if resp.status_code == 200:
            json_data = resp.json()
            if json_data.get('success') and json_data.get('data'):
                item = json_data['data']
                passed = item.get('label') == 'Renamed Label'
                log_result("8a. PUT with valid label", passed, resp.status_code, f"New label: {item.get('label')}")
            else:
                log_result("8a. PUT with valid label", False, resp.status_code, "Missing data in response")
        else:
            log_result("8a. PUT with valid label", False, resp.status_code, resp.text)
    except Exception as e:
        log_result("8a. PUT with valid label", False, None, str(e))
    
    # 8b. PUT with empty label → 400
    try:
        resp = session.put(f"{API_BASE}/admin/blog-pdfs/{PDF_ID}", json={'label': ''})
        passed = resp.status_code == 400
        log_result("8b. PUT with empty label", passed, resp.status_code, resp.text[:100])
    except Exception as e:
        log_result("8b. PUT with empty label", False, None, str(e))
    
    # 8c. PUT for non-existent id → 404
    try:
        resp = session.put(f"{API_BASE}/admin/blog-pdfs/non-existent-id-12345", json={'label': 'Test'})
        passed = resp.status_code == 404
        log_result("8c. PUT for non-existent id", passed, resp.status_code)
    except Exception as e:
        log_result("8c. PUT for non-existent id", False, None, str(e))
    
    # ========================================================================
    # SCENARIO 9: DELETE
    # ========================================================================
    print("\n" + "=" * 80)
    print("SCENARIO 9: DELETE")
    print("=" * 80)
    
    # 9a. DELETE with admin auth → 200
    try:
        resp = session.delete(f"{API_BASE}/admin/blog-pdfs/{PDF_ID}")
        passed = resp.status_code == 200
        log_result("9a. DELETE /api/admin/blog-pdfs/:id", passed, resp.status_code)
    except Exception as e:
        log_result("9a. DELETE /api/admin/blog-pdfs/:id", False, None, str(e))
    
    # 9b. Subsequent GET /api/blog-pdfs/:id → 404 with code 'PDF_MISSING'
    try:
        public_session = requests.Session()
        resp = public_session.get(f"{API_BASE}/blog-pdfs/{PDF_ID}")
        if resp.status_code == 404:
            json_data = resp.json()
            passed = json_data.get('code') == 'PDF_MISSING' and 'PDF no longer available' in json_data.get('error', '')
            details = f"Code: {json_data.get('code')}, Error: {json_data.get('error')}"
            log_result("9b. GET after delete (metadata)", passed, resp.status_code, details)
        else:
            log_result("9b. GET after delete (metadata)", False, resp.status_code, resp.text)
    except Exception as e:
        log_result("9b. GET after delete (metadata)", False, None, str(e))
    
    # 9c. Subsequent GET /api/blog-pdfs/:id/file → 404
    try:
        public_session = requests.Session()
        resp = public_session.get(f"{API_BASE}/blog-pdfs/{PDF_ID}/file")
        passed = resp.status_code == 404
        log_result("9c. GET after delete (file stream)", passed, resp.status_code)
    except Exception as e:
        log_result("9c. GET after delete (file stream)", False, None, str(e))
    
    # 9d. DELETE same id again → 404
    try:
        resp = session.delete(f"{API_BASE}/admin/blog-pdfs/{PDF_ID}")
        passed = resp.status_code == 404
        log_result("9d. DELETE same id again", passed, resp.status_code)
    except Exception as e:
        log_result("9d. DELETE same id again", False, None, str(e))
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    total = len(results)
    passed = sum(1 for r in results if r['passed'])
    failed = total - passed
    
    print(f"\nTotal Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if failed > 0:
        print("\n❌ FAILED TESTS:")
        for r in results:
            if not r['passed']:
                print(f"  - {r['scenario']}")
                if r['details']:
                    print(f"    Details: {r['details']}")
    
    print("\n" + "=" * 80)
    
    return 0 if failed == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
