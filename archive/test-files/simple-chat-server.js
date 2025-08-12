const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Store messages per room
const roomMessages = new Map(); // roomId -> [messages]
const connectedUsers = new Map(); // socketId -> userInfo

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size,
    activeRooms: roomMessages.size
  });
});

// Get all messages (for testing)
app.get('/messages', (req, res) => {
  const allMessages = [];
  roomMessages.forEach((messages, roomId) => {
    allMessages.push(...messages);
  });
  res.json(allMessages);
});

// Get room messages
app.get('/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const messages = roomMessages.get(roomId) || [];
  res.json(messages);
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    
    // Send chat history for this room
    const msgs = roomMessages.get(roomId) || [];
    socket.emit('chat history', msgs);
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Leave a room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user-left', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Listen for new messages
  socket.on('chat message', (msg) => {
    // msg should include: text, user, userId, emoji, timestamp, roomId, reactions
    const message = { 
      id: Date.now(), 
      ...msg,
      timestamp: msg.timestamp || new Date().toISOString()
    };
    
    if (!message.roomId) {
      console.error('Message missing roomId:', message);
      return;
    }
    
    // Store message in the correct room
    if (!roomMessages.has(message.roomId)) {
      roomMessages.set(message.roomId, []);
    }
    roomMessages.get(message.roomId).push(message);
    
    // Keep only last 100 messages per room to prevent memory issues
    if (roomMessages.get(message.roomId).length > 100) {
      roomMessages.get(message.roomId).shift();
    }
    
    // Broadcast to all users in the room
    io.to(message.roomId).emit('chat message', message);
    console.log(`Message sent in ${message.roomId}:`, {
      user: message.user,
      text: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '')
    });
  });

  // Typing indicators
  socket.on('typing-start', (roomId) => {
    socket.to(roomId).emit('user-typing', { roomId });
  });
  
  socket.on('typing-stop', (roomId) => {
    socket.to(roomId).emit('user-stop-typing', { roomId });
  });

  // Handle user info
  socket.on('user-info', (userInfo) => {
    connectedUsers.set(socket.id, {
      ...userInfo,
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });
    console.log('User info updated:', userInfo.username);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Hoodly Chat Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time messaging`);
  console.log(`🌐 Test URL: http://localhost:${PORT}`);
  console.log(`📱 Ready for mobile testing!`);
  console.log(`🔧 Health check: http://localhost:${PORT}/health`);
}); 