import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getApiUrl } from '../../lib/config';

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  userId: string;
  user: {
    id: string;
    personalName: string;
    username: string;
    avatar: string;
    location: string;
    distance: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  proximity: 'neighborhood' | 'city' | 'state';
  tags: string[];
  isAIBot: boolean;
  userLiked?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: string, liked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onUserPress?: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onUserPress,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [isLiked, setIsLiked] = useState(post.userLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [heartScale] = useState(new Animated.Value(1));

  const handleLike = async () => {
    if (!user) return;

    // Optimistic update
    const newLiked = !isLiked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newLiked);
    setLikeCount(newCount);

    // Animate heart
    if (newLiked) {
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }

    try {
      const response = await fetch(`${getApiUrl()}/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // Revert optimistic update on error
        setIsLiked(!newLiked);
        setLikeCount(likeCount);
        console.error('Failed to toggle like:', data.error);
      } else {
        // Update with actual server response
        setLikeCount(data.likeCount);
        setIsLiked(data.liked);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!newLiked);
      setLikeCount(likeCount);
      console.error('Error toggling like:', error);
    }

    // Call parent callback
    onLike?.(post.id, newLiked);
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.glass.primary,
      borderColor: theme.colors.glass.border,
    }]}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={() => onUserPress?.(post.user.id)}
        >
          <Text style={styles.avatar}>{post.user.avatar}</Text>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
              {post.user.personalName}
            </Text>
            <View style={styles.userMeta}>
              <Text style={[styles.userLocation, { color: theme.colors.text.tertiary }]}>
                {post.user.location}
              </Text>
              <Text style={[styles.userDistance, { color: theme.colors.text.tertiary }]}>
                {post.user.distance}
              </Text>
              {post.isAIBot && (
                <View style={[styles.aiBadge, { backgroundColor: theme.colors.neural.primary }]}>
                  <Text style={[styles.aiBadgeText, { color: theme.colors.text.inverse }]}>AI</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <Text style={[styles.proximityBadge, { 
            backgroundColor: theme.colors.glass.secondary,
            color: theme.colors.text.secondary 
          }]}>
            {post.proximity}
          </Text>
          <TouchableOpacity style={styles.moreButton}>
            <MoreHorizontal size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Content */}
      <View style={styles.content}>
        <Text style={[styles.postText, { color: theme.colors.text.primary }]}>
          {post.content}
        </Text>
        
        {post.image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: post.image }} style={styles.postImage} />
          </View>
        )}
        
        {post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { 
                backgroundColor: theme.colors.glass.secondary 
              }]}>
                <Text style={[styles.tagText, { color: theme.colors.text.secondary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Post Actions */}
      <View style={styles.actions}>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart 
                size={20} 
                color={isLiked ? theme.colors.status.error : theme.colors.text.tertiary}
                fill={isLiked ? theme.colors.status.error : 'none'}
              />
            </Animated.View>
            <Text style={[
              styles.actionText, 
              { 
                color: isLiked ? theme.colors.status.error : theme.colors.text.tertiary,
                fontWeight: isLiked ? '600' : '500'
              }
            ]}>
              {likeCount}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onComment?.(post.id)}
            activeOpacity={0.7}
          >
            <MessageCircle size={20} color={theme.colors.text.tertiary} />
            <Text style={[styles.actionText, { color: theme.colors.text.tertiary }]}>
              {post.comments}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onShare?.(post.id)}
            activeOpacity={0.7}
          >
            <Share size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.timestamp, { color: theme.colors.text.tertiary }]}>
          {formatTime(post.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    fontSize: 32,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userLocation: {
    fontSize: 12,
    fontWeight: '500',
  },
  userDistance: {
    fontSize: 12,
    fontWeight: '500',
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proximityBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 