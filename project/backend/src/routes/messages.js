const express = require('express');
const Joi = require('joi');
const { db } = require('../config/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation schemas
const sendMessageSchema = Joi.object({
  roomId: Joi.number().integer().required(),
  text: Joi.string().min(1).max(1000).required()
});

// Get messages for a room
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const messages = await db('messages')
      .select(
        'messages.*',
        'users.username',
        'users.email'
      )
      .join('users', 'messages.user_id', 'users.id')
      .where({ room_id: roomId })
      .orderBy('messages.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await db('messages')
      .where({ room_id: roomId })
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: messages.reverse(), // Show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/', validateRequest(sendMessageSchema), async (req, res) => {
  try {
    const { roomId, text } = req.body;
    const userId = req.user.userId; // From JWT token

    // Check if room exists
    const room = await db('rooms').where({ id: roomId }).first();
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Create message
    const [messageId] = await db('messages').insert({
      room_id: roomId,
      user_id: userId,
      text,
      created_at: new Date()
    });

    // Get the created message with user info
    const message = await db('messages')
      .select(
        'messages.*',
        'users.username',
        'users.email'
      )
      .join('users', 'messages.user_id', 'users.id')
      .where({ 'messages.id': messageId })
      .first();

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 