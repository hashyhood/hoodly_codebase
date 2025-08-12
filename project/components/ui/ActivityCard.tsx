import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { getColor } from '../../lib/theme';

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
    <TouchableOpacity style={[styles.container, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getColor('success') }]}>
            <Text style={styles.avatarText}>{user.avatar}</Text>
            {user.isLive && <View style={[styles.proximityRing, { borderColor: getColor('success') }]} />}
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: getColor('textPrimary') }]}>{user.name}</Text>
          <View style={styles.metaInfo}>
            <View style={[styles.distanceBadge, { backgroundColor: `${getColor('success')}30` }]}>
              <Text style={[styles.distanceText, { color: getColor('success') }]}>{user.distance}</Text>
            </View>
            {user.isLive && (
              <View style={[styles.liveIndicator, { backgroundColor: getColor('success') }]}>
                <Text style={[styles.liveText, { color: getColor('textPrimary') }]}>LIVE</Text>
              </View>
            )}
            <Text style={[styles.locationText, { color: getColor('textTertiary') }]}>• {user.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.contentText, { color: getColor('textSecondary') }]}>{content}</Text>
        
        {media && (
          <View style={styles.mediaContainer}>
            <View style={[styles.mediaPlaceholder, { backgroundColor: getColor('success') }]} />
          </View>
        )}

        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={[styles.actionButton, liked && { backgroundColor: `${getColor('success')}20` }]} 
              onPress={handleLike}
            >
              <Text style={[styles.actionIcon, liked && { color: getColor('success') }]}>
                {liked ? '❤️' : '🤍'}
              </Text>
              <Text style={[styles.actionText, liked && { color: getColor('success') }]}>
                {likeCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onComment}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={[styles.actionText, { color: getColor('textTertiary') }]}>{comments}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={[styles.actionText, { color: getColor('textTertiary') }]}>Share</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={[styles.joinButton, { backgroundColor: `${getColor('success')}20` }]} onPress={onJoin}>
            <Text style={styles.joinIcon}>⭐</Text>
            <Text style={[styles.joinText, { color: getColor('success') }]}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
    borderRadius: 25.5,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  distanceText: { fontSize: 11, fontWeight: '600' },
  liveIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveText: { fontSize: 9, fontWeight: '700' },
  locationText: { fontSize: 11 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contentText: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  mediaContainer: {
    marginBottom: 16,
  },
  mediaPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 12,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: { fontSize: 12 },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  joinIcon: {
    fontSize: 16,
  },
  joinText: { fontSize: 12, fontWeight: '600' },
}); 