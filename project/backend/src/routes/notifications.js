const express = require('express');
const router = express.Router();
const { supabase } = require('../../lib/supabase');

// Get user's notifications
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        fromUser:profiles!notifications_from_user_id_fkey(
          id,
          personalName,
          username,
          avatar
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Get total count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      success: true,
      notifications: notifications || [],
      total: count || 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }
      throw error;
    }
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) throw error;
    
    res.json({
      success: true,
      message: `Marked ${notifications?.length || 0} notifications as read`,
      updatedCount: notifications?.length || 0
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
  }
});

// Delete a notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// Get unread notification count
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    
    res.json({
      success: true,
      unreadCount: count || 0
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
  }
});

// Create a notification (internal function, called by other routes)
const createNotification = async (userId, type, title, message, metadata = {}) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get notification statistics
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get counts by type
    const { data: typeStats, error: typeError } = await supabase
      .from('notifications')
      .select('type, is_read')
      .eq('user_id', userId);

    if (typeError) throw typeError;

    // Calculate statistics
    const stats = {
      total: typeStats?.length || 0,
      unread: typeStats?.filter(n => !n.is_read).length || 0,
      byType: {}
    };

    // Group by type
    typeStats?.forEach(notification => {
      if (!stats.byType[notification.type]) {
        stats.byType[notification.type] = { total: 0, unread: 0 };
      }
      stats.byType[notification.type].total++;
      if (!notification.is_read) {
        stats.byType[notification.type].unread++;
      }
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notification stats' });
  }
});

// Export the createNotification function for use in other routes
module.exports = { router, createNotification }; 