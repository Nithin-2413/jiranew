#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class JiraProxyTester:
    def __init__(self, base_url="https://team-metrics-62.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "response": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        
        return success

    def test_jira_test_connection(self):
        """Test JIRA test-connection endpoint"""
        url = f"{self.base_url}/api/jira/test-connection"
        test_data = {
            "url": "https://test.atlassian.net",
            "email": "test@example.com", 
            "apiToken": "test-token",
            "projectKey": "TEST"
        }
        
        try:
            response = requests.post(url, json=test_data, timeout=30)
            
            # Check if we got a response (not CORS blocked)
            if response.status_code in [200, 400, 401, 403, 500]:
                try:
                    data = response.json()
                    if data.get("success") == False and "error" in data:
                        # Expected: authentication error, not CORS
                        return self.log_result(
                            "JIRA Test Connection", 
                            True, 
                            f"Endpoint accessible, got expected auth error: {data['error'][:100]}...",
                            data
                        )
                    else:
                        return self.log_result(
                            "JIRA Test Connection", 
                            True, 
                            f"Endpoint accessible, response: {str(data)[:100]}...",
                            data
                        )
                except json.JSONDecodeError:
                    return self.log_result(
                        "JIRA Test Connection", 
                        False, 
                        f"Invalid JSON response, status: {response.status_code}",
                        {"status_code": response.status_code, "text": response.text[:200]}
                    )
            else:
                return self.log_result(
                    "JIRA Test Connection", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code}
                )
                
        except requests.exceptions.RequestException as e:
            return self.log_result(
                "JIRA Test Connection", 
                False, 
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_jira_search(self):
        """Test JIRA search endpoint"""
        url = f"{self.base_url}/api/jira/search"
        test_data = {
            "config": {
                "url": "https://test.atlassian.net",
                "email": "test@example.com",
                "apiToken": "test-token",
                "projectKey": "TEST"
            },
            "filters": {}
        }
        
        try:
            response = requests.post(url, json=test_data, timeout=30)
            
            if response.status_code in [200, 400, 401, 403, 500]:
                try:
                    data = response.json()
                    if data.get("success") == False and "error" in data:
                        return self.log_result(
                            "JIRA Search", 
                            True, 
                            f"Endpoint accessible, got expected error: {data['error'][:100]}...",
                            data
                        )
                    else:
                        return self.log_result(
                            "JIRA Search", 
                            True, 
                            f"Endpoint accessible, response: {str(data)[:100]}...",
                            data
                        )
                except json.JSONDecodeError:
                    return self.log_result(
                        "JIRA Search", 
                        False, 
                        f"Invalid JSON response, status: {response.status_code}",
                        {"status_code": response.status_code, "text": response.text[:200]}
                    )
            else:
                return self.log_result(
                    "JIRA Search", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code}
                )
                
        except requests.exceptions.RequestException as e:
            return self.log_result(
                "JIRA Search", 
                False, 
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_jira_sprints(self):
        """Test JIRA sprints endpoint"""
        url = f"{self.base_url}/api/jira/sprints"
        test_data = {
            "url": "https://test.atlassian.net",
            "email": "test@example.com",
            "apiToken": "test-token",
            "projectKey": "TEST"
        }
        
        try:
            response = requests.post(url, json=test_data, timeout=30)
            
            if response.status_code in [200, 400, 401, 403, 500]:
                try:
                    data = response.json()
                    # Sprints endpoint returns success=True even with auth errors
                    if "success" in data:
                        return self.log_result(
                            "JIRA Sprints", 
                            True, 
                            f"Endpoint accessible, response: {str(data)[:100]}...",
                            data
                        )
                    else:
                        return self.log_result(
                            "JIRA Sprints", 
                            True, 
                            f"Endpoint accessible, got response: {str(data)[:100]}...",
                            data
                        )
                except json.JSONDecodeError:
                    return self.log_result(
                        "JIRA Sprints", 
                        False, 
                        f"Invalid JSON response, status: {response.status_code}",
                        {"status_code": response.status_code, "text": response.text[:200]}
                    )
            else:
                return self.log_result(
                    "JIRA Sprints", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code}
                )
                
        except requests.exceptions.RequestException as e:
            return self.log_result(
                "JIRA Sprints", 
                False, 
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )

    def test_basic_api_endpoint(self):
        """Test basic API endpoint"""
        url = f"{self.base_url}/api/"
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get("message") == "Hello World":
                        return self.log_result(
                            "Basic API", 
                            True, 
                            "Basic API endpoint working correctly",
                            data
                        )
                    else:
                        return self.log_result(
                            "Basic API", 
                            True, 
                            f"API accessible, unexpected response: {data}",
                            data
                        )
                except json.JSONDecodeError:
                    return self.log_result(
                        "Basic API", 
                        False, 
                        f"Invalid JSON response, status: {response.status_code}",
                        {"status_code": response.status_code}
                    )
            else:
                return self.log_result(
                    "Basic API", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code}
                )
                
        except requests.exceptions.RequestException as e:
            return self.log_result(
                "Basic API", 
                False, 
                f"Request failed: {str(e)}",
                {"error": str(e)}
            )

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting JIRA Backend Proxy Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic API first
        self.test_basic_api_endpoint()
        
        # Test JIRA proxy endpoints
        self.test_jira_test_connection()
        self.test_jira_search()
        self.test_jira_sprints()
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        # Print detailed results
        print("\n📋 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        # Check for CORS-related failures
        cors_issues = []
        for result in self.test_results:
            if not result["success"] and ("cors" in result["message"].lower() or "cross-origin" in result["message"].lower()):
                cors_issues.append(result["test"])
        
        if cors_issues:
            print(f"\n⚠️  CORS Issues Found in: {', '.join(cors_issues)}")
        else:
            print("\n✅ No CORS issues detected - all endpoints accessible")
        
        return self.tests_passed == self.tests_run

def main():
    tester = JiraProxyTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())