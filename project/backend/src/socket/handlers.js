const { supabase } = require('../../lib/supabase');

// Store connected users and their locations
const connectedUsers = new Map();
const userRooms = new Map();

// Initialize WebSocket handlers
const initializeHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', async (data) => {
      try {
        const { token, userId } = data;
        
        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          socket.emit('auth_error', { message: 'Invalid token' });
          return;
        }

        // Store user connection
        connectedUsers.set(socket.id, {
          id: user.id,
          socketId: socket.id,
          connectedAt: new Date(),
          location: null
        });

        // Join user to their personal room
        socket.join(`user:${user.id}`);
        userRooms.set(user.id, socket.id);

        socket.emit('authenticated', { 
          userId: user.id,
          message: 'Successfully authenticated'
        });

        console.log(`User ${user.id} authenticated on socket ${socket.id}`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Handle like notifications
    socket.on('like_post', async (data) => {
      try {
        const { postId, postOwnerId } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Get user profile for notification
        const { data: fromUser } = await supabase
          .from('profiles')
          .select('id, personalName, username, avatar')
          .eq('id', userData.id)
          .single();

        // Create notification in database
        const { data: notification, error } = await supabase
          .from('notifications')
          .insert({
            user_id: postOwnerId,
            from_user_id: userData.id,
            type: 'like',
            title: 'New Like',
            message: `${fromUser?.personalName || fromUser?.username || 'Someone'} liked your post`,
            metadata: { postId },
            is_read: false
          })
          .select()
          .single();

        if (error) throw error;

        // Send real-time notification to post owner
        const postOwnerSocketId = userRooms.get(postOwnerId);
        if (postOwnerSocketId && postOwnerSocketId !== socket.id) {
          io.to(postOwnerSocketId).emit('notification', {
            type: 'like',
            fromUser,
            postId,
            notification
          });
        }

        socket.emit('like_sent', { success: true, notification });
        console.log(`Like notification sent from ${userData.id} to ${postOwnerId}`);
      } catch (error) {
        console.error('Like notification error:', error);
        socket.emit('error', { message: 'Failed to send like notification' });
      }
    });

    // Handle friend request notifications
    socket.on('friend_request', async (data) => {
      try {
        const { receiverId } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Get user profile for notification
        const { data: fromUser } = await supabase
          .from('profiles')
          .select('id, personalName, username, avatar')
          .eq('id', userData.id)
          .single();

        // Create notification in database
        const { data: notification, error } = await supabase
          .from('notifications')
          .insert({
            user_id: receiverId,
            from_user_id: userData.id,
            type: 'friend_request',
            title: 'Friend Request',
            message: `${fromUser?.personalName || fromUser?.username || 'Someone'} sent you a friend request`,
            metadata: { requestId: data.requestId },
            is_read: false
          })
          .select()
          .single();

        if (error) throw error;

        // Send real-time notification to receiver
        const receiverSocketId = userRooms.get(receiverId);
        if (receiverSocketId && receiverSocketId !== socket.id) {
          io.to(receiverSocketId).emit('notification', {
            type: 'friend_request',
            fromUser,
            notification
          });
        }

        socket.emit('friend_request_sent', { success: true, notification });
        console.log(`Friend request notification sent from ${userData.id} to ${receiverId}`);
      } catch (error) {
        console.error('Friend request notification error:', error);
        socket.emit('error', { message: 'Failed to send friend request notification' });
      }
    });

    // Handle private message notifications
    socket.on('private_message', async (data) => {
      try {
        const { receiverId, message } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Get user profile for notification
        const { data: fromUser } = await supabase
          .from('profiles')
          .select('id, personalName, username, avatar')
          .eq('id', userData.id)
          .single();

        // Create notification in database
        const { data: notification, error } = await supabase
          .from('notifications')
          .insert({
            user_id: receiverId,
            from_user_id: userData.id,
            type: 'dm',
            title: 'New Message',
            message: `New message from ${fromUser?.personalName || fromUser?.username || 'Someone'}`,
            metadata: { message: message.substring(0, 100), messageId: data.messageId },
            is_read: false
          })
          .select()
          .single();

        if (error) throw error;

        // Send real-time notification to receiver
        const receiverSocketId = userRooms.get(receiverId);
        if (receiverSocketId && receiverSocketId !== socket.id) {
          io.to(receiverSocketId).emit('notification', {
            type: 'dm',
            fromUser,
            message: message.substring(0, 100),
            notification
          });
        }

        socket.emit('message_sent', { success: true, notification });
        console.log(`DM notification sent from ${userData.id} to ${receiverId}`);
      } catch (error) {
        console.error('DM notification error:', error);
        socket.emit('error', { message: 'Failed to send message notification' });
      }
    });

    // Handle comment notifications
    socket.on('comment_post', async (data) => {
      try {
        const { postId, postOwnerId, comment } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Don't notify if commenting on own post
        if (userData.id === postOwnerId) {
          socket.emit('comment_sent', { success: true });
          return;
        }

        // Get user profile for notification
        const { data: fromUser } = await supabase
          .from('profiles')
          .select('id, personalName, username, avatar')
          .eq('id', userData.id)
          .single();

        // Create notification in database
        const { data: notification, error } = await supabase
          .from('notifications')
          .insert({
            user_id: postOwnerId,
            from_user_id: userData.id,
            type: 'comment',
            title: 'New Comment',
            message: `${fromUser?.personalName || fromUser?.username || 'Someone'} commented on your post`,
            metadata: { postId, comment: comment.substring(0, 100) },
            is_read: false
          })
          .select()
          .single();

        if (error) throw error;

        // Send real-time notification to post owner
        const postOwnerSocketId = userRooms.get(postOwnerId);
        if (postOwnerSocketId && postOwnerSocketId !== socket.id) {
          io.to(postOwnerSocketId).emit('notification', {
            type: 'comment',
            fromUser,
            postId,
            comment: comment.substring(0, 100),
            notification
          });
        }

        socket.emit('comment_sent', { success: true, notification });
        console.log(`Comment notification sent from ${userData.id} to ${postOwnerId}`);
      } catch (error) {
        console.error('Comment notification error:', error);
        socket.emit('error', { message: 'Failed to send comment notification' });
      }
    });

    // Handle notification read status
    socket.on('mark_notification_read', async (data) => {
      try {
        const { notificationId } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Update notification in database
        const { data: notification, error } = await supabase
          .from('notifications')
          .update({ 
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', notificationId)
          .eq('user_id', userData.id)
          .select()
          .single();

        if (error) throw error;

        socket.emit('notification_marked_read', { success: true, notification });
      } catch (error) {
        console.error('Mark notification read error:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    // Handle mark all notifications as read
    socket.on('mark_all_notifications_read', async (data) => {
      try {
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Update all user's notifications in database
        const { data: notifications, error } = await supabase
          .from('notifications')
          .update({ 
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('user_id', userData.id)
          .eq('is_read', false)
          .select();

        if (error) throw error;

        socket.emit('all_notifications_marked_read', { 
          success: true, 
          updatedCount: notifications?.length || 0 
        });
      } catch (error) {
        console.error('Mark all notifications read error:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });

    // Handle location updates
    socket.on('location_update', async (data) => {
      try {
        const { latitude, longitude, address } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Update user location in memory
        userData.location = { latitude, longitude, address };
        userData.lastLocationUpdate = new Date();

        // Update location in database
        await supabase
          .from('user_locations')
          .upsert({
            user_id: userData.id,
            latitude,
            longitude,
            address,
            updated_at: new Date().toISOString()
          });

        // Broadcast to nearby users (within 1km)
        const nearbyUsers = await getNearbyUsers(latitude, longitude, 1000);
        nearbyUsers.forEach(nearbyUser => {
          const nearbySocketId = userRooms.get(nearbyUser.user_id);
          if (nearbySocketId && nearbySocketId !== socket.id) {
            io.to(nearbySocketId).emit('user_nearby', {
              userId: userData.id,
              distance: nearbyUser.distance,
              location: { latitude, longitude }
            });
          }
        });

        socket.emit('location_updated', { 
          success: true,
          nearbyUsers: nearbyUsers.length
        });
      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle safety alert creation
    socket.on('create_safety_alert', async (data) => {
      try {
        const { type, title, description, location, severity, affected_area } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Create alert in database
        const { data: alert, error } = await supabase
          .from('safety_alerts')
          .insert({
            type,
            title,
            description,
            location: JSON.stringify(location),
            severity,
            affected_area: affected_area || 1000,
            created_by: userData.id
          })
          .select()
          .single();

        if (error) throw error;

        // Find users within affected area
        const affectedUsers = await getNearbyUsers(
          location.latitude, 
          location.longitude, 
          affected_area || 1000
        );

        // Broadcast alert to affected users
        affectedUsers.forEach(affectedUser => {
          const affectedSocketId = userRooms.get(affectedUser.user_id);
          if (affectedSocketId && affectedSocketId !== socket.id) {
            io.to(affectedSocketId).emit('safety_alert', {
              alert,
              distance: affectedUser.distance,
              createdBy: userData.id
            });
          }
        });

        // Send confirmation to creator
        socket.emit('safety_alert_created', {
          alert,
          affectedUsers: affectedUsers.length
        });

        console.log(`Safety alert created by ${userData.id}, affecting ${affectedUsers.length} users`);
      } catch (error) {
        console.error('Safety alert creation error:', error);
        socket.emit('error', { message: 'Failed to create safety alert' });
      }
    });

    // Handle safety alert response
    socket.on('respond_to_alert', async (data) => {
      try {
        const { alertId, responseType, comment } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Record response in database
        const { data: response, error } = await supabase
          .from('alert_responses')
          .insert({
            alert_id: alertId,
            user_id: userData.id,
            response_type: responseType,
            comment
          })
          .onConflict(['alert_id', 'user_id'])
          .merge()
          .select()
          .single();

        if (error) throw error;

        // Notify alert creator
        const { data: alert } = await supabase
          .from('safety_alerts')
          .select('created_by')
          .eq('id', alertId)
          .single();

        if (alert) {
          const creatorSocketId = userRooms.get(alert.created_by);
          if (creatorSocketId && creatorSocketId !== socket.id) {
            io.to(creatorSocketId).emit('alert_response', {
              alertId,
              response,
              responderId: userData.id
            });
          }
        }

        socket.emit('response_recorded', { response });
      } catch (error) {
        console.error('Alert response error:', error);
        socket.emit('error', { message: 'Failed to record response' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (userData && roomId) {
        socket.to(`room:${roomId}`).emit('user_typing', {
          userId: userData.id,
          roomId
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (userData && roomId) {
        socket.to(`room:${roomId}`).emit('user_stopped_typing', {
          userId: userData.id,
          roomId
        });
      }
    });

    // Handle room joining
    socket.on('join_room', (data) => {
      const { roomId } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (userData && roomId) {
        socket.join(`room:${roomId}`);
        socket.to(`room:${roomId}`).emit('user_joined_room', {
          userId: userData.id,
          roomId
        });
      }
    });

    // Handle room leaving
    socket.on('leave_room', (data) => {
      const { roomId } = data;
      const userData = connectedUsers.get(socket.id);
      
      if (userData && roomId) {
        socket.leave(`room:${roomId}`);
        socket.to(`room:${roomId}`).emit('user_left_room', {
          userId: userData.id,
          roomId
        });
      }
    });

    // Handle emergency calls
    socket.on('emergency_call', async (data) => {
      try {
        const { location, message } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Create emergency alert
        const { data: alert, error } = await supabase
          .from('safety_alerts')
          .insert({
            type: 'emergency',
            title: 'Emergency Call',
            description: message || 'User has made an emergency call',
            location: JSON.stringify(location),
            severity: 'high',
            created_by: userData.id,
            affected_area: 5000 // 5km radius for emergencies
          })
          .select()
          .single();

        if (error) throw error;

        // Find all users within 5km
        const nearbyUsers = await getNearbyUsers(
          location.latitude,
          location.longitude,
          5000
        );

        // Broadcast emergency to all nearby users
        nearbyUsers.forEach(nearbyUser => {
          const nearbySocketId = userRooms.get(nearbyUser.user_id);
          if (nearbySocketId && nearbySocketId !== socket.id) {
            io.to(nearbySocketId).emit('emergency_alert', {
              alert,
              distance: nearbyUser.distance,
              callerId: userData.id,
              location
            });
          }
        });

        // Notify emergency contacts (if implemented)
        // TODO: Implement SMS/call functionality

        socket.emit('emergency_sent', {
          alert,
          notifiedUsers: nearbyUsers.length
        });

        console.log(`Emergency call from ${userData.id}, notified ${nearbyUsers.length} users`);
      } catch (error) {
        console.error('Emergency call error:', error);
        socket.emit('error', { message: 'Failed to send emergency alert' });
      }
    });

    // Handle proximity radar requests
    socket.on('request_nearby_users', async (data) => {
      try {
        const { latitude, longitude, radius = 1000 } = data;
        const userData = connectedUsers.get(socket.id);
        
        if (!userData) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const nearbyUsers = await getNearbyUsers(latitude, longitude, radius);
        
        socket.emit('nearby_users', {
          users: nearbyUsers,
          count: nearbyUsers.length,
          radius
        });
      } catch (error) {
        console.error('Nearby users request error:', error);
        socket.emit('error', { message: 'Failed to get nearby users' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);
      
      if (userData) {
      // Remove from connected users
        connectedUsers.delete(socket.id);
        userRooms.delete(userData.id);
        
        console.log(`User ${userData.id} disconnected from socket ${socket.id}`);
      }
    });
  });
};

// Helper function to get nearby users
const getNearbyUsers = async (latitude, longitude, radius) => {
  try {
    const { data: users, error } = await supabase
      .from('user_locations')
      .select(`
        user_id,
        latitude,
        longitude,
        updated_at,
        profiles!user_locations_user_id_fkey(
          id,
          full_name,
          avatar_url,
          bio
        )
      `)
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .neq('user_id', connectedUsers.get(socket.id)?.id);

    if (error) throw error;

    // Calculate distances and filter
    const nearbyUsers = users
      .map(user => {
        const distance = calculateDistance(
          latitude,
          longitude,
          user.latitude,
          user.longitude
        );
        return {
          ...user,
          distance
        };
      })
      .filter(user => user.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return nearbyUsers;
  } catch (error) {
    console.error('Error getting nearby users:', error);
    return [];
  }
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Get connected users count
const getConnectedUsersCount = () => {
  return connectedUsers.size;
};

// Get user by socket ID
const getUserBySocketId = (socketId) => {
  return connectedUsers.get(socketId);
};

// Get socket ID by user ID
const getSocketIdByUserId = (userId) => {
  return userRooms.get(userId);
};

module.exports = {
  initializeHandlers,
  getConnectedUsersCount,
  getUserBySocketId,
  getSocketIdByUserId
}; 