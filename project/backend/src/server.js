const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const eventsRoutes = require('./routes/events');
const marketplaceRoutes = require('./routes/marketplace');
const groupsRoutes = require('./routes/groups');
const { router: notificationsRoutes, createNotification } = require('./routes/notifications');

// Use routes
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/notifications', notificationsRoutes);

// In-memory data storage (will be replaced with database later)
const users = new Map();
const messages = {};
const friendRequests = new Map();
const friendships = new Map();
const onlineUsers = new Set();
const privateMessages = new Map();
const posts = new Map();
const aiBots = new Map();

// Initialize AI Bots for initial app population
const initializeAIBots = () => {
  const botData = [
    {
      id: 'ai_1',
      personalName: 'Sarah Chen',
      username: 'sarahchen',
      email: 'sarah@ai.local',
      bio: 'Tech enthusiast and coffee lover ☕️ Always exploring new cafes and sharing local discoveries',
      location: 'Downtown District',
      interests: ['Coffee', 'Tech', 'Photography', 'Local Business'],
      avatar: '👩‍💻',
      isAIBot: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      isOnline: false,
      lastSeen: new Date().toISOString()
    },
    {
      id: 'ai_2',
      personalName: 'Marcus Johnson',
      username: 'marcusj',
      email: 'marcus@ai.local',
      bio: 'Street artist and community organizer 🎨 Making the city more colorful one mural at a time',
      location: 'Arts Quarter',
      interests: ['Art', 'Music', 'Food', 'Community'],
      avatar: '👨‍🎨',
      isAIBot: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isOnline: false,
      lastSeen: new Date().toISOString()
    },
    {
      id: 'ai_3',
      personalName: 'Elena Rodriguez',
      username: 'elenar',
      email: 'elena@ai.local',
      bio: 'Food blogger and culinary explorer 🍳 Discovering the best local eats and sharing recipes',
      location: 'Culinary District',
      interests: ['Cooking', 'Travel', 'Fitness', 'Food'],
      avatar: '👩‍🍳',
      isAIBot: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isOnline: false,
      lastSeen: new Date().toISOString()
    },
    {
      id: 'ai_4',
      personalName: 'David Kim',
      username: 'davidkim',
      email: 'david@ai.local',
      bio: 'Entrepreneur and startup mentor 💼 Building the next generation of local businesses',
      location: 'Business District',
      interests: ['Business', 'Sports', 'Reading', 'Networking'],
      avatar: '👨‍💼',
      isAIBot: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isOnline: false,
      lastSeen: new Date().toISOString()
    },
    {
      id: 'ai_5',
      personalName: 'Aisha Patel',
      username: 'aishap',
      email: 'aisha@ai.local',
      bio: 'Yoga instructor and wellness advocate 🧘‍♀️ Helping neighbors find balance and peace',
      location: 'Wellness District',
      interests: ['Yoga', 'Wellness', 'Meditation', 'Health'],
      avatar: '🧘‍♀️',
      isAIBot: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isOnline: false,
      lastSeen: new Date().toISOString()
    }
  ];

  botData.forEach(bot => {
    users.set(bot.id, bot);
    aiBots.set(bot.id, bot);
    friendRequests.set(bot.id, []);
    friendships.set(bot.id, []);
    posts.set(bot.id, []);
  });

  console.log(`🤖 Initialized ${botData.length} AI bots for app population`);
};

