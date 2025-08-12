import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getColor, getSpacing, getRadius, theme } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getApiUrl } from '../lib/config';
import { friendsApi } from '../lib/api';

interface Friend {
  id: string;
  personalName: string;
  username: string;
  bio: string;
  location: string;
  interests: string[];
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
  followStatus: 'none' | 'requested' | 'following';
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingUnfriend, setProcessingUnfriend] = useState<string | null>(null);
  const [processingFollow, setProcessingFollow] = useState<string | null>(null);

  const loadFriends = async () => {
    try {
      const result = await friendsApi.getFriends();
      
      if (result.success && result.data) {
        // Add follow status to each friend
        const friendsWithStatus = result.data.map((friend: any) => ({
          id: friend.id,
          personalName: friend.full_name || friend.personalName || 'Unknown',
          username: friend.username || 'unknown',
          bio: friend.bio || '',
          location: friend.location || friend.neighborhood || '',
          interests: friend.interests || [],
          avatar: friend.avatar_url || friend.avatar || '👤',
          isOnline: friend.is_online || false,
          lastSeen: friend.last_seen || friend.last_active || '',
          followStatus: 'following' as const // They're already friends
        }));
        setFriends(friendsWithStatus);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleFollowToggle = async (friendId: string, currentStatus: string) => {
    if (!user) return;
    
    setProcessingFollow(friendId);
    
    try {
      if (currentStatus === 'none') {
        // Send follow request
        const { error } = await supabase
          .from('friend_requests')
          .insert({
            from_user_id: user.id,
            to_user_id: friendId,
            status: 'pending'
          });
        
        if (error) throw error;
        
        // Update local state
        setFriends(prev => prev.map(friend => 
          friend.id === friendId 
            ? { ...friend, followStatus: 'requested' as const }
            : friend
        ));
        
        Alert.alert('Follow Request Sent', 'Your follow request has been sent!');
        
      } else if (currentStatus === 'requested') {
        // Cancel follow request
        const { error } = await supabase
          .from('friend_requests')
          .delete()
          .eq('from_user_id', user.id)
          .eq('to_user_id', friendId);
        
        if (error) throw error;
        
        // Update local state
        setFriends(prev => prev.map(friend => 
          friend.id === friendId 
            ? { ...friend, followStatus: 'none' as const }
            : friend
        ));
        
        Alert.alert('Request Cancelled', 'Follow request has been cancelled.');
        
      } else if (currentStatus === 'following') {
        // Unfollow (remove from friends)
        const { error } = await supabase
          .from('friends')
          .delete()
          .or(`user_id.eq.${user.id}.and.friend_id.eq.${friendId},user_id.eq.${friendId}.and.friend_id.eq.${user.id}`);
        
        if (error) throw error;
        
        // Update local state
        setFriends(prev => prev.map(friend => 
          friend.id === friendId 
            ? { ...friend, followStatus: 'none' as const }
            : friend
        ));
        
        Alert.alert('Unfollowed', 'You have unfollowed this user.');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      
      // Reload friends to sync with server state
      loadFriends();
    } finally {
      setProcessingFollow(null);
    }
  };

  const handleUnfriend = async (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setProcessingUnfriend(friendId);
            
            try {
              const result = await friendsApi.removeFriend(friendId);
              
              if (result.success) {
                // Remove the friend from the list
                setFriends(prev => prev.filter(friend => friend.id !== friendId));
                Alert.alert('Success', `${friendName} has been removed from your friends.`);
              } else {
                Alert.alert('Error', 'Something went wrong.');
              }
            } catch (error) {
              Alert.alert('Connection Error', 'Please check your connection and try again.');
            } finally {
              setProcessingUnfriend(null);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadFriends();
  };

  const getFollowButtonContent = (friend: Friend) => {
    switch (friend.followStatus) {
      case 'none':
        return (
          <>
            {processingFollow === friend.id ? (
              <ActivityIndicator size="small" color={getColor('textPrimary')} />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color={getColor('textPrimary')} />
                <Text style={[styles.followText, { color: getColor('textPrimary') }]}>Follow</Text>
              </>
            )}
          </>
        );
      case 'requested':
        return (
          <>
            <Ionicons name="person" size={16} color={getColor('textSecondary')} />
            <Text style={[styles.followText, { color: getColor('textSecondary') }]}>Requested</Text>
          </>
        );
      case 'following':
        return (
          <>
            <Ionicons name="checkmark" size={16} color={getColor('textPrimary')} />
            <Text style={[styles.followText, { color: getColor('textPrimary') }]}>Following</Text>
          </>
        );
      default:
        return null;
    }
  };

  const getFollowButtonStyle = (friend: Friend) => {
    switch (friend.followStatus) {
      case 'none':
        return { backgroundColor: getColor('success') };
      case 'requested':
        return { backgroundColor: getColor('surface'), borderColor: getColor('divider') };
      case 'following':
        return { backgroundColor: getColor('success') };
      default:
        return { backgroundColor: getColor('success') };
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={[styles.friendCard, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.friendAvatar}>{item.avatar}</Text>
          {item.isOnline && (
            <View style={[styles.onlineIndicator, { backgroundColor: getColor('success') }]} />
          )}
        </View>
        <View style={styles.friendDetails}>
          <Text style={[styles.friendName, { color: getColor('textPrimary') }]}>
            {item.personalName}
          </Text>
          <Text style={[styles.friendUsername, { color: getColor('textSecondary') }]}>
            @{item.username}
          </Text>
          {item.bio && (
            <Text style={[styles.friendBio, { color: getColor('textTertiary') }]} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
          {item.location && (
            <Text style={[styles.friendLocation, { color: getColor('textTertiary') }]}>
              📍 {item.location}
            </Text>
          )}
          {item.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {item.interests.slice(0, 3).map((interest) => (
                <View key={interest} style={[styles.interestChip, { backgroundColor: getColor('surface') }]}>
                  <Text style={[styles.interestText, { color: getColor('textPrimary') }]}>
                    {interest}
                  </Text>
                </View>
              ))}
              {item.interests.length > 3 && (
                <Text style={[styles.moreInterests, { color: getColor('textTertiary') }]}>
                  +{item.interests.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: getColor('success') }]}
          onPress={() => {
            router.push({
              pathname: '/private-chat/[friendId]',
              params: { friendId: item.id }
            });
          }}
        >
          <Ionicons name="chatbubble" size={16} color={getColor('textPrimary')} />
          <Text style={[styles.messageText, { color: getColor('textPrimary') }]}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.followButton, getFollowButtonStyle(item)]}
          onPress={() => handleFollowToggle(item.id, item.followStatus)}
          disabled={processingFollow === item.id}
        >
          {getFollowButtonContent(item)}
        </TouchableOpacity>
        
        {item.followStatus === 'following' && (
          <TouchableOpacity
            style={[styles.unfriendButton, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}
            onPress={() => handleUnfriend(item.id, item.personalName)}
            disabled={processingUnfriend === item.id}
          >
            {processingUnfriend === item.id ? (
              <ActivityIndicator size="small" color={getColor('textSecondary')} />
            ) : (
              <>
                <Ionicons name="person-remove" size={16} color={getColor('textSecondary')} />
                <Text style={[styles.unfriendText, { color: getColor('textSecondary') }]}>Remove</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: getColor('bg') }]}>
        <LinearGradient
          colors={theme.gradients.primary}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={30} style={[styles.header, { borderBottomColor: getColor('divider') }]}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: getColor('surface') }]}>
              <Ionicons name="arrow-back" size={24} color={getColor('textPrimary')} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: getColor('textPrimary') }]}>My Friends</Text>
            <View style={styles.headerSpacer} />
          </BlurView>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={getColor('textPrimary')} />
            <Text style={[styles.loadingText, { color: getColor('textSecondary') }]}>Loading friends...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: getColor('bg') }]}>
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={30} style={[styles.header, { borderBottomColor: getColor('divider') }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: getColor('surface') }]}>
            <Ionicons name="arrow-back" size={24} color={getColor('textPrimary')} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: getColor('textPrimary') }]}>My Friends</Text>
          <View style={styles.headerSpacer} />
        </BlurView>

        {/* Friends Count */}
        <View style={styles.friendsCount}>
          <Text style={[styles.countText, { color: getColor('textPrimary') }]}>
            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
          </Text>
        </View>

        {/* Friends List */}
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.friendsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={getColor('textPrimary')}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color={getColor('textTertiary')} />
              <Text style={[styles.emptyTitle, { color: getColor('textPrimary') }]}>
                No Friends Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: getColor('textSecondary') }]}>
                Start connecting with people to build your friend network
              </Text>
              <TouchableOpacity
                style={[styles.findPeopleButton, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}
                onPress={() => router.push('/search')}
              >
                <Text style={[styles.findPeopleText, { color: getColor('textPrimary') }]}>
                  Find People to Connect With
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
  friendsCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  friendCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  friendAvatar: {
    fontSize: 48,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  friendBio: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  friendLocation: {
    fontSize: 12,
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  interestChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: 12,
    alignSelf: 'center',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  followText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  unfriendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  unfriendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  findPeopleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  findPeopleText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 