import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  HeaderScreen, 
  SearchBar, 
  SegmentedChips, 
  Card, 
  EmptyState,
  Spinner,
  SkeletonCard,
  GradientFAB
} from '../../components/ui';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';
import { useAuth } from '../../contexts/AuthContext';
import { roomsApi } from '../../lib/api';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { logger } from '../../lib/logger';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'private';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  members: number;
  isActive: boolean;
  emoji: string;
}

interface PrivateChat {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  distance: string;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { hasPermission, requestPermission, getCurrentLocation } = useLocationPermission();
  const [activeTab, setActiveTab] = useState<'rooms' | 'private'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Private chats - will be loaded from Supabase
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([]);

  // Chat rooms - will be loaded from Supabase

  useEffect(() => {
    // Load chat rooms from Supabase
    loadRooms();
    // Get user's current location for distance calculations
    if (hasPermission) {
      getCurrentLocation().then(location => {
        if (location) {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      });
    }
  }, [hasPermission]);

  const handleRoomPress = (room: ChatRoom) => {
    router.push(`/chat/${room.id}`);
  };

  const handlePrivateChatPress = (chat: PrivateChat) => {
    router.push(`/chat/private/${chat.id}`);
  };

  const handleCreateRoom = () => {
    router.push('/chat/create');
  };

  const handleFindPeople = () => {
    router.push('/search');
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Reset to show all conversations
      if (activeTab === 'rooms') {
        await loadRooms();
      } else {
        await loadPrivateChats();
      }
      return;
    }
    
    try {
      if (activeTab === 'rooms') {
        // Search in rooms
        const filteredRooms = chatRooms.filter(room => 
          room.name.toLowerCase().includes(query.toLowerCase()) ||
          room.lastMessage.toLowerCase().includes(query.toLowerCase())
        );
        setChatRooms(filteredRooms);
      } else {
        // Search in private chats
        const filteredPrivateChats = privateChats.filter(chat => 
          chat.name.toLowerCase().includes(query.toLowerCase()) ||
          chat.lastMessage.toLowerCase().includes(query.toLowerCase())
        );
        setPrivateChats(filteredPrivateChats);
      }
    } catch (error) {
      logger.error('Error searching conversations:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'rooms' | 'private');
  };

  const tabOptions = [
    { key: 'rooms', label: 'Groups', icon: 'people' as const },
    { key: 'private', label: 'Direct', icon: 'chatbubble' as const },
  ];

  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <Card key={item.id} variant="default" onPress={() => handleRoomPress(item)}>
              <View style={styles.roomHeader}>
          <View style={styles.roomEmojiContainer}>
            <Text style={styles.roomEmoji}>{item.emoji}</Text>
          </View>
          
          <View style={styles.roomInfo}>
            <View style={styles.roomNameRow}>
              <Text style={styles.roomName}>{item.name}</Text>
              <View style={styles.roomStatus}>
                {item.isActive && (
                  <Ionicons name="wifi" size={12} color={getColor('success')} />
                )}
                <Ionicons name="shield-checkmark" size={12} color={getColor('textSecondary')} />
              </View>
            </View>
            
            <Text style={styles.roomMembers}>{item.members} members</Text>
          </View>
        
        <View style={styles.roomActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={16} color={getColor('textSecondary')} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="videocam" size={16} color={getColor('textSecondary')} />
          </TouchableOpacity>
        </View>
      </View>
      
              <View style={styles.roomFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        
                  <View style={styles.roomFooterRight}>
            <Text style={styles.lastMessageTime}>
              {item.lastMessageTime}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
      </View>
    </Card>
  );

  const renderPrivateChat = ({ item }: { item: PrivateChat }) => (
    <Card key={item.id} variant="default" onPress={() => handlePrivateChatPress(item)}>
      <View style={styles.chatAvatarContainer}>
        <Text style={styles.chatAvatar}>{item.avatar}</Text>
        <View style={[
          styles.onlineIndicator,
          { backgroundColor: item.isOnline ? getColor('success') : getColor('textTertiary') }
        ]} />
      </View>
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <View style={styles.chatActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call" size={16} color={getColor('textSecondary')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="videocam" size={16} color={getColor('textSecondary')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="ellipsis-horizontal" size={16} color={getColor('textSecondary')} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.chatMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        
        <View style={styles.chatFooter}>
          <View style={styles.chatFooterLeft}>
            <Ionicons name="location" size={12} color={getColor('textTertiary')} />
            <Text style={styles.chatDistance}>{item.distance}</Text>
          </View>
          
          <View style={styles.chatFooterRight}>
            <Ionicons name="time" size={12} color={getColor('textTertiary')} />
            <Text style={styles.chatTime}>{item.lastMessageTime}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <EmptyState
      emoji={activeTab === 'rooms' ? '👥' : '💬'}
      title={activeTab === 'rooms' ? 'No group chats yet' : 'No direct messages yet'}
      subtitle={
        activeTab === 'rooms' 
          ? 'Join or create a group to start chatting with your neighbors'
          : 'Start a conversation with someone in your neighborhood'
      }
      cta={{
        text: activeTab === 'rooms' ? 'Create Group' : 'Find People',
        onPress: activeTab === 'rooms' ? handleCreateRoom : handleFindPeople
      }}
    />
  );

  const loadRooms = async () => {
    if (!user) return;
    
    try {
      setLoadingRooms(true);
      const { data, error } = await roomsApi.getUserRooms();
      
      if (error) {
        logger.warn('Error loading rooms:', error);
        // Implement proper error handling with fallback data
        setChatRooms([]);
        return;
      }
      
      if (data) {
        // Convert Room[] to ChatRoom[] format
        const convertedRooms: ChatRoom[] = data.map(room => ({
          id: room.id,
          name: room.name,
          type: 'group',
          lastMessage: room.last_message || 'No messages yet',
          lastMessageTime: room.updated_at || room.created_at,
          unreadCount: 0, // Will be updated by loadUnreadCounts
          members: room.member_count || 1,
          isActive: true,
          emoji: '💬',
        }));
        setChatRooms(convertedRooms);
      }
    } catch (error) {
      logger.error('Error loading rooms:', error);
      // Set empty array as fallback
      setChatRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadPrivateChats = async () => {
    if (!user) return;
    
    try {
      // Load private conversations from messages table
      const { data: conversations, error: conversationsError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          receiver_id,
          content,
          created_at,
          profiles!messages_sender_id_fkey(
            id,
            personalName,
            username,
            avatar,
            latitude,
            longitude,
            is_online
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (conversationsError) {
        logger.warn('Error loading private conversations:', conversationsError);
        return;
      }
      
      // Group messages by conversation and get the latest message for each
      const conversationMap = new Map<string, any>();
      
      conversations?.forEach(message => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const conversationKey = otherUserId;
        
        if (!conversationMap.has(conversationKey) || 
            new Date(message.created_at) > new Date(conversationMap.get(conversationKey).created_at)) {
          conversationMap.set(conversationKey, {
            ...message,
            otherUserId,
            profile: message.profiles
          });
        }
      });
      
      // Convert to PrivateChat format
      const privateChatsData: PrivateChat[] = Array.from(conversationMap.values()).map(conv => {
        // Calculate distance if user has location data
        let distance = 'Nearby';
        if (userLocation && conv.profile?.latitude && conv.profile?.longitude) {
          const distanceInKm = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            conv.profile.latitude,
            conv.profile.longitude
          );
          if (distanceInKm < 1) {
            distance = 'Very Close';
          } else if (distanceInKm < 5) {
            distance = 'Nearby';
          } else if (distanceInKm < 10) {
            distance = 'Close';
          } else {
            distance = `${Math.round(distanceInKm)}km away`;
          }
        }
        
        return {
          id: conv.conversation_id || conv.otherUserId,
          userId: conv.otherUserId,
          name: conv.profile?.personalName || conv.profile?.username || 'Unknown User',
          avatar: conv.profile?.avatar || '',
          lastMessage: conv.content || 'No messages yet',
          lastMessageTime: conv.created_at,
          unreadCount: 0, // Will be updated by loadUnreadCounts
          isOnline: conv.profile?.is_online || false, // Get online status from profile
          distance,
        };
      });
      
      setPrivateChats(privateChatsData);
    } catch (error) {
      logger.error('Error loading private chats:', error);
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadUnreadCounts = async () => {
    if (!user) return;
    
    try {
      // Get unread message counts for rooms
      const { data: roomMessages, error: roomError } = await supabase
        .from('messages')
        .select('room_id, receiver_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .not('room_id', 'is', null);
      
      if (roomError) {
        logger.warn('Error loading room unread counts:', roomError);
      } else if (roomMessages) {
        // Count unread messages per room
        const roomUnreadCounts = new Map<string, number>();
        roomMessages.forEach(message => {
          const count = roomUnreadCounts.get(message.room_id) || 0;
          roomUnreadCounts.set(message.room_id, count + 1);
        });
        
        // Update chat rooms with unread counts
        setChatRooms(prev => prev.map(room => ({
          ...room,
          unreadCount: roomUnreadCounts.get(room.id) || 0
        })));
      }
      
      // Get unread message counts for private chats
      const { data: privateMessages, error: privateError } = await supabase
        .from('dm_messages')
        .select('sender_id, receiver_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      if (privateError) {
        logger.warn('Error loading private unread counts:', privateError);
      } else if (privateMessages) {
        // Count unread messages per sender
        const privateUnreadCounts = new Map<string, number>();
        privateMessages.forEach(message => {
          const count = privateUnreadCounts.get(message.sender_id) || 0;
          privateUnreadCounts.set(message.sender_id, count + 1);
        });
        
        // Update private chats with unread counts
        setPrivateChats(prev => prev.map(chat => ({
          ...chat,
          unreadCount: privateUnreadCounts.get(chat.userId) || 0
        })));
      }
    } catch (error) {
      logger.error('Error loading unread counts:', error);
    }
  };

  useEffect(() => {
    loadRooms();
    loadPrivateChats();
  }, [user]);

  useEffect(() => {
    // Load unread counts after conversations are loaded
    if (chatRooms.length > 0 || privateChats.length > 0) {
      loadUnreadCounts();
    }
  }, [chatRooms.length, privateChats.length]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <HeaderScreen title="Messages" subtitle="Connect with your neighbors" />
        <View style={styles.loadingContainer}>
          <Spinner text="Loading conversations..." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <HeaderScreen 
        title="Messages" 
        subtitle="Connect with your neighbors"
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleCreateRoom}
            >
              <Ionicons name="add" size={20} color={getColor('textPrimary')} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <SearchBar
        placeholder="Search conversations..."
        value={searchQuery}
        onChangeText={handleSearch}
        withMic={false}
      />

      {/* Tab Bar */}
      <SegmentedChips
        items={tabOptions}
        value={activeTab}
        onChange={handleTabChange}
      />

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'rooms' ? (
          <FlatList
            data={chatRooms}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
          />
        ) : (
          <FlatList
            data={privateChats}
            renderItem={renderPrivateChat}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <GradientFAB
        onPress={activeTab === 'rooms' ? handleCreateRoom : handleFindPeople}
        icon={activeTab === 'rooms' ? 'add' : 'search'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: getColor('bg'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: getColor('surface'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: getSpacing('lg'),
  },
  listContainer: {
    paddingBottom: 120, // Account for tab bar and FAB
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  roomEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: getColor('surface'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing('md'),
  },
  roomEmoji: {
    fontSize: 24,
  },
  roomInfo: {
    flex: 1,
  },
  roomNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: getColor('textPrimary'),
    marginRight: getSpacing('sm'),
  },
  roomStatus: {
    flexDirection: 'row',
    gap: getSpacing('xs'),
  },
  roomMembers: {
    fontSize: 14,
    fontWeight: '500',
    color: getColor('textSecondary'),
  },
  roomActions: {
    flexDirection: 'row',
    gap: getSpacing('sm'),
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: getColor('surface'),
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: getColor('textSecondary'),
    marginRight: getSpacing('md'),
  },
  roomFooterRight: {
    alignItems: 'flex-end',
    gap: getSpacing('sm'),
  },
  lastMessageTime: {
    fontSize: 12,
    fontWeight: '500',
    color: getColor('textTertiary'),
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: getColor('error'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getSpacing('xs'),
  },
  unreadBadgeText: {
    color: getColor('textPrimary'),
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatAvatarContainer: {
    position: 'relative',
    marginRight: getSpacing('md'),
  },
  chatAvatar: {
    fontSize: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: getColor('bg'),
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: getColor('textPrimary'),
  },
  chatActions: {
    flexDirection: 'row',
    gap: getSpacing('xs'),
  },
  chatMessage: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginBottom: getSpacing('sm'),
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('xs'),
  },
  chatDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: getColor('textTertiary'),
  },
  chatFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  chatTime: {
    fontSize: 12,
    fontWeight: '500',
    color: getColor('textTertiary'),
  },
}); 