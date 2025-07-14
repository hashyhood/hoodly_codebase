import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import websocketManager from '../../lib/websocket';
import { supabase, createRealtimeSubscription } from '../../lib/supabase';

interface SocketEventsProps {
  roomId?: string;
  onNotificationReceived?: (notification: any) => void;
  onUnreadCountChange?: (count: number) => void;
}

interface Notification {
  id: string;
  type: 'like' | 'dm' | 'friend_request' | 'comment';
  fromUser: {
    id: string;
    personalName: string;
    username: string;
    avatar: string;
  };
  title: string;
  message: string;
  metadata?: any;
  is_read: boolean;
  created_at: string;
}

export default function SocketEvents({ 
  roomId, 
  onNotificationReceived,
  onUnreadCountChange 
}: SocketEventsProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Load initial unread count
  useEffect(() => {
    if (!user) return;
    
    loadUnreadCount();
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
      
      const countValue = count || 0;
      setUnreadCount(countValue);
      onUnreadCountChange?.(countValue);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Handle typing indicators
    websocketManager.setHandlers({
      onTyping: (data: { userId: string; roomId: string }) => {
        if (data.roomId === roomId) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        }
      },
      onStopTyping: (data: { userId: string; roomId: string }) => {
        if (data.roomId === roomId) {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      },
      onNotification: (data: any) => {
        handleNotificationReceived(data);
      },
    });

    // Join room for ephemeral events
    if (roomId) {
      websocketManager.joinRoom(roomId);
    }

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Use the new createRealtimeSubscription with error handling
    try {
      subscriptionRef.current = createRealtimeSubscription(`notifications-${user.id}`, (payload: any) => {
        // Handle notification updates
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          handleNotificationReceived({
            type: newNotification.type,
            fromUser: payload.new.fromUser,
            title: newNotification.title,
            message: newNotification.message,
            metadata: newNotification.metadata,
            notification: newNotification
          });
        } else if (payload.eventType === 'UPDATE') {
          // Reload unread count when notifications are updated
          loadUnreadCount();
        }
      });

      // Add specific event listeners
      subscriptionRef.current
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload: any) => {
            const newNotification = payload.new as Notification;
            handleNotificationReceived({
              type: newNotification.type,
              fromUser: payload.new.fromUser,
              title: newNotification.title,
              message: newNotification.message,
              metadata: newNotification.metadata,
              notification: newNotification
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Reload unread count when notifications are updated
            loadUnreadCount();
          }
        )
        .subscribe();
    } catch (error) {
      console.warn('Failed to setup Supabase Realtime subscription:', error);
      // Don't block rendering - app will work without realtime
    }

    return () => {
      if (roomId) {
        websocketManager.leaveRoom(roomId);
      }
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        } catch (error) {
          console.warn('Error unsubscribing from Supabase Realtime:', error);
        }
      }
    };
  }, [user, roomId]);

  const handleNotificationReceived = (data: any) => {
    const { type, fromUser, title, message, metadata, notification } = data;
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
    onUnreadCountChange?.(unreadCount + 1);
    
    // Add to recent notifications
    setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Call parent callback
    onNotificationReceived?.(data);
    
    // Show toast notification
    showNotificationToast(type, fromUser, title, message);
    
    // Clear notification after 5 seconds
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = setTimeout(() => {
      setRecentNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const showNotificationToast = (type: string, fromUser: any, title: string, message: string) => {
    const userName = fromUser?.personalName || fromUser?.username || 'Someone';
    
    let icon = '🔔';
    let action = '';
    
    switch (type) {
      case 'like':
        icon = '❤️';
        action = 'liked your post';
        break;
      case 'dm':
        icon = '💬';
        action = 'sent you a message';
        break;
      case 'friend_request':
        icon = '👥';
        action = 'sent you a friend request';
        break;
      case 'comment':
        icon = '💭';
        action = 'commented on your post';
        break;
    }

    // Show alert as toast (you can replace this with a proper toast library)
    Alert.alert(
      `${icon} ${title}`,
      `${userName} ${action}`,
      [
        { text: 'View', onPress: () => handleNotificationTap(type, fromUser) },
        { text: 'Dismiss', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleNotificationTap = (type: string, fromUser: any) => {
    // Handle navigation based on notification type
    switch (type) {
      case 'like':
        // Navigate to post
        console.log('Navigate to post');
        break;
      case 'dm':
        // Navigate to chat
        console.log('Navigate to chat with:', fromUser?.id);
        break;
      case 'friend_request':
        // Navigate to friend requests
        console.log('Navigate to friend requests');
        break;
      case 'comment':
        // Navigate to post
        console.log('Navigate to post');
        break;
    }
  };

  // Send typing indicators
  const startTyping = () => {
    if (!user || !roomId) return;
    websocketManager.startTyping(roomId);
  };

  const stopTyping = () => {
    if (!user || !roomId) return;
    websocketManager.stopTyping(roomId);
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Update local state
      setUnreadCount(prev => Math.max(0, prev - 1));
      onUnreadCountChange?.(Math.max(0, unreadCount - 1));
      
      // Emit socket event
      websocketManager.emitMarkNotificationRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      setUnreadCount(0);
      onUnreadCountChange?.(0);
      
      // Emit socket event
      websocketManager.emitMarkAllNotificationsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <View style={[styles.typingIndicator, { backgroundColor: theme.colors.glass.primary }]}>
          <Text style={[styles.typingText, { color: theme.colors.text.secondary }]}>
            {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
          </Text>
        </View>
      )}

      {/* Online users indicator */}
      {onlineUsers.length > 0 && (
        <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.glass.secondary }]}>
          <Text style={[styles.onlineText, { color: theme.colors.text.tertiary }]}>
            {onlineUsers.length} online
          </Text>
        </View>
      )}

      {/* Recent notifications */}
      {recentNotifications.length > 0 && (
        <View style={styles.notificationsContainer}>
          {recentNotifications.slice(0, 2).map((notification) => (
            <View 
              key={notification.id} 
              style={[styles.notificationItem, { backgroundColor: theme.colors.glass.primary }]}
            >
              <Text style={[styles.notificationText, { color: theme.colors.text.primary }]}>
                {notification.message}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  onlineIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  onlineText: {
    fontSize: 10,
  },
  notificationsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  notificationItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationText: {
    fontSize: 12,
  },
}); 