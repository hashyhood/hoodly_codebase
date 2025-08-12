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

app.use(cors());
app.use(express.json());

// Simple in-memory storage
const users = new Map();
const messages = [];
const rooms = new Map();

// Create default room
rooms.set('general', {
  id: 'general',
  name: 'General Chat',
  emoji: '💬',
  messages: []
});

// Auth endpoints (simple version)
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  const userId = Date.now().toString();
  
  users.set(userId, { 
    id: userId, 
    username, 
    email,
    created_at: new Date()
  });
  
  res.json({
    message: 'User registered successfully',
    token: `token-${userId}`,
    user: { id: userId, username, email }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const userId = Date.now().toString();
  
  res.json({
    message: 'Login successful',
    token: `token-${userId}`,
    user: { 
      id: userId, 
      username: email.split('@')[0], 
      email 
    }
  });
});

// Get rooms
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    emoji: room.emoji,
    messageCount: room.messages.length
  }));
  
  res.json({ data: roomList });
});

// Get messages for a room
app.get('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({ data: room.messages });
});

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    
    socket.emit('room-joined', { 
      roomId, 
      userCount: io.sockets.adapter.rooms.get(roomId)?.size || 1 
    });
  });

  socket.on('send-message', (data) => {
    const message = {
      id: Date.now(),
      userId: socket.userId || 'anonymous',
      username: socket.username || 'User',
      text: data.text,
      emoji: data.emoji || '💬',
      timestamp: new Date()
    };
    
    // Store message in room
    const room = rooms.get(data.roomId);
    if (room) {
      room.messages.push(message);
    }
    
    // Broadcast to all users in the room
    io.to(data.roomId).emit('new-message', message);
    console.log(`Message sent in ${data.roomId}:`, message.text);
  });

  socket.on('typing-start', (roomId) => {
    socket.to(roomId).emit('user-typing', {
      userId: socket.userId || 'anonymous',
      username: socket.username || 'User'
    });
  });

  socket.on('typing-stop', (roomId) => {
    socket.to(roomId).emit('user-stop-typing', {
      userId: socket.userId || 'anonymous'
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time messaging`);
  console.log(`🌐 Test URL: http://localhost:${PORT}`);
  console.log(`📱 Ready for mobile testing!`);
}); 