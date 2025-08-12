import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Card } from './Card';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';
import { formatCount, formatTimeAgo, safeJsonParse } from '../../lib/utils';

interface PostCardProps {
  avatar?: string;
  name: string;
  time: string | Date;
  text: string;
  media?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  onMore?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  avatar,
  name,
  time,
  text,
  media,
  likeCount,
  commentCount,
  shareCount,
  onMore,
  onLike,
  onComment,
  onShare
}) => {
  const likeScale = useSharedValue(1);
  const countScale = useSharedValue(1);

  const handleLike = () => {
    likeScale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
    countScale.value = withSpring(1.1, { damping: 15, stiffness: 150 });
    
    setTimeout(() => {
      likeScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      countScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }, 200);
    
    onLike?.();
  };

  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }]
  }));

  const animatedCountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }]
  }));

  const cleanText = safeJsonParse(text);

  return (
    <Card variant="post">
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.postTime}>{formatTimeAgo(time)}</Text>
          </View>
        </View>
        {onMore && (
          <TouchableOpacity onPress={onMore} style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={getColor('textSecondary')} />
          </TouchableOpacity>
        )}
      </View>

      {cleanText && <Text style={styles.postText}>{cleanText}</Text>}

      {media && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: media }} style={styles.media} resizeMode="cover" />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Animated.View style={[styles.actionIcon, animatedLikeStyle]}>
            <Ionicons name="heart-outline" size={20} color={getColor('textSecondary')} />
          </Animated.View>
          <Animated.Text style={[styles.actionCount, animatedCountStyle]}>
            {formatCount(likeCount)}
          </Animated.Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={20} color={getColor('textSecondary')} />
          <Text style={styles.actionCount}>{formatCount(commentCount)}</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={20} color={getColor('textSecondary')} />
          <Text style={styles.actionCount}>{formatCount(shareCount)}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('md'),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: getSpacing('sm'),
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: getColor('muted'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.body.size,
    fontWeight: '600',
    color: getColor('textPrimary'),
    marginBottom: 2,
  },
  postTime: {
    fontSize: theme.typography.caption.size,
    color: getColor('textSecondary'),
    opacity: theme.typography.caption.opacity,
  },
  moreButton: {
    padding: getSpacing('xs'),
  },
  postText: {
    fontSize: theme.typography.body.size,
    color: getColor('textPrimary'),
    lineHeight: theme.typography.body.lineHeight,
    marginBottom: getSpacing('md'),
  },
  mediaContainer: {
    marginBottom: getSpacing('md'),
    borderRadius: getRadius('md'),
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: 200,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: getSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: theme.components.card.divider,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getSpacing('xs'),
    paddingHorizontal: getSpacing('sm'),
  },
  actionIcon: {
    marginRight: getSpacing('xs'),
  },
  actionCount: {
    fontSize: theme.typography.caption.size,
    color: getColor('textSecondary'),
    opacity: theme.typography.caption.opacity,
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.components.card.divider,
    marginHorizontal: getSpacing('xs'),
  },
}); 