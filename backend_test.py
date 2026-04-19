#!/usr/bin/env python3

import requests
import json
import sys
import os

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://content-hub-admin-5.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Admin credentials from review request
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class RankPredictorTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_answer_key_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def admin_login(self):
        """Test admin login with new credentials"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data', {}).get('user', {}).get('role') == 'SUPER_ADMIN':
                    self.auth_token = data['data']['token']
                    self.log_result("Admin Login", True, f"Successfully logged in as {ADMIN_EMAIL} with SUPER_ADMIN role")
                    return True
                else:
                    self.log_result("Admin Login", False, f"Login successful but role verification failed: {data}")
                    return False
            else:
                self.log_result("Admin Login", False, f"Login failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception during login: {str(e)}")
            return False

    def test_admin_answer_keys_crud(self):
        """Test Answer Key Admin CRUD operations"""
        
        # 1. Test GET /api/admin/answer-keys (should return array) - Test without auth first
        try:
            unauthenticated_session = requests.Session()
            response = unauthenticated_session.get(f"{API_BASE}/admin/answer-keys")
            if response.status_code == 401:
                self.log_result("GET /admin/answer-keys (no auth)", True, "Correctly returned 401 without auth")
            else:
                self.log_result("GET /admin/answer-keys (no auth)", False, f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /admin/answer-keys (no auth)", False, f"Exception: {str(e)}")

        # 2. Test POST /api/admin/answer-keys - Missing title should return 400
        try:
            response = self.session.post(f"{API_BASE}/admin/answer-keys", json={
                "description": "Test without title",
                "examId": "test-exam",
                "positiveMarks": 1,
                "negativeMarks": 0.25
            })
            if response.status_code == 400:
                self.log_result("POST /admin/answer-keys (missing title)", True, "Correctly returned 400 for missing title")
            else:
                self.log_result("POST /admin/answer-keys (missing title)", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("POST /admin/answer-keys (missing title)", False, f"Exception: {str(e)}")

        # 3. Test POST /api/admin/answer-keys - Valid creation
        try:
            response = self.session.post(f"{API_BASE}/admin/answer-keys", json={
                "title": "Test Answer Key for Rank Predictor",
                "description": "Test answer key with 5 questions",
                "examId": "gate-2024",
                "positiveMarks": 1,
                "negativeMarks": 0.25
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    answer_key = data['data']
                    self.test_answer_key_id = answer_key['id']
                    
                    # Verify structure
                    expected_fields = ['id', 'title', 'description', 'examId', 'positiveMarks', 'negativeMarks', 'totalQuestions', 'answers', 'status']
                    missing_fields = [f for f in expected_fields if f not in answer_key]
                    
                    if not missing_fields and answer_key['answers'] == [] and answer_key['totalQuestions'] == 0 and answer_key['status'] == 'active':
                        self.log_result("POST /admin/answer-keys (valid)", True, f"Created answer key with ID: {self.test_answer_key_id}")
                    else:
                        self.log_result("POST /admin/answer-keys (valid)", False, f"Missing fields: {missing_fields}, answers: {answer_key.get('answers')}, totalQuestions: {answer_key.get('totalQuestions')}")
                else:
                    self.log_result("POST /admin/answer-keys (valid)", False, f"Invalid response structure: {data}")
            else:
                self.log_result("POST /admin/answer-keys (valid)", False, f"Expected 200, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("POST /admin/answer-keys (valid)", False, f"Exception: {str(e)}")

        if not self.test_answer_key_id:
            print("❌ Cannot continue tests without a valid answer key ID")
            return False

        # 4. Test GET /api/admin/answer-keys (with auth)
        try:
            response = self.session.get(f"{API_BASE}/admin/answer-keys")
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and isinstance(data.get('data'), list):
                    self.log_result("GET /admin/answer-keys (with auth)", True, f"Retrieved {len(data['data'])} answer keys")
                else:
                    self.log_result("GET /admin/answer-keys (with auth)", False, f"Invalid response structure: {data}")
            else:
                self.log_result("GET /admin/answer-keys (with auth)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /admin/answer-keys (with auth)", False, f"Exception: {str(e)}")

        # 5. Test GET /api/admin/answer-keys/:id (single answer key with full answers array)
        try:
            response = self.session.get(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data') and 'answers' in data['data']:
                    self.log_result("GET /admin/answer-keys/:id", True, f"Retrieved single answer key with answers array")
                else:
                    self.log_result("GET /admin/answer-keys/:id", False, f"Missing answers field: {data}")
            else:
                self.log_result("GET /admin/answer-keys/:id", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /admin/answer-keys/:id", False, f"Exception: {str(e)}")

        # 6. Test PUT /api/admin/answer-keys/:id (partial update)
        try:
            response = self.session.put(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}", json={
                "positiveMarks": 2,
                "negativeMarks": 0.5
            })
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    updated_key = data['data']
                    if updated_key.get('positiveMarks') == 2 and updated_key.get('negativeMarks') == 0.5:
                        self.log_result("PUT /admin/answer-keys/:id", True, "Successfully updated positiveMarks and negativeMarks")
                    else:
                        self.log_result("PUT /admin/answer-keys/:id", False, f"Update failed: positiveMarks={updated_key.get('positiveMarks')}, negativeMarks={updated_key.get('negativeMarks')}")
                else:
                    self.log_result("PUT /admin/answer-keys/:id", False, f"Invalid response: {data}")
            else:
                self.log_result("PUT /admin/answer-keys/:id", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("PUT /admin/answer-keys/:id", False, f"Exception: {str(e)}")

        # 7. Test PUT with non-existent ID (should return 404)
        try:
            response = self.session.put(f"{API_BASE}/admin/answer-keys/non-existent-id", json={
                "positiveMarks": 3
            })
            if response.status_code == 404:
                self.log_result("PUT /admin/answer-keys/:id (404)", True, "Correctly returned 404 for non-existent ID")
            else:
                self.log_result("PUT /admin/answer-keys/:id (404)", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("PUT /admin/answer-keys/:id (404)", False, f"Exception: {str(e)}")

        return True

    def test_csv_upload(self):
        """Test CSV upload functionality"""
        if not self.test_answer_key_id:
            self.log_result("CSV Upload Tests", False, "No test answer key ID available")
            return False

        # 1. Test CSV upload with header row
        csv_content = "question_id,correct_answer\nQ1,A\nQ2,B\nQ3,C"
        try:
            response = self.session.post(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}/upload-csv", json={
                "csv": csv_content
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data') and data.get('stats'):
                    stats = data['stats']
                    answer_key = data['data']
                    
                    if stats.get('imported') == 3 and answer_key.get('totalQuestions') == 3 and len(answer_key.get('answers', [])) == 3:
                        self.log_result("CSV Upload (with header)", True, f"Imported {stats['imported']} questions, totalQuestions: {answer_key['totalQuestions']}")
                    else:
                        self.log_result("CSV Upload (with header)", False, f"Import count mismatch: imported={stats.get('imported')}, totalQuestions={answer_key.get('totalQuestions')}, answers_length={len(answer_key.get('answers', []))}")
                else:
                    self.log_result("CSV Upload (with header)", False, f"Invalid response structure: {data}")
            else:
                self.log_result("CSV Upload (with header)", False, f"Expected 200, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("CSV Upload (with header)", False, f"Exception: {str(e)}")

        # 2. Test CSV upload without header row
        csv_content_no_header = "Q4,D\nQ5,A"
        try:
            response = self.session.post(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}/upload-csv", json={
                "csv": csv_content_no_header
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('stats'):
                    stats = data['stats']
                    if stats.get('imported') == 2:
                        self.log_result("CSV Upload (no header)", True, f"Imported {stats['imported']} questions without header")
                    else:
                        self.log_result("CSV Upload (no header)", False, f"Expected 2 imports, got {stats.get('imported')}")
                else:
                    self.log_result("CSV Upload (no header)", False, f"Invalid response: {data}")
            else:
                self.log_result("CSV Upload (no header)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("CSV Upload (no header)", False, f"Exception: {str(e)}")

        # 3. Test normalization (numeric answers to letters)
        csv_content_numeric = "Q6,1\nQ7,2\nQ8,3"
        try:
            response = self.session.post(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}/upload-csv", json={
                "csv": csv_content_numeric
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    # Verify the answers were normalized
                    answers = data['data'].get('answers', [])
                    q6_answer = next((a['correct_answer'] for a in answers if a['question_id'] == '6'), None)
                    q7_answer = next((a['correct_answer'] for a in answers if a['question_id'] == '7'), None)
                    
                    if q6_answer == 'A' and q7_answer == 'B':
                        self.log_result("CSV Upload (normalization)", True, "Numeric answers correctly normalized to letters")
                    else:
                        self.log_result("CSV Upload (normalization)", False, f"Normalization failed: Q6={q6_answer}, Q7={q7_answer}")
                else:
                    self.log_result("CSV Upload (normalization)", False, f"Upload failed: {data}")
            else:
                self.log_result("CSV Upload (normalization)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("CSV Upload (normalization)", False, f"Exception: {str(e)}")

        # 4. Test duplicate question handling
        csv_content_duplicates = "Q1,A\nQ1,B\nQ9,C"
        try:
            response = self.session.post(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}/upload-csv", json={
                "csv": csv_content_duplicates
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('stats'):
                    stats = data['stats']
                    if len(stats.get('errors', [])) > 0 and 'duplicate' in str(stats['errors']).lower():
                        self.log_result("CSV Upload (duplicates)", True, f"Duplicate handling working: {stats['errors']}")
                    else:
                        self.log_result("CSV Upload (duplicates)", False, f"Expected duplicate error, got: {stats}")
                else:
                    self.log_result("CSV Upload (duplicates)", False, f"Invalid response: {data}")
            else:
                self.log_result("CSV Upload (duplicates)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("CSV Upload (duplicates)", False, f"Exception: {str(e)}")

        # 5. Verify final state - should have 5 questions (Q1-Q5 from first upload, Q6-Q9 from subsequent uploads, minus duplicates)
        try:
            response = self.session.get(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    answer_key = data['data']
                    answers = answer_key.get('answers', [])
                    total_questions = answer_key.get('totalQuestions', 0)
                    
                    if len(answers) == total_questions and total_questions > 0:
                        self.log_result("CSV Upload (final verification)", True, f"Final state: {total_questions} questions with consistent answers array")
                    else:
                        self.log_result("CSV Upload (final verification)", False, f"Inconsistent state: answers_length={len(answers)}, totalQuestions={total_questions}")
                else:
                    self.log_result("CSV Upload (final verification)", False, f"Invalid response: {data}")
            else:
                self.log_result("CSV Upload (final verification)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("CSV Upload (final verification)", False, f"Exception: {str(e)}")

        return True

    def test_public_endpoints(self):
        """Test public endpoints"""
        
        # 1. Test GET /api/answer-keys (public, should return only active keys without answers field)
        try:
            # Test without auth
            public_session = requests.Session()
            response = public_session.get(f"{API_BASE}/answer-keys")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and isinstance(data.get('data'), list):
                    keys = data['data']
                    if len(keys) > 0:
                        # Check that answers field is not included
                        first_key = keys[0]
                        if 'answers' not in first_key and 'id' in first_key and 'title' in first_key:
                            self.log_result("GET /api/answer-keys (public)", True, f"Retrieved {len(keys)} public answer keys without answers field")
                        else:
                            self.log_result("GET /api/answer-keys (public)", False, f"Public keys contain answers field or missing required fields: {first_key.keys()}")
                    else:
                        self.log_result("GET /api/answer-keys (public)", True, "No public answer keys found (expected if none are active)")
                else:
                    self.log_result("GET /api/answer-keys (public)", False, f"Invalid response structure: {data}")
            else:
                self.log_result("GET /api/answer-keys (public)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/answer-keys (public)", False, f"Exception: {str(e)}")

        # 2. Test GET /api/rank-predictor/sample-csv (should return CSV with Content-Disposition header)
        try:
            public_session = requests.Session()
            response = public_session.get(f"{API_BASE}/rank-predictor/sample-csv")
            
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                content_disposition = response.headers.get('Content-Disposition', '')
                
                if 'text/csv' in content_type and 'attachment' in content_disposition:
                    csv_content = response.text
                    if 'question_id,correct_answer' in csv_content and 'Q1,A' in csv_content:
                        self.log_result("GET /api/rank-predictor/sample-csv", True, f"CSV download working with proper headers")
                    else:
                        self.log_result("GET /api/rank-predictor/sample-csv", False, f"Invalid CSV content: {csv_content[:100]}")
                else:
                    self.log_result("GET /api/rank-predictor/sample-csv", False, f"Missing headers: Content-Type={content_type}, Content-Disposition={content_disposition}")
            else:
                self.log_result("GET /api/rank-predictor/sample-csv", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/rank-predictor/sample-csv", False, f"Exception: {str(e)}")

        return True

    def test_predict_rank(self):
        """Test rank prediction functionality"""
        if not self.test_answer_key_id:
            self.log_result("Predict Rank Tests", False, "No test answer key ID available")
            return False

        # First, ensure we have a proper answer key with 5 questions
        csv_content = "question_id,correct_answer\nQ1,A\nQ2,B\nQ3,C\nQ4,D\nQ5,A"
        try:
            response = self.session.post(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}/upload-csv", json={
                "csv": csv_content
            })
            if response.status_code != 200:
                self.log_result("Setup Answer Key for Prediction", False, f"Failed to setup answer key: {response.status_code}")
                return False
            
            # Update marking scheme to +1/-0.25
            response = self.session.put(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}", json={
                "positiveMarks": 1,
                "negativeMarks": 0.25
            })
            if response.status_code != 200:
                self.log_result("Setup Marking Scheme", False, f"Failed to update marking scheme: {response.status_code}")
                return False
                
            self.log_result("Setup Answer Key for Prediction", True, "Answer key setup with 5 questions (Q1-Q5: A,B,C,D,A) and marking +1/-0.25")
        except Exception as e:
            self.log_result("Setup Answer Key for Prediction", False, f"Exception: {str(e)}")
            return False

        # 1. Test missing required fields
        test_cases = [
            ({"name": "Test User", "email": "test@test.com"}, "answerKeyId is required"),
            ({"answerKeyId": self.test_answer_key_id, "email": "test@test.com"}, "Name is required"),
            ({"answerKeyId": self.test_answer_key_id, "name": "Test User"}, "Email is required"),
        ]
        
        for payload, expected_error in test_cases:
            try:
                public_session = requests.Session()
                response = public_session.post(f"{API_BASE}/predict-rank", json=payload)
                
                if response.status_code == 400:
                    data = response.json()
                    if expected_error.lower() in data.get('error', '').lower():
                        self.log_result(f"Predict Rank Validation ({expected_error})", True, f"Correctly validated: {expected_error}")
                    else:
                        self.log_result(f"Predict Rank Validation ({expected_error})", False, f"Wrong error message: {data.get('error')}")
                else:
                    self.log_result(f"Predict Rank Validation ({expected_error})", False, f"Expected 400, got {response.status_code}")
            except Exception as e:
                self.log_result(f"Predict Rank Validation ({expected_error})", False, f"Exception: {str(e)}")

        # 2. Test non-existent answer key
        try:
            public_session = requests.Session()
            response = public_session.post(f"{API_BASE}/predict-rank", json={
                "answerKeyId": "non-existent-id",
                "name": "Test User",
                "email": "test@test.com",
                "manualAnswers": {"1": "A"}
            })
            
            if response.status_code == 404:
                self.log_result("Predict Rank (non-existent key)", True, "Correctly returned 404 for non-existent answer key")
            else:
                self.log_result("Predict Rank (non-existent key)", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("Predict Rank (non-existent key)", False, f"Exception: {str(e)}")

        # 3. Test manual answers (object format) - correct=3, wrong=1, unattempted=1
        # Expected: 3*1 - 1*0.25 = 2.75 marks
        try:
            public_session = requests.Session()
            response = public_session.post(f"{API_BASE}/predict-rank", json={
                "answerKeyId": self.test_answer_key_id,
                "name": "Test User A",
                "email": "usera@test.com",
                "category": "General",
                "manualAnswers": {
                    "1": "A",  # Correct
                    "2": "B",  # Correct  
                    "3": "C",  # Correct
                    "4": "A",  # Wrong (correct is D)
                    # Q5 unattempted
                }
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    result = data['data']
                    expected_marks = 2.75
                    
                    # Verify all required fields
                    required_fields = ['marks', 'maxMarks', 'percentage', 'correct', 'wrong', 'unattempted', 
                                     'attempted', 'totalQuestions', 'overallRank', 'categoryRank', 'category', 
                                     'categoryTotal', 'totalParticipants', 'percentile', 'positiveMarks', 'negativeMarks']
                    
                    missing_fields = [f for f in required_fields if f not in result]
                    
                    if not missing_fields:
                        if (result['marks'] == expected_marks and result['correct'] == 3 and 
                            result['wrong'] == 1 and result['unattempted'] == 1 and 
                            result['totalQuestions'] == 5 and result['overallRank'] == 1):
                            self.log_result("Predict Rank (manual answers object)", True, 
                                          f"Correct calculation: marks={result['marks']}, correct={result['correct']}, wrong={result['wrong']}, rank={result['overallRank']}")
                        else:
                            self.log_result("Predict Rank (manual answers object)", False, 
                                          f"Calculation error: marks={result['marks']} (expected {expected_marks}), correct={result['correct']}, wrong={result['wrong']}")
                    else:
                        self.log_result("Predict Rank (manual answers object)", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("Predict Rank (manual answers object)", False, f"Invalid response: {data}")
            else:
                self.log_result("Predict Rank (manual answers object)", False, f"Expected 200, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Predict Rank (manual answers object)", False, f"Exception: {str(e)}")

        # 4. Test manual answers (string format)
        try:
            public_session = requests.Session()
            response = public_session.post(f"{API_BASE}/predict-rank", json={
                "answerKeyId": self.test_answer_key_id,
                "name": "Test User B",
                "email": "userb@test.com",
                "category": "General",
                "manualAnswers": "1:A, 2:B, 3:D, 4:D, 5:A"  # 4 correct, 1 wrong = 4*1 - 1*0.25 = 3.75
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    result = data['data']
                    expected_marks = 3.75
                    
                    if (result['marks'] == expected_marks and result['correct'] == 4 and 
                        result['wrong'] == 1 and result['overallRank'] == 1):
                        self.log_result("Predict Rank (manual answers string)", True, 
                                      f"String parsing working: marks={result['marks']}, correct={result['correct']}")
                    else:
                        self.log_result("Predict Rank (manual answers string)", False, 
                                      f"String parsing failed: marks={result['marks']} (expected {expected_marks}), correct={result['correct']}")
                else:
                    self.log_result("Predict Rank (manual answers string)", False, f"Invalid response: {data}")
            else:
                self.log_result("Predict Rank (manual answers string)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("Predict Rank (manual answers string)", False, f"Exception: {str(e)}")

        # 5. Test responseHtml parsing
        html_content = """
        <div>
            <p>Question Number: 1</p>
            <p>Chosen Option: 1</p>
            <p>Question Number: 2</p>
            <p>Chosen Option: 2</p>
            <p>Question Number: 3</p>
            <p>Chosen Option: 3</p>
            <p>Question Number: 4</p>
            <p>Chosen Option: 4</p>
            <p>Question Number: 5</p>
            <p>Chosen Option: 1</p>
        </div>
        """
        try:
            public_session = requests.Session()
            response = public_session.post(f"{API_BASE}/predict-rank", json={
                "answerKeyId": self.test_answer_key_id,
                "name": "Test User C",
                "email": "userc@test.com",
                "category": "OBC",
                "responseHtml": html_content
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    result = data['data']
                    # HTML should parse to: 1->A, 2->B, 3->C, 4->D, 5->A (all correct = 5 marks)
                    
                    if result['marks'] == 5 and result['correct'] == 5 and result['category'] == 'OBC':
                        self.log_result("Predict Rank (responseHtml)", True, 
                                      f"HTML parsing working: marks={result['marks']}, correct={result['correct']}, category={result['category']}")
                    else:
                        self.log_result("Predict Rank (responseHtml)", False, 
                                      f"HTML parsing failed: marks={result['marks']}, correct={result['correct']}, category={result['category']}")
                else:
                    self.log_result("Predict Rank (responseHtml)", False, f"Invalid response: {data}")
            else:
                self.log_result("Predict Rank (responseHtml)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("Predict Rank (responseHtml)", False, f"Exception: {str(e)}")

        # 6. Test ranking system - submit another user with lower score
        try:
            public_session = requests.Session()
            response = public_session.post(f"{API_BASE}/predict-rank", json={
                "answerKeyId": self.test_answer_key_id,
                "name": "Test User D",
                "email": "userd@test.com",
                "category": "General",
                "manualAnswers": {"1": "A", "2": "A"}  # 1 correct, 1 wrong = 1*1 - 1*0.25 = 0.75
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    result = data['data']
                    
                    # This user should have rank 2 or higher (depending on previous submissions)
                    if result['marks'] == 0.75 and result['overallRank'] >= 2:
                        self.log_result("Predict Rank (ranking verification)", True, 
                                      f"Ranking working: marks={result['marks']}, rank={result['overallRank']}, participants={result['totalParticipants']}")
                    else:
                        self.log_result("Predict Rank (ranking verification)", False, 
                                      f"Ranking issue: marks={result['marks']}, rank={result['overallRank']}")
                else:
                    self.log_result("Predict Rank (ranking verification)", False, f"Invalid response: {data}")
            else:
                self.log_result("Predict Rank (ranking verification)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("Predict Rank (ranking verification)", False, f"Exception: {str(e)}")

        # 7. Test re-submission (should replace previous score)
        try:
            public_session = requests.Session()
            response = public_session.post(f"{API_BASE}/predict-rank", json={
                "answerKeyId": self.test_answer_key_id,
                "name": "Test User A Updated",
                "email": "usera@test.com",  # Same email as first submission
                "category": "General",
                "manualAnswers": {"1": "A", "2": "B", "3": "C", "4": "D", "5": "A"}  # All correct = 5 marks
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    result = data['data']
                    
                    if result['marks'] == 5 and result['overallRank'] == 1:
                        self.log_result("Predict Rank (re-submission)", True, 
                                      f"Re-submission working: updated marks={result['marks']}, rank={result['overallRank']}")
                    else:
                        self.log_result("Predict Rank (re-submission)", False, 
                                      f"Re-submission failed: marks={result['marks']}, rank={result['overallRank']}")
                else:
                    self.log_result("Predict Rank (re-submission)", False, f"Invalid response: {data}")
            else:
                self.log_result("Predict Rank (re-submission)", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("Predict Rank (re-submission)", False, f"Exception: {str(e)}")

        # 8. Test empty answer key error
        try:
            # Create an empty answer key
            response = self.session.post(f"{API_BASE}/admin/answer-keys", json={
                "title": "Empty Answer Key",
                "description": "For testing empty key error",
                "positiveMarks": 1,
                "negativeMarks": 0
            })
            
            if response.status_code == 200:
                empty_key_id = response.json()['data']['id']
                
                # Try to predict with empty key
                public_session = requests.Session()
                response = public_session.post(f"{API_BASE}/predict-rank", json={
                    "answerKeyId": empty_key_id,
                    "name": "Test User",
                    "email": "test@test.com",
                    "manualAnswers": {"1": "A"}
                })
                
                if response.status_code == 400:
                    data = response.json()
                    if "no questions uploaded" in data.get('error', '').lower():
                        self.log_result("Predict Rank (empty answer key)", True, "Correctly rejected empty answer key")
                    else:
                        self.log_result("Predict Rank (empty answer key)", False, f"Wrong error message: {data.get('error')}")
                else:
                    self.log_result("Predict Rank (empty answer key)", False, f"Expected 400, got {response.status_code}")
            else:
                self.log_result("Predict Rank (empty answer key)", False, "Failed to create empty answer key for testing")
        except Exception as e:
            self.log_result("Predict Rank (empty answer key)", False, f"Exception: {str(e)}")

        return True

    def test_admin_rank_predictions(self):
        """Test admin rank predictions endpoint"""
        
        try:
            response = self.session.get(f"{API_BASE}/admin/rank-predictions")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and isinstance(data.get('data'), list):
                    predictions = data['data']
                    
                    # Verify userAnswers field is excluded
                    if len(predictions) > 0:
                        first_prediction = predictions[0]
                        if 'userAnswers' not in first_prediction:
                            self.log_result("GET /admin/rank-predictions", True, 
                                          f"Retrieved {len(predictions)} predictions without userAnswers field")
                        else:
                            self.log_result("GET /admin/rank-predictions", False, 
                                          "userAnswers field should be excluded from admin view")
                    else:
                        self.log_result("GET /admin/rank-predictions", True, "No predictions found (expected if none submitted)")
                else:
                    self.log_result("GET /admin/rank-predictions", False, f"Invalid response structure: {data}")
            else:
                self.log_result("GET /admin/rank-predictions", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /admin/rank-predictions", False, f"Exception: {str(e)}")

        # Test without auth
        try:
            public_session = requests.Session()
            response = public_session.get(f"{API_BASE}/admin/rank-predictions")
            
            if response.status_code == 401:
                self.log_result("GET /admin/rank-predictions (no auth)", True, "Correctly returned 401 without auth")
            else:
                self.log_result("GET /admin/rank-predictions (no auth)", False, f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /admin/rank-predictions (no auth)", False, f"Exception: {str(e)}")

        return True

    def test_delete_answer_key(self):
        """Test DELETE answer key and associated predictions cleanup"""
        if not self.test_answer_key_id:
            self.log_result("DELETE Answer Key", False, "No test answer key ID available")
            return False

        try:
            response = self.session.delete(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    message = data.get('message', '')
                    if 'deleted' in message.lower():
                        self.log_result("DELETE /admin/answer-keys/:id", True, f"Answer key deleted: {message}")
                        
                        # Verify it's actually deleted
                        verify_response = self.session.get(f"{API_BASE}/admin/answer-keys/{self.test_answer_key_id}")
                        if verify_response.status_code == 404:
                            self.log_result("DELETE verification", True, "Answer key properly deleted")
                        else:
                            self.log_result("DELETE verification", False, f"Answer key still exists: {verify_response.status_code}")
                    else:
                        self.log_result("DELETE /admin/answer-keys/:id", False, f"Unexpected message: {message}")
                else:
                    self.log_result("DELETE /admin/answer-keys/:id", False, f"Delete failed: {data}")
            else:
                self.log_result("DELETE /admin/answer-keys/:id", False, f"Expected 200, got {response.status_code}")
        except Exception as e:
            self.log_result("DELETE /admin/answer-keys/:id", False, f"Exception: {str(e)}")

        return True

    def test_regression_endpoints(self):
        """Test that existing endpoints still work"""
        endpoints_to_test = [
            ("/blogs", "GET"),
            ("/jobs", "GET"), 
            ("/colleges", "GET"),
            ("/testimonials", "GET"),
            ("/contact", "POST")
        ]
        
        for endpoint, method in endpoints_to_test:
            try:
                public_session = requests.Session()
                
                if method == "GET":
                    response = public_session.get(f"{API_BASE}{endpoint}")
                elif method == "POST" and endpoint == "/contact":
                    response = public_session.post(f"{API_BASE}{endpoint}", json={
                        "name": "Test User",
                        "email": "test@test.com",
                        "message": "Test message"
                    })
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        self.log_result(f"Regression {method} {endpoint}", True, "Endpoint still working")
                    else:
                        self.log_result(f"Regression {method} {endpoint}", False, f"Endpoint failed: {data}")
                else:
                    self.log_result(f"Regression {method} {endpoint}", False, f"Expected 200, got {response.status_code}")
            except Exception as e:
                self.log_result(f"Regression {method} {endpoint}", False, f"Exception: {str(e)}")

        return True

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Rank Predictor + Answer Key Management System Tests")
        print("=" * 80)
        print()
        
        # Login first
        if not self.admin_login():
            print("❌ Cannot proceed without admin login")
            return False
        
        # Run all test suites
        test_suites = [
            ("Answer Key Admin CRUD", self.test_admin_answer_keys_crud),
            ("CSV Upload", self.test_csv_upload),
            ("Public Endpoints", self.test_public_endpoints),
            ("Predict Rank", self.test_predict_rank),
            ("Admin Rank Predictions", self.test_admin_rank_predictions),
            ("Delete Answer Key", self.test_delete_answer_key),
            ("Regression Tests", self.test_regression_endpoints)
        ]
        
        for suite_name, test_func in test_suites:
            print(f"📋 Running {suite_name} Tests...")
            print("-" * 50)
            test_func()
            print()
        
        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print()
        
        if failed > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
            print()
        
        return failed == 0

if __name__ == "__main__":
    tester = RankPredictorTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)