// Generate AI posts based on proximity
const generateAIPosts = (proximity) => {
  const allPosts = [];
  
  aiBots.forEach((bot, botId) => {
    const botPosts = posts.get(botId) || [];
    
    // Generate posts based on proximity and bot interests
    const proximityPosts = {
      neighborhood: [
        {
          id: `post_${botId}_neighborhood_1`,
          userId: botId,
          content: `Just discovered this amazing ${bot.interests[0].toLowerCase()} spot around the corner! ${getEmojiForInterest(bot.interests[0])} Anyone want to join for a meetup this weekend? #Local${bot.interests[0]} #NeighborhoodVibes`,
          likes: Math.floor(Math.random() * 20) + 5,
          comments: Math.floor(Math.random() * 5) + 1,
          timestamp: getRandomRecentTime(),
          proximity: 'neighborhood',
          tags: [bot.interests[0], 'Local', 'Meetup'],
          isAIBot: true
        }
      ],
      city: [
        {
          id: `post_${botId}_city_1`,
          userId: botId,
          content: `New ${bot.interests[1].toLowerCase()} event happening downtown! ${getEmojiForInterest(bot.interests[1])} Perfect for ${bot.interests[1].toLowerCase()} enthusiasts. Who's excited? #${bot.interests[1]} #Downtown #Community`,
          likes: Math.floor(Math.random() * 30) + 10,
          comments: Math.floor(Math.random() * 8) + 2,
          timestamp: getRandomRecentTime(),
          proximity: 'city',
          tags: [bot.interests[1], 'Downtown', 'Community'],
          isAIBot: true
        }
      ],
      state: [
        {
          id: `post_${botId}_state_1`,
          userId: botId,
          content: `State-wide ${bot.interests[2].toLowerCase()} gathering next month! ${getEmojiForInterest(bot.interests[2])} People from all over are participating. It's going to be incredible. #${bot.interests[2]} #StateWide #Culture`,
          likes: Math.floor(Math.random() * 40) + 15,
          comments: Math.floor(Math.random() * 10) + 3,
          timestamp: getRandomRecentTime(),
          proximity: 'state',
          tags: [bot.interests[2], 'StateWide', 'Culture'],
          isAIBot: true
        }
      ]
    };

    allPosts.push(...proximityPosts[proximity]);
  });

  return allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const getEmojiForInterest = (interest) => {
  const emojiMap = {
    'Coffee': '☕️',
    'Tech': '💻',
    'Art': '🎨',
    'Music': '🎵',
    'Food': '🍕',
    'Cooking': '👨‍🍳',
    'Travel': '✈️',
    'Fitness': '💪',
    'Business': '💼',
    'Sports': '⚽',
    'Reading': '📚',
    'Yoga': '🧘‍♀️',
    'Wellness': '🌿',
    'Meditation': '🧘',
    'Health': '🏥',
    'Photography': '📸',
    'Local Business': '🏪',
    'Community': '🤝',
    'Networking': '🤝'
  };
  return emojiMap[interest] || '✨';
};

const getRandomRecentTime = () => {
  const now = new Date();
  const hoursAgo = Math.floor(Math.random() * 72) + 1; // 1-72 hours ago
  const time = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  
  const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    const days = Math.floor(diffInHours / 24);
    return `${days} days ago`;
  }
};

// Initialize AI bots when server starts
initializeAIBots();

// Generate unique username
const generateUsername = (personalName) => {
  const base = personalName.toLowerCase().replace(/\s+/g, '');
  let username = base;
  let counter = 1;
  
  while (Array.from(users.values()).some(user => user.username === username)) {
    username = `${base}${counter}`;
    counter++;
  }
  
  return username;
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hoodly MVP Backend Running!' });
});

// User registration
app.post('/api/users/register', (req, res) => {
  const { personalName, email, bio, location, interests } = req.body;
  
  if (!personalName || !email) {
    return res.status(400).json({ error: 'Personal name and email are required' });
  }
  
  // Check if email already exists
  if (Array.from(users.values()).some(user => user.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const username = generateUsername(personalName);
  
  const user = {
    id: userId,
    personalName,
    username,
    email,
    bio: bio || '',
    location: location || '',
    interests: interests || [],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    createdAt: new Date().toISOString(),
    isOnline: false,
    lastSeen: new Date().toISOString()
  };
  
  users.set(userId, user);
  friendRequests.set(userId, []);
  friendships.set(userId, []);
  
  res.json({ success: true, user });
});

// Get user profile
app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ success: true, user });
});

// Search users
app.get('/api/users/search/:query', (req, res) => {
  const { query } = req.params;
  const searchTerm = query.toLowerCase();
  
  const results = Array.from(users.values())
    .filter(user => 
      user.personalName.toLowerCase().includes(searchTerm) ||
      user.username.toLowerCase().includes(searchTerm) ||
      user.interests.some(interest => interest.toLowerCase().includes(searchTerm))
    )
    .slice(0, 20); // Limit results
  
  res.json({ success: true, users: results });
});

// Send friend request
app.post('/api/friends/request', (req, res) => {
  const { fromUserId, toUserId } = req.body;
  
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ error: 'Both user IDs are required' });
  }
  
  const fromUser = users.get(fromUserId);
  const toUser = users.get(toUserId);
  
  if (!fromUser || !toUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (fromUserId === toUserId) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' });
  }
  
  const toUserRequests = friendRequests.get(toUserId) || [];
  
  // Check if request already exists
  if (toUserRequests.some(req => req.fromUserId === fromUserId)) {
    return res.status(400).json({ error: 'Friend request already sent' });
  }
  
  // Check if already friends
  const fromUserFriends = friendships.get(fromUserId) || [];
  if (fromUserFriends.includes(toUserId)) {
    return res.status(400).json({ error: 'Already friends' });
  }
  
  const request = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fromUserId,
    toUserId,
    fromUser: {
      id: fromUser.id,
      personalName: fromUser.personalName,
      username: fromUser.username,
      avatar: fromUser.avatar
    },
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  
  toUserRequests.push(request);
  friendRequests.set(toUserId, toUserRequests);
  
  res.json({ success: true, request });
});

