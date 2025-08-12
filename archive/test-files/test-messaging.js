const io = require('socket.io-client');

// Test configuration
const SOCKET_URL = 'http://localhost:5002';
const ROOM_ID = '1'; // Test room ID

console.log('🧪 Testing Hoodly Messaging System...\n');

// Create two test clients
const client1 = io(SOCKET_URL);
const client2 = io(SOCKET_URL);

// Test client 1
client1.on('connect', () => {
  console.log('✅ Client 1 connected');
  client1.emit('join-room', ROOM_ID);
});

client1.on('chat history', (history) => {
  console.log('📜 Client 1 received chat history:', history.length, 'messages');
});

client1.on('chat message', (message) => {
  console.log('📨 Client 1 received message:', {
    from: message.user,
    text: message.text,
    timestamp: message.timestamp
  });
});

client1.on('user-joined', (data) => {
  console.log('👋 Client 1: User joined:', data.username);
});

// Test client 2
client2.on('connect', () => {
  console.log('✅ Client 2 connected');
  client2.emit('join-room', ROOM_ID);
});

client2.on('chat history', (history) => {
  console.log('📜 Client 2 received chat history:', history.length, 'messages');
});

client2.on('chat message', (message) => {
  console.log('📨 Client 2 received message:', {
    from: message.user,
    text: message.text,
    timestamp: message.timestamp
  });
});

client2.on('user-joined', (data) => {
  console.log('👋 Client 2: User joined:', data.username);
});

// Test messaging after both clients are connected
setTimeout(() => {
  console.log('\n📤 Sending test message from Client 1...');
  client1.emit('chat message', {
    roomId: ROOM_ID,
    text: 'Hello from Client 1! 👋',
    type: 'text'
  });
}, 2000);

setTimeout(() => {
  console.log('\n📤 Sending test message from Client 2...');
  client2.emit('chat message', {
    roomId: ROOM_ID,
    text: 'Hello from Client 2! 🚀',
    type: 'text'
  });
}, 4000);

setTimeout(() => {
  console.log('\n📤 Sending another message from Client 1...');
  client1.emit('chat message', {
    roomId: ROOM_ID,
    text: 'This is a test of the messaging system! 💬',
    type: 'text'
  });
}, 6000);

// Cleanup after testing
setTimeout(() => {
  console.log('\n🧹 Cleaning up test clients...');
  client1.disconnect();
  client2.disconnect();
  console.log('✅ Test completed!');
  process.exit(0);
}, 8000);

// Error handling
client1.on('error', (error) => {
  console.error('❌ Client 1 error:', error);
});

client2.on('error', (error) => {
  console.error('❌ Client 2 error:', error);
});

client1.on('connect_error', (error) => {
  console.error('❌ Client 1 connection error:', error);
});

client2.on('connect_error', (error) => {
  console.error('❌ Client 2 connection error:', error);
}); 