const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Get all active safety alerts
router.get('/alerts', [
  query('type').optional().isIn(['emergency', 'warning', 'info']),
  query('severity').optional().isIn(['high', 'medium', 'low']),
  query('radius').optional().isInt({ min: 100, max: 50000 }), // meters
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
], authenticateToken, async (req, res) => {
  try {
    const { type, severity, radius = 1000, latitude, longitude } = req.query;
    
    let query = req.db('safety_alerts')
      .where('is_active', true)
      .orderBy('created_at', 'desc');
    
    if (type) {
      query = query.where('type', type);
    }
    
    if (severity) {
      query = query.where('severity', severity);
    }
    
    // Filter by distance if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const rad = parseFloat(radius);
      
      // Haversine formula for distance calculation
      query = query.whereRaw(`
        (6371000 * acos(cos(radians(?)) * cos(radians((location->>'latitude')::float)) * 
        cos(radians((location->>'longitude')::float) - radians(?)) + 
        sin(radians(?)) * sin(radians((location->>'latitude')::float)))) <= ?
      `, [lat, lng, lat, rad]);
    }
    
    const alerts = await query;
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error fetching safety alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch safety alerts'
    });
  }
});

// Create a new safety alert
router.post('/alerts', [
  body('type').isIn(['emergency', 'warning', 'info']),
  body('title').isLength({ min: 1, max: 200 }),
  body('description').isLength({ min: 1, max: 1000 }),
  body('location').isObject(),
  body('location.latitude').isFloat(),
  body('location.longitude').isFloat(),
  body('severity').isIn(['high', 'medium', 'low']),
  body('affected_area').optional().isInt({ min: 100, max: 50000 }),
], authenticateToken, validateRequest, async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      location,
      severity,
      affected_area = 1000
    } = req.body;
    
    const [alert] = await req.db('safety_alerts')
      .insert({
        type,
        title,
        description,
        location: JSON.stringify(location),
        severity,
        affected_area,
        created_by: req.user.id
      })
      .returning('*');
    
    // Send real-time notification to nearby users
    // TODO: Implement WebSocket notification
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Safety alert created successfully'
    });
  } catch (error) {
    console.error('Error creating safety alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create safety alert'
    });
  }
});

// Update safety alert
router.put('/alerts/:id', [
  param('id').isUUID(),
  body('is_active').optional().isBoolean(),
  body('description').optional().isLength({ min: 1, max: 1000 }),
], authenticateToken, validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, description } = req.body;
    
    const [alert] = await req.db('safety_alerts')
      .where({ id, created_by: req.user.id })
      .update({
        is_active,
        description,
        updated_at: req.db.fn.now()
      })
      .returning('*');
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Safety alert not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      data: alert,
      message: 'Safety alert updated successfully'
    });
  } catch (error) {
    console.error('Error updating safety alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update safety alert'
    });
  }
});

// Respond to safety alert
router.post('/alerts/:id/respond', [
  param('id').isUUID(),
  body('response_type').isIn(['confirm', 'deny', 'help_offered']),
  body('comment').optional().isLength({ max: 500 }),
], authenticateToken, validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { response_type, comment } = req.body;
    
    // Check if alert exists and is active
    const alert = await req.db('safety_alerts')
      .where({ id, is_active: true })
      .first();
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Safety alert not found or inactive'
      });
    }
    
    // Insert or update response
    const [response] = await req.db('alert_responses')
      .insert({
        alert_id: id,
        user_id: req.user.id,
        response_type,
        comment
      })
      .onConflict(['alert_id', 'user_id'])
      .merge()
      .returning('*');
    
    res.json({
      success: true,
      data: response,
      message: 'Response recorded successfully'
    });
  } catch (error) {
    console.error('Error responding to safety alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record response'
    });
  }
});

// Get emergency contacts
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await req.db('emergency_contacts')
      .where('user_id', req.user.id)
      .orderBy('is_primary', 'desc')
      .orderBy('created_at', 'asc');
    
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts'
    });
  }
});

