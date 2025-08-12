import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface DynamicIslandProps {
  unreadCount?: number;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
  }>;
  onPress?: () => void;
  onMarkAllRead?: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  unreadCount = 0,
  notifications = [],
  onPress,
  onMarkAllRead,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const heightAnimation = useRef(new Animated.Value(40)).current;

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    Animated.parallel([
      Animated.timing(expandAnimation, {
        toValue: newExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnimation, {
        toValue: newExpanded ? 200 : 40,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (isExpanded) {
      toggleExpanded();
    } else {
      onPress?.();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: heightAnimation,
          transform: [
            {
              scaleX: expandAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            },
          ],
        },
      ]}
    >
      <BlurView intensity={30} style={[styles.blurView, { borderColor: colors.glass.border }]}>
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          {!isExpanded ? (
            <View style={styles.collapsedContent}>
              <View style={[styles.statusIndicator, { backgroundColor: colors.neural.primary }]}>
                <Text style={[styles.statusText, { color: colors.neural.primary }]}>●</Text>
              </View>
              <Text style={[styles.collapsedText, { color: colors.text.primary }]}>
                {unreadCount > 0 ? `${unreadCount} new notifications` : 'All caught up'}
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.neural.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.text.primary }]}>{unreadCount}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.expandedContent}>
              <View style={styles.expandedHeader}>
                <Text style={[styles.expandedTitle, { color: colors.text.primary }]}>Live Activity</Text>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={onMarkAllRead}>
                    <Text style={[styles.markReadText, { color: colors.text.secondary }]}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={toggleExpanded}>
                  <Text style={[styles.closeText, { color: colors.text.primary }]}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.notificationsList}>
                {notifications.slice(0, 3).map((notification) => (
                  <View key={notification.id} style={styles.notificationItem}>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, { color: colors.text.primary }]}>
                        {notification.title}
                      </Text>
                      <Text style={[styles.notificationMessage, { color: colors.text.secondary }]}>
                        {notification.message}
                      </Text>
                      <Text style={[styles.notificationTime, { color: colors.text.tertiary }]}>
                        {notification.time}
                      </Text>
                    </View>
                    {!notification.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.neural.primary }]} />
                    )}
                  </View>
                ))}
                
                {notifications.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: colors.text.secondary }]}>All caught up!</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.expandedFooter}>
                <Text style={[styles.bottomCloseText, { color: colors.text.secondary }]}>Tap to close</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
};

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
  content: {
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
  expandedFooter: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  bottomCloseText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 