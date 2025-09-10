const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUsers = [
    {
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'password123'
    },
    {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password123'
    }
];

let userTokens = {};

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

// Test functions
async function registerUsers() {
    console.log('\n🔐 Testing User Registration...');
    
    for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        try {
            const result = await apiCall('/auth/register', 'POST', user);
            if (result.status === 201) {
                console.log(`✅ User ${user.name} registered successfully`);
            } else {
                console.log(`⚠️  User ${user.name} registration: ${result.data.message}`);
            }
        } catch (error) {
            console.error(`❌ Error registering ${user.name}:`, error.message);
        }
    }
}

async function loginUsers() {
    console.log('\n🔑 Testing User Login...');
    
    for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        try {
            const result = await apiCall('/auth/login', 'POST', {
                email: user.email,
                password: user.password
            });
            
            if (result.status === 200) {
                userTokens[user.email] = result.data.token;
                console.log(`✅ User ${user.name} logged in successfully`);
            } else {
                console.error(`❌ Login failed for ${user.name}: ${result.data.message}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error logging in ${user.name}:`, error.message);
            return false;
        }
    }
    return true;
}

async function testCreateChat() {
    console.log('\n💬 Testing Chat Creation...');
    
    const aliceToken = userTokens['alice@example.com'];
    const bobToken = userTokens['bob@example.com'];
    
    if (!aliceToken || !bobToken) {
        console.error('❌ Missing user tokens');
        return null;
    }
    
    // Get user profiles to get user IDs
    const aliceProfile = await apiCall('/profile', 'GET', null, aliceToken);
    const bobProfile = await apiCall('/profile', 'GET', null, bobToken);
    
    const aliceId = aliceProfile.data.data.id;
    const bobId = bobProfile.data.data.id;
    
    console.log(`📝 Alice ID: ${aliceId}, Bob ID: ${bobId}`);
    
    // Alice creates a chat with Bob
    const result = await apiCall('/chats', 'POST', {
        other_user_id: bobId
    }, aliceToken);
    
    if (result.status === 201) {
        console.log('✅ Chat created successfully:', result.data.data);
        return result.data.data;
    } else {
        console.error('❌ Chat creation failed:', result.data.message);
        return null;
    }
}

async function testSendMessages(chat) {
    console.log('\n📨 Testing Message Sending...');
    
    const aliceToken = userTokens['alice@example.com'];
    const bobToken = userTokens['bob@example.com'];
    
    if (!chat) {
        console.error('❌ No chat available for testing');
        return;
    }
    
    // Alice sends a message
    const message1 = await apiCall(`/chats/${chat.id}/messages`, 'POST', {
        content: 'Hello Bob! How are you?'
    }, aliceToken);
    
    if (message1.status === 201) {
        console.log('✅ Alice sent message successfully');
    } else {
        console.error('❌ Alice message failed:', message1.data.message);
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Bob replies
    const message2 = await apiCall(`/chats/${chat.id}/messages`, 'POST', {
        content: 'Hi Alice! I\'m doing great. How about you?'
    }, bobToken);
    
    if (message2.status === 201) {
        console.log('✅ Bob sent message successfully');
    } else {
        console.error('❌ Bob message failed:', message2.data.message);
    }
}

async function testGetMessages(chat) {
    console.log('\n📋 Testing Message Retrieval...');
    
    const aliceToken = userTokens['alice@example.com'];
    
    if (!chat) {
        console.error('❌ No chat available for testing');
        return;
    }
    
    const result = await apiCall(`/chats/${chat.id}/messages`, 'GET', null, aliceToken);
    
    if (result.status === 200) {
        console.log('✅ Messages retrieved successfully');
        console.log(`📊 Found ${result.data.data.length} messages`);
        
        result.data.data.forEach((msg, index) => {
            console.log(`   ${index + 1}. ${msg.sender.name}: ${msg.content}`);
        });
    } else {
        console.error('❌ Message retrieval failed:', result.data.message);
    }
}

async function testGetChats() {
    console.log('\n📝 Testing Chat List Retrieval...');
    
    const aliceToken = userTokens['alice@example.com'];
    const bobToken = userTokens['bob@example.com'];
    
    // Test for Alice
    const aliceChats = await apiCall('/chats', 'GET', null, aliceToken);
    if (aliceChats.status === 200) {
        console.log(`✅ Alice has ${aliceChats.data.data.length} chats`);
    } else {
        console.error('❌ Alice chat list failed:', aliceChats.data.message);
    }
    
    // Test for Bob
    const bobChats = await apiCall('/chats', 'GET', null, bobToken);
    if (bobChats.status === 200) {
        console.log(`✅ Bob has ${bobChats.data.data.length} chats`);
    } else {
        console.error('❌ Bob chat list failed:', bobChats.data.message);
    }
}

async function testUnreadCount() {
    console.log('\n📊 Testing Unread Count...');
    
    const aliceToken = userTokens['alice@example.com'];
    const bobToken = userTokens['bob@example.com'];
    
    const aliceUnread = await apiCall('/chats/unread-count', 'GET', null, aliceToken);
    const bobUnread = await apiCall('/chats/unread-count', 'GET', null, bobToken);
    
    if (aliceUnread.status === 200) {
        console.log(`✅ Alice unread count: ${aliceUnread.data.data.unreadCount}`);
    } else {
        console.error('❌ Alice unread count failed:', aliceUnread.data.message);
    }
    
    if (bobUnread.status === 200) {
        console.log(`✅ Bob unread count: ${bobUnread.data.data.unreadCount}`);
    } else {
        console.error('❌ Bob unread count failed:', bobUnread.data.message);
    }
}

// Main test function
async function runChatTests() {
    console.log('🚀 Starting Chat Functionality Tests...');
    
    try {
        await registerUsers();
        
        const loginSuccess = await loginUsers();
        if (!loginSuccess) {
            console.error('❌ Login failed, cannot continue tests');
            return;
        }
        
        const chat = await testCreateChat();
        await testSendMessages(chat);
        await testGetMessages(chat);
        await testGetChats();
        await testUnreadCount();
        
        console.log('\n✅ All chat tests completed!');
        
    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Check if node-fetch is available, if not provide instructions
try {
    runChatTests();
} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.log('❌ node-fetch not found. Please run: npm install node-fetch@2');
    } else {
        console.error('❌ Error:', error);
    }
}
