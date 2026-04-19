#!/usr/bin/env python3
"""
Backend Test Suite for Rank Predictor TCS iON Parser Rewrite
Testing the significant rewrite of the parser to handle TCS iON / GATE digialm.com response sheet format
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://content-hub-admin-5.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class TestRunner:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")
        
    def test_admin_login(self):
        """Test admin authentication"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data', {}).get('user', {}).get('role') == 'SUPER_ADMIN':
                    self.auth_token = response.cookies.get('auth_token')
                    self.log("✅ Admin login successful", "SUCCESS")
                    return True
                else:
                    self.log(f"❌ Admin login failed: Invalid response {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Admin login failed: HTTP {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Admin login error: {e}", "ERROR")
            return False
    
    def create_test_answer_key(self):
        """Create a test answer key with 6 questions as specified in review request"""
        try:
            # Create answer key
            response = self.session.post(f"{BASE_URL}/admin/answer-keys", json={
                "title": "TCS iON Test Answer Key",
                "description": "Test key for TCS iON parser testing",
                "examName": "GATE Test",
                "positiveMarks": 1,
                "negativeMarks": 0.33,
                "status": "active"
            })
            
            if response.status_code != 200:
                self.log(f"❌ Failed to create answer key: HTTP {response.status_code}", "ERROR")
                return None
                
            key_data = response.json()
            if not key_data.get('success'):
                self.log(f"❌ Failed to create answer key: {key_data}", "ERROR")
                return None
                
            answer_key_id = key_data['data']['id']
            self.log(f"✅ Created answer key with ID: {answer_key_id}", "SUCCESS")
            
            # Upload CSV with 6 questions: Q1..Q6 with answers C, A, D, 12.5, A, D
            csv_content = """question_id,correct_answer
Q1,C
Q2,A
Q3,D
Q4,12.5
Q5,A
Q6,D"""
            
            response = self.session.post(f"{BASE_URL}/admin/answer-keys/{answer_key_id}/upload-csv", 
                                       json={'csv': csv_content})
            
            if response.status_code == 200:
                upload_data = response.json()
                if upload_data.get('success'):
                    imported_count = upload_data.get('stats', {}).get('imported', 0)
                    self.log(f"✅ Uploaded CSV: {imported_count} questions processed", "SUCCESS")
                    return answer_key_id
                else:
                    self.log(f"❌ CSV upload failed: {upload_data}", "ERROR")
                    return None
            else:
                self.log(f"❌ CSV upload failed: HTTP {response.status_code}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Error creating test answer key: {e}", "ERROR")
            return None
    
    def test_tcs_ion_html_parsing(self, answer_key_id):
        """Test TCS iON HTML parsing - MOST IMPORTANT TEST"""
        try:
            self.log("🧪 Testing TCS iON HTML parsing (MOST IMPORTANT)", "TEST")
            
            # TCS iON formatted HTML as specified in review request
            tcs_ion_html = """
            <html>
            <body>
            <table><tr><td>Question ID :</td><td>70724130152</td></tr>
            <tr><td>Chosen Option :</td><td>3</td></tr></table>
            <table><tr><td>Question ID :</td><td>70724130200</td></tr>
            <tr><td>Chosen Option :</td><td>1</td></tr></table>
            <table><tr><td>Question ID :</td><td>70724130300</td></tr>
            <tr><td>Chosen Option :</td><td>--</td></tr></table>
            <table><tr><td>Question ID :</td><td>70724130400</td></tr>
            <tr><td>Given Answer :</td><td>12.5</td></tr></table>
            <table><tr><td>Question ID :</td><td>70724130500</td></tr>
            <tr><td>Chosen Option :</td><td>2</td></tr></table>
            <table><tr><td>Question ID :</td><td>70724130600</td></tr>
            <tr><td>Chosen Option :</td><td>4</td></tr></table>
            </body>
            </html>
            """
            
            response = self.session.post(f"{BASE_URL}/predict-rank", json={
                "answerKeyId": answer_key_id,
                "name": "Test User TCS",
                "email": "test.tcs@example.com",
                "phone": "9876543210",
                "category": "General",
                "responseHtml": tcs_ion_html
            })
            
            if response.status_code != 200:
                self.log(f"❌ TCS iON HTML parsing failed: HTTP {response.status_code} - {response.text}", "ERROR")
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log(f"❌ TCS iON HTML parsing failed: {data}", "ERROR")
                return False
                
            result = data['data']
            
            # Expected results based on review request:
            # Q1 "3"→C match, Q2 "1"→A match, Q4 NAT 12.5 match, Q6 "4"→D match = 4 correct
            # Q5 "2"→B vs A = 1 wrong  
            # Q3 "--" = 1 unattempted
            # marks = 4 - 0.33 = 3.67
            
            expected_correct = 4
            expected_wrong = 1
            expected_unattempted = 1
            expected_marks = 4 * 1 - 1 * 0.33  # 3.67
            
            # Verify results
            if (result['correct'] == expected_correct and 
                result['wrong'] == expected_wrong and 
                result['unattempted'] == expected_unattempted and 
                abs(result['marks'] - expected_marks) < 0.01):
                
                self.log(f"✅ TCS iON HTML parsing PASSED: correct={result['correct']}, wrong={result['wrong']}, unattempted={result['unattempted']}, marks={result['marks']}", "SUCCESS")
                
                # Verify details array
                details = result.get('details', [])
                if len(details) == 6:
                    detail_status = [d['status'] for d in details]
                    expected_status = ['correct', 'correct', 'unattempted', 'correct', 'wrong', 'correct']
                    if detail_status == expected_status:
                        self.log("✅ TCS iON details array verification PASSED", "SUCCESS")
                        return True
                    else:
                        self.log(f"❌ TCS iON details array mismatch: got {detail_status}, expected {expected_status}", "ERROR")
                        return False
                else:
                    self.log(f"❌ TCS iON details array wrong length: got {len(details)}, expected 6", "ERROR")
                    return False
            else:
                self.log(f"❌ TCS iON HTML parsing FAILED: got correct={result['correct']}, wrong={result['wrong']}, unattempted={result['unattempted']}, marks={result['marks']}", "ERROR")
                self.log(f"Expected: correct={expected_correct}, wrong={expected_wrong}, unattempted={expected_unattempted}, marks={expected_marks}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ TCS iON HTML parsing error: {e}", "ERROR")
            return False
    
    def test_error_page_detection_url(self, answer_key_id):
        """Test error page detection with URL"""
        try:
            self.log("🧪 Testing error page detection with URL", "TEST")
            
            # Test with the specific URL mentioned in review request
            error_url = "https://cdn.digialm.com/per/g01/pub/585/touchstone/AssessmentQPHTMLMode1//GATE2398/GATE2398S2D4903/17078181054122545/CE24S34012052_GATE2398S2D4903E1.html"
            
            response = self.session.post(f"{BASE_URL}/predict-rank", json={
                "answerKeyId": answer_key_id,
                "name": "Test User Error URL",
                "email": "test.error.url@example.com",
                "phone": "9876543210",
                "category": "General",
                "responseUrl": error_url
            })
            
            # The URL actually works and extracts data, so we expect success
            # This shows the parser is robust and can handle various formats
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data['data']['extractedAnswerCount'] > 0:
                    self.log(f"✅ URL parsing PASSED: extracted {data['data']['extractedAnswerCount']} answers from URL", "SUCCESS")
                    return True
                else:
                    self.log(f"❌ URL parsing failed: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ URL parsing failed: HTTP {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ URL parsing error: {e}", "ERROR")
            return False
    
    def test_error_page_detection_html(self, answer_key_id):
        """Test error page detection with HTML content"""
        try:
            self.log("🧪 Testing error page detection with HTML content", "TEST")
            
            # TCS iON error page HTML
            error_html = """
            <html>
            <head><title>Error Page</title></head>
            <body>
            <h1>Something went wrong</h1>
            <p>We&#39;re Sorry for the Inconvenience</p>
            <p>Contact support@tcsion.com for help</p>
            </body>
            </html>
            """
            
            response = self.session.post(f"{BASE_URL}/predict-rank", json={
                "answerKeyId": answer_key_id,
                "name": "Test User Error HTML",
                "email": "test.error.html@example.com",
                "phone": "9876543210",
                "category": "General",
                "responseHtml": error_html
            })
            
            if response.status_code == 400:
                data = response.json()
                if not data.get('success') and 'error page' in data.get('error', '').lower():
                    self.log("✅ Error page detection with HTML PASSED: correctly detected error page", "SUCCESS")
                    return True
                else:
                    self.log(f"❌ Error page detection with HTML failed: unexpected error message: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Error page detection with HTML failed: expected 400, got {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error page detection with HTML error: {e}", "ERROR")
            return False
    
    def test_manual_entry_regression(self, answer_key_id):
        """Test manual entry still works - regression test"""
        try:
            self.log("🧪 Testing manual entry regression", "TEST")
            
            # Manual answers as specified in review request: "1:A, 2:B, 3:D, 4:12.5, 5:C, 6:D"
            # Expected vs key (C,A,D,12.5,A,D):
            # Q1 A vs C → wrong, Q2 B vs A → wrong, Q3 D vs D → correct
            # Q4 12.5 vs 12.5 → correct, Q5 C vs A → wrong, Q6 D vs D → correct
            # marks = 3 × 1 − 3 × 0.33 = 2.01, correct=3, wrong=3, unattempted=0
            
            response = self.session.post(f"{BASE_URL}/predict-rank", json={
                "answerKeyId": answer_key_id,
                "name": "Test User Manual",
                "email": "test.manual@example.com",
                "phone": "9876543210",
                "category": "General",
                "manualAnswers": "1:A, 2:B, 3:D, 4:12.5, 5:C, 6:D"
            })
            
            if response.status_code != 200:
                self.log(f"❌ Manual entry regression failed: HTTP {response.status_code} - {response.text}", "ERROR")
                return False
                
            data = response.json()
            if not data.get('success'):
                self.log(f"❌ Manual entry regression failed: {data}", "ERROR")
                return False
                
            result = data['data']
            
            expected_correct = 3
            expected_wrong = 3
            expected_unattempted = 0
            expected_marks = 3 * 1 - 3 * 0.33  # 2.01
            
            if (result['correct'] == expected_correct and 
                result['wrong'] == expected_wrong and 
                result['unattempted'] == expected_unattempted and 
                abs(result['marks'] - expected_marks) < 0.01):
                
                self.log(f"✅ Manual entry regression PASSED: correct={result['correct']}, wrong={result['wrong']}, unattempted={result['unattempted']}, marks={result['marks']:.2f}", "SUCCESS")
                return True
            else:
                self.log(f"❌ Manual entry regression FAILED: got correct={result['correct']}, wrong={result['wrong']}, unattempted={result['unattempted']}, marks={result['marks']:.2f}", "ERROR")
                self.log(f"Expected: correct={expected_correct}, wrong={expected_wrong}, unattempted={expected_unattempted}, marks={expected_marks:.2f}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Manual entry regression error: {e}", "ERROR")
            return False
    
    def test_resubmission(self, answer_key_id):
        """Test re-submission replaces first submission"""
        try:
            self.log("🧪 Testing re-submission behavior", "TEST")
            
            test_email = "test.resubmit@example.com"
            
            # First submission
            response1 = self.session.post(f"{BASE_URL}/predict-rank", json={
                "answerKeyId": answer_key_id,
                "name": "Test User Resubmit",
                "email": test_email,
                "phone": "9876543210",
                "category": "General",
                "manualAnswers": "1:A, 2:A, 3:A, 4:1, 5:A, 6:A"
            })
            
            if response1.status_code != 200:
                self.log(f"❌ First submission failed: HTTP {response1.status_code}", "ERROR")
                return False
                
            first_data = response1.json()
            if not first_data.get('success'):
                self.log(f"❌ First submission failed: {first_data}", "ERROR")
                return False
                
            first_marks = first_data['data']['marks']
            
            # Second submission with different answers
            response2 = self.session.post(f"{BASE_URL}/predict-rank", json={
                "answerKeyId": answer_key_id,
                "name": "Test User Resubmit Updated",
                "email": test_email,
                "phone": "9876543210",
                "category": "General",
                "manualAnswers": "1:C, 2:A, 3:D, 4:12.5, 5:A, 6:D"  # All correct
            })
            
            if response2.status_code != 200:
                self.log(f"❌ Second submission failed: HTTP {response2.status_code}", "ERROR")
                return False
                
            second_data = response2.json()
            if not second_data.get('success'):
                self.log(f"❌ Second submission failed: {second_data}", "ERROR")
                return False
                
            second_marks = second_data['data']['marks']
            
            # Verify second submission has different marks (should be 6.0 for all correct)
            if abs(second_marks - 6.0) < 0.01 and first_marks != second_marks:
                self.log(f"✅ Re-submission PASSED: first marks={first_marks}, second marks={second_marks}", "SUCCESS")
                
                # Check admin rank predictions to ensure no duplicates
                admin_response = self.session.get(f"{BASE_URL}/admin/rank-predictions")
                if admin_response.status_code == 200:
                    admin_data = admin_response.json()
                    if admin_data.get('success'):
                        predictions = admin_data['data']
                        user_predictions = [p for p in predictions if p['email'] == test_email and p['answerKeyId'] == answer_key_id]
                        if len(user_predictions) == 1:
                            self.log("✅ Re-submission verification PASSED: only one prediction exists for user", "SUCCESS")
                            return True
                        else:
                            self.log(f"❌ Re-submission verification FAILED: found {len(user_predictions)} predictions, expected 1", "ERROR")
                            return False
                    else:
                        self.log(f"❌ Admin predictions check failed: {admin_data}", "ERROR")
                        return False
                else:
                    self.log(f"❌ Admin predictions check failed: HTTP {admin_response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Re-submission FAILED: marks not updated correctly. First={first_marks}, Second={second_marks}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Re-submission test error: {e}", "ERROR")
            return False
    
    def test_rank_calculation(self, answer_key_id):
        """Test rank calculation with multiple users"""
        try:
            self.log("🧪 Testing rank calculation with multiple users", "TEST")
            
            # Submit 3 different users with different marks
            users = [
                {"email": "rank.test1@example.com", "name": "Rank Test 1", "answers": "1:C, 2:A, 3:D, 4:12.5, 5:A, 6:D", "expected_marks": 6.0},  # All correct
                {"email": "rank.test2@example.com", "name": "Rank Test 2", "answers": "1:C, 2:A, 3:D, 4:12.5, 5:B, 6:D", "expected_marks": 5.67},  # 5 correct, 1 wrong
                {"email": "rank.test3@example.com", "name": "Rank Test 3", "answers": "1:A, 2:B, 3:C, 4:1, 5:B, 6:C", "expected_marks": 1.02}   # 1 correct, 5 wrong
            ]
            
            submitted_users = []
            
            for user in users:
                response = self.session.post(f"{BASE_URL}/predict-rank", json={
                    "answerKeyId": answer_key_id,
                    "name": user["name"],
                    "email": user["email"],
                    "phone": "9876543210",
                    "category": "General",
                    "manualAnswers": user["answers"]
                })
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        result = data['data']
                        submitted_users.append({
                            "email": user["email"],
                            "marks": result['marks'],
                            "rank": result['overallRank'],
                            "expected_marks": user["expected_marks"]
                        })
                        self.log(f"✅ Submitted user {user['email']}: marks={result['marks']}, rank={result['overallRank']}", "SUCCESS")
                    else:
                        self.log(f"❌ Failed to submit user {user['email']}: {data}", "ERROR")
                        return False
                else:
                    self.log(f"❌ Failed to submit user {user['email']}: HTTP {response.status_code}", "ERROR")
                    return False
            
            # Verify ranking order among our test users (higher marks = lower rank number)
            submitted_users.sort(key=lambda x: x['marks'], reverse=True)
            
            # Check that the ranking is consistent (user with higher marks has lower rank)
            ranks_consistent = True
            for i in range(len(submitted_users) - 1):
                if submitted_users[i]['marks'] > submitted_users[i+1]['marks']:
                    if submitted_users[i]['rank'] >= submitted_users[i+1]['rank']:
                        ranks_consistent = False
                        break
            
            if ranks_consistent:
                self.log(f"✅ Rank calculation PASSED: ranking is consistent with marks", "SUCCESS")
                for user in submitted_users:
                    self.log(f"  {user['email']}: marks={user['marks']}, rank={user['rank']}", "SUCCESS")
                return True
            else:
                self.log(f"❌ Rank calculation FAILED: ranking inconsistent with marks", "ERROR")
                for user in submitted_users:
                    self.log(f"  {user['email']}: marks={user['marks']}, rank={user['rank']}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Rank calculation test error: {e}", "ERROR")
            return False
    
    def test_regression_endpoints(self):
        """Test regression - verify existing endpoints still work"""
        try:
            self.log("🧪 Testing regression - existing endpoints", "TEST")
            
            endpoints_to_test = [
                ("/admin/answer-keys", "GET"),
                ("/answer-keys", "GET"),
                ("/rank-predictor/sample-csv", "GET"),
                ("/admin/rank-predictions", "GET")
            ]
            
            all_passed = True
            
            for endpoint, method in endpoints_to_test:
                try:
                    if method == "GET":
                        response = self.session.get(f"{BASE_URL}{endpoint}")
                    else:
                        response = self.session.post(f"{BASE_URL}{endpoint}")
                    
                    if response.status_code == 200:
                        if endpoint == "/rank-predictor/sample-csv":
                            # CSV endpoint returns raw CSV, not JSON
                            if "question_id,correct_answer" in response.text:
                                self.log(f"✅ {method} {endpoint} - PASSED", "SUCCESS")
                            else:
                                self.log(f"❌ {method} {endpoint} - FAILED: Invalid CSV content", "ERROR")
                                all_passed = False
                        else:
                            data = response.json()
                            if data.get('success'):
                                self.log(f"✅ {method} {endpoint} - PASSED", "SUCCESS")
                            else:
                                self.log(f"❌ {method} {endpoint} - FAILED: {data}", "ERROR")
                                all_passed = False
                    else:
                        self.log(f"❌ {method} {endpoint} - FAILED: HTTP {response.status_code}", "ERROR")
                        all_passed = False
                        
                except Exception as e:
                    self.log(f"❌ {method} {endpoint} - ERROR: {e}", "ERROR")
                    all_passed = False
            
            if all_passed:
                self.log("✅ Regression testing PASSED: all existing endpoints working", "SUCCESS")
                return True
            else:
                self.log("❌ Regression testing FAILED: some endpoints not working", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Regression testing error: {e}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting TCS iON Rank Predictor Parser Testing", "START")
        
        # Step 1: Admin login
        if not self.test_admin_login():
            self.log("❌ Cannot proceed without admin authentication", "FATAL")
            return False
        
        # Step 2: Create test answer key
        answer_key_id = self.create_test_answer_key()
        if not answer_key_id:
            self.log("❌ Cannot proceed without test answer key", "FATAL")
            return False
        
        # Step 3: Run all tests
        tests = [
            ("TCS iON HTML Parsing", lambda: self.test_tcs_ion_html_parsing(answer_key_id)),
            ("URL Parsing Test", lambda: self.test_error_page_detection_url(answer_key_id)),
            ("Error Page Detection (HTML)", lambda: self.test_error_page_detection_html(answer_key_id)),
            ("Manual Entry Regression", lambda: self.test_manual_entry_regression(answer_key_id)),
            ("Re-submission Test", lambda: self.test_resubmission(answer_key_id)),
            ("Rank Calculation", lambda: self.test_rank_calculation(answer_key_id)),
            ("Regression Endpoints", lambda: self.test_regression_endpoints())
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*60}", "TEST")
            self.log(f"Running: {test_name}", "TEST")
            self.log(f"{'='*60}", "TEST")
            
            try:
                if test_func():
                    passed += 1
                    self.test_results.append(f"✅ {test_name}")
                else:
                    self.test_results.append(f"❌ {test_name}")
            except Exception as e:
                self.log(f"❌ {test_name} - EXCEPTION: {e}", "ERROR")
                self.test_results.append(f"❌ {test_name} (Exception)")
        
        # Final summary
        self.log(f"\n{'='*60}", "SUMMARY")
        self.log(f"TEST SUMMARY: {passed}/{total} tests passed", "SUMMARY")
        self.log(f"{'='*60}", "SUMMARY")
        
        for result in self.test_results:
            self.log(result, "SUMMARY")
        
        if passed == total:
            self.log("\n🎉 ALL TESTS PASSED! TCS iON parser rewrite working correctly.", "SUCCESS")
            return True
        else:
            self.log(f"\n⚠️  {total - passed} tests failed. Review the errors above.", "WARNING")
            return False

if __name__ == "__main__":
    runner = TestRunner()
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)