// Accept/decline friend request
app.post('/api/friends/respond', (req, res) => {
  const { requestId, toUserId, action } = req.body; // action: 'accept' or 'decline'
  
  if (!requestId || !toUserId || !action) {
    return res.status(400).json({ error: 'Request ID, user ID, and action are required' });
  }
  
  const toUserRequests = friendRequests.get(toUserId) || [];
  const requestIndex = toUserRequests.findIndex(req => req.id === requestId);
  
  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Friend request not found' });
  }
  
  const request = toUserRequests[requestIndex];
  
  if (action === 'accept') {
    // Add to both users' friend lists
    const fromUserFriends = friendships.get(request.fromUserId) || [];
    const toUserFriends = friendships.get(toUserId) || [];
    
    if (!fromUserFriends.includes(toUserId)) {
      fromUserFriends.push(toUserId);
      friendships.set(request.fromUserId, fromUserFriends);
    }
    
    if (!toUserFriends.includes(request.fromUserId)) {
      toUserFriends.push(request.fromUserId);
      friendships.set(toUserId, toUserFriends);
    }
  }
  
  // Remove the request
  toUserRequests.splice(requestIndex, 1);
  friendRequests.set(toUserId, toUserRequests);
  
  res.json({ success: true, action });
});

// Get friend requests
app.get('/api/friends/requests/:userId', (req, res) => {
  const { userId } = req.params;
  const requests = friendRequests.get(userId) || [];
  
  res.json({ success: true, requests });
});

// Get friends list
app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  const friendIds = friendships.get(userId) || [];
  const friends = friendIds.map(id => users.get(id)).filter(Boolean);
  
  res.json({ success: true, friends });
});

