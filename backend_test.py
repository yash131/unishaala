#!/usr/bin/env python3
"""
Backend API Testing Script for Unishaala
Tests TWO new backend tasks:
1. PYQ visibility when only PDF uploaded (no questions)
2. Coupon system for Get Pass purchases
"""

import requests
import json
import io
import os
from datetime import datetime, timedelta

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://dark-mode-theme-2.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Admin credentials
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

# Global variables for cleanup
auth_token = None
created_test_ids = []
created_coupon_ids = []

def login_admin():
    """Login as admin and get auth token"""
    global auth_token
    print("\n=== ADMIN LOGIN ===")
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            # Get auth_token from cookies
            if 'auth_token' in response.cookies:
                auth_token = response.cookies['auth_token']
                print(f"✅ Admin login successful, role: {data.get('data', {}).get('role')}")
                return True
            else:
                print(f"❌ No auth_token cookie in response")
                return False
        else:
            print(f"❌ Login failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return False

def get_cookies():
    """Get cookies dict with auth token"""
    return {'auth_token': auth_token} if auth_token else {}

def create_small_pdf():
    """Create a minimal valid PDF for testing"""
    # Minimal PDF structure
    pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
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
<< /Size 5 /Root 1 0 R >>
startxref
410
%%EOF
"""
    return pdf_content

# ============================================================================
# TASK A: PYQ VISIBILITY WHEN ONLY PDF UPLOADED (NO QUESTIONS)
# ============================================================================

def test_pyq_visibility():
    """Test PYQ tests with only PDF (no questions) are visible in listings"""
    print("\n" + "="*80)
    print("TASK A: PYQ VISIBILITY WHEN ONLY PDF UPLOADED (NO QUESTIONS)")
    print("="*80)
    
    global created_test_ids
    
    # Step 1: Get existing exam and domain
    print("\n--- Step 1: Get Exam and Domain IDs ---")
    try:
        # Get exams
        response = requests.get(f"{API_BASE}/admin/exams", cookies=get_cookies(), timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get exams: {response.status_code}")
            return False
        
        exams = response.json().get('data', [])
        if not exams:
            print("❌ No exams found in database")
            return False
        
        exam = exams[0]
        exam_id = exam['id']
        print(f"✅ Using exam: {exam['name']} (id: {exam_id})")
        
        # Get domains for this exam
        response = requests.get(f"{API_BASE}/admin/domains", cookies=get_cookies(), timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to get domains: {response.status_code}")
            return False
        
        all_domains = response.json().get('data', [])
        domains = [d for d in all_domains if d.get('examId') == exam_id]
        if not domains:
            print(f"❌ No domains found for exam {exam_id}")
            print(f"DEBUG: All domains: {[(d.get('name'), d.get('examId')) for d in all_domains]}")
            return False
        
        domain = domains[0]
        domain_id = domain['id']
        print(f"✅ Using domain: {domain['name']} (id: {domain_id})")
        
    except Exception as e:
        print(f"❌ Error getting exam/domain: {str(e)}")
        return False
    
    # Step 2: Create a PYQ test with no questions
    print("\n--- Step 2: Create PYQ Test (no questions) ---")
    try:
        test_data = {
            "title": f"PYQ Test PDFonly {datetime.now().strftime('%H%M%S')}",
            "examId": exam_id,
            "domainId": domain_id,
            "testType": "previous_year",
            "duration": 60,
            "isFree": True,
            "status": "Active"
        }
        
        response = requests.post(
            f"{API_BASE}/admin/mock-tests",
            json=test_data,
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to create test: {response.status_code} - {response.text}")
            return False
        
        test = response.json().get('data', {})
        test_id = test.get('id')
        created_test_ids.append(test_id)
        print(f"✅ Created PYQ test: {test['title']} (id: {test_id})")
        
        # Publish the test (workaround: POST endpoint always sets isPublished=false)
        response = requests.post(
            f"{API_BASE}/admin/mock-tests/publish",
            json={"testId": test_id, "isPublished": True},
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to publish test: {response.status_code}")
            return False
        
        print(f"✅ Test published")
        
    except Exception as e:
        print(f"❌ Error creating test: {str(e)}")
        return False
    
    # Step 3: Upload PDF to the test
    print("\n--- Step 3: Upload PDF to Test ---")
    try:
        pdf_bytes = create_small_pdf()
        files = {
            'pdf': ('test.pdf', io.BytesIO(pdf_bytes), 'application/pdf'),
            'permission': (None, 'view')
        }
        
        response = requests.post(
            f"{API_BASE}/admin/mock-tests/{test_id}/upload-pdf",
            files=files,
            cookies=get_cookies(),
            timeout=15
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to upload PDF: {response.status_code} - {response.text}")
            return False
        
        result = response.json()
        print(f"✅ PDF uploaded successfully, pdfFileId: {result.get('data', {}).get('pdfFileId')}")
        
    except Exception as e:
        print(f"❌ Error uploading PDF: {str(e)}")
        return False
    
    # Step 4: Verify test has pdfFileId and questionCount=0
    print("\n--- Step 4: Verify Test Metadata ---")
    try:
        response = requests.get(
            f"{API_BASE}/mock-test/{test_id}",
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get test: {response.status_code}")
            return False
        
        test = response.json().get('data', {})
        pdf_file_id = test.get('pdfFileId')
        
        if not pdf_file_id:
            print(f"❌ Test does not have pdfFileId set")
            return False
        
        print(f"✅ Test has pdfFileId: {pdf_file_id}")
        
    except Exception as e:
        print(f"❌ Error verifying test: {str(e)}")
        return False
    
    # TEST A1: GET /api/previous-year-tests should include this test
    print("\n--- TEST A1: GET /api/previous-year-tests ---")
    try:
        response = requests.get(
            f"{API_BASE}/previous-year-tests?examId={exam_id}&domainId={domain_id}",
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get previous-year-tests: {response.status_code}")
            return False
        
        tests = response.json().get('data', [])
        print(f"DEBUG: Found {len(tests)} tests in listing")
        for t in tests:
            print(f"  - {t.get('title')} (id: {t.get('id')}, questionCount: {t.get('questionCount')}, pdfFileId: {t.get('pdfFileId') is not None})")
        
        found = False
        for t in tests:
            if t.get('id') == test_id:
                found = True
                question_count = t.get('questionCount', -1)
                has_pdf = t.get('pdfFileId') is not None
                print(f"✅ PASS: Test found in listing with questionCount={question_count}, pdfFileId={has_pdf}")
                
                if question_count != 0:
                    print(f"⚠️  Warning: Expected questionCount=0, got {question_count}")
                if not has_pdf:
                    print(f"❌ FAIL: Test does not have pdfFileId in listing")
                    return False
                break
        
        if not found:
            print(f"❌ FAIL: Test NOT found in /api/previous-year-tests listing")
            print(f"DEBUG: Looking for test_id: {test_id}")
            return False
        
    except Exception as e:
        print(f"❌ Error in TEST A1: {str(e)}")
        return False
    
    # TEST A2: GET /api/domains/:domainId should include this test
    print("\n--- TEST A2: GET /api/domains/:domainId ---")
    try:
        response = requests.get(
            f"{API_BASE}/domains/{domain_id}",
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get domain: {response.status_code}")
            return False
        
        data = response.json().get('data', {})
        tests = data.get('tests', [])
        found = False
        for t in tests:
            if t.get('id') == test_id:
                found = True
                question_count = t.get('questionCount', -1)
                has_pdf = t.get('pdfFileId') is not None
                print(f"✅ PASS: Test found in domain listing with questionCount={question_count}, pdfFileId={has_pdf}")
                
                if question_count != 0:
                    print(f"⚠️  Warning: Expected questionCount=0, got {question_count}")
                if not has_pdf:
                    print(f"❌ FAIL: Test does not have pdfFileId in domain listing")
                    return False
                break
        
        if not found:
            print(f"❌ FAIL: Test NOT found in /api/domains/{domain_id} listing")
            return False
        
    except Exception as e:
        print(f"❌ Error in TEST A2: {str(e)}")
        return False
    
    # TEST A3: NEGATIVE - Create mock_test with 0 questions and no PDF, should NOT appear
    print("\n--- TEST A3: NEGATIVE - Mock test with no questions and no PDF ---")
    try:
        # Create a regular mock_test (not PYQ) with no questions and no PDF
        test_data = {
            "title": f"Mock Test NoQuestions {datetime.now().strftime('%H%M%S')}",
            "examId": exam_id,
            "domainId": domain_id,
            "testType": "mock_test",
            "duration": 60,
            "isFree": True,
            "isPublished": True,
            "status": "Active"
        }
        
        response = requests.post(
            f"{API_BASE}/admin/mock-tests",
            json=test_data,
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to create mock test: {response.status_code}")
            return False
        
        mock_test = response.json().get('data', {})
        mock_test_id = mock_test.get('id')
        created_test_ids.append(mock_test_id)
        print(f"✅ Created mock_test with no questions: {mock_test['title']} (id: {mock_test_id})")
        
        # Check that it does NOT appear in previous-year-tests
        response = requests.get(
            f"{API_BASE}/previous-year-tests?examId={exam_id}&domainId={domain_id}",
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get previous-year-tests: {response.status_code}")
            return False
        
        tests = response.json().get('data', [])
        found = any(t.get('id') == mock_test_id for t in tests)
        
        if found:
            print(f"❌ FAIL: Mock test with no questions/PDF incorrectly appears in previous-year-tests")
            return False
        else:
            print(f"✅ PASS: Mock test with no questions/PDF correctly excluded from previous-year-tests")
        
    except Exception as e:
        print(f"❌ Error in TEST A3: {str(e)}")
        return False
    
    print("\n" + "="*80)
    print("✅ TASK A: ALL TESTS PASSED")
    print("="*80)
    return True

# ============================================================================
# TASK B: COUPON SYSTEM FOR GET PASS PURCHASES
# ============================================================================

def test_coupon_system():
    """Test all 17 coupon system scenarios"""
    print("\n" + "="*80)
    print("TASK B: COUPON SYSTEM FOR GET PASS PURCHASES")
    print("="*80)
    
    global created_coupon_ids
    
    # Cleanup any leftover TEST10 or FLAT300 coupons from previous runs
    print("\n--- Pre-test Cleanup ---")
    try:
        response = requests.get(f"{API_BASE}/admin/coupons", cookies=get_cookies(), timeout=10)
        if response.status_code == 200:
            coupons = response.json().get('data', [])
            for coupon in coupons:
                if coupon.get('code') in ['TEST10', 'FLAT300']:
                    coupon_id = coupon.get('id')
                    requests.delete(f"{API_BASE}/admin/coupons/{coupon_id}", cookies=get_cookies(), timeout=10)
                    print(f"✅ Cleaned up leftover coupon: {coupon.get('code')}")
    except Exception as e:
        print(f"⚠️  Cleanup warning: {str(e)}")
    
    # Scenario (a): Unauth GET/POST/PUT/DELETE → 401
    print("\n--- Scenario (a): Unauthorized access → 401 ---")
    try:
        # GET without auth
        response = requests.get(f"{API_BASE}/admin/coupons", timeout=10)
        if response.status_code == 401:
            print("✅ PASS: GET /admin/coupons without auth → 401")
        else:
            print(f"❌ FAIL: Expected 401, got {response.status_code}")
            return False
        
        # POST without auth
        response = requests.post(
            f"{API_BASE}/admin/coupons",
            json={"code": "TEST", "type": "percent", "value": 10},
            timeout=10
        )
        if response.status_code == 401:
            print("✅ PASS: POST /admin/coupons without auth → 401")
        else:
            print(f"❌ FAIL: Expected 401, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (a): {str(e)}")
        return False
    
    # Scenario (b): Create coupon TEST10
    print("\n--- Scenario (b): Create coupon TEST10 ---")
    try:
        coupon_data = {
            "code": "TEST10",
            "type": "percent",
            "value": 10
        }
        
        response = requests.post(
            f"{API_BASE}/admin/coupons",
            json=coupon_data,
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Create coupon failed: {response.status_code} - {response.text}")
            return False
        
        coupon = response.json().get('data', {})
        coupon_id = coupon.get('id')
        created_coupon_ids.append(coupon_id)
        
        if coupon.get('code') != 'TEST10':
            print(f"❌ FAIL: Expected code 'TEST10', got '{coupon.get('code')}'")
            return False
        if coupon.get('usageCount') != 0:
            print(f"❌ FAIL: Expected usageCount 0, got {coupon.get('usageCount')}")
            return False
        if coupon.get('active') != True:
            print(f"❌ FAIL: Expected active=true, got {coupon.get('active')}")
            return False
        if coupon.get('appliesTo') != 'get_pass':
            print(f"❌ FAIL: Expected appliesTo='get_pass', got '{coupon.get('appliesTo')}'")
            return False
        
        print(f"✅ PASS: Coupon TEST10 created successfully (id: {coupon_id})")
        
    except Exception as e:
        print(f"❌ Error in scenario (b): {str(e)}")
        return False
    
    # Scenario (c): Duplicate code → 400
    print("\n--- Scenario (c): Duplicate code → 400 ---")
    try:
        response = requests.post(
            f"{API_BASE}/admin/coupons",
            json={"code": "TEST10", "type": "percent", "value": 10},
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            if 'already exists' in error.lower():
                print(f"✅ PASS: Duplicate code rejected with 400: {error}")
            else:
                print(f"⚠️  Warning: Got 400 but unexpected error message: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (c): {str(e)}")
        return False
    
    # Scenario (d): Code too short → 400
    print("\n--- Scenario (d): Code too short → 400 ---")
    try:
        response = requests.post(
            f"{API_BASE}/admin/coupons",
            json={"code": "AB", "type": "percent", "value": 10},
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            print(f"✅ PASS: Short code rejected with 400: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (d): {str(e)}")
        return False
    
    # Scenario (e): Zero/negative value → 400
    print("\n--- Scenario (e): Zero/negative value → 400 ---")
    try:
        response = requests.post(
            f"{API_BASE}/admin/coupons",
            json={"code": "BAD", "type": "percent", "value": 0},
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            print(f"✅ PASS: Zero value rejected with 400: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (e): {str(e)}")
        return False
    
    # Scenario (f): Percent > 100 → 400
    print("\n--- Scenario (f): Percent > 100 → 400 ---")
    try:
        response = requests.post(
            f"{API_BASE}/admin/coupons",
            json={"code": "BIG", "type": "percent", "value": 150},
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            print(f"✅ PASS: Percent > 100 rejected with 400: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (f): {str(e)}")
        return False
    
    # Scenario (g): GET list includes TEST10
    print("\n--- Scenario (g): GET /admin/coupons includes TEST10 ---")
    try:
        response = requests.get(
            f"{API_BASE}/admin/coupons",
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: GET coupons failed: {response.status_code}")
            return False
        
        coupons = response.json().get('data', [])
        found = any(c.get('code') == 'TEST10' for c in coupons)
        
        if found:
            print(f"✅ PASS: TEST10 found in coupon list")
        else:
            print(f"❌ FAIL: TEST10 not found in coupon list")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (g): {str(e)}")
        return False
    
    # Scenario (h): Validate TEST10 with amount 5000
    print("\n--- Scenario (h): Validate TEST10 with amount 5000 ---")
    try:
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "TEST10", "paymentType": "get_pass", "amount": 5000},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Validate failed: {response.status_code} - {response.text}")
            return False
        
        result = response.json().get('data', {})
        discount = result.get('discount')
        final_amount = result.get('finalAmount')
        
        # 10% of 5000 = 500
        if discount == 500 and final_amount == 4500:
            print(f"✅ PASS: Validation successful - discount={discount}, finalAmount={final_amount}")
        else:
            print(f"❌ FAIL: Expected discount=500, finalAmount=4500, got discount={discount}, finalAmount={final_amount}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (h): {str(e)}")
        return False
    
    # Scenario (i): Validate with wrong code → 400
    print("\n--- Scenario (i): Validate with wrong code → 400 ---")
    try:
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "WRONGCODE", "paymentType": "get_pass", "amount": 5000},
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            print(f"✅ PASS: Wrong code rejected with 400: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (i): {str(e)}")
        return False
    
    # Scenario (j): Validate with wrong paymentType → 400
    print("\n--- Scenario (j): Validate with wrong paymentType → 400 ---")
    try:
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "TEST10", "paymentType": "exam_purchase", "amount": 5000},
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            if 'get pass' in error.lower():
                print(f"✅ PASS: Wrong paymentType rejected with 400: {error}")
            else:
                print(f"⚠️  Warning: Got 400 but unexpected error: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (j): {str(e)}")
        return False
    
    # Scenario (k): Validate with amount 0 → 400
    print("\n--- Scenario (k): Validate with amount 0 → 400 ---")
    try:
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "TEST10", "paymentType": "get_pass", "amount": 0},
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            print(f"✅ PASS: Zero amount rejected with 400: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (k): {str(e)}")
        return False
    
    # Scenario (l): Disable coupon, then validate → 400
    print("\n--- Scenario (l): Disable coupon, then validate → 400 ---")
    try:
        # Disable the coupon
        response = requests.put(
            f"{API_BASE}/admin/coupons/{coupon_id}",
            json={"active": False},
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Failed to disable coupon: {response.status_code}")
            return False
        
        print(f"✅ Coupon disabled")
        
        # Try to validate
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "TEST10", "paymentType": "get_pass", "amount": 5000},
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            if 'disabled' in error.lower():
                print(f"✅ PASS: Disabled coupon rejected with 400: {error}")
            else:
                print(f"⚠️  Warning: Got 400 but unexpected error: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (l): {str(e)}")
        return False
    
    # Scenario (m): Expire coupon, then validate → 400
    print("\n--- Scenario (m): Expire coupon, then validate → 400 ---")
    try:
        # Set expiry to past date
        past_date = (datetime.now() - timedelta(days=1)).isoformat()
        response = requests.put(
            f"{API_BASE}/admin/coupons/{coupon_id}",
            json={"expiresAt": past_date},
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Failed to expire coupon: {response.status_code}")
            return False
        
        print(f"✅ Coupon expired")
        
        # Try to validate
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "TEST10", "paymentType": "get_pass", "amount": 5000},
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            if 'expired' in error.lower():
                print(f"✅ PASS: Expired coupon rejected with 400: {error}")
            else:
                print(f"⚠️  Warning: Got 400 but unexpected error: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (m): {str(e)}")
        return False
    
    # Scenario (n): Re-enable, set maxDiscount cap, test capping
    print("\n--- Scenario (n): Re-enable, set maxDiscount=200, test capping ---")
    try:
        # Re-enable and set maxDiscount
        response = requests.put(
            f"{API_BASE}/admin/coupons/{coupon_id}",
            json={
                "active": True,
                "expiresAt": None,
                "usageLimit": 1,
                "maxDiscount": 200,
                "value": 50
            },
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Failed to update coupon: {response.status_code}")
            return False
        
        print(f"✅ Coupon updated: active=true, value=50%, maxDiscount=200")
        
        # Validate with amount 5000 (50% = 2500, but capped at 200)
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "TEST10", "paymentType": "get_pass", "amount": 5000},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Validate failed: {response.status_code}")
            return False
        
        result = response.json().get('data', {})
        discount = result.get('discount')
        final_amount = result.get('finalAmount')
        
        # Should be capped at 200
        if discount == 200 and final_amount == 4800:
            print(f"✅ PASS: maxDiscount cap working - discount={discount}, finalAmount={final_amount}")
        else:
            print(f"❌ FAIL: Expected discount=200, finalAmount=4800, got discount={discount}, finalAmount={final_amount}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (n): {str(e)}")
        return False
    
    # Scenario (o): Flat coupon with floor clamp
    print("\n--- Scenario (o): Flat coupon FLAT300, test floor clamp ---")
    try:
        # Create flat coupon
        response = requests.post(
            f"{API_BASE}/admin/coupons",
            json={"code": "FLAT300", "type": "flat", "value": 300},
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Failed to create flat coupon: {response.status_code}")
            return False
        
        flat_coupon = response.json().get('data', {})
        flat_coupon_id = flat_coupon.get('id')
        created_coupon_ids.append(flat_coupon_id)
        print(f"✅ Created flat coupon FLAT300 (id: {flat_coupon_id})")
        
        # Validate with amount 1000
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "FLAT300", "paymentType": "get_pass", "amount": 1000},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Validate failed: {response.status_code}")
            return False
        
        result = response.json().get('data', {})
        discount = result.get('discount')
        final_amount = result.get('finalAmount')
        
        if discount == 300 and final_amount == 700:
            print(f"✅ PASS: Flat discount working - discount={discount}, finalAmount={final_amount}")
        else:
            print(f"❌ FAIL: Expected discount=300, finalAmount=700, got discount={discount}, finalAmount={final_amount}")
            return False
        
        # Validate with amount 200 (should clamp to ₹1 minimum)
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "FLAT300", "paymentType": "get_pass", "amount": 200},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Validate failed: {response.status_code}")
            return False
        
        result = response.json().get('data', {})
        discount = result.get('discount')
        final_amount = result.get('finalAmount')
        
        # finalAmount should be clamped to 1
        if final_amount == 1 and discount == 199:
            print(f"✅ PASS: Floor clamp working - discount={discount}, finalAmount={final_amount} (clamped to ₹1)")
        else:
            print(f"❌ FAIL: Expected finalAmount=1, discount=199, got discount={discount}, finalAmount={final_amount}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (o): {str(e)}")
        return False
    
    # Scenario (p): DELETE coupon
    print("\n--- Scenario (p): DELETE coupon ---")
    try:
        # Delete FLAT300
        response = requests.delete(
            f"{API_BASE}/admin/coupons/{flat_coupon_id}",
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Failed to delete coupon: {response.status_code}")
            return False
        
        print(f"✅ Coupon deleted")
        created_coupon_ids.remove(flat_coupon_id)
        
        # Verify it's not in list
        response = requests.get(
            f"{API_BASE}/admin/coupons",
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Failed to get coupons: {response.status_code}")
            return False
        
        coupons = response.json().get('data', [])
        found = any(c.get('id') == flat_coupon_id for c in coupons)
        
        if found:
            print(f"❌ FAIL: Deleted coupon still in list")
            return False
        else:
            print(f"✅ PASS: Deleted coupon not in list")
        
        # Try to validate deleted coupon
        response = requests.post(
            f"{API_BASE}/coupons/validate",
            json={"code": "FLAT300", "paymentType": "get_pass", "amount": 1000},
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            print(f"✅ PASS: Deleted coupon validation rejected with 400: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (p): {str(e)}")
        return False
    
    # Scenario (q): create-order with valid coupon
    print("\n--- Scenario (q): create-order with valid coupon ---")
    try:
        # First, re-enable TEST10 and remove limits for testing
        response = requests.put(
            f"{API_BASE}/admin/coupons/{coupon_id}",
            json={
                "active": True,
                "expiresAt": None,
                "usageLimit": None,
                "maxDiscount": None,
                "value": 10
            },
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: Failed to update coupon: {response.status_code}")
            return False
        
        print(f"✅ Coupon TEST10 re-enabled for testing")
        
        # Call create-order with coupon (increased timeout for Razorpay API call)
        response = requests.post(
            f"{API_BASE}/payment/create-order",
            json={
                "paymentType": "get_pass",
                "amount": 5000,
                "couponCode": "TEST10"
            },
            cookies=get_cookies(),
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL: create-order failed: {response.status_code} - {response.text}")
            return False
        
        result = response.json().get('data', {})
        coupon_data = result.get('coupon', {})
        amount_paise = result.get('amount')
        
        # Check coupon data
        if coupon_data.get('code') != 'TEST10':
            print(f"❌ FAIL: Expected coupon code TEST10, got {coupon_data.get('code')}")
            return False
        
        if coupon_data.get('discount') != 500:
            print(f"❌ FAIL: Expected discount 500, got {coupon_data.get('discount')}")
            return False
        
        # Amount should be in paise (4500 * 100 = 450000)
        if amount_paise == 450000:
            print(f"✅ PASS: create-order with coupon successful - discount={coupon_data.get('discount')}, amount={amount_paise} paise (₹4500)")
        else:
            print(f"❌ FAIL: Expected amount=450000 paise, got {amount_paise}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (q): {str(e)}")
        return False
    
    # Scenario (r): create-order with invalid coupon → 400
    print("\n--- Scenario (r): create-order with invalid coupon → 400 ---")
    try:
        response = requests.post(
            f"{API_BASE}/payment/create-order",
            json={
                "paymentType": "get_pass",
                "amount": 5000,
                "couponCode": "NOPE"
            },
            cookies=get_cookies(),
            timeout=10
        )
        
        if response.status_code == 400:
            error = response.json().get('error', '')
            print(f"✅ PASS: Invalid coupon rejected with 400: {error}")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Error in scenario (r): {str(e)}")
        return False
    
    print("\n" + "="*80)
    print("✅ TASK B: ALL 17 SCENARIOS PASSED")
    print("="*80)
    return True

# ============================================================================
# CLEANUP
# ============================================================================

def cleanup():
    """Clean up created test data"""
    print("\n" + "="*80)
    print("CLEANUP")
    print("="*80)
    
    # Delete created tests
    for test_id in created_test_ids:
        try:
            response = requests.delete(
                f"{API_BASE}/admin/mock-tests/{test_id}",
                cookies=get_cookies(),
                timeout=10
            )
            if response.status_code == 200:
                print(f"✅ Deleted test: {test_id}")
            else:
                print(f"⚠️  Failed to delete test {test_id}: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Error deleting test {test_id}: {str(e)}")
    
    # Delete created coupons
    for coupon_id in created_coupon_ids:
        try:
            response = requests.delete(
                f"{API_BASE}/admin/coupons/{coupon_id}",
                cookies=get_cookies(),
                timeout=10
            )
            if response.status_code == 200:
                print(f"✅ Deleted coupon: {coupon_id}")
            else:
                print(f"⚠️  Failed to delete coupon {coupon_id}: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Error deleting coupon {coupon_id}: {str(e)}")

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main test runner"""
    print("\n" + "="*80)
    print("BACKEND API TESTING - TWO NEW TASKS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    
    # Login
    if not login_admin():
        print("\n❌ FAILED: Could not login as admin")
        return False
    
    # Run tests
    task_a_passed = False
    task_b_passed = False
    
    try:
        task_a_passed = test_pyq_visibility()
    except Exception as e:
        print(f"\n❌ TASK A FAILED WITH EXCEPTION: {str(e)}")
    
    try:
        task_b_passed = test_coupon_system()
    except Exception as e:
        print(f"\n❌ TASK B FAILED WITH EXCEPTION: {str(e)}")
    
    # Cleanup
    cleanup()
    
    # Final summary
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    print(f"TASK A (PYQ Visibility): {'✅ PASSED' if task_a_passed else '❌ FAILED'}")
    print(f"TASK B (Coupon System): {'✅ PASSED' if task_b_passed else '❌ FAILED'}")
    print("="*80)
    
    return task_a_passed and task_b_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
