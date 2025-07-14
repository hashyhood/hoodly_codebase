import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface NotificationCardProps {
  notification: {
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
  };
  onPress?: () => void;
  onMarkRead?: (notificationId: string) => void;
}

export default function NotificationCard({ 
  notification, 
  onPress, 
  onMarkRead 
}: NotificationCardProps) {
  const { theme } = useTheme();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return { name: 'heart', color: '#ff4757' };
      case 'dm':
        return { name: 'chatbubble', color: '#3742fa' };
      case 'friend_request':
        return { name: 'people', color: '#2ed573' };
      case 'comment':
        return { name: 'chatbubble-ellipses', color: '#ffa502' };
      default:
        return { name: 'notifications', color: '#747d8c' };
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'like':
        return theme.colors.status.error;
      case 'dm':
        return theme.colors.status.info;
      case 'friend_request':
        return theme.colors.status.success;
      case 'comment':
        return theme.colors.status.warning;
      default:
        return theme.colors.neural.primary;
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
            ? theme.colors.glass.secondary 
            : theme.colors.glass.primary,
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
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {notification.fromUser?.personalName || notification.fromUser?.username || 'Someone'}
          </Text>
          <Text style={[styles.time, { color: theme.colors.text.tertiary }]}>
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>
        
        <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
          {notification.message}
        </Text>

        {/* Metadata preview */}
        {notification.metadata && (
          <View style={styles.metadata}>
            {notification.type === 'dm' && notification.metadata.message && (
              <Text style={[styles.metadataText, { color: theme.colors.text.tertiary }]}>
                "{notification.metadata.message}"
              </Text>
            )}
            {notification.type === 'comment' && notification.metadata.comment && (
              <Text style={[styles.metadataText, { color: theme.colors.text.tertiary }]}>
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
        style={[styles.actionButton, { backgroundColor: theme.colors.glass.primary }]}
        onPress={() => onMarkRead?.(notification.id)}
      >
        <Ionicons 
          name={notification.is_read ? "checkmark-circle" : "checkmark-circle-outline"} 
          size={20} 
          color={notification.is_read ? theme.colors.status.success : theme.colors.text.secondary} 
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