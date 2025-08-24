// Simple API Test Script for ParentConnect Backend
// Run with: node test-api.js

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing ParentConnect API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE}/`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test 2: Register a new user
    console.log('\n2. Testing user registration...');
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Parent',
        email: 'test@example.com',
        password: 'password123',
        phone: '+1-555-0123'
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful:', registerData.user.name);
      
      // Test 3: Login
      console.log('\n3. Testing login...');
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData.user.name);
        
        const token = loginData.token;
        
        // Test 4: Get user profile
        console.log('\n4. Testing user profile...');
        const profileResponse = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('✅ Profile retrieved:', profileData.name);
        } else {
          console.log('❌ Profile failed:', profileResponse.status);
        }
        
        // Test 5: Add a child
        console.log('\n5. Testing child creation...');
        const childResponse = await fetch(`${API_BASE}/api/children`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'Test Child',
            grade: '3rd Grade',
            school: 'Test School'
          })
        });
        
        if (childResponse.ok) {
          const childData = await childResponse.json();
          console.log('✅ Child created:', childData.name);
        } else {
          console.log('❌ Child creation failed:', childResponse.status);
        }
        
        // Test 6: Get chats
        console.log('\n6. Testing chat retrieval...');
        const chatsResponse = await fetch(`${API_BASE}/api/chats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json();
          console.log('✅ Chats retrieved:', chatsData.length, 'chats');
        } else {
          console.log('❌ Chats failed:', chatsResponse.status);
        }
        
      } else {
        console.log('❌ Login failed:', loginResponse.status);
      }
    } else {
      console.log('❌ Registration failed:', registerResponse.status);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n🎉 API testing complete!');
}

// Run the test
testAPI();
