const WebSocket = require('ws');

// Test the online users API endpoint
async function testOnlineUsersAPI() {
  console.log('🔍 Testing online users API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/online', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJpYXQiOjE3MzQ5NjgwMDAsImV4cCI6MTczNTA1NDQwMH0.test'
      }
    });
    
    if (response.ok) {
      const onlineUsers = await response.json();
      console.log('✅ Online users API response:', onlineUsers);
    } else {
      console.log('❌ Online users API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Online users API error:', error.message);
  }
}

// Test WebSocket presence updates
function testWebSocketPresence() {
  console.log('🔍 Testing WebSocket presence updates...');
  
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
    
    // Send authentication
    const authMessage = {
      id: 'test-auth-1',
      type: 'auth',
      timestamp: Date.now(),
      data: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJpYXQiOjE3MzQ5NjgwMDAsImV4cCI6MTczNTA1NDQwMH0.test' }
    };
    
    ws.send(JSON.stringify(authMessage));
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('📨 Received WebSocket message:', message.type, message.data);
    
    if (message.type === 'auth' && message.data.status === 'authenticated') {
      console.log('✅ WebSocket authenticated successfully');
    } else if (message.type === 'presence') {
      console.log('👤 Presence update received:', message.data);
    }
  });
  
  ws.on('error', (error) => {
    console.log('❌ WebSocket error:', error.message);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket closed');
  });
  
  // Close after 5 seconds
  setTimeout(() => {
    ws.close();
  }, 5000);
}

// Run tests
async function runTests() {
  console.log('🧪 Starting online status tests...\n');
  
  // Test API endpoint
  await testOnlineUsersAPI();
  console.log('');
  
  // Test WebSocket
  testWebSocketPresence();
}

runTests();
