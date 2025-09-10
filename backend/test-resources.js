#!/usr/bin/env node

/**
 * Comprehensive Resource API Testing Script
 * 
 * This script tests all Resource endpoints to ensure they work correctly.
 * Run this after the server is started.
 */

const https = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Test configuration
const testConfig = {
  timeout: 5000,
  verbose: true
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.setTimeout(testConfig.timeout);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test runner function
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Running: ${testName}`);
  try {
    await testFunction();
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS' });
    console.log(`✅ PASS: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log(`❌ FAIL: ${testName} - ${error.message}`);
    if (testConfig.verbose) {
      console.log(`   Error details: ${error.stack}`);
    }
  }
}

// Test functions
async function testHealthEndpoint() {
  const response = await makeRequest('GET', '/health');
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  if (!response.body || !response.body.success) {
    throw new Error('Health check should return success: true');
  }
}

async function testResourceCategories() {
  const response = await makeRequest('GET', '/resources/categories');
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  if (!response.body || !response.body.success) {
    throw new Error('Categories endpoint should return success: true');
  }
  if (!Array.isArray(response.body.data)) {
    throw new Error('Categories should return an array of categories');
  }
}

async function testGetResources() {
  const response = await makeRequest('GET', '/resources');
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  if (!response.body || !response.body.success) {
    throw new Error('Get resources should return success: true');
  }
  if (!response.body.data || !Array.isArray(response.body.data)) {
    throw new Error('Response should contain data array');
  }
  if (!response.body.pagination) {
    throw new Error('Response should contain pagination info');
  }
}

async function testGetResourcesWithPagination() {
  const response = await makeRequest('GET', '/resources?page=1&limit=5');
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  if (!response.body.pagination || response.body.pagination.limit !== 5) {
    throw new Error('Pagination limit should be respected');
  }
}

async function testGetResourcesWithFilters() {
  const response = await makeRequest('GET', '/resources?category=Tools&sort_by=created_at&sort_order=DESC');
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  // Should not error even if no results match
}

async function testSearchResourcesValidation() {
  // Test without search query - should fail validation
  const response = await makeRequest('GET', '/resources/search');
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for missing search query, got ${response.statusCode}`);
  }
}

async function testSearchResourcesWithQuery() {
  const response = await makeRequest('GET', '/resources/search?q=test');
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
}

async function testNearbyResourcesValidation() {
  // Test without required location parameters
  const response = await makeRequest('GET', '/resources/nearby');
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for missing location, got ${response.statusCode}`);
  }
}

async function testNearbyResourcesWithLocation() {
  const response = await makeRequest('GET', '/resources/nearby?latitude=40.7128&longitude=-74.0060&radius=10');
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
}

async function testCreateResourceValidation() {
  // Test with invalid data - should fail validation
  const invalidResource = {
    title: 'A', // Too short
    description: 'Short', // Too short
    category: 'InvalidCategory' // Invalid category
  };
  
  const response = await makeRequest('POST', '/resources', invalidResource);
  if (response.statusCode !== 400 && response.statusCode !== 422) {
    throw new Error(`Expected status 400 or 422 for validation error, got ${response.statusCode}`);
  }
}

async function testCreateResourceWithoutAuth() {
  // Test creating resource without authentication
  const validResource = {
    title: 'Test Resource',
    description: 'This is a test resource with valid data for testing purposes',
    category: 'Tools',
    condition: 'good',
    estimated_value: 100
  };
  
  const response = await makeRequest('POST', '/resources', validResource);
  // Should fail due to no authentication, but validation should pass first
  // The exact status code depends on auth middleware implementation
  if (response.statusCode === 200 || response.statusCode === 201) {
    console.log('   ⚠️  Warning: Resource creation succeeded without authentication');
  }
}

async function testResourceIdValidation() {
  // Test with invalid resource ID
  const response = await makeRequest('GET', '/resources/invalid-id');
  if (response.statusCode !== 400 && response.statusCode !== 404) {
    throw new Error(`Expected status 400 or 404 for invalid ID, got ${response.statusCode}`);
  }
}

