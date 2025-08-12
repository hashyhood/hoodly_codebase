import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getColor, getSpacing, getRadius, theme } from '../../lib/theme';
import { privateMessagesApi, userApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import type { User as DBUser, PrivateMessage as DBPrivateMessage } from '../../types';
import { format } from 'date-fns';
import { CONFIG } from '../../lib/config';

type Profile = Database['public']['Tables']['profiles']['Row'];
type User = DBUser & { last_seen?: string };
type PrivateMessage = DBPrivateMessage & { is_read?: boolean };

const { width } = Dimensions.get('window');

export default function PrivateChatScreen() {
  const { user } = useAuth();
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load friend details and messages from Supabase
  useEffect(() => {
    const loadChatData = async () => {
      try {
        setIsLoading(true);
        
        // Load friend details from profiles table
        const friendResponse = await userApi.getUserById(friendId as string);
        if (friendResponse.success && friendResponse.data) {
          setFriend(friendResponse.data as User);
        }

        // Load messages between current user and friend
        const messagesResponse = await privateMessagesApi.getPrivateMessages(friendId as string);
        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data as PrivateMessage[]);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
        Alert.alert('Error', 'Failed to load chat data.');
      } finally {
        setIsLoading(false);
      }
    };

    if (friendId && user) {
      loadChatData();
      
      // Subscribe to real-time updates for private messages
      const subscription = supabase
        .channel(`private_messages:${user.id}:${friendId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dm_messages',
            filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id}))`,
          },
          (payload) => {
            const newMessage = payload.new as PrivateMessage;
            if (newMessage.sender_id === friendId || newMessage.receiver_id === friendId) {
              setMessages(prev => [...prev, newMessage]);
              // Auto-scroll to bottom for new messages
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, CONFIG.TIMEOUTS.AUTO_SCROLL_DELAY);
            }
          }
        )
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'dm_messages',
          filter: `id=eq.${friendId}`,
        }, (payload) => {
          const updatedMessage = payload.new as PrivateMessage;
          setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
        })
        .subscribe();

      subscriptionRef.current = subscription;

      // Add error handling for subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.on('error', (error: any) => {
          console.error('Private chat subscription error:', error);
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (friendId && user) {
              loadChatData();
            }
          }, CONFIG.TIMEOUTS.RECONNECTION_DELAY);
        });
      }

      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
      };
    }
  }, [friendId, user]);

  // Typing indicator (simplified for now)
  const handleTyping = () => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, CONFIG.TIMEOUTS.TYPING_INDICATOR) as any;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !friendId || !user || isSending) return;
    
    try {
      setIsSending(true);
      const messageContent = newMessage.trim();
      setNewMessage('');
      
      await privateMessagesApi.sendPrivateMessage(friendId, messageContent);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, CONFIG.TIMEOUTS.AUTO_SCROLL_DELAY);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
      setNewMessage(newMessage.trim()); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
    setShowScrollToBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleLongPress = (message: PrivateMessage) => {
    Alert.alert(
      'Message Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy Text', onPress: () => {
          Alert.alert('Copied!', 'Message text copied to clipboard.');
        }},
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => Alert.alert('Report', 'Message reported.')
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: PrivateMessage }) => {
    const isMyMessage = item.sender_id === user?.id;
    const messageTime = format(new Date(item.created_at), 'HH:mm');

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
        ]}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage 
            ? { backgroundColor: getColor('success') }
            : { backgroundColor: getColor('surface'), borderColor: getColor('divider') }
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage 
              ? { color: getColor('textPrimary') }
              : { color: getColor('textPrimary') }
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage 
                ? { color: getColor('textPrimary') }
                : { color: getColor('textTertiary') }
            ]}>
              {messageTime}
            </Text>
            {isMyMessage && (
              <Text style={[styles.readStatus, { color: getColor('textPrimary') }]}>
                {item.is_read ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTypingIndicator = () => {
    if (!friendIsTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.theirMessageContainer]}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View style={[styles.typingBubble, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
          <Text style={[styles.typingText, { color: getColor('textTertiary') }]}>
            Friend is typing...
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: getColor('bg') }]}> 
        <BlurView intensity={30} style={[styles.backgroundGradient, { opacity: 0.1 }]} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={getColor('textPrimary')} />
            <Text style={[styles.loadingText, { color: getColor('textSecondary') }]}> 
              Loading messages...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!friend) {
    return (
      <View style={[styles.container, { backgroundColor: getColor('bg') }]}> 
        <BlurView intensity={30} style={[styles.backgroundGradient, { opacity: 0.1 }]} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: getColor('textPrimary') }]}> 
              Friend not found
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: getColor('surface') }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: getColor('textPrimary') }]}> 
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: getColor('bg') }]}> 
      <BlurView intensity={30} style={[styles.backgroundGradient, { opacity: 0.1 }]} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={30} style={[styles.header, { borderBottomColor: getColor('divider') }]}> 
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: getColor('surface') }]}>
            <Ionicons name="arrow-back" size={24} color={getColor('textPrimary')} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={[styles.friendAvatar, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
              <Ionicons name="person" size={24} color={getColor('textSecondary')} />
            </View>
            <View style={styles.friendDetails}>
              <Text style={[styles.friendName, { color: getColor('textPrimary') }]}> 
                {friend?.full_name || 'Unknown User'}
              </Text>
              <View style={styles.connectionStatus}>
                <View style={[styles.statusIndicator, { backgroundColor: getColor('textTertiary') }]} />
                <Text style={[styles.friendStatus, { color: getColor('textSecondary') }]}>
                  Offline
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={[styles.moreButton, { backgroundColor: getColor('surface') }]}> 
            <Ionicons name="ellipsis-vertical" size={24} color={getColor('textPrimary')} />
          </TouchableOpacity>
        </BlurView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          {/* Messages */}
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: getColor('textSecondary') }]}>No messages yet. Start the conversation!</Text>
              </View>
            }
          />

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <Text style={[styles.typingText, { color: getColor('textSecondary') }]}> 
                {friend?.full_name || 'Unknown User'} is typing...
              </Text>
            </View>
          )}

          {/* Message Input */}
          <BlurView intensity={30} style={[styles.inputContainer, { borderTopColor: getColor('divider') }]}> 
            <View style={[styles.inputWrapper, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}> 
              <TouchableOpacity style={styles.voiceButton}>
                <Ionicons name="mic" size={20} color={getColor('textSecondary')} />
              </TouchableOpacity>
              
              <TextInput
                style={[styles.textInput, { color: getColor('textPrimary') }]}
                placeholder="Type a message..."
                placeholderTextColor={getColor('textTertiary')}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
                editable={!isSending}
                onSubmitEditing={sendMessage}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  newMessage.trim() && !isSending ? { backgroundColor: getColor('success') } : { backgroundColor: getColor('surface') }
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={getColor('textPrimary')} />
                ) : (
                  <LinearGradient
                    colors={newMessage.trim() && !isSending ? theme.gradients.primary : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                    style={styles.sendButtonGradient}
                  >
                    <Ionicons 
                      name="send" 
                      size={20} 
                      color={newMessage.trim() && !isSending ? "#fff" : getColor('textTertiary')} 
                    />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
  },
  friendStatus: {
    fontSize: 12,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    marginRight: 4,
  },
  readStatus: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 0,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 18,
  },
  typingBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
}); 