# Resource Module Testing Guide

This guide explains how to test the Resource module implementation.

## Prerequisites

1. **Server Running**: Make sure the backend server is running
2. **Database Connected**: Ensure database connection is established
3. **Node.js**: Node.js should be installed for running test scripts

## Running Tests

### 1. Start the Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3000` and show:
- ✅ Database connection established successfully
- 🔧 Database initialized  
- 🚀 Server is running on http://localhost:3000

### 2. Run Comprehensive API Tests

In a new terminal window:

```bash
node test-resources.js
```

This will run all Resource API tests including:
- ✅ **Basic functionality tests**
- ✅ **Validation tests**  
- ✅ **Authorization tests**
- ✅ **Edge case tests**

### 3. Manual Testing with curl

You can also test individual endpoints manually:

#### Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

#### Test Get Resources
```bash
curl "http://localhost:3000/api/resources"
```

#### Test Get Categories
```bash
curl "http://localhost:3000/api/resources/categories"
```

#### Test Search Resources
```bash
curl "http://localhost:3000/api/resources/search?q=test"
```

#### Test Nearby Resources
```bash
curl "http://localhost:3000/api/resources/nearby?latitude=40.7128&longitude=-74.0060&radius=10"
```

#### Test Validation (should return 400 error)
```bash
curl "http://localhost:3000/api/resources/search"  # Missing search query
```

#### Test Invalid Resource ID (should return 400 error)
```bash
curl "http://localhost:3000/api/resources/invalid-id"
```

#### Test Create Resource (requires authentication)
```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Resource",
    "description": "This is a test resource for API testing",
    "category": "Tools",
    "condition": "good",
    "estimated_value": 100
  }'
```

## Test Coverage

The test suite covers:

### ✅ Basic Functionality
- Health endpoint
- Resource categories
- Get resources with pagination
- Get resources with filters
- Search resources
- Nearby resources

### ✅ Input Validation
- Required field validation
- Field length validation  
- Enum value validation
- Numeric range validation
- Location coordinate validation
- Boolean type validation

### ✅ Error Handling
- Invalid resource IDs
- Non-existent resources
- Invalid query parameters
- Missing required fields
- Authentication failures

### ✅ Photo Management
- Photo upload validation
- File type validation
- File size validation
- Photo deletion
- Photo reordering

### ✅ Edge Cases
- Boundary values
- Empty responses
- Large pagination limits
- Invalid coordinates
- Malformed requests

## Expected Results

When running `node test-resources.js`, you should see output like:

```
🚀 Starting Resource API Tests...

============================================================
🔧 BASIC FUNCTIONALITY TESTS
============================================================

✅ PASS: Health Endpoint
✅ PASS: Resource Categories
✅ PASS: Get Resources
✅ PASS: Get Resources with Pagination
✅ PASS: Get Resources with Filters
✅ PASS: Search Resources with Query
✅ PASS: Nearby Resources with Location

============================================================
✅ VALIDATION TESTS
============================================================

✅ PASS: Search Resources Validation
✅ PASS: Nearby Resources Validation
✅ PASS: Create Resource Validation
✅ PASS: Resource ID Validation
✅ PASS: Invalid Query Parameters
✅ PASS: Location Validation
✅ PASS: Photo Upload Validation
✅ PASS: Update Resource Validation
✅ PASS: Availability Toggle Validation

============================================================
📊 TEST RESULTS SUMMARY
============================================================

📈 Results:
   Total Tests: 16
   Passed: 16 ✅
   Failed: 0 ❌
   Pass Rate: 100.0%

============================================================
🎉 ALL TESTS PASSED!
============================================================
```

## Troubleshooting

### Server Not Running
If you see "Server is not accessible":
```bash
# Make sure server is running
npm run dev
```

### Database Connection Issues
If you see database errors:
```bash
# Check your .env file has correct database settings
# Ensure SQLite database file exists or can be created
```

### Port Already in Use
If port 3000 is busy:
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or change port in src/server.ts
```

### Test Failures
If tests fail:
1. Check server logs for errors
2. Verify all dependencies are installed: `npm install`
3. Ensure database is properly initialized
4. Check that all routes are properly mounted

## Adding New Tests

To add more tests, modify `test-resources.js`:

1. Create a new test function:
```javascript
async function testNewFeature() {
  const response = await makeRequest('GET', '/resources/new-endpoint');
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
}
```

2. Add it to the test execution:
```javascript
await runTest('Test New Feature', testNewFeature);
```

## Performance Testing

For performance testing, you can use tools like:

```bash
# Install apache bench
brew install httpie

# Test endpoint performance
ab -n 100 -c 10 http://localhost:3000/api/resources

# Or use hey (modern alternative)
brew install hey
hey -n 100 -c 10 http://localhost:3000/api/resources
```

## Integration with CI/CD

The test script can be integrated into CI/CD pipelines:

```bash
# In package.json scripts
"test:api": "node test-resources.js",
"test:integration": "npm run build && npm run start & npm run test:api"
```

This comprehensive testing ensures the Resource module is production-ready and all endpoints work as expected.
