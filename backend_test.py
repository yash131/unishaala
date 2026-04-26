#!/usr/bin/env python3
"""
Backend test script for CSV Question Import with URL-based image columns
Tests all scenarios specified in the review request
"""

import requests
import json
import csv
import io
import tempfile
import os
from typing import Dict, Any, List

# Configuration
BASE_URL = "https://rank-predict-test.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

class CSVQuestionImportTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_id = None
        
    def login_admin(self) -> bool:
        """Login as admin and get auth token"""
        try:
            response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Admin login successful: {data.get('user', {}).get('role')}")
                # Auth token should be in cookies
                self.auth_token = self.session.cookies.get('auth_token')
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            return False
    
    def get_or_create_test_id(self) -> str:
        """Get existing test ID or create a new one"""
        try:
            # Try to get existing mock tests
            response = self.session.get(f"{BASE_URL}/api/admin/mock-tests")
            if response.status_code == 200:
                result = response.json()
                tests = result.get('data', []) if isinstance(result, dict) else result
                if tests and len(tests) > 0:
                    self.test_id = tests[0]['id']
                    print(f"✅ Using existing test ID: {self.test_id}")
                    return self.test_id
            
            # Create new test if none exist
            response = self.session.post(f"{BASE_URL}/api/admin/mock-tests", json={
                "title": "CSV Import Test",
                "description": "Test for CSV question import",
                "duration": 120,
                "totalQuestions": 0,
                "totalMarks": 0,
                "examId": "test-exam",
                "testType": "mock_test",
                "isPublished": False,
                "status": "Active"
            })
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                self.test_id = data.get('id')
                print(f"✅ Created new test ID: {self.test_id}")
                return self.test_id
            else:
                print(f"❌ Failed to create test: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting/creating test ID: {e}")
            return None
    
    def create_csv_content(self, rows: List[Dict[str, str]]) -> str:
        """Create CSV content from rows"""
        if not rows:
            return ""
        
        # Standard header for URL-based image columns
        headers = [
            'paper_title', 'topic_title', 'question_title', 'duration', 'description',
            'question_image', 'solution_text', 'tip', 'status',
            'option1_title', 'option1_image', 'option2_title', 'option2_image',
            'option3_title', 'option3_image', 'option4_title', 'option4_image',
            'correct_option_number', 'solution_image'
        ]
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
        return output.getvalue()
    
    def test_scenario_1_url_mode_happy_path(self) -> bool:
        """Test URL mode with valid URLs (happy path)"""
        print("\n🧪 Test Scenario 1: URL mode — happy path (valid URLs)")
        
        try:
            # Create CSV with valid image URLs
            rows = [
                {
                    'paper_title': 'Test Paper 1',
                    'topic_title': 'Mathematics',
                    'question_title': 'What is 2+2?',
                    'duration': '60',
                    'description': 'Basic arithmetic',
                    'question_image': 'https://placehold.co/600x400.png',
                    'solution_text': 'The answer is 4',
                    'tip': 'Add the numbers',
                    'status': 'active',
                    'option1_title': 'Three',
                    'option1_image': 'https://placehold.co/100x100.png',
                    'option2_title': 'Four',
                    'option2_image': 'https://placehold.co/100x100.png',
                    'option3_title': 'Five',
                    'option3_image': 'https://placehold.co/100x100.png',
                    'option4_title': 'Six',
                    'option4_image': 'https://placehold.co/100x100.png',
                    'correct_option_number': '2',
                    'solution_image': 'https://placehold.co/300x200.png'
                },
                {
                    'paper_title': 'Test Paper 1',
                    'topic_title': 'Mathematics',
                    'question_title': 'What is 3+3?',
                    'duration': '60',
                    'description': 'Basic arithmetic',
                    'question_image': 'https://placehold.co/600x400.png',
                    'solution_text': 'The answer is 6',
                    'tip': 'Add the numbers',
                    'status': 'active',
                    'option1_title': 'Five',
                    'option1_image': 'https://placehold.co/100x100.png',
                    'option2_title': 'Six',
                    'option2_image': 'https://placehold.co/100x100.png',
                    'option3_title': 'Seven',
                    'option3_image': 'https://placehold.co/100x100.png',
                    'option4_title': 'Eight',
                    'option4_image': 'https://placehold.co/100x100.png',
                    'correct_option_number': '2',
                    'solution_image': 'https://placehold.co/300x200.png'
                }
            ]
            
            csv_content = self.create_csv_content(rows)
            
            # Create temporary CSV file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_content)
                csv_file_path = f.name
            
            try:
                # Upload CSV
                with open(csv_file_path, 'rb') as csv_file:
                    files = {'csv_file': ('test.csv', csv_file, 'text/csv')}
                    data = {'test_id': self.test_id}
                    
                    response = self.session.post(
                        f"{BASE_URL}/api/admin/import-questions",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Import response: {json.dumps(result, indent=2)}")
                    
                    # Verify expectations
                    success = result.get('success', False)
                    imported = result.get('imported', 0)
                    invalid_image_urls = result.get('invalid_image_urls', [])
                    missing_images = result.get('missing_images', [])
                    
                    if success and imported >= 2 and len(invalid_image_urls) == 0 and len(missing_images) == 0:
                        print("✅ Scenario 1 PASSED: Valid URLs imported successfully")
                        
                        # Verify questions were stored with correct URLs
                        questions_response = self.session.get(f"{BASE_URL}/api/admin/questions?mockTestId={self.test_id}")
                        if questions_response.status_code == 200:
                            result = questions_response.json()
                            questions = result.get('data', []) if isinstance(result, dict) else result
                            if len(questions) >= 2:
                                # Find our test questions
                                test_questions = [q for q in questions if q.get('question_text', '').startswith('What is')]
                                if len(test_questions) >= 2:
                                    q1 = test_questions[0]
                                    if (q1.get('question_image_url') == 'https://placehold.co/600x400.png' and
                                        q1.get('solution_image_url') == 'https://placehold.co/300x200.png' and
                                        q1.get('options', [{}])[0].get('image_url') == 'https://placehold.co/100x100.png'):
                                        print("✅ Question URLs stored correctly")
                                        return True
                                    else:
                                        print("❌ Question URLs not stored correctly")
                                        print(f"Debug - q1 question_image_url: {q1.get('question_image_url')}")
                                        print(f"Debug - q1 solution_image_url: {q1.get('solution_image_url')}")
                                        print(f"Debug - q1 options[0]: {q1.get('options', [{}])[0] if q1.get('options') else 'None'}")
                                        return False
                                else:
                                    print("❌ Not enough test questions found")
                                    return False
                            else:
                                print("❌ Not enough questions found in database")
                                return False
                        else:
                            print("❌ Failed to retrieve questions")
                            return False
                    else:
                        print(f"❌ Scenario 1 FAILED: success={success}, imported={imported}, invalid_urls={len(invalid_image_urls)}, missing={len(missing_images)}")
                        return False
                else:
                    print(f"❌ Import failed: {response.status_code} - {response.text}")
                    return False
                    
            finally:
                os.unlink(csv_file_path)
                
        except Exception as e:
            print(f"❌ Scenario 1 error: {e}")
            return False
    
    def test_scenario_2_mixed_urls(self) -> bool:
        """Test URL mode with mixed valid/invalid URLs"""
        print("\n🧪 Test Scenario 2: URL mode — mixed (one bogus URL)")
        
        try:
            rows = [
                {
                    'paper_title': 'Test Paper 2',
                    'topic_title': 'Science',
                    'question_title': 'Valid URL question',
                    'duration': '60',
                    'description': 'Question with valid URL',
                    'question_image': 'https://placehold.co/600x400.png',
                    'solution_text': 'Valid solution',
                    'tip': 'Valid tip',
                    'status': 'active',
                    'option1_title': 'Option A',
                    'option1_image': '',
                    'option2_title': 'Option B',
                    'option2_image': '',
                    'option3_title': 'Option C',
                    'option3_image': '',
                    'option4_title': 'Option D',
                    'option4_image': '',
                    'correct_option_number': '1',
                    'solution_image': ''
                },
                {
                    'paper_title': 'Test Paper 2',
                    'topic_title': 'Science',
                    'question_title': 'Invalid URL question',
                    'duration': '60',
                    'description': 'Question with invalid URL',
                    'question_image': 'https://this-host-definitely-does-not-exist-xyz.invalid/missing.png',
                    'solution_text': 'Invalid solution',
                    'tip': 'Invalid tip',
                    'status': 'active',
                    'option1_title': 'Option A',
                    'option1_image': '',
                    'option2_title': 'Option B',
                    'option2_image': '',
                    'option3_title': 'Option C',
                    'option3_image': '',
                    'option4_title': 'Option D',
                    'option4_image': '',
                    'correct_option_number': '1',
                    'solution_image': ''
                }
            ]
            
            csv_content = self.create_csv_content(rows)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_content)
                csv_file_path = f.name
            
            try:
                with open(csv_file_path, 'rb') as csv_file:
                    files = {'csv_file': ('test.csv', csv_file, 'text/csv')}
                    data = {'test_id': self.test_id}
                    
                    response = self.session.post(
                        f"{BASE_URL}/api/admin/import-questions",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Import response: {json.dumps(result, indent=2)}")
                    
                    imported = result.get('imported', 0)
                    invalid_image_urls = result.get('invalid_image_urls', [])
                    
                    # Should import at least 1 (valid row), and have 1 invalid URL entry
                    if imported >= 1 and len(invalid_image_urls) > 0:
                        invalid_entry = invalid_image_urls[0]
                        expected_url = 'https://this-host-definitely-does-not-exist-xyz.invalid/missing.png'
                        if (invalid_entry.get('row') == 3 and  # Row 3 (header=1, first data=2, second data=3)
                            invalid_entry.get('field') == 'question_image' and
                            invalid_entry.get('url') == expected_url and
                            'error' in invalid_entry):
                            print("✅ Scenario 2 PASSED: Mixed URLs handled correctly")
                            return True
                        else:
                            print(f"❌ Invalid URL entry format incorrect: {invalid_entry}")
                            return False
                    else:
                        print(f"❌ Scenario 2 FAILED: imported={imported}, invalid_urls={len(invalid_image_urls)}")
                        return False
                else:
                    print(f"❌ Import failed: {response.status_code} - {response.text}")
                    return False
                    
            finally:
                os.unlink(csv_file_path)
                
        except Exception as e:
            print(f"❌ Scenario 2 error: {e}")
            return False
    
    def test_scenario_3_wrong_content_type(self) -> bool:
        """Test URL mode with wrong content type"""
        print("\n🧪 Test Scenario 3: URL mode — wrong content type")
        
        try:
            rows = [
                {
                    'paper_title': 'Test Paper 3',
                    'topic_title': 'Content Type Test',
                    'question_title': 'Wrong content type question',
                    'duration': '60',
                    'description': 'Question with HTML URL instead of image',
                    'question_image': 'https://example.com/',  # This returns text/html
                    'solution_text': 'Solution text',
                    'tip': 'Tip text',
                    'status': 'active',
                    'option1_title': 'Option A',
                    'option1_image': '',
                    'option2_title': 'Option B',
                    'option2_image': '',
                    'option3_title': 'Option C',
                    'option3_image': '',
                    'option4_title': 'Option D',
                    'option4_image': '',
                    'correct_option_number': '1',
                    'solution_image': ''
                }
            ]
            
            csv_content = self.create_csv_content(rows)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_content)
                csv_file_path = f.name
            
            try:
                with open(csv_file_path, 'rb') as csv_file:
                    files = {'csv_file': ('test.csv', csv_file, 'text/csv')}
                    data = {'test_id': self.test_id}
                    
                    response = self.session.post(
                        f"{BASE_URL}/api/admin/import-questions",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Import response: {json.dumps(result, indent=2)}")
                    
                    invalid_image_urls = result.get('invalid_image_urls', [])
                    
                    # Should have invalid URL entry for wrong content type
                    if len(invalid_image_urls) > 0:
                        invalid_entry = invalid_image_urls[0]
                        if (invalid_entry.get('url') == 'https://example.com/' and
                            'not an image' in invalid_entry.get('error', '').lower() or
                            'content-type' in invalid_entry.get('error', '').lower()):
                            print("✅ Scenario 3 PASSED: Wrong content type detected")
                            return True
                        else:
                            print(f"❌ Wrong content type error format: {invalid_entry}")
                            return False
                    else:
                        print("❌ Scenario 3 FAILED: No invalid URL detected for wrong content type")
                        return False
                else:
                    print(f"❌ Import failed: {response.status_code} - {response.text}")
                    return False
                    
            finally:
                os.unlink(csv_file_path)
                
        except Exception as e:
            print(f"❌ Scenario 3 error: {e}")
            return False
    
    def test_scenario_4_paper_title_alias(self) -> bool:
        """Test paper_title alias functionality"""
        print("\n🧪 Test Scenario 4: paper_title alias")
        
        try:
            rows = [
                {
                    'paper_title': 'Custom Paper Title from CSV',
                    'topic_title': 'Alias Test',
                    'question_title': 'Paper title alias test',
                    'duration': '60',
                    'description': 'Testing paper_title alias',
                    'question_image': '',
                    'solution_text': 'Solution',
                    'tip': 'Tip',
                    'status': 'active',
                    'option1_title': 'Option A',
                    'option1_image': '',
                    'option2_title': 'Option B',
                    'option2_image': '',
                    'option3_title': 'Option C',
                    'option3_image': '',
                    'option4_title': 'Option D',
                    'option4_image': '',
                    'correct_option_number': '1',
                    'solution_image': ''
                }
            ]
            
            csv_content = self.create_csv_content(rows)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_content)
                csv_file_path = f.name
            
            try:
                with open(csv_file_path, 'rb') as csv_file:
                    files = {'csv_file': ('test.csv', csv_file, 'text/csv')}
                    data = {'test_id': self.test_id}
                    
                    response = self.session.post(
                        f"{BASE_URL}/api/admin/import-questions",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Import response: {json.dumps(result, indent=2)}")
                    
                    if result.get('success') and result.get('imported', 0) > 0:
                        # Check if question has the paper_title value in test_title field
                        questions_response = self.session.get(f"{BASE_URL}/api/admin/questions?mockTestId={self.test_id}")
                        if questions_response.status_code == 200:
                            result = questions_response.json()
                            questions = result.get('data', []) if isinstance(result, dict) else result
                            # Find the question we just imported
                            for q in questions:
                                if q.get('question_text') == 'Paper title alias test':
                                    if q.get('test_title') == 'Custom Paper Title from CSV':
                                        print("✅ Scenario 4 PASSED: paper_title alias working")
                                        return True
                                    else:
                                        print(f"❌ test_title mismatch: expected 'Custom Paper Title from CSV', got '{q.get('test_title')}'")
                                        return False
                            print("❌ Could not find the imported question")
                            return False
                        else:
                            print("❌ Failed to retrieve questions")
                            return False
                    else:
                        print("❌ Import failed")
                        return False
                else:
                    print(f"❌ Import failed: {response.status_code} - {response.text}")
                    return False
                    
            finally:
                os.unlink(csv_file_path)
                
        except Exception as e:
            print(f"❌ Scenario 4 error: {e}")
            return False
    
    def test_scenario_5_solution_image_persistence(self) -> bool:
        """Test solution_image persistence"""
        print("\n🧪 Test Scenario 5: solution_image persistence")
        
        try:
            rows = [
                {
                    'paper_title': 'Solution Image Test',
                    'topic_title': 'Image Persistence',
                    'question_title': 'Question with solution image',
                    'duration': '60',
                    'description': 'Testing solution image persistence',
                    'question_image': '',
                    'solution_text': 'Solution with image',
                    'tip': 'Tip',
                    'status': 'active',
                    'option1_title': 'Option A',
                    'option1_image': '',
                    'option2_title': 'Option B',
                    'option2_image': '',
                    'option3_title': 'Option C',
                    'option3_image': '',
                    'option4_title': 'Option D',
                    'option4_image': '',
                    'correct_option_number': '1',
                    'solution_image': 'https://placehold.co/400x300.png'
                },
                {
                    'paper_title': 'Solution Image Test',
                    'topic_title': 'Image Persistence',
                    'question_title': 'Question without solution image',
                    'duration': '60',
                    'description': 'Testing empty solution image',
                    'question_image': '',
                    'solution_text': 'Solution without image',
                    'tip': 'Tip',
                    'status': 'active',
                    'option1_title': 'Option A',
                    'option1_image': '',
                    'option2_title': 'Option B',
                    'option2_image': '',
                    'option3_title': 'Option C',
                    'option3_image': '',
                    'option4_title': 'Option D',
                    'option4_image': '',
                    'correct_option_number': '1',
                    'solution_image': ''
                }
            ]
            
            csv_content = self.create_csv_content(rows)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_content)
                csv_file_path = f.name
            
            try:
                with open(csv_file_path, 'rb') as csv_file:
                    files = {'csv_file': ('test.csv', csv_file, 'text/csv')}
                    data = {'test_id': self.test_id}
                    
                    response = self.session.post(
                        f"{BASE_URL}/api/admin/import-questions",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Import response: {json.dumps(result, indent=2)}")
                    
                    if result.get('success') and result.get('imported', 0) >= 2:
                        # Check solution_image_url field persistence
                        questions_response = self.session.get(f"{BASE_URL}/api/admin/questions?mockTestId={self.test_id}")
                        if questions_response.status_code == 200:
                            result = questions_response.json()
                            questions = result.get('data', []) if isinstance(result, dict) else result
                            
                            with_image = None
                            without_image = None
                            
                            for q in questions:
                                if q.get('question_text') == 'Question with solution image':
                                    with_image = q
                                elif q.get('question_text') == 'Question without solution image':
                                    without_image = q
                            
                            if with_image and without_image:
                                if (with_image.get('solution_image_url') == 'https://placehold.co/400x300.png' and
                                    (without_image.get('solution_image_url') is None or without_image.get('solution_image_url') == '')):
                                    print("✅ Scenario 5 PASSED: solution_image_url persistence working")
                                    return True
                                else:
                                    print(f"❌ solution_image_url values incorrect: with_image={with_image.get('solution_image_url')}, without_image={without_image.get('solution_image_url')}")
                                    return False
                            else:
                                print("❌ Could not find both test questions")
                                return False
                        else:
                            print("❌ Failed to retrieve questions")
                            return False
                    else:
                        print("❌ Import failed or insufficient questions imported")
                        return False
                else:
                    print(f"❌ Import failed: {response.status_code} - {response.text}")
                    return False
                    
            finally:
                os.unlink(csv_file_path)
                
        except Exception as e:
            print(f"❌ Scenario 5 error: {e}")
            return False
    
    def test_scenario_6_zip_mode_regression(self) -> bool:
        """Test ZIP-mode regression (backward compatibility)"""
        print("\n🧪 Test Scenario 6: ZIP-mode regression")
        
        try:
            # Create CSV with filenames (not URLs)
            rows = [
                {
                    'paper_title': 'ZIP Mode Test',
                    'topic_title': 'Regression Test',
                    'question_title': 'ZIP mode question',
                    'duration': '60',
                    'description': 'Testing ZIP mode regression',
                    'question_image': 'q1.png',  # Filename, not URL
                    'solution_text': 'Solution',
                    'tip': 'Tip',
                    'status': 'active',
                    'option1_title': 'Option A',
                    'option1_image': 'opt1.png',
                    'option2_title': 'Option B',
                    'option2_image': 'opt2.png',
                    'option3_title': 'Option C',
                    'option3_image': 'opt3.png',
                    'option4_title': 'Option D',
                    'option4_image': 'opt4.png',
                    'correct_option_number': '1',
                    'solution_image': 'sol1.png'
                }
            ]
            
            csv_content = self.create_csv_content(rows)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_content)
                csv_file_path = f.name
            
            try:
                # Upload CSV without ZIP file
                with open(csv_file_path, 'rb') as csv_file:
                    files = {'csv_file': ('test.csv', csv_file, 'text/csv')}
                    data = {'test_id': self.test_id}
                    
                    response = self.session.post(
                        f"{BASE_URL}/api/admin/import-questions",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Import response: {json.dumps(result, indent=2)}")
                    
                    # Should detect ZIP-mode (no urlMode) and populate missing_images
                    missing_images = result.get('missing_images', [])
                    imported = result.get('imported', 0)
                    
                    if imported > 0 and len(missing_images) > 0:
                        # Check that missing images are reported for filenames
                        expected_files = ['q1.png', 'opt1.png', 'opt2.png', 'opt3.png', 'opt4.png', 'sol1.png']
                        missing_files = [item.get('filename') for item in missing_images]
                        
                        if any(f in missing_files for f in expected_files):
                            print("✅ Scenario 6 PASSED: ZIP-mode regression working, missing images detected")
                            return True
                        else:
                            print(f"❌ Expected missing files not found: expected some of {expected_files}, got {missing_files}")
                            return False
                    else:
                        print(f"❌ Scenario 6 FAILED: imported={imported}, missing_images={len(missing_images)}")
                        return False
                else:
                    print(f"❌ Import failed: {response.status_code} - {response.text}")
                    return False
                    
            finally:
                os.unlink(csv_file_path)
                
        except Exception as e:
            print(f"❌ Scenario 6 error: {e}")
            return False
    
    def test_scenario_7_auth_required(self) -> bool:
        """Test authentication requirement"""
        print("\n🧪 Test Scenario 7: Auth requirement")
        
        try:
            # Create a simple CSV
            rows = [
                {
                    'paper_title': 'Auth Test',
                    'topic_title': 'Security',
                    'question_title': 'Auth test question',
                    'duration': '60',
                    'description': 'Testing auth requirement',
                    'question_image': '',
                    'solution_text': 'Solution',
                    'tip': 'Tip',
                    'status': 'active',
                    'option1_title': 'Option A',
                    'option1_image': '',
                    'option2_title': 'Option B',
                    'option2_image': '',
                    'option3_title': 'Option C',
                    'option3_image': '',
                    'option4_title': 'Option D',
                    'option4_image': '',
                    'correct_option_number': '1',
                    'solution_image': ''
                }
            ]
            
            csv_content = self.create_csv_content(rows)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_content)
                csv_file_path = f.name
            
            try:
                # Create new session without auth
                unauth_session = requests.Session()
                
                with open(csv_file_path, 'rb') as csv_file:
                    files = {'csv_file': ('test.csv', csv_file, 'text/csv')}
                    data = {'test_id': self.test_id}
                    
                    response = unauth_session.post(
                        f"{BASE_URL}/api/admin/import-questions",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 401:
                    result = response.json()
                    if 'Unauthorized' in result.get('error', ''):
                        print("✅ Scenario 7 PASSED: Authentication required, 401 returned")
                        return True
                    else:
                        print(f"❌ Wrong error message: {result}")
                        return False
                else:
                    print(f"❌ Scenario 7 FAILED: Expected 401, got {response.status_code}")
                    return False
                    
            finally:
                os.unlink(csv_file_path)
                
        except Exception as e:
            print(f"❌ Scenario 7 error: {e}")
            return False
    
    def test_scenario_8_invalid_csv(self) -> bool:
        """Test invalid CSV handling"""
        print("\n🧪 Test Scenario 8: Invalid CSV")
        
        try:
            # Create malformed CSV with unbalanced quotes
            malformed_csv = '''paper_title,topic_title,question_title,correct_option_number
"Test Paper","Topic","Question with unbalanced quote,1
"Another","Topic","Valid question",2'''
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(malformed_csv)
                csv_file_path = f.name
            
            try:
                with open(csv_file_path, 'rb') as csv_file:
                    files = {'csv_file': ('test.csv', csv_file, 'text/csv')}
                    data = {'test_id': self.test_id}
                    
                    response = self.session.post(
                        f"{BASE_URL}/api/admin/import-questions",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 400:
                    result = response.json()
                    error_msg = result.get('error', '').lower()
                    if 'csv' in error_msg and ('parse' in error_msg or 'format' in error_msg or 'invalid' in error_msg):
                        print("✅ Scenario 8 PASSED: Invalid CSV detected with 400 error")
                        return True
                    else:
                        print(f"❌ Wrong error message format: {result}")
                        return False
                else:
                    print(f"❌ Scenario 8 FAILED: Expected 400, got {response.status_code}")
                    return False
                    
            finally:
                os.unlink(csv_file_path)
                
        except Exception as e:
            print(f"❌ Scenario 8 error: {e}")
            return False
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all test scenarios"""
        print("🚀 Starting CSV Question Import URL-based Testing")
        print("=" * 60)
        
        # Login first
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return {}
        
        # Get test ID
        if not self.get_or_create_test_id():
            print("❌ Cannot proceed without test ID")
            return {}
        
        # Run all test scenarios
        results = {}
        
        test_methods = [
            ('URL mode happy path', self.test_scenario_1_url_mode_happy_path),
            ('URL mode mixed URLs', self.test_scenario_2_mixed_urls),
            ('URL mode wrong content type', self.test_scenario_3_wrong_content_type),
            ('paper_title alias', self.test_scenario_4_paper_title_alias),
            ('solution_image persistence', self.test_scenario_5_solution_image_persistence),
            ('ZIP-mode regression', self.test_scenario_6_zip_mode_regression),
            ('Auth requirement', self.test_scenario_7_auth_required),
            ('Invalid CSV', self.test_scenario_8_invalid_csv)
        ]
        
        for test_name, test_method in test_methods:
            try:
                results[test_name] = test_method()
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results[test_name] = False
        
        return results

def main():
    """Main test execution"""
    tester = CSVQuestionImportTester()
    results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! CSV Question Import URL-based functionality working correctly.")
    else:
        print("⚠️  Some tests failed. Please review the failures above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)