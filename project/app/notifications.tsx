import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NotificationCard from '../components/ui/NotificationCard';
import SocketEvents from '../components/ui/SocketEvents';
import { Ionicons } from '@expo/vector-icons';
import { notificationsApi } from '../lib/api';

interface Notification {
  id: string;
  type: string; // allow any string type
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  fromUser?: {
    id: string;
    personalName: string;
    username: string;
    avatar: string;
  };
  metadata?: any;
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Load notifications
  const loadNotifications = useCallback(async (refresh = false) => {
    if (!user) return;
    try {
      setLoading(true);
      setRefreshing(refresh);
      const { data, error } = await notificationsApi.getNotifications(user.id);
      if (error) throw new Error(error);
      setNotifications(data || []);
      setHasMore((data || []).length === pageSize);
      setPage(refresh ? 1 : page + 1);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await notificationsApi.getNotifications(user.id);
      if (error) throw new Error(error);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [user]);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    try {
      const { error } = await notificationsApi.markNotificationAsRead(notificationId);
      if (error) throw new Error(error);
      setNotifications(prev => prev.map(notif => notif.id === notificationId ? { ...notif, is_read: true } : notif));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await notificationsApi.markAllAsRead(user.id);
      if (error) throw new Error(error);
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, [user]);

  // Handle notification received
  const handleNotificationReceived = useCallback((data: any) => {
    const { notification } = data;
    
    // Add new notification to the top of the list
    setNotifications(prev => [notification, ...prev]);
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
  }, []);

  // Handle unread count change
  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadNotifications(true);
      loadUnreadCount();
    }
  }, [user, loadNotifications, loadUnreadCount]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          handleNotificationReceived({ notification: newNotification });
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

    return () => {
      subscription.unsubscribe();
    };
  }, [user, handleNotificationReceived, loadUnreadCount]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(true);
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Load more
  const onLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadNotifications();
    }
  }, [hasMore, loading, loadNotifications]);

  // Handle notification press
  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      markNotificationRead(notification.id);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'like':
        // Navigate to post
        console.log('Navigate to post:', notification.metadata?.postId);
        break;
      case 'dm':
        // Navigate to chat
        console.log('Navigate to chat with:', notification.fromUser?.id);
        break;
      case 'friend_request':
        // Navigate to friend requests
        console.log('Navigate to friend requests');
        break;
      case 'comment':
        // Navigate to post
        console.log('Navigate to post:', notification.metadata?.postId);
        break;
    }
  }, [markNotificationRead]);

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationCard
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onMarkRead={markNotificationRead}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="notifications-outline" 
        size={64} 
        color={theme.colors.text.tertiary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.text.secondary }]}>
        When you receive likes, comments, or messages, they'll appear here
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.status.error }]}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllButton, { backgroundColor: theme.colors.glass.primary }]}
          onPress={markAllAsRead}
        >
          <Text style={[styles.markAllText, { color: theme.colors.text.secondary }]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.neural.primary}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Socket events for real-time notifications */}
      <SocketEvents
        onNotificationReceived={handleNotificationReceived}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 