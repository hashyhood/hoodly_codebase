import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  user: string;
  userId?: string;
  text: string;
  emoji: string;
  timestamp: string;
  reactions: string[];
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const reactionAnim = new Animated.Value(0);

  const toggleReactions = () => {
    setShowReactions(!showReactions);
    Animated.spring(reactionAnim, {
      toValue: showReactions ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isOwnMessage = user && (message.userId === user.id || message.user === user.user_metadata?.name || user.email?.split('@')[0]);

  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessage]}>
      <TouchableOpacity onPress={toggleReactions} style={styles.bubble}>
        <BlurView 
          intensity={60} 
          style={[
            styles.bubbleContent,
            isOwnMessage ? styles.ownBubbleContent : styles.otherBubbleContent
          ]}
        >
          {!isOwnMessage && (
            <View style={styles.userInfo}>
              <Text style={styles.username}>{message.user}</Text>
              <Text style={styles.emoji}>{message.emoji}</Text>
            </View>
          )}
          <Text style={styles.messageText}>{message.text}</Text>
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
        </BlurView>
      </TouchableOpacity>

      {message.reactions.length > 0 && (
        <View style={[styles.reactions, isOwnMessage && styles.ownReactions]}>
          {message.reactions.map((reaction, index) => (
            <Text key={index} style={styles.reaction}>{reaction}</Text>
          ))}
        </View>
      )}

      {showReactions && (
        <Animated.View 
          style={[
            styles.reactionPicker,
            { 
              transform: [{ scale: reactionAnim }],
              opacity: reactionAnim,
            }
          ]}
        >
          {['❤️', '😂', '😭', '🔥', '🧠', '😎'].map((emoji, index) => (
            <TouchableOpacity key={index} style={styles.reactionButton}>
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
  },
  bubbleContent: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  otherBubbleContent: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ownBubbleContent: {
    backgroundColor: 'rgba(255, 107, 157, 0.3)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
    marginRight: 8,
  },
  emoji: {
    fontSize: 16,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: '#FFFFFF60',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  reactions: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 16,
  },
  ownReactions: {
    marginLeft: 0,
    marginRight: 16,
  },
  reaction: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 25,
    padding: 8,
    marginTop: 8,
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  reactionButton: {
    padding: 8,
  },
  reactionEmoji: {
    fontSize: 20,
  },
});