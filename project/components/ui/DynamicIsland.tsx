import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  type: 'message' | 'event' | 'alert' | 'neighbor';
  title: string;
  message: string;
  time: string;
  avatar?: string;
  isRead: boolean;
}

interface DynamicIslandProps {
  isExpanded: boolean;
  onToggle: () => void;
  notifications: Notification[];
  onNotificationPress: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

export function DynamicIsland({ 
  isExpanded, 
  onToggle, 
  notifications, 
  onNotificationPress,
  onMarkAllRead 
}: DynamicIslandProps) {
  const { theme } = useTheme();
  const [animation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [isExpanded]);

  // Pulse animation for unread notifications
  useEffect(() => {
    if (notifications.some(n => !n.isRead)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const islandWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [120, width - 40],
  });

  const islandHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 300],
  });

  const borderRadius = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 25],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬';
      case 'event': return '🎉';
      case 'alert': return '🚨';
      case 'neighbor': return '👋';
      default: return '📱';
    }
  };

  const handleClose = () => {
    if (isExpanded) {
      onToggle();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: islandWidth,
          height: islandHeight,
          borderRadius,
          opacity,
        },
      ]}
    >
      <BlurView intensity={30} style={[styles.blurView, { borderColor: theme.colors.glass.border }]}>
        <TouchableOpacity
          style={styles.islandContent}
          onPress={onToggle}
          activeOpacity={0.8}
        >
          {!isExpanded ? (
            // Collapsed state
            <View style={styles.collapsedContent}>
              <Animated.View style={[styles.statusIndicator, { 
                transform: [{ scale: pulseAnimation }],
                backgroundColor: theme.colors.neural.primary,
              }]}>
                <Text style={[styles.statusText, { color: theme.colors.neural.primary }]}>●</Text>
              </Animated.View>
              <Text style={[styles.collapsedText, { color: theme.colors.text.primary }]}>
                {unreadCount > 0 ? `${unreadCount} new` : 'Hoodly'}
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.neural.primary }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.text.primary }]}>{unreadCount}</Text>
                </View>
              )}
            </View>
          ) : (
            // Expanded state
            <View style={styles.expandedContent}>
              <View style={styles.expandedHeader}>
                <Text style={[styles.expandedTitle, { color: theme.colors.text.primary }]}>Live Activity</Text>
                <View style={styles.headerActions}>
                  {unreadCount > 0 && (
                    <TouchableOpacity onPress={onMarkAllRead} style={styles.markReadButton}>
                      <Text style={[styles.markReadText, { color: theme.colors.text.secondary }]}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Text style={[styles.closeText, { color: theme.colors.text.primary }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.notificationsList}>
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notificationItem,
                        !notification.isRead && styles.unreadNotification
                      ]}
                      onPress={() => onNotificationPress(notification)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.notificationIcon}>
                        {getNotificationIcon(notification.type)}
                      </Text>
                      <View style={styles.notificationContent}>
                        <Text style={[styles.notificationTitle, { color: theme.colors.text.primary }]}>
                          {notification.title}
                        </Text>
                        <Text style={[styles.notificationMessage, { color: theme.colors.text.secondary }]}>
                          {notification.message}
                        </Text>
                        <Text style={[styles.notificationTime, { color: theme.colors.text.tertiary }]}>
                          {notification.time}
                        </Text>
                      </View>
                      {!notification.isRead && (
                        <View style={[styles.unreadDot, { backgroundColor: theme.colors.neural.primary }]} />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>✨</Text>
                    <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>All caught up!</Text>
                  </View>
                )}
              </View>
              
              {/* Close button at bottom */}
              <TouchableOpacity onPress={handleClose} style={styles.bottomCloseButton}>
                <Text style={[styles.bottomCloseText, { color: theme.colors.text.secondary }]}>Tap to close</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  blurView: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
  },
  islandContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
  },
  collapsedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markReadButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  unreadNotification: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  bottomCloseButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  bottomCloseText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 