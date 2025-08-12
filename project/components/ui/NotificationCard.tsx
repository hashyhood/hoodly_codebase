import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { getColor } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface NotificationCardProps {
  notification: {
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
  };
  onPress?: () => void;
  onMarkRead?: (notificationId: string) => void;
}

export default function NotificationCard({ 
  notification, 
  onPress, 
  onMarkRead 
}: NotificationCardProps) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return { name: 'heart', color: '#ff4757' };
      case 'message':
        return { name: 'chatbubble', color: '#3742fa' };
      case 'friend_request':
        return { name: 'people', color: '#2ed573' };
      case 'comment':
        return { name: 'chatbubble-ellipses', color: '#ffa502' };
      case 'follow':
        return { name: 'person-add', color: '#3742fa' };
      default:
        return { name: 'notifications', color: '#747d8c' };
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'like':
        return getColor('error');
      case 'message':
        return getColor('success');
      case 'friend_request':
        return getColor('success');
      case 'comment':
        return getColor('warning');
      case 'follow':
        return getColor('success');
      default:
        return getColor('success');
    }
  };

  const getDefaultMessage = (type: string) => {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'message':
        return 'sent you a message';
      case 'friend_request':
        return 'sent you a friend request';
      default:
        return 'interacted with your content';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handlePress = () => {
    if (!notification.is_read && onMarkRead) {
      onMarkRead(notification.id);
    }
    onPress?.();
  };

  const icon = getNotificationIcon();
  const accentColor = getNotificationColor();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: notification.is_read 
            ? getColor('surface') 
            : getColor('surface'),
          borderLeftColor: accentColor,
          borderLeftWidth: notification.is_read ? 0 : 3
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {notification.fromUser?.avatar ? (
          <Image
            source={{ uri: notification.fromUser.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: accentColor }]}>
            <Ionicons name="person" size={20} color="white" />
          </View>
        )}
        
        {/* Notification type icon overlay */}
        <View style={[styles.typeIcon, { backgroundColor: accentColor }]}>
          <Ionicons name={icon.name as any} size={12} color="white" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: getColor('textPrimary') }]}>
            {notification.fromUser?.personalName || notification.fromUser?.username || 'Someone'}
          </Text>
          <Text style={[styles.time, { color: getColor('textTertiary') }]}>
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>
        
        <Text style={[styles.message, { color: getColor('textSecondary') }]}>
          {notification.data?.message || getDefaultMessage(notification.type)}
        </Text>

        {/* Metadata preview */}
        {notification.metadata && (
          <View style={styles.metadata}>
            {notification.type === 'message' && notification.metadata.message && (
              <Text style={[styles.metadataText, { color: getColor('textTertiary') }]}>
                "{notification.metadata.message}"
              </Text>
            )}
            {notification.type === 'comment' && notification.metadata.comment && (
              <Text style={[styles.metadataText, { color: getColor('textTertiary') }]}>
                "{notification.metadata.comment}"
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Unread indicator */}
      {!notification.is_read && (
        <View style={[styles.unreadIndicator, { backgroundColor: accentColor }]} />
      )}

      {/* Action button */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: getColor('surface') }]}
        onPress={() => onMarkRead?.(notification.id)}
      >
        <Ionicons 
          name={notification.is_read ? "checkmark-circle" : "checkmark-circle-outline"} 
          size={20} 
          color={notification.is_read ? getColor('success') : getColor('textSecondary')} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  metadata: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metadataText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 