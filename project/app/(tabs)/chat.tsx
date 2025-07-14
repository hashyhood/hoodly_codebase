import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { 
  Search, 
  Plus, 
  Users, 
  MessageCircle, 
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react-native';
import { HoodlyLayout } from '../../components/ui/HoodlyLayout';
import SocketEvents from '../../components/ui/SocketEvents';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

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
  gradient: string[];
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
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rooms' | 'private'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Dummy data for chat rooms
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    {
      id: '1',
      name: 'Downtown Coffee Lovers',
      type: 'group',
      lastMessage: 'Sarah: Thanks for the restaurant recommendation! 🍕',
      lastMessageTime: '2 min ago',
      unreadCount: 42,
      members: 1247,
      isActive: true,
      emoji: '☕',
      gradient: ['#667eea', '#764ba2'],
    },
    {
      id: '2',
      name: 'Block Party Planning',
      type: 'group',
      lastMessage: 'Mike: Block party planning meeting tomorrow at 7pm!',
      lastMessageTime: '15 min ago',
      unreadCount: 18,
      members: 89,
      isActive: false,
      emoji: '🎉',
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      id: '3',
      name: 'Food Truck Hunters',
      type: 'group',
      lastMessage: 'Lisa: New taco truck on 5th Street is absolutely fire! 🌮',
      lastMessageTime: '1 hour ago',
      unreadCount: 31,
      members: 456,
      isActive: false,
      emoji: '🌮',
      gradient: ['#4facfe', '#00f2fe'],
    },
    {
      id: '4',
      name: 'Local Marketplace',
      type: 'group',
      lastMessage: 'Tom: Selling my bike - excellent condition, great price! 🚲',
      lastMessageTime: '3 hours ago',
      unreadCount: 7,
      members: 234,
      isActive: false,
      emoji: '🛍️',
      gradient: ['#43e97b', '#38f9d7'],
    },
    {
      id: '5',
      name: 'Fitness Buddies',
      type: 'group',
      lastMessage: 'Alex: Anyone up for a morning run tomorrow? 🏃‍♂️',
      lastMessageTime: '5 hours ago',
      unreadCount: 23,
      members: 567,
      isActive: false,
      emoji: '💪',
      gradient: ['#fa709a', '#fee140'],
    },
  ]);

  // Dummy data for private chats
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([
    {
      id: '1',
      userId: 'user1',
      name: 'Sarah Chen',
      avatar: '👩‍💻',
      lastMessage: 'Hey! Want to grab coffee later?',
      lastMessageTime: '5 min ago',
      unreadCount: 2,
      isOnline: true,
      distance: '50m away',
    },
    {
      id: '2',
      userId: 'user2',
      name: 'Mike Rodriguez',
      avatar: '🏃‍♂️',
      lastMessage: 'Great run this morning!',
      lastMessageTime: '1 hour ago',
      unreadCount: 0,
      isOnline: false,
      distance: '2 blocks',
    },
    {
      id: '3',
      userId: 'user3',
      name: 'Emma Wilson',
      avatar: '👩‍🎨',
      lastMessage: 'Check out my new mural!',
      lastMessageTime: '3 hours ago',
      unreadCount: 1,
      isOnline: true,
      distance: '0.5 miles',
    },
  ]);

  const handleRoomPress = (room: ChatRoom) => {
    router.push({
      pathname: '/chat/[roomId]',
      params: {
        roomId: room.id,
        roomName: room.name,
        roomEmoji: room.emoji,
      },
    });
  };

  const handlePrivateChatPress = (chat: PrivateChat) => {
    router.push({
      pathname: '/private-chat/[friendId]',
      params: {
        friendId: chat.userId,
        friendName: chat.name,
      },
    });
  };

  const handleCreateRoom = () => {
    // TODO: Implement create room functionality
    console.log('Create new room');
  };

  const handleFindPeople = () => {
    router.push('/search');
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <BlurView intensity={20} style={[styles.searchBar, { backgroundColor: theme.colors.glass.primary }]}>
        <Search size={20} color={theme.colors.text.tertiary} />
        <Text style={[styles.searchInput, { color: theme.colors.text.primary }]}>
          Search conversations...
        </Text>
      </BlurView>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'rooms' && { backgroundColor: theme.colors.neural.primary }
        ]}
        onPress={() => setActiveTab('rooms')}
      >
        <Users size={20} color={activeTab === 'rooms' ? theme.colors.text.inverse : theme.colors.text.primary} />
        <Text style={[
          styles.tabLabel,
          { color: activeTab === 'rooms' ? theme.colors.text.inverse : theme.colors.text.primary }
        ]}>
          Groups
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'private' && { backgroundColor: theme.colors.neural.primary }
        ]}
        onPress={() => setActiveTab('private')}
      >
        <MessageCircle size={20} color={activeTab === 'private' ? theme.colors.text.inverse : theme.colors.text.primary} />
        <Text style={[
          styles.tabLabel,
          { color: activeTab === 'private' ? theme.colors.text.inverse : theme.colors.text.primary }
        ]}>
          Private
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={[styles.chatRoomCard, { backgroundColor: theme.colors.glass.primary }]}
      onPress={() => handleRoomPress(item)}
      activeOpacity={0.7}
    >
      <BlurView intensity={20} style={styles.roomContent}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomEmoji}>{item.emoji}</Text>
          <View style={styles.roomInfo}>
            <Text style={[styles.roomName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <View style={styles.roomMeta}>
              <Users size={12} color={theme.colors.text.tertiary} />
              <Text style={[styles.memberCount, { color: theme.colors.text.tertiary }]}>
                {item.members} members
              </Text>
              {item.isActive && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>LIVE</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.roomActions}>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.colors.neural.primary }]}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
            <Text style={[styles.lastMessageTime, { color: theme.colors.text.tertiary }]}>
              {item.lastMessageTime}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.lastMessage, { color: theme.colors.text.secondary }]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );

  const renderPrivateChat = ({ item }: { item: PrivateChat }) => (
    <TouchableOpacity
      style={[styles.privateChatCard, { backgroundColor: theme.colors.glass.primary }]}
      onPress={() => handlePrivateChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.privateChatContent}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: item.isOnline ? theme.colors.status.success : theme.colors.status.error }
          ]} />
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <Text style={[styles.chatTime, { color: theme.colors.text.tertiary }]}>
              {item.lastMessageTime}
            </Text>
          </View>
          
          <Text style={[styles.chatDistance, { color: theme.colors.text.tertiary }]}>
            📍 {item.distance}
          </Text>
          
          <Text style={[styles.chatLastMessage, { color: theme.colors.text.secondary }]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: theme.colors.neural.primary }]}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>
        {activeTab === 'rooms' ? '💬' : '👤'}
      </Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {activeTab === 'rooms' ? 'No Group Chats' : 'No Private Chats'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {activeTab === 'rooms' 
          ? 'Join or create a group to start chatting with your neighbors'
          : 'Connect with people nearby to start private conversations'
        }
      </Text>
      <TouchableOpacity
        style={[styles.emptyActionButton, { backgroundColor: theme.colors.neural.primary }]}
        onPress={activeTab === 'rooms' ? handleCreateRoom : handleFindPeople}
      >
        <Text style={styles.emptyActionText}>
          {activeTab === 'rooms' ? 'Create Group' : 'Find People'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <HoodlyLayout
        neighborhoodName="Chat"
        activeNeighbors={47}
        communityHealth={94}
        socialScore={8.4}
        eventsToday={23}
      >
        {renderSearchBar()}
        {renderTabBar()}
        
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

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.neural.primary }]}
          onPress={activeTab === 'rooms' ? handleCreateRoom : handleFindPeople}
          activeOpacity={0.8}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </HoodlyLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  chatRoomCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roomGradient: {
    borderRadius: 16,
  },
  roomContent: {
    padding: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  activeIndicator: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  roomActions: {
    alignItems: 'flex-end',
  },
  lastMessageTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    marginLeft: 36,
  },
  privateChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  privateChatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatTime: {
    fontSize: 12,
  },
  chatDistance: {
    fontSize: 12,
    marginBottom: 4,
  },
  chatLastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyActionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
}); 