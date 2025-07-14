import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../../lib/theme';

interface ActivityCardProps {
  user: {
    name: string;
    avatar: string;
    isLive?: boolean;
    distance: string;
    location: string;
  };
  content: string;
  media?: boolean;
  likes: number;
  comments: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onJoin?: () => void;
  onShare?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  user,
  content,
  media = false,
  likes,
  comments,
  isLiked = false,
  onLike,
  onComment,
  onJoin,
  onShare,
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    onLike?.();
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.avatar}</Text>
            {user.isLive && <View style={styles.proximityRing} />}
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.metaInfo}>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{user.distance}</Text>
            </View>
            {user.isLive && (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            <Text style={styles.locationText}>• {user.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.contentText}>{content}</Text>
        
        {media && (
          <View style={styles.mediaContainer}>
            <View style={styles.mediaPlaceholder} />
          </View>
        )}

        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={[styles.actionButton, liked && styles.likedButton]} 
              onPress={handleLike}
            >
              <Text style={[styles.actionIcon, liked && styles.likedIcon]}>
                {liked ? '❤️' : '🤍'}
              </Text>
              <Text style={[styles.actionText, liked && styles.likedText]}>
                {likeCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onComment}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>{comments}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
            <Text style={styles.joinIcon}>⭐</Text>
            <Text style={styles.joinText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.glass.primary,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: theme.colors.gradients.neural[0],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
  },
  proximityRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 2,
    borderColor: theme.colors.neural.secondary,
    borderRadius: 25.5,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  distanceBadge: {
    backgroundColor: `${theme.colors.neural.secondary}30`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  distanceText: {
    color: theme.colors.neural.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  liveIndicator: {
    backgroundColor: theme.colors.neural.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveText: {
    color: theme.colors.text.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  locationText: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  contentText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  mediaContainer: {
    marginBottom: theme.spacing.md,
  },
  mediaPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gradients.neural[0],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  likedButton: {
    backgroundColor: `${theme.colors.neural.primary}20`,
  },
  actionIcon: {
    fontSize: 16,
  },
  likedIcon: {
    color: theme.colors.neural.primary,
  },
  actionText: {
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  likedText: {
    color: theme.colors.neural.primary,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${theme.colors.neural.secondary}20`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  joinIcon: {
    fontSize: 16,
  },
  joinText: {
    color: theme.colors.neural.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
}); 