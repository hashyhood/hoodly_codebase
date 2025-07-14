const express = require('express');
const Joi = require('joi');
const { db } = require('../config/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation schemas
const createRoomSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  emoji: Joi.string().max(10).optional(),
  description: Joi.string().max(500).optional(),
  isPublic: Joi.boolean().default(true)
});

// Get all public rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await db('rooms')
      .where({ is_public: true })
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new room
router.post('/', validateRequest(createRoomSchema), async (req, res) => {
  try {
    const { name, emoji = '💬', description, isPublic = true } = req.body;

    const [roomId] = await db('rooms').insert({
      name,
      emoji,
      description,
      is_public: isPublic,
      created_at: new Date(),
      updated_at: new Date()
    });

    const room = await db('rooms').where({ id: roomId }).first();

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await db('rooms').where({ id: req.params.id }).first();
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 