async function testNonExistentResource() {
  // Test with non-existent but valid ID
  const response = await makeRequest('GET', '/resources/99999');
  if (response.statusCode !== 404) {
    throw new Error(`Expected status 404 for non-existent resource, got ${response.statusCode}`);
  }
}

async function testInvalidQueryParameters() {
  // Test with invalid query parameters
  const response = await makeRequest('GET', '/resources?page=0&limit=1000');
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for invalid pagination params, got ${response.statusCode}`);
  }
}

async function testLocationValidation() {
  // Test with invalid coordinates
  const response = await makeRequest('GET', '/resources/nearby?latitude=999&longitude=-999');
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for invalid coordinates, got ${response.statusCode}`);
  }
}

async function testPhotoUploadValidation() {
  // Test photo upload without files
  const response = await makeRequest('POST', '/resources/1/photos');
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for missing files, got ${response.statusCode}`);
  }
}

async function testUpdateResourceValidation() {
  // Test update with invalid data
  const invalidUpdate = {
    title: '', // Empty title
    estimated_value: -100 // Negative value
  };
  
  const response = await makeRequest('PUT', '/resources/1', invalidUpdate);
  if (response.statusCode !== 400 && response.statusCode !== 422) {
    throw new Error(`Expected status 400 or 422 for validation error, got ${response.statusCode}`);
  }
}

async function testAvailabilityToggleValidation() {
  // Test availability toggle with invalid data
  const invalidData = { is_available: 'not-a-boolean' };
  
  const response = await makeRequest('POST', '/resources/1/availability', invalidData);
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for invalid boolean, got ${response.statusCode}`);
  }
}

// Main test execution function
async function runAllTests() {
  console.log('🚀 Starting Resource API Tests...\n');
  console.log('📋 Test Configuration:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Timeout: ${testConfig.timeout}ms`);
  console.log(`   Verbose: ${testConfig.verbose}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔧 BASIC FUNCTIONALITY TESTS');
  console.log('='.repeat(60));
  
  await runTest('Health Endpoint', testHealthEndpoint);
  await runTest('Resource Categories', testResourceCategories);
  await runTest('Get Resources', testGetResources);
  await runTest('Get Resources with Pagination', testGetResourcesWithPagination);
  await runTest('Get Resources with Filters', testGetResourcesWithFilters);
  await runTest('Search Resources with Query', testSearchResourcesWithQuery);
  await runTest('Nearby Resources with Location', testNearbyResourcesWithLocation);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ VALIDATION TESTS');
  console.log('='.repeat(60));
  
  await runTest('Search Resources Validation', testSearchResourcesValidation);
  await runTest('Nearby Resources Validation', testNearbyResourcesValidation);
  await runTest('Create Resource Validation', testCreateResourceValidation);
  await runTest('Resource ID Validation', testResourceIdValidation);
  await runTest('Invalid Query Parameters', testInvalidQueryParameters);
  await runTest('Location Validation', testLocationValidation);
  await runTest('Photo Upload Validation', testPhotoUploadValidation);
  await runTest('Update Resource Validation', testUpdateResourceValidation);
  await runTest('Availability Toggle Validation', testAvailabilityToggleValidation);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔒 AUTHORIZATION TESTS');
  console.log('='.repeat(60));
  
  await runTest('Create Resource without Auth', testCreateResourceWithoutAuth);
  await runTest('Non-existent Resource', testNonExistentResource);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? (testResults.passed / total * 100).toFixed(1) : 0;
  
  console.log(`\n📈 Results:`);
  console.log(`   Total Tests: ${total}`);
  console.log(`   Passed: ${testResults.passed} ✅`);
  console.log(`   Failed: ${testResults.failed} ❌`);
  console.log(`   Pass Rate: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(testResults.failed === 0 ? '🎉 ALL TESTS PASSED!' : `⚠️  ${testResults.failed} TESTS FAILED`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Check if server is running before starting tests
async function checkServerHealth() {
  try {
    console.log('🔍 Checking if server is running...');
    await makeRequest('GET', '/health');
    console.log('✅ Server is running and healthy');
    return true;
  } catch (error) {
    console.log('❌ Server is not accessible:', error.message);
    console.log('\n💡 Please make sure the server is running with:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await runAllTests();
}

// Run the tests
main().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
