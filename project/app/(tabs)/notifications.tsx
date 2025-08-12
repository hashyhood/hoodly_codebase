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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  HeaderScreen,
  Card,
  EmptyState,
  Spinner,
  GradientFAB
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import NotificationCard from '../../components/ui/NotificationCard';
import { notificationsApi } from '../../lib/api';
import type { Database } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

// Use the database schema type for notifications
type DBNotification = Database['public']['Tables']['notifications']['Row'];

interface NotificationWithUser {
  id: string;
  user_id: string;
  type: string;
  data?: {
    sender_id?: string;
    post_id?: string;
    room_id?: string;
    message?: string;
  };
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  fromUser?: {
    id: string;
    personalName: string;
    username: string;
    avatar: string;
  };
  metadata?: any;
}

export default function NotificationsTab() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([]);
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
      
      const currentPage = refresh ? 0 : page;
      const from = currentPage * pageSize;
      
      const { data, error } = await notificationsApi.getNotifications(user.id, pageSize, from);
      if (error) throw new Error(error);
      
      // Cast the data to the correct type
      const newNotifications = (data as NotificationWithUser[]) || [];
      
      if (refresh) {
        // Replace all notifications on refresh
        setNotifications(newNotifications);
        setPage(1);
      } else {
        // Append new notifications for pagination
        setNotifications(prev => [...prev, ...newNotifications]);
        setPage(prev => prev + 1);
      }
      
      // Check if there are more notifications to load
      setHasMore(newNotifications.length === pageSize);
    } catch (error) {
      logger.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, page, pageSize]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await notificationsApi.getNotifications(user.id);
      if (error) throw new Error(error);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      logger.warn('Error loading unread count:', error);
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
      logger.warn('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      if (error) throw new Error(error.message);
      
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      logger.warn('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Load data on mount
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    loadNotifications(true);
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!loading && hasMore && user) {
      loadNotifications(false);
    }
  }, [loading, hasMore, loadNotifications, user]);

  // Render notification item
  const renderNotification = ({ item }: { item: NotificationWithUser }) => (
    <NotificationCard
      notification={item}
      onPress={() => markNotificationRead(item.id)}
      onMarkRead={() => markNotificationRead(item.id)}
    />
  );

  // Render empty state
  const renderEmpty = () => (
    <EmptyState
      icon="notifications-off"
      title="No notifications yet"
      subtitle="When you get notifications, they'll appear here"
    />
  );

  // Render header
  const renderHeader = () => (
    <HeaderScreen
      title="Notifications"
      subtitle={`${unreadCount} unread`}
      rightActions={
        unreadCount > 0 ? [
          <TouchableOpacity
            key="mark-all"
            style={[styles.markAllButton, { backgroundColor: getColor('surface') }]}
            onPress={markAllAsRead}
          >
            <Text style={[styles.markAllText, { color: getColor('textPrimary') }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        ] : undefined
      }
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getColor('bg') }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      {renderHeader()}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={getColor('success')}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          hasMore && notifications.length > 0 ? (
            <View style={styles.loadingMore}>
              <Spinner size="small" />
              <Text style={[styles.loadingMoreText, { color: getColor('textSecondary') }]}>
                Loading more...
              </Text>
            </View>
          ) : null
        }
      />

      {/* Quick Actions */}
      {notifications.length > 0 && (
        <GradientFAB
          icon="filter"
          onPress={() => Alert.alert('Filter', 'Filter functionality coming soon!')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginRight: 12,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  quickActionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  quickActionsBlur: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 