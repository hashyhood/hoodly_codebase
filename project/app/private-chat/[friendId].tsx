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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Mic, MoreVertical, User, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { privateMessagesApi, userApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import websocketManager from '../../lib/websocket';
import type { Database } from '../../lib/supabase';
import type { User as DBUser, PrivateMessage as DBPrivateMessage } from '../../types';
import { format } from 'date-fns';

type Profile = Database['public']['Tables']['profiles']['Row'];
type User = DBUser & { last_seen?: string };
type PrivateMessage = DBPrivateMessage & { is_read?: boolean };

const { width } = Dimensions.get('window');

export default function PrivateChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const socket = websocketManager;
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
      const subscription = privateMessagesApi.subscribeToPrivateMessages(user.id, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as PrivateMessage;
          if (newMessage.sender_id === friendId || newMessage.receiver_id === friendId) {
            setMessages(prev => [...prev, newMessage]);
            // Auto-scroll to bottom for new messages
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new as PrivateMessage;
          setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
        }
      });

      subscriptionRef.current = subscription;

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
    }, 1000) as any;
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
      }, 100);
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
            ? { backgroundColor: theme.colors.neural.primary }
            : { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage 
              ? { color: theme.colors.text.inverse }
              : { color: theme.colors.text.primary }
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage 
                ? { color: theme.colors.text.inverse }
                : { color: theme.colors.text.tertiary }
            ]}>
              {messageTime}
            </Text>
            {isMyMessage && (
              <Text style={[styles.readStatus, { color: theme.colors.text.inverse }]}>
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
        <View style={[styles.typingBubble, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}>
          <Text style={[styles.typingText, { color: theme.colors.text.tertiary }]}>
            Friend is typing...
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
        <LinearGradient
          colors={theme.colors.gradients.neural as [string, string]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.text.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
              Loading chat...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!friend) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
        <LinearGradient
          colors={theme.colors.gradients.neural as [string, string]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
              Friend not found
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.glass.primary }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
      <LinearGradient
        colors={theme.colors.gradients.neural as [string, string]}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={30} style={[styles.header, { borderBottomColor: theme.colors.glass.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.glass.secondary }]}>
            <ArrowLeft color={theme.colors.text.primary} size={24} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.friendAvatar}>{friend.avatar_url || '👤'}</Text>
            <View style={styles.friendDetails}>
              <Text style={[styles.friendName, { color: theme.colors.text.primary }]}>
                {friend.full_name}
              </Text>
              <Text style={[styles.friendStatus, { color: theme.colors.text.secondary }]}>
                {friend.last_seen ? '🟢 Online' : '⚪ Offline'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={[styles.moreButton, { backgroundColor: theme.colors.glass.secondary }]}>
            <MoreVertical color={theme.colors.text.primary} size={24} />
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
                <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>Start a conversation with {friend?.full_name}!</Text>
              </View>
            }
          />

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <Text style={[styles.typingText, { color: theme.colors.text.secondary }]}>
                {friend.full_name} is typing...
              </Text>
            </View>
          )}

          {/* Message Input */}
          <BlurView intensity={30} style={[styles.inputContainer, { borderTopColor: theme.colors.glass.border }]}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}>
              <TouchableOpacity style={styles.voiceButton}>
                <Mic color={theme.colors.text.secondary} size={20} />
              </TouchableOpacity>
              
              <TextInput
                style={[styles.textInput, { color: theme.colors.text.primary }]}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
                editable={!isSending}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  newMessage.trim() && !isSending ? { backgroundColor: theme.colors.neural.primary } : { backgroundColor: theme.colors.glass.secondary }
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                ) : (
                  <Send color={newMessage.trim() && !isSending ? theme.colors.text.inverse : theme.colors.text.secondary} size={20} />
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
    fontSize: 32,
    marginRight: 12,
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
}); 