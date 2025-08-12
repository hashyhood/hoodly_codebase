import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { messagesAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { getColor, getSpacing, getRadius, theme } from '../../lib/theme';
import type { Database } from '../../lib/supabase';

type Message = Database['public']['Tables']['messages']['Row'] & {
  user_id?: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
};

export default function ChatScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const { roomId, roomName, roomEmoji } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<any>(null);

  // Load messages from Supabase
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await messagesAPI.getMessages(roomId as string);
      if (response.success && response.data) {
        setMessages(response.data as Message[]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    loadMessages();
    const subscription = messagesAPI.subscribeToMessages(roomId as string, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setMessages(prev => [...prev, payload.new as Message]);
      } else if (payload.eventType === 'DELETE') {
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      } else if (payload.eventType === 'UPDATE') {
        setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new as Message : msg));
      }
    });
    subscriptionRef.current = subscription;
    
    // Add error handling for subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.subscribe((status: any) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Chat subscription error');
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (roomId) {
              loadMessages();
            }
          }, 5000);
        }
      });
    }
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [roomId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Show/hide scroll-to-bottom FAB
  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
    setShowScrollToBottom(!isAtBottom && messages.length > 5);
  };

  const sendMessage = async () => {
    if (!message.trim() || !user || isSending) return;
    
    const messageContent = message.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Add message to local state immediately for optimistic UI
    const tempMessage: Message = {
      id: tempId,
      room_id: roomId as string,
      user_id: user.id,
      content: messageContent,
      message_type: 'text',
      file_url: null,
      location_data: null,
      is_edited: false,
      edited_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        full_name: user.email || 'You',
        avatar_url: null
      }
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setMessage('');
    
    try {
      setIsSending(true);
      await messagesAPI.sendMessage(roomId as string, messageContent);
      
      // Remove temp message and let real-time update handle the real message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setMessage(messageContent); // Restore message content
    } finally {
      setIsSending(false);
    }
  };

  // Helper to determine if the message is from the current user
  const isMyMessage = (message: Message) => message.user_id === user?.id;

  // Render a single message bubble
  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = isMyMessage(item);
    return (
      <View style={[
        styles.messageRow,
        isMine ? styles.messageRowRight : styles.messageRowLeft
      ]}>
        {!isMine && (
          <Text style={[styles.username, { color: getColor('textSecondary') }]}> {item.profiles?.full_name || 'Unknown User'} </Text>
        )}
        <View style={[
          styles.messageBubble,
          isMine ? styles.bubbleMine : styles.bubbleOther,
          isMine
            ? { backgroundColor: getColor('success'), alignSelf: 'flex-end' }
            : { backgroundColor: getColor('surface'), alignSelf: 'flex-start' },
        ]}>
          <Text style={[
            styles.messageText,
            isMine ? { color: getColor('textPrimary') } : { color: getColor('textPrimary') },
            { flexWrap: 'wrap', maxWidth: '80%' }
          ]}>{item.content}</Text>
          <Text style={styles.timeText}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.container, { backgroundColor: getColor('bg') }]}> 
          <BlurView intensity={30} style={[styles.backgroundGradient, { opacity: 0.1 }]} />
          {/* Header */}
          <BlurView intensity={30} style={[styles.header, { borderBottomColor: getColor('divider') }]}> 
            <SafeAreaView>
              <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: getColor('surface') }]}> 
                  <Ionicons name="arrow-back" size={24} color={getColor('textPrimary')} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                  <View style={[styles.roomEmojiContainer, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}> 
                    <Text style={styles.roomEmoji}>{roomEmoji || '💬'}</Text>
                  </View>
                  <View style={styles.roomDetails}>
                    <Text style={[styles.roomName, { color: getColor('textPrimary') }]}>{roomName || 'Chat Room'}</Text>
                    <View style={styles.connectionStatus}>
                      <Ionicons name="people" size={12} color={getColor('textTertiary')} />
                      <Text style={[styles.memberCount, { color: getColor('textTertiary') }]}> {messages.length > 0 ? Math.floor(Math.random() * 50) + 10 : 0} members </Text>
                    </View>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </BlurView>
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            style={styles.messages}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentInsetAdjustmentBehavior="automatic"
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyIcon, { fontSize: 48 }]}>⚙️</Text>
                 <Text style={[styles.emptyTitle, { color: getColor('textPrimary') }]}>Loading messages...</Text>
                 <Text style={[styles.emptyText, { color: getColor('textSecondary') }]}>Please wait while we fetch the conversation.</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyIcon, { fontSize: 48 }]}>💬</Text>
                  <Text style={[styles.emptyTitle, { color: getColor('textPrimary') }]}>No messages yet. Be the first to vibe!</Text>
                  <Text style={[styles.emptyText, { color: getColor('textSecondary') }]}>Start the conversation below.</Text>
                </View>
              )
            }
          />
          {/* Scroll-to-bottom FAB */}
          {showScrollToBottom && (
            <TouchableOpacity
              style={styles.scrollToBottomFab}
              onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
            >
                <Ionicons name="arrow-down-circle" size={36} color={getColor('success')} />
            </TouchableOpacity>
          )}
          {/* Input */}
          <View style={[styles.inputContainer, { borderTopColor: getColor('divider') }]}> 
            <TextInput
              style={[styles.input, { color: getColor('textPrimary'), backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}
              placeholder="Type a message..."
              placeholderTextColor={getColor('textTertiary')}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
              editable={!isSending}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={!message.trim() || isSending}
            >
              <LinearGradient
                colors={user && !isSending ? theme.gradients.primary : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.sendButtonGradient}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={user && !isSending ? "#fff" : getColor('textTertiary')} 
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
  },
  roomEmoji: {
    fontSize: 24,
  },
  roomDetails: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 12,
  },
  connectionWarning: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  connectionText: {
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  messageTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  // Add/adjust styles for Instagram-like chat bubbles
  messageRow: {
    flexDirection: 'column',
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubbleMine: {
    borderRadius: 20,
    borderTopRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginLeft: 40,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  bubbleOther: {
    borderRadius: 20,
    borderTopLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 40,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollToBottomFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});