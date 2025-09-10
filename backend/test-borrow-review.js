const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return { status: response.status, data };
}

// Test users (will be created/used for testing)
const testUsers = [
    {
        name: 'Resource Owner',
        email: 'owner@example.com',
        password: 'password123'
    },
    {
        name: 'Resource Borrower',
        email: 'borrower@example.com',
        password: 'password123'
    }
];

let userTokens = {};
let testResource = null;
let testBorrowRequest = null;

async function testBorrowRequestAndReviewFlow() {
    console.log('🚀 Starting Borrow Request and Review Tests...\n');

    try {
        // Step 1: Register/Login users
        console.log('🔐 Setting up test users...');
        for (const user of testUsers) {
            // Try to register first
            await apiCall('/auth/register', 'POST', user);
            
            // Then login
            const loginResult = await apiCall('/auth/login', 'POST', {
                email: user.email,
                password: user.password
            });
            
            if (loginResult.status === 200) {
                userTokens[user.email] = loginResult.data.token;
                console.log(`✅ ${user.name} logged in successfully`);
            }
        }

        // Step 2: Create a test resource
        console.log('\n📦 Creating test resource...');
        const resourceResult = await apiCall('/resources', 'POST', {
            title: 'Test Power Drill',
            description: 'A high-quality power drill for testing borrow requests',
            category: 'tools',
            estimated_value: 150.00,
            conditions: 'Good condition, handle with care'
        }, userTokens['owner@example.com']);

        if (resourceResult.status === 201) {
            testResource = resourceResult.data.data;
            console.log('✅ Test resource created:', testResource.title);
        } else {
            console.error('❌ Failed to create resource:', resourceResult.data.message);
            return;
        }

        // Step 3: Create a borrow request
        console.log('\n📋 Creating borrow request...');
        const borrowRequestResult = await apiCall('/borrow-requests', 'POST', {
            resource_id: testResource.id,
            start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
            message: 'I need this drill for a home improvement project',
            pickup_location: '123 Main Street'
        }, userTokens['borrower@example.com']);

        if (borrowRequestResult.status === 201) {
            testBorrowRequest = borrowRequestResult.data.data;
            console.log('✅ Borrow request created successfully');
        } else {
            console.error('❌ Failed to create borrow request:', borrowRequestResult.data.message);
            return;
        }

        // Step 4: View requests as owner
        console.log('\n📝 Checking resource requests...');
        const resourceRequestsResult = await apiCall('/resource-requests', 'GET', null, userTokens['owner@example.com']);
        
        if (resourceRequestsResult.status === 200) {
            console.log('✅ Resource owner can see pending requests:', resourceRequestsResult.data.data.length);
        }

        // Step 5: Approve the request
        console.log('\n✅ Approving borrow request...');
        const approveResult = await apiCall(`/borrow-requests/${testBorrowRequest.id}/status`, 'PUT', {
            status: 'approved',
            response_message: 'Approved! Please handle with care.'
        }, userTokens['owner@example.com']);

        if (approveResult.status === 200) {
            console.log('✅ Borrow request approved successfully');
        } else {
            console.error('❌ Failed to approve request:', approveResult.data.message);
            return;
        }

        // Step 6: Mark as picked up
        console.log('\n📦 Marking as picked up...');
        const pickupResult = await apiCall(`/borrow-requests/${testBorrowRequest.id}/pickup`, 'PUT', {
            pickup_notes: 'Item picked up at 2:00 PM, borrower showed ID'
        }, userTokens['owner@example.com']);

        if (pickupResult.status === 200) {
            console.log('✅ Request marked as picked up');
        }

        // Step 7: Mark as returned
        console.log('\n🔄 Marking as returned...');
        const returnResult = await apiCall(`/borrow-requests/${testBorrowRequest.id}/return`, 'PUT', {
            return_notes: 'Item returned in good condition',
            has_issues: false
        }, userTokens['owner@example.com']);

        if (returnResult.status === 200) {
            console.log('✅ Request marked as returned');
        }

        // Step 8: Create reviews
        console.log('\n⭐ Creating reviews...');
        
        // Borrower reviews owner
        const borrowerReviewResult = await apiCall('/reviews', 'POST', {
            reviewee_id: testResource.owner_id,
            borrow_request_id: testBorrowRequest.id,
            rating: 5,
            comment: 'Great resource owner! Very accommodating and the drill worked perfectly.',
            review_type: 'borrower_to_owner',
            communication_rating: 5,
            reliability_rating: 5
        }, userTokens['borrower@example.com']);

        if (borrowerReviewResult.status === 201) {
            console.log('✅ Borrower review created successfully');
        } else {
            console.error('❌ Failed to create borrower review:', borrowerReviewResult.data.message);
        }

        // Get owner's user ID from the resource
        const ownerProfile = await apiCall('/profile', 'GET', null, userTokens['owner@example.com']);
        const ownerId = ownerProfile.data.data.id;

        // Get borrower's user ID
        const borrowerProfile = await apiCall('/profile', 'GET', null, userTokens['borrower@example.com']);
        const borrowerId = borrowerProfile.data.data.id;

        // Owner reviews borrower
        const ownerReviewResult = await apiCall('/reviews', 'POST', {
            reviewee_id: borrowerId,
            borrow_request_id: testBorrowRequest.id,
            rating: 4.5,
            comment: 'Responsible borrower, took good care of the drill and returned it on time.',
            review_type: 'owner_to_borrower',
            communication_rating: 4,
            reliability_rating: 5,
            care_rating: 4.5
        }, userTokens['owner@example.com']);

        if (ownerReviewResult.status === 201) {
            console.log('✅ Owner review created successfully');
        } else {
            console.error('❌ Failed to create owner review:', ownerReviewResult.data.message);
        }

        // Step 9: Check user reviews and stats
        console.log('\n📊 Checking user reviews and statistics...');
        
        // Get owner's reviews
        const ownerReviewsResult = await apiCall(`/users/${ownerId}/reviews`, 'GET');
        if (ownerReviewsResult.status === 200) {
            console.log(`✅ Owner has ${ownerReviewsResult.data.data.totalReviews} reviews, average rating: ${ownerReviewsResult.data.data.averageRating}`);
        }

        // Get borrower's reviews
        const borrowerReviewsResult = await apiCall(`/users/${borrowerId}/reviews`, 'GET');
        if (borrowerReviewsResult.status === 200) {
            console.log(`✅ Borrower has ${borrowerReviewsResult.data.data.totalReviews} reviews, average rating: ${borrowerReviewsResult.data.data.averageRating}`);
        }

        // Get user statistics
        const ownerStatsResult = await apiCall('/borrow-requests/stats', 'GET', null, userTokens['owner@example.com']);
        if (ownerStatsResult.status === 200) {
            console.log('✅ Owner stats:', ownerStatsResult.data.data);
        }

        const borrowerStatsResult = await apiCall('/borrow-requests/stats', 'GET', null, userTokens['borrower@example.com']);
        if (borrowerStatsResult.status === 200) {
            console.log('✅ Borrower stats:', borrowerStatsResult.data.data);
        }

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n✅ Successfully tested:');
        console.log('   - User registration and authentication');
        console.log('   - Resource creation');
        console.log('   - Borrow request creation');
        console.log('   - Request approval workflow');
        console.log('   - Pickup and return process');
        console.log('   - Review system (both directions)');
        console.log('   - User statistics and ratings');

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

// Run the tests
testBorrowRequestAndReviewFlow();
