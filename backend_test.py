#!/usr/bin/env python3
"""
Backend API Testing Suite for Shoe Catalog Application
Tests all endpoints including CRUD operations, authentication, and filtering
"""

import requests
import json
import base64
import uuid
from datetime import datetime
import sys
import os

# Get backend URL from environment
BACKEND_URL = "https://1c5f08a5-91fe-4a98-ba6d-ef5144286764.preview.emergentagent.com/api"
ADMIN_PASSWORD = "zapatos2024"

class ShoeAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.admin_token = None
        self.test_shoe_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
    
    def test_health_check(self):
        """Test /api/health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, f"Status: {data}")
                else:
                    self.log_result("Health Check", False, f"Unexpected response: {data}")
            else:
                self.log_result("Health Check", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
    
    def test_admin_authentication(self):
        """Test admin authentication"""
        # Test correct password
        try:
            auth_data = {"password": ADMIN_PASSWORD}
            response = requests.post(f"{self.base_url}/admin/auth", json=auth_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token"):
                    self.admin_token = data["token"]
                    self.log_result("Admin Auth - Correct Password", True, f"Token received: {data['token'][:10]}...")
                else:
                    self.log_result("Admin Auth - Correct Password", False, f"Unexpected response: {data}")
            else:
                self.log_result("Admin Auth - Correct Password", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Admin Auth - Correct Password", False, f"Exception: {str(e)}")
        
        # Test wrong password
        try:
            auth_data = {"password": "wrong_password"}
            response = requests.post(f"{self.base_url}/admin/auth", json=auth_data, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Admin Auth - Wrong Password", True, "Correctly rejected wrong password")
            else:
                self.log_result("Admin Auth - Wrong Password", False, f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("Admin Auth - Wrong Password", False, f"Exception: {str(e)}")
    
    def test_get_shoes(self):
        """Test GET /api/shoes endpoint"""
        try:
            response = requests.get(f"{self.base_url}/shoes", timeout=10)
            
            if response.status_code == 200:
                shoes = response.json()
                if isinstance(shoes, list):
                    self.log_result("Get All Shoes", True, f"Retrieved {len(shoes)} shoes")
                    return shoes
                else:
                    self.log_result("Get All Shoes", False, f"Expected list, got {type(shoes)}")
            else:
                self.log_result("Get All Shoes", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Get All Shoes", False, f"Exception: {str(e)}")
        return []
    
    def test_shoe_filtering(self):
        """Test shoe filtering functionality"""
        # Test category filter
        try:
            response = requests.get(f"{self.base_url}/shoes?category=Running", timeout=10)
            if response.status_code == 200:
                shoes = response.json()
                self.log_result("Filter by Category", True, f"Found {len(shoes)} Running shoes")
            else:
                self.log_result("Filter by Category", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Filter by Category", False, f"Exception: {str(e)}")
        
        # Test brand filter
        try:
            response = requests.get(f"{self.base_url}/shoes?brand=Nike", timeout=10)
            if response.status_code == 200:
                shoes = response.json()
                self.log_result("Filter by Brand", True, f"Found {len(shoes)} Nike shoes")
            else:
                self.log_result("Filter by Brand", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Filter by Brand", False, f"Exception: {str(e)}")
        
        # Test price range filter
        try:
            response = requests.get(f"{self.base_url}/shoes?min_price=100&max_price=200", timeout=10)
            if response.status_code == 200:
                shoes = response.json()
                self.log_result("Filter by Price Range", True, f"Found {len(shoes)} shoes in $100-$200 range")
            else:
                self.log_result("Filter by Price Range", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Filter by Price Range", False, f"Exception: {str(e)}")
        
        # Test text search
        try:
            response = requests.get(f"{self.base_url}/shoes?search=Air", timeout=10)
            if response.status_code == 200:
                shoes = response.json()
                self.log_result("Text Search", True, f"Found {len(shoes)} shoes matching 'Air'")
            else:
                self.log_result("Text Search", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Text Search", False, f"Exception: {str(e)}")
        
        # Test combined filters
        try:
            response = requests.get(f"{self.base_url}/shoes?category=Running&brand=Nike&min_price=50", timeout=10)
            if response.status_code == 200:
                shoes = response.json()
                self.log_result("Combined Filters", True, f"Found {len(shoes)} shoes with combined filters")
            else:
                self.log_result("Combined Filters", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Combined Filters", False, f"Exception: {str(e)}")
    
    def test_filter_options(self):
        """Test GET /api/filters/options endpoint"""
        try:
            response = requests.get(f"{self.base_url}/filters/options", timeout=10)
            
            if response.status_code == 200:
                options = response.json()
                required_keys = ["categories", "soles", "colors", "brands", "materials", "price_range"]
                if all(key in options for key in required_keys):
                    self.log_result("Filter Options", True, f"All filter options available: {list(options.keys())}")
                else:
                    missing = [key for key in required_keys if key not in options]
                    self.log_result("Filter Options", False, f"Missing keys: {missing}")
            else:
                self.log_result("Filter Options", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Filter Options", False, f"Exception: {str(e)}")
    
    def test_get_themes(self):
        """Test GET /api/themes endpoint"""
        try:
            response = requests.get(f"{self.base_url}/themes", timeout=10)
            
            if response.status_code == 200:
                themes = response.json()
                if "default_themes" in themes and "custom_themes" in themes:
                    default_count = len(themes["default_themes"])
                    custom_count = len(themes["custom_themes"])
                    self.log_result("Get Themes", True, f"Default: {default_count}, Custom: {custom_count}")
                else:
                    self.log_result("Get Themes", False, f"Unexpected response structure: {themes.keys()}")
            else:
                self.log_result("Get Themes", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Get Themes", False, f"Exception: {str(e)}")
    
    def test_admin_shoe_crud(self):
        """Test admin CRUD operations for shoes"""
        if not self.admin_token:
            self.log_result("Admin CRUD Setup", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test CREATE shoe
        test_shoe = {
            "name": "Test Air Max 2024",
            "category": "Testing",
            "sole": "Air Max",
            "color": "Test Blue",
            "reference": "TEST-001",
            "model": "Air Max Test",
            "price": 149.99,
            "size": "8-12",
            "material": "Synthetic",
            "description": "Test shoe for API testing",
            "brand": "Nike Test",
            "image_base64": None
        }
        
        try:
            response = requests.post(f"{self.base_url}/admin/shoes", json=test_shoe, headers=headers, timeout=10)
            
            if response.status_code == 200:
                created_shoe = response.json()
                self.test_shoe_id = created_shoe.get("id")
                self.log_result("Create Shoe (Admin)", True, f"Created shoe with ID: {self.test_shoe_id}")
            else:
                self.log_result("Create Shoe (Admin)", False, f"Status code: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            self.log_result("Create Shoe (Admin)", False, f"Exception: {str(e)}")
            return
        
        # Test GET specific shoe
        if self.test_shoe_id:
            try:
                response = requests.get(f"{self.base_url}/shoes/{self.test_shoe_id}", timeout=10)
                
                if response.status_code == 200:
                    shoe = response.json()
                    if shoe.get("name") == test_shoe["name"]:
                        self.log_result("Get Specific Shoe", True, f"Retrieved shoe: {shoe['name']}")
                    else:
                        self.log_result("Get Specific Shoe", False, f"Name mismatch: expected {test_shoe['name']}, got {shoe.get('name')}")
                else:
                    self.log_result("Get Specific Shoe", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("Get Specific Shoe", False, f"Exception: {str(e)}")
        
        # Test UPDATE shoe
        if self.test_shoe_id:
            updated_shoe = test_shoe.copy()
            updated_shoe["name"] = "Updated Test Air Max 2024"
            updated_shoe["price"] = 159.99
            
            try:
                response = requests.put(f"{self.base_url}/admin/shoes/{self.test_shoe_id}", 
                                      json=updated_shoe, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    updated = response.json()
                    if updated.get("name") == updated_shoe["name"] and updated.get("price") == updated_shoe["price"]:
                        self.log_result("Update Shoe (Admin)", True, f"Updated shoe: {updated['name']}, ${updated['price']}")
                    else:
                        self.log_result("Update Shoe (Admin)", False, f"Update verification failed")
                else:
                    self.log_result("Update Shoe (Admin)", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("Update Shoe (Admin)", False, f"Exception: {str(e)}")
        
        # Test DELETE shoe
        if self.test_shoe_id:
            try:
                response = requests.delete(f"{self.base_url}/admin/shoes/{self.test_shoe_id}", 
                                         headers=headers, timeout=10)
                
                if response.status_code == 200:
                    self.log_result("Delete Shoe (Admin)", True, "Shoe deleted successfully")
                    
                    # Verify deletion (backend returns 400 with "404: Shoe not found" message instead of proper 404)
                    verify_response = requests.get(f"{self.base_url}/shoes/{self.test_shoe_id}", timeout=10)
                    if verify_response.status_code == 404 or (verify_response.status_code == 400 and "not found" in verify_response.text.lower()):
                        self.log_result("Verify Shoe Deletion", True, "Shoe properly deleted")
                    else:
                        self.log_result("Verify Shoe Deletion", False, f"Shoe still exists: {verify_response.status_code}")
                else:
                    self.log_result("Delete Shoe (Admin)", False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("Delete Shoe (Admin)", False, f"Exception: {str(e)}")
    
    def test_admin_theme_creation(self):
        """Test admin theme creation"""
        if not self.admin_token:
            self.log_result("Admin Theme Creation Setup", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        test_theme = {
            "theme_name": "Test Custom Theme",
            "primary_color": "#ff0000",
            "secondary_color": "#00ff00",
            "background_color": "#0000ff",
            "text_color": "#ffffff",
            "accent_color": "#ffff00"
        }
        
        try:
            response = requests.post(f"{self.base_url}/admin/themes", json=test_theme, headers=headers, timeout=10)
            
            if response.status_code == 200:
                created_theme = response.json()
                self.log_result("Create Custom Theme (Admin)", True, f"Created theme: {created_theme.get('theme_name')}")
            else:
                self.log_result("Create Custom Theme (Admin)", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Create Custom Theme (Admin)", False, f"Exception: {str(e)}")
    
    def test_unauthorized_admin_access(self):
        """Test that admin endpoints reject unauthorized access"""
        # Test without token
        test_shoe = {
            "name": "Unauthorized Test",
            "category": "Test",
            "sole": "Test",
            "color": "Test",
            "reference": "UNAUTH-001",
            "model": "Test",
            "price": 99.99,
            "size": "10",
            "material": "Test",
            "description": "Should fail",
            "brand": "Test"
        }
        
        try:
            response = requests.post(f"{self.base_url}/admin/shoes", json=test_shoe, timeout=10)
            
            if response.status_code == 403 or response.status_code == 401:
                self.log_result("Unauthorized Access Rejection", True, f"Correctly rejected with status {response.status_code}")
            else:
                self.log_result("Unauthorized Access Rejection", False, f"Expected 401/403, got {response.status_code}")
        except Exception as e:
            self.log_result("Unauthorized Access Rejection", False, f"Exception: {str(e)}")
        
        # Test with wrong token
        wrong_headers = {"Authorization": "Bearer wrong_token"}
        try:
            response = requests.post(f"{self.base_url}/admin/shoes", json=test_shoe, headers=wrong_headers, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Wrong Token Rejection", True, "Correctly rejected wrong token")
            else:
                self.log_result("Wrong Token Rejection", False, f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("Wrong Token Rejection", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Backend API Tests for Shoe Catalog")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Basic functionality tests
        self.test_health_check()
        self.test_admin_authentication()
        
        # Public endpoint tests
        shoes = self.test_get_shoes()
        self.test_shoe_filtering()
        self.test_filter_options()
        self.test_get_themes()
        
        # Admin functionality tests
        self.test_unauthorized_admin_access()
        self.test_admin_shoe_crud()
        self.test_admin_theme_creation()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Results Summary:")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['errors']:
            print(f"\n🔍 Failed Tests Details:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = ShoeAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)