import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface FeedPost {
  user: string;
  emoji: string;
  text: string;
  image?: string | null;
  timestamp: string;
  reactions: { [key: string]: number };
}

interface FeedCardProps {
  post: FeedPost;
}

export function FeedCard({ post }: FeedCardProps) {
  const [liked, setLiked] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getMoodGradient = (emoji: string) => {
    switch (emoji) {
      case '💔':
        return ['rgba(74, 144, 226, 0.3)', 'rgba(123, 104, 238, 0.3)'];
      case '🔥':
        return ['rgba(255, 107, 157, 0.3)', 'rgba(255, 142, 83, 0.3)'];
      case '🧠':
        return ['rgba(168, 230, 207, 0.3)', 'rgba(136, 216, 192, 0.3)'];
      default:
        return ['rgba(102, 126, 234, 0.3)', 'rgba(118, 75, 162, 0.3)'];
    }
  };

  const totalReactions = Object.values(post.reactions).reduce((sum, count) => sum + count, 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getMoodGradient(post.emoji) as [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={20} style={styles.content}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text style={styles.emoji}>{post.emoji}</Text>
              <View>
                <Text style={styles.username}>{post.user}</Text>
                <Text style={styles.timestamp}>{formatTime(post.timestamp)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.postText}>{post.text}</Text>

          {post.image && (
            <Image source={{ uri: post.image }} style={styles.postImage} />
          )}

          <View style={styles.reactions}>
            {Object.entries(post.reactions).map(([emoji, count]) => (
              <View key={emoji} style={styles.reactionItem}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setLiked(!liked)}
            >
              <Heart 
                size={20} 
                color={liked ? '#FF6B9D' : '#FFFFFF80'} 
                fill={liked ? '#FF6B9D' : 'transparent'}
              />
              <Text style={styles.actionText}>{totalReactions}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={20} color="#FFFFFF80" />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={20} color="#FFFFFF80" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 20,
  },
  content: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    color: '#FFFFFF60',
    marginTop: 2,
  },
  postText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  reactions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginLeft: 8,
    fontWeight: '600',
  },
});