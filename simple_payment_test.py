#!/usr/bin/env python3
"""
Simple test for payment create-order endpoint
"""

import requests
import json

BASE_URL = "https://admin-cleanup-18.preview.emergentagent.com"
ADMIN_EMAIL = "admin@unishaala.com"
ADMIN_PASSWORD = "Shivani@1234"

# Login first
session = requests.Session()
login_response = session.post(f"{BASE_URL}/api/auth/login", 
    json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })

print(f"Login Status: {login_response.status_code}")
print(f"Login Response: {login_response.json()}")

if login_response.status_code == 200:
    # Test payment create-order
    payment_response = session.post(f"{BASE_URL}/api/payment/create-order", 
        json={
            "paymentType": "get_pass",
            "amount": 4999
        })
    
    print(f"\nPayment Status: {payment_response.status_code}")
    print(f"Payment Response: {payment_response.text}")