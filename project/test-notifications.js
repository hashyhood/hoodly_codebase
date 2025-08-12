const { io } = require('socket.io-client');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SOCKET_URL = 'http://localhost:3001';
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TODO: Remove test users - use real user IDs from Supabase database
const TEST_USERS = {
  sender: 'sender-user-id',
  receiver: 'receiver-user-id'
};

async function testNotifications() {
  console.log('🧪 Testing Real-Time Notification System...\n');

  // Test 1: Socket.IO Connection
  console.log('1. Testing Socket.IO Connection...');
  const socket = io(SOCKET_URL);
  
  socket.on('connect', () => {
    console.log('✅ Socket.IO connected successfully');
  });

  socket.on('connect_error', (error) => {
    console.log('❌ Socket.IO connection failed:', error.message);
  });

  // Test 2: Authentication
  console.log('\n2. Testing Authentication...');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      socket.emit('authenticate', {
        token: session.access_token,
        userId: TEST_USERS.sender
      });
      console.log('✅ Authentication successful');
    } else {
      console.log('❌ No active session found');
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
  }

  // Test 3: Like Notification
  console.log('\n3. Testing Like Notification...');
  
  socket.emit('like_post', {
    postId: 'test-post-123',
    postOwnerId: TEST_USERS.receiver
  });

  socket.on('like_sent', (data) => {
    console.log('✅ Like notification sent:', data);
  });

  // Test 4: Friend Request Notification
  console.log('\n4. Testing Friend Request Notification...');
  
  socket.emit('friend_request', {
    receiverId: TEST_USERS.receiver,
    requestId: 'test-request-456'
  });

  socket.on('friend_request_sent', (data) => {
    console.log('✅ Friend request notification sent:', data);
  });

  // Test 5: Private Message Notification
  console.log('\n5. Testing Private Message Notification...');
  
  socket.emit('private_message', {
    receiverId: TEST_USERS.receiver,
    message: 'Hello! This is a test message.',
    messageId: 'test-message-789'
  });

  socket.on('message_sent', (data) => {
    console.log('✅ Private message notification sent:', data);
  });

  // Test 6: Comment Notification
  console.log('\n6. Testing Comment Notification...');
  
  socket.emit('comment_post', {
    postId: 'test-post-123',
    postOwnerId: TEST_USERS.receiver,
    comment: 'Great post! Thanks for sharing.'
  });

  socket.on('comment_sent', (data) => {
    console.log('✅ Comment notification sent:', data);
  });

  // Test 7: Mark Notification as Read
  console.log('\n7. Testing Mark as Read...');
  
  setTimeout(() => {
    socket.emit('mark_notification_read', {
      notificationId: 'test-notification-id'
    });

    socket.on('notification_marked_read', (data) => {
      console.log('✅ Notification marked as read:', data);
    });
  }, 2000);

  // Test 8: Mark All Notifications as Read
  console.log('\n8. Testing Mark All as Read...');
  
  setTimeout(() => {
    socket.emit('mark_all_notifications_read');

    socket.on('all_notifications_marked_read', (data) => {
      console.log('✅ All notifications marked as read:', data);
    });
  }, 3000);

  // Test 9: Database Verification
  console.log('\n9. Testing Database Verification...');
  
  setTimeout(async () => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', TEST_USERS.receiver)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      console.log('✅ Database verification successful');
      console.log('📊 Recent notifications:', notifications?.length || 0);
      
      if (notifications && notifications.length > 0) {
        console.log('📝 Latest notification:', {
          type: notifications[0].type,
          title: notifications[0].title,
          is_read: notifications[0].is_read
        });
      }
    } catch (error) {
      console.log('❌ Database verification failed:', error.message);
    }
  }, 4000);

  // Test 10: Real-time Reception (simulate receiver)
  console.log('\n10. Testing Real-time Reception...');
  
  const receiverSocket = io(SOCKET_URL);
  
  receiverSocket.on('connect', () => {
    console.log('✅ Receiver socket connected');
    
    // Authenticate receiver
    receiverSocket.emit('authenticate', {
      token: 'receiver-token', // Replace with actual token
      userId: TEST_USERS.receiver
    });
  });

  receiverSocket.on('notification', (data) => {
    console.log('✅ Real-time notification received:', {
      type: data.type,
      fromUser: data.fromUser?.personalName || data.fromUser?.username,
      title: data.title
    });
  });

  // Cleanup after tests
  setTimeout(() => {
    console.log('\n🧹 Cleaning up...');
    socket.disconnect();
    receiverSocket.disconnect();
    console.log('✅ Test completed');
    process.exit(0);
  }, 10000);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run tests
testNotifications().catch(console.error); 