// Private messaging routes
app.get('/api/messages/private/:friendId', (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = 'current-user-id'; // In real app, get from auth
    
    // Verify friendship
    const userFriends = friendships.get(userId) || [];
    if (!userFriends.includes(friendId)) {
      return res.status(403).json({ success: false, error: 'Not friends' });
    }
    
    // Get messages (in real app, use database)
    const messages = privateMessages.get(`${userId}-${friendId}`) || [];
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching private messages:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/messages/private/send', (req, res) => {
  try {
    const { receiverId, content, type = 'text' } = req.body;
    const senderId = 'current-user-id'; // In real app, get from auth
    
    // Verify friendship
    const userFriends = friendships.get(senderId) || [];
    if (!userFriends.includes(receiverId)) {
      return res.status(403).json({ success: false, error: 'Not friends' });
    }
    
    // Create message
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      receiverId,
      content,
      type,
      isRead: false,
      timestamp: new Date().toISOString()
    };
    
    // Store message
    const conversationKey = `${senderId}-${receiverId}`;
    const messages = privateMessages.get(conversationKey) || [];
    messages.push(message);
    privateMessages.set(conversationKey, messages);
    
    // Emit to socket for real-time delivery
    io.emit('private_message', {
      message,
      senderId,
      receiverId
    });
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending private message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.put('/api/messages/private/read/:friendId', (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = 'current-user-id'; // In real app, get from auth
    
    // Mark messages as read
    const conversationKey = `${friendId}-${userId}`;
    const messages = privateMessages.get(conversationKey) || [];
    
    messages.forEach(msg => {
      if (msg.senderId === friendId && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = new Date().toISOString();
      }
    });
    
    privateMessages.set(conversationKey, messages);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Proximity-based feed API
app.get('/api/feed/:proximity', (req, res) => {
  try {
    const { proximity } = req.params;
    const validProximities = ['neighborhood', 'city', 'state'];
    
    if (!validProximities.includes(proximity)) {
      return res.status(400).json({ success: false, error: 'Invalid proximity level' });
    }
    
    // Generate AI posts for the requested proximity
    const feedPosts = generateAIPosts(proximity);
    
    // Add user info to each post
    const postsWithUsers = feedPosts.map(post => {
      const user = users.get(post.userId);
      return {
        ...post,
        user: {
          id: user.id,
          personalName: user.personalName,
          username: user.username,
          avatar: user.avatar,
          location: user.location,
          distance: getDistanceFromUser(user.location),
          isAIBot: user.isAIBot || false
        }
      };
    });
    
    res.json({ 
      success: true, 
      posts: postsWithUsers,
      proximity,
      totalPosts: postsWithUsers.length
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get AI bots for discovery
app.get('/api/users/ai-bots', (req, res) => {
  try {
    const bots = Array.from(aiBots.values()).map(bot => ({
      id: bot.id,
      personalName: bot.personalName,
      username: bot.username,
      avatar: bot.avatar,
      bio: bot.bio,
      location: bot.location,
      interests: bot.interests,
      isAIBot: true,
      createdAt: bot.createdAt
    }));
    
    res.json({ success: true, bots });
  } catch (error) {
    console.error('Error fetching AI bots:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Simulate AI bot activity
const simulateAIActivity = () => {
  setInterval(() => {
    // Randomly make some bots appear online
    aiBots.forEach((bot, botId) => {
      if (Math.random() < 0.3) { // 30% chance
        bot.isOnline = true;
        bot.lastSeen = new Date().toISOString();
      } else {
        bot.isOnline = false;
      }
    });
    
    console.log('🤖 AI bot activity updated');
  }, 30000); // Every 30 seconds
};

// Start AI activity simulation
simulateAIActivity();

// Helper function to get distance (simulated)
const getDistanceFromUser = (location) => {
  const distances = {
    'Downtown District': '0.8km away',
    'Arts Quarter': '1.2km away',
    'Culinary District': '2.1km away',
    'Business District': '3.5km away',
    'Wellness District': '1.8km away'
  };
  return distances[location] || '2.0km away';
};

// Feed API endpoint
app.get('/api/feed/:proximity', (req, res) => {
  try {
    const { proximity } = req.params;
    const aiPosts = generateAIPosts(proximity);
    
    res.json({
      success: true,
      posts: aiPosts
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feed' });
  }
});

// Simple rooms API
app.get('/api/rooms', (req, res) => {
  const rooms = [
    {
      id: 1,
      name: 'General Chat',
      emoji: '💬',
      description: 'General discussion and random topics',
      memberCount: 156,
      lastMessage: 'Hello everyone! 👋',
      lastMessageAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Tech Talk',
      emoji: '💻',
      description: 'Technology discussions and programming',
      memberCount: 89,
      lastMessage: 'Anyone working on React Native?',
      lastMessageAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Gaming',
      emoji: '🎮',
      description: 'Video games and gaming discussions',
      memberCount: 234,
      lastMessage: 'What games are you playing?',
      lastMessageAt: new Date().toISOString()
    }
  ];
  
  res.json({ success: true, data: rooms });
});

// Socket.io handling
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);
  
  // Generate user info
  socket.userId = `user_${socket.id.slice(-6)}`;
  socket.username = 'hashir';
  
  // Add to online users
  onlineUsers.add(socket.userId);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`👥 User ${socket.username} joined room ${roomId}`);
    
    // Initialize room messages
    if (!messages[roomId]) {
      messages[roomId] = [];
    }
    
    // Chat history is now loaded from Supabase
    // Removed Socket.IO chat history logic
    
    // Notify others
    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      username: socket.username
    });
  });
  
  // Chat messages are now handled by Supabase Realtime
  // Removed Socket.IO chat message logic
  
  // Friend request events
  socket.on('send-friend-request', (data) => {
    const { toUserId } = data;
    const fromUser = users.get(socket.userId);
    
    if (!fromUser) return;
    
    const request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId: socket.userId,
      toUserId,
      fromUser: {
        id: fromUser.id,
        personalName: fromUser.personalName,
        username: fromUser.username,
        avatar: fromUser.avatar
      },
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    const toUserRequests = friendRequests.get(toUserId) || [];
    toUserRequests.push(request);
    friendRequests.set(toUserId, toUserRequests);
    
    // Notify recipient
    socket.to(toUserId).emit('friend-request-received', request);
  });
  
  socket.on('respond-friend-request', (data) => {
    const { requestId, action } = data;
    const toUserRequests = friendRequests.get(socket.userId) || [];
    const requestIndex = toUserRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) return;
    
    const request = toUserRequests[requestIndex];
    
    if (action === 'accept') {
      const fromUserFriends = friendships.get(request.fromUserId) || [];
      const toUserFriends = friendships.get(socket.userId) || [];
      
      if (!fromUserFriends.includes(socket.userId)) {
        fromUserFriends.push(socket.userId);
        friendships.set(request.fromUserId, fromUserFriends);
      }
      
      if (!toUserFriends.includes(request.fromUserId)) {
        toUserFriends.push(request.fromUserId);
        friendships.set(socket.userId, toUserFriends);
      }
      
      // Notify both users
      socket.emit('friend-request-accepted', { fromUserId: request.fromUserId });
      socket.to(request.fromUserId).emit('friend-request-accepted', { fromUserId: socket.userId });
    }
    
    // Remove request
    toUserRequests.splice(requestIndex, 1);
    friendRequests.set(socket.userId, toUserRequests);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
    onlineUsers.delete(socket.userId);
  });
});

const PORT = 5002;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Hoodly MVP Backend running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time chat`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Rooms: http://localhost:${PORT}/api/rooms`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`🔍 Search: http://localhost:${PORT}/api/users/search`);
  console.log(`🌐 Network: http://192.168.18.232:${PORT}`);
}); 