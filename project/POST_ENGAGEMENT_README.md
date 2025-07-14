# Post Engagement System

A comprehensive social media engagement system for the Hoodly app, featuring likes, comments, and real-time notifications.

## 🏗️ Architecture Overview

The post engagement system consists of:

### Backend Components
- **Database Tables**: `posts`, `post_likes`, `post_comments`
- **API Routes**: RESTful endpoints for CRUD operations
- **Socket Integration**: Real-time notifications via Socket.IO
- **Supabase Integration**: Database operations and RLS policies

### Frontend Components
- **PostCard**: Enhanced post display with like/comment functionality
- **CommentsModal**: Full-featured comment interface
- **Feed Integration**: Real-time post updates in main feed
- **Optimistic UI**: Instant feedback with error handling

## 📊 Database Schema

### Posts Table
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image TEXT,
  proximity TEXT DEFAULT 'neighborhood' CHECK (proximity IN ('neighborhood', 'city', 'state')),
  tags TEXT[] DEFAULT '{}',
  is_ai_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Post Likes Table
```sql
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

### Post Comments Table
```sql
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Posts
- `GET /api/posts/feed/:proximity` - Get posts by proximity level
- `POST /api/posts` - Create a new post
- `DELETE /api/posts/:postId` - Delete a post
- `GET /api/posts/user/:userId` - Get user's posts

### Likes
- `POST /api/posts/:postId/like` - Toggle like/unlike on a post

### Comments
- `GET /api/posts/:postId/comments` - Get comments for a post
- `POST /api/posts/:postId/comments` - Add a comment to a post
- `DELETE /api/comments/:commentId` - Delete a comment

## 🎨 Frontend Components

### PostCard Component
```typescript
interface PostCardProps {
  post: Post;
  onLike?: (postId: string, liked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onUserPress?: (userId: string) => void;
}
```

**Features:**
- Optimistic like updates with heart animation
- Real-time like count updates
- User avatar and profile navigation
- Tag display and proximity badges
- AI bot indicators

### CommentsModal Component
```typescript
interface CommentsModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
  onCommentAdded?: (comment: Comment) => void;
}
```

**Features:**
- Real-time comment loading
- Pull-to-refresh functionality
- Optimistic comment addition
- Comment deletion (owner only)
- Keyboard-aware input
- User avatars and timestamps

## 🔔 Real-Time Notifications

### Socket Events
- `like_post` - Sent when someone likes a post
- `comment_post` - Sent when someone comments on a post

### Notification Payload
```typescript
interface LikeNotification {
  postId: string;
  postOwnerId: string;
  fromUserId: string;
}

interface CommentNotification {
  postId: string;
  postOwnerId: string;
  comment: string;
  fromUserId: string;
}
```

## 🚀 Key Features

### 1. Optimistic UI Updates
- Instant feedback for likes and comments
- Automatic rollback on API errors
- Smooth animations and transitions

### 2. Real-Time Engagement
- Live like count updates
- Instant comment display
- Socket-based notifications

### 3. User Experience
- Heart animation on like
- Pull-to-refresh for comments
- Loading states and error handling
- Keyboard-aware modals

### 4. Security & Performance
- Row Level Security (RLS) policies
- Database indexes for performance
- Input validation and sanitization
- Cascade deletes for data integrity

## 🛠️ Implementation Details

### Backend Implementation

#### Posts Route (`backend/src/routes/posts.js`)
- Supabase database integration
- Socket notification emission
- Error handling and validation
- Optimized queries with joins

#### Database Migration (`db/migrations/08_posts_engagement_system.sql`)
- Complete schema creation
- RLS policies for security
- Indexes for performance
- Sample data for testing

### Frontend Implementation

#### State Management
```typescript
// Feed screen state
const [posts, setPosts] = useState<Post[]>([]);
const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
const [commentsModalVisible, setCommentsModalVisible] = useState(false);
```

#### API Integration
```typescript
// Load posts
const loadPosts = async (refresh = false) => {
  const response = await fetch(`${getApiUrl()}/posts/feed/neighborhood?userId=${user.id}`);
  const data = await response.json();
  setPosts(data.posts || []);
};

// Toggle like
const handleLike = async () => {
  const response = await fetch(`${getApiUrl()}/posts/${postId}/like`, {
    method: 'POST',
    body: JSON.stringify({ userId: user.id }),
  });
};
```

## 🧪 Testing

### Test Script (`test-post-engagement.js`)
Comprehensive test suite covering:
- Post creation and deletion
- Like/unlike functionality
- Comment addition and deletion
- Feed retrieval with engagement data
- Notification integration
- Error handling and cleanup

### Running Tests
```bash
cd project
node test-post-engagement.js
```

## 📱 Usage Examples

### Creating a Post
```typescript
const createPost = async (content: string) => {
  const response = await fetch(`${getApiUrl()}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      content,
      proximity: 'neighborhood',
      tags: ['community']
    })
  });
};
```

### Liking a Post
```typescript
const likePost = async (postId: string) => {
  const response = await fetch(`${getApiUrl()}/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id })
  });
};
```

### Adding a Comment
```typescript
const addComment = async (postId: string, text: string) => {
  const response = await fetch(`${getApiUrl()}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      text
    })
  });
};
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend API URL
API_URL=http://192.168.18.232:5002/api

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
1. Run the migration script:
   ```bash
   psql -d your_database -f db/migrations/08_posts_engagement_system.sql
   ```

2. Verify RLS policies are active:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'posts';
   ```

## 🚨 Error Handling

### Common Error Scenarios
1. **Network Errors**: Automatic retry with user feedback
2. **Validation Errors**: Clear error messages to users
3. **Permission Errors**: Graceful degradation
4. **Database Errors**: Logging and fallback behavior

### Error Recovery
- Optimistic updates are reverted on API failures
- Loading states prevent multiple requests
- Retry mechanisms for transient failures

## 📈 Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Efficient joins for post data retrieval
- Pagination for large datasets

### Frontend Optimization
- Virtual scrolling for large feeds
- Image lazy loading
- Debounced API calls
- Memoized components

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only modify their own posts/comments
- Public read access for posts
- Secure like/comment operations

### Input Validation
- Content length limits
- XSS prevention
- SQL injection protection

### Authentication
- User ID validation on all operations
- Session-based access control
- Secure API endpoints

## 🎯 Future Enhancements

### Planned Features
1. **Reactions**: Multiple reaction types (love, laugh, etc.)
2. **Comment Replies**: Nested comment threads
3. **Post Sharing**: Cross-platform sharing
4. **Analytics**: Engagement metrics and insights
5. **Moderation**: Content filtering and reporting

### Technical Improvements
1. **Caching**: Redis for frequently accessed data
2. **CDN**: Image optimization and delivery
3. **Webhooks**: Third-party integrations
4. **Search**: Full-text search capabilities

## 📚 Related Documentation

- [Notification System](./NOTIFICATIONS_README.md)
- [Socket.IO Integration](./SOCKET_README.md)
- [Supabase Setup](./SUPABASE_SETUP.md)
- [API Documentation](./API_README.md)

## 🤝 Contributing

When contributing to the post engagement system:

1. Follow the existing code patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure RLS policies are maintained
5. Test optimistic UI updates thoroughly

## 📞 Support

For issues or questions about the post engagement system:

1. Check the test logs for debugging
2. Verify database schema and policies
3. Test API endpoints independently
4. Review socket connection status
5. Check frontend console for errors 