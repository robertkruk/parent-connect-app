import WebSocket from 'ws';

console.log('🔌 Testing WebSocket connection...');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ WebSocket connected!');
  
  // Send authentication message
  const authMessage = {
    id: 'test-1',
    type: 'auth',
    timestamp: Date.now(),
    data: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MGU4YjUxMC0xN2JjLTQxOGUtODk0YS0wZDM2M2Y4NzU4ZTciLCJpYXQiOjE3NTYwMDU1ODcsImV4cCI6MTc1NjYxMDM4N30.viDcnCAWf5Gj38DU1jsf1nYEG7wXVmTCJB9LlyVuKdw'
    }
  };
  
  console.log('📤 Sending auth message:', authMessage);
  ws.send(JSON.stringify(authMessage));
});

let isAuthenticated = false;

ws.on('message', (data) => {
  console.log('📨 Received message:', data.toString());
  
  const message = JSON.parse(data.toString());
  
  if (message.type === 'auth' && message.data.status === 'authenticated') {
    console.log('✅ Authentication successful! Sending test message...');
    isAuthenticated = true;
    
    // Send a test chat message
    const chatMessage = {
      id: 'test-msg-1',
      type: 'message',
      timestamp: Date.now(),
      data: {
        id: 'test-msg-1',
        chatId: 'ddf0fdb6-9a96-4c45-9fbb-f3ab2fc848f0',
        content: 'Test message from WebSocket client',
        senderId: '40e8b510-17bc-418e-894a-0d363f8758e7',
        messageType: 'text',
        attachments: [],
        replyTo: null,
        timestamp: Date.now()
      }
    };
    
    console.log('📤 Sending chat message:', chatMessage);
    ws.send(JSON.stringify(chatMessage));
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log('🔌 WebSocket closed:', code, reason);
});

// Close after 10 seconds
setTimeout(() => {
  console.log('🔌 Closing WebSocket connection...');
  ws.close();
}, 10000);