// Add emergency contact
router.post('/contacts', [
  body('name').isLength({ min: 1, max: 100 }),
  body('phone').isMobilePhone(),
  body('relationship').optional().isLength({ max: 100 }),
  body('is_primary').optional().isBoolean(),
], authenticateToken, validateRequest, async (req, res) => {
  try {
    const { name, phone, relationship, is_primary = false } = req.body;
    
    // If this is the first contact, make it primary
    const existingContacts = await req.db('emergency_contacts')
      .where('user_id', req.user.id)
      .count('* as count');
    
    const shouldBePrimary = is_primary || existingContacts[0].count === 0;
    
    // If making this contact primary, unset others
    if (shouldBePrimary) {
      await req.db('emergency_contacts')
        .where('user_id', req.user.id)
        .update({ is_primary: false });
    }
    
    const [contact] = await req.db('emergency_contacts')
      .insert({
        user_id: req.user.id,
        name,
        phone,
        relationship,
        is_primary: shouldBePrimary
      })
      .returning('*');
    
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Emergency contact added successfully'
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact'
    });
  }
});

// Update emergency contact
router.put('/contacts/:id', [
  param('id').isUUID(),
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('phone').optional().isMobilePhone(),
  body('relationship').optional().isLength({ max: 100 }),
  body('is_primary').optional().isBoolean(),
], authenticateToken, validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, relationship, is_primary } = req.body;
    
    // If making this contact primary, unset others
    if (is_primary) {
      await req.db('emergency_contacts')
        .where('user_id', req.user.id)
        .update({ is_primary: false });
    }
    
    const [contact] = await req.db('emergency_contacts')
      .where({ id, user_id: req.user.id })
      .update({
        name,
        phone,
        relationship,
        is_primary,
        updated_at: req.db.fn.now()
      })
      .returning('*');
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      data: contact,
      message: 'Emergency contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency contact'
    });
  }
});

// Delete emergency contact
router.delete('/contacts/:id', [
  param('id').isUUID(),
], authenticateToken, validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await req.db('emergency_contacts')
      .where({ id, user_id: req.user.id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emergency contact'
    });
  }
});

// Update user location
router.post('/location', [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('address').optional().isLength({ max: 500 }),
], authenticateToken, validateRequest, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    
    const [location] = await req.db('user_locations')
      .insert({
        user_id: req.user.id,
        latitude,
        longitude,
        address
      })
      .onConflict('user_id')
      .merge()
      .returning('*');
    
    res.json({
      success: true,
      data: location,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Get nearby users
router.get('/nearby', [
  query('radius').optional().isInt({ min: 100, max: 10000 }), // meters
  query('limit').optional().isInt({ min: 1, max: 50 }),
], authenticateToken, async (req, res) => {
  try {
    const { radius = 1000, limit = 20 } = req.query;
    
    // Get current user's location
    const userLocation = await req.db('user_locations')
      .where('user_id', req.user.id)
      .first();
    
    if (!userLocation) {
      return res.status(404).json({
        success: false,
        message: 'User location not found'
      });
    }
    
    // Find nearby users
    const nearbyUsers = await req.db('user_locations')
      .select(
        'user_locations.*',
        'profiles.full_name',
        'profiles.avatar_url',
        'profiles.bio',
        req.db.raw(`
          (6371000 * acos(cos(radians(?)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(latitude)))) as distance
        `, [userLocation.latitude, userLocation.longitude, userLocation.latitude])
      )
      .join('profiles', 'user_locations.user_id', 'profiles.id')
      .whereNot('user_locations.user_id', req.user.id)
      .whereRaw(`
        (6371000 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + 
        sin(radians(?)) * sin(radians(latitude)))) <= ?
      `, [userLocation.latitude, userLocation.longitude, userLocation.latitude, radius])
      .orderBy('distance', 'asc')
      .limit(limit);
    
    res.json({
      success: true,
      data: nearbyUsers,
      count: nearbyUsers.length
    });
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby users'
    });
  }
});

module.exports = router; 