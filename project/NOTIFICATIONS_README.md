# Real-Time Notification System

This document describes the comprehensive real-time notification system implemented using Socket.IO and Supabase.

## 🎯 Overview

The notification system provides instant alerts for:
- **Likes** on posts
- **Friend requests** 
- **Private messages** (DMs)
- **Comments** on posts

## 🏗️ Architecture

### Backend Components

#### 1. Socket.IO Handlers (`backend/src/socket/handlers.js`)
- **Real-time event handling** for all notification types
- **Supabase integration** for persistent storage
- **User authentication** via Supabase tokens
- **Room-based messaging** for targeted notifications

#### 2. Notification Routes (`backend/src/routes/notifications.js`)
- **REST API endpoints** for notification management
- **Supabase database operations** (replaced in-memory storage)
- **RLS policy compliance** for secure access

### Frontend Components

#### 1. SocketEvents Component (`components/ui/SocketEvents.tsx`)
- **Real-time notification reception**
- **Toast notifications** with action buttons
- **Unread count management**
- **Supabase real-time subscriptions**

#### 2. NotificationCard Component (`components/ui/NotificationCard.tsx`)
- **Premium UI design** with seen/unseen states
- **Type-specific icons and colors**
- **Metadata preview** for DMs and comments
- **Interactive read/unread toggles**

#### 3. Notifications Screen (`app/notifications.tsx`)
- **Full-screen notification management**
- **Pull-to-refresh** functionality
- **Infinite scrolling** with pagination
- **Mark all as read** functionality

#### 4. Tab Navigation (`app/(tabs)/_layout.tsx`)
- **Real-time badge** on notifications tab
- **Unread count display** with overflow handling
- **Socket integration** for live updates

## 🔧 Implementation Details

### Socket.IO Events

#### Emitted Events
```javascript
// Like notifications
socket.emit('like_post', { postId, postOwnerId });

// Friend request notifications  
socket.emit('friend_request', { receiverId, requestId });

// Private message notifications
socket.emit('private_message', { receiverId, message, messageId });

// Comment notifications
socket.emit('comment_post', { postId, postOwnerId, comment });

// Mark as read
socket.emit('mark_notification_read', { notificationId });
socket.emit('mark_all_notifications_read');
```

#### Received Events
```javascript
// Real-time notifications
socket.on('notification', (data) => {
  // Handle incoming notification
});

// Confirmation events
socket.on('like_sent', (data) => {});
socket.on('friend_request_sent', (data) => {});
socket.on('message_sent', (data) => {});
socket.on('comment_sent', (data) => {});
socket.on('notification_marked_read', (data) => {});
socket.on('all_notifications_marked_read', (data) => {});
```

### Database Schema

#### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'dm', 'friend_request', 'comment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### RLS Policies
```sql
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);
```

### Frontend Integration

#### WebSocket Manager (`lib/websocket.ts`)
```typescript
// Notification event methods
websocketManager.emitLikePost(postId, postOwnerId);
websocketManager.emitFriendRequest(receiverId, requestId);
websocketManager.emitPrivateMessage(receiverId, message, messageId);
websocketManager.emitCommentPost(postId, postOwnerId, comment);
websocketManager.emitMarkNotificationRead(notificationId);
websocketManager.emitMarkAllNotificationsRead();
```

#### Real-time Subscriptions
```typescript
// Supabase real-time for notifications
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle new notification
  })
  .subscribe();
```

## 🎨 UI/UX Features

### Notification Types
- **❤️ Likes**: Red accent, heart icon
- **💬 DMs**: Blue accent, chat bubble icon  
- **👥 Friend Requests**: Green accent, people icon
- **💭 Comments**: Orange accent, comment icon

### Visual States
- **Unread**: Bold text, colored left border, unread indicator
- **Read**: Muted colors, no border, checkmark icon
- **Toast**: Alert popup with action buttons
- **Badge**: Red dot with count on tab bar

### Interactions
- **Tap to mark read** and navigate
- **Long press** for additional actions
- **Pull to refresh** for latest notifications
- **Mark all as read** button
- **Infinite scroll** for older notifications

## 🚀 Usage Examples

### Sending a Like Notification
```javascript
// In your post like handler
websocketManager.emitLikePost(postId, postOwnerId);
```

### Sending a Friend Request Notification
```javascript
// In your friend request handler
websocketManager.emitFriendRequest(receiverId, requestId);
```

### Sending a DM Notification
```javascript
// In your message send handler
websocketManager.emitPrivateMessage(receiverId, message, messageId);
```

### Receiving Notifications
```javascript
// In your component
<SocketEvents
  onNotificationReceived={(data) => {
    // Handle new notification
    console.log('New notification:', data);
  }}
  onUnreadCountChange={(count) => {
    // Update badge count
    setUnreadCount(count);
  }}
/>
```

## 🧪 Testing

### Manual Testing
1. Start the backend server: `npm run dev:backend`
2. Start the frontend: `npm start`
3. Open the app on multiple devices/simulators
4. Test each notification type:
   - Like a post
   - Send a friend request
   - Send a private message
   - Comment on a post

### Automated Testing
```bash
# Run the test script
node test-notifications.js
```

The test script verifies:
- Socket.IO connection
- Authentication
- All notification types
- Database persistence
- Real-time reception

## 🔒 Security Considerations

### Authentication
- All socket connections require valid Supabase tokens
- User verification on every notification event
- RLS policies prevent unauthorized access

### Data Validation
- Input sanitization for all notification data
- Type checking for notification types
- Metadata validation for JSON payloads

### Rate Limiting
- Consider implementing rate limiting for notification events
- Prevent spam notifications from the same user

## 📱 Mobile Considerations

### Performance
- Efficient real-time subscriptions
- Optimized re-renders with React.memo
- Background app handling

### Battery Life
- Smart reconnection logic
- Efficient polling intervals
- Background task optimization

### Offline Support
- Queue notifications when offline
- Sync when connection restored
- Local storage for unread counts

## 🔧 Configuration

### Environment Variables
```bash
# Backend
SOCKET_URL=http://localhost:3001
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key

# Frontend  
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
```

### Socket.IO Settings
```javascript
// Backend configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});
```

## 🐛 Troubleshooting

### Common Issues

#### Notifications not appearing
1. Check Socket.IO connection status
2. Verify user authentication
3. Check RLS policies
4. Review console for errors

#### Real-time not working
1. Verify Supabase real-time is enabled
2. Check subscription filters
3. Ensure proper channel setup
4. Review network connectivity

#### Badge count incorrect
1. Refresh unread count on app focus
2. Check for duplicate subscriptions
3. Verify state management
4. Review mark-as-read logic

### Debug Mode
```javascript
// Enable debug logging
websocketManager.setDebugMode(true);
```

## 📈 Monitoring

### Metrics to Track
- Notification delivery success rate
- Real-time connection stability
- Database performance
- User engagement with notifications

### Logging
- Socket connection events
- Notification creation/deletion
- Error tracking
- Performance metrics

## 🔮 Future Enhancements

### Planned Features
- **Push notifications** for mobile
- **Email notifications** for important events
- **Notification preferences** per user
- **Notification templates** for different types
- **Analytics dashboard** for notification metrics

### Performance Optimizations
- **WebSocket clustering** for scale
- **Database indexing** optimization
- **Caching layer** for frequent queries
- **CDN integration** for global delivery

---

## 📞 Support

For issues or questions about the notification system:
1. Check the troubleshooting section
2. Review the test script output
3. Check console logs for errors
4. Verify configuration settings

The notification system is designed to be robust, scalable, and user-friendly while maintaining security and performance standards. 