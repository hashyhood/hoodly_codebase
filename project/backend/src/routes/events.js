const express = require('express');
const router = express.Router();

// In-memory storage for events
const events = new Map();
const eventRSVPs = new Map();
const userEvents = new Map();

// Get all events
router.get('/', (req, res) => {
  try {
    const { proximity = 'neighborhood' } = req.query;
    
    const allEvents = Array.from(events.values())
      .filter(event => event.proximity === proximity)
      .map(event => {
        const eventRSVPList = eventRSVPs.get(event.id) || [];
        return {
          ...event,
          rsvpCount: eventRSVPList.length,
          attendees: eventRSVPList.map(rsvp => rsvp.userId)
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      success: true,
      events: allEvents
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// Create a new event
router.post('/', (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      date,
      time,
      location,
      maxAttendees,
      category,
      proximity = 'neighborhood',
      tags = [],
      image
    } = req.body;
    
    if (!userId || !title || !description || !date || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID, title, description, date, and location are required' 
      });
    }
    
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEvent = {
      id: eventId,
      userId,
      title,
      description,
      date,
      time: time || 'TBD',
      location,
      maxAttendees: maxAttendees || null,
      category: category || 'general',
      proximity,
      tags,
      image: image || null,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    events.set(eventId, newEvent);
    
    // Add to user's events
    if (!userEvents.has(userId)) {
      userEvents.set(userId, []);
    }
    userEvents.get(userId).push(eventId);
    
    // Initialize empty RSVP list
    eventRSVPs.set(eventId, []);
    
    res.json({
      success: true,
      event: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

// RSVP to an event
router.post('/:eventId/rsvp', (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, status } = req.body; // status: 'going', 'maybe', 'not_going'
    
    if (!userId || !status) {
      return res.status(400).json({ success: false, error: 'User ID and status are required' });
    }
    
    if (!events.has(eventId)) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    const validStatuses = ['going', 'maybe', 'not_going'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid RSVP status' });
    }
    
    const event = events.get(eventId);
    const eventRSVPList = eventRSVPs.get(eventId) || [];
    
    // Check if user already RSVP'd
    const existingRSVPIndex = eventRSVPList.findIndex(rsvp => rsvp.userId === userId);
    
    if (existingRSVPIndex !== -1) {
      // Update existing RSVP
      eventRSVPList[existingRSVPIndex].status = status;
      eventRSVPList[existingRSVPIndex].updatedAt = new Date().toISOString();
    } else {
      // Add new RSVP
      eventRSVPList.push({
        userId,
        status,
        createdAt: new Date().toISOString()
      });
    }
    
    eventRSVPs.set(eventId, eventRSVPList);
    
    res.json({
      success: true,
      rsvp: {
        userId,
        status,
        eventId
      }
    });
  } catch (error) {
    console.error('Error RSVPing to event:', error);
    res.status(500).json({ success: false, error: 'Failed to RSVP to event' });
  }
});

// Get event details with RSVPs
router.get('/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!events.has(eventId)) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    const event = events.get(eventId);
    const eventRSVPList = eventRSVPs.get(eventId) || [];
    
    const eventWithRSVPs = {
      ...event,
      rsvps: eventRSVPList,
      rsvpCount: eventRSVPList.length,
      goingCount: eventRSVPList.filter(rsvp => rsvp.status === 'going').length,
      maybeCount: eventRSVPList.filter(rsvp => rsvp.status === 'maybe').length,
      notGoingCount: eventRSVPList.filter(rsvp => rsvp.status === 'not_going').length
    };
    
    res.json({
      success: true,
      event: eventWithRSVPs
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
});

// Get user's events
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'created' } = req.query; // 'created' or 'attending'
    
    let userEventIds = [];
    
    if (type === 'created') {
      userEventIds = userEvents.get(userId) || [];
    } else if (type === 'attending') {
      // Find events where user has RSVP'd
      for (const [eventId, rsvpList] of eventRSVPs.entries()) {
        const userRSVP = rsvpList.find(rsvp => rsvp.userId === userId);
        if (userRSVP && userRSVP.status === 'going') {
          userEventIds.push(eventId);
        }
      }
    }
    
    const userEventsList = userEventIds
      .map(eventId => events.get(eventId))
      .filter(event => event)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      success: true,
      events: userEventsList
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user events' });
  }
});

// Update an event
router.put('/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, ...updates } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const event = events.get(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    if (event.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this event' });
    }
    
    const updatedEvent = {
      ...event,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    events.set(eventId, updatedEvent);
    
    res.json({
      success: true,
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

// Delete an event
router.delete('/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const event = events.get(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    if (event.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this event' });
    }
    
    // Remove event and related data
    events.delete(eventId);
    eventRSVPs.delete(eventId);
    
    // Remove from user's events
    const userEventIds = userEvents.get(userId) || [];
    const updatedUserEvents = userEventIds.filter(id => id !== eventId);
    userEvents.set(userId, updatedUserEvents);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

module.exports = router; 