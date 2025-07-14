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
import { ArrowLeft, Users, MessageCircle, UserMinus, User, UserPlus, Check } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
  const { theme } = useTheme();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingUnfriend, setProcessingUnfriend] = useState<string | null>(null);
  const [processingFollow, setProcessingFollow] = useState<string | null>(null);

  const loadFriends = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/users/friends');
      const data = await response.json();
      
      if (data.success) {
        // Add follow status to each friend
        const friendsWithStatus = data.friends.map((friend: Friend) => ({
          ...friend,
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
              const response = await fetch(`http://localhost:5002/api/users/unfriend`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  friendId,
                }),
              });

              const data = await response.json();

              if (data.success) {
                // Remove the friend from the list
                setFriends(prev => prev.filter(friend => friend.id !== friendId));
                Alert.alert('Success', `${friendName} has been removed from your friends.`);
              } else {
                Alert.alert('Error', data.error || 'Something went wrong.');
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
    if (processingFollow === friend.id) {
      return <ActivityIndicator size="small" color={theme.colors.text.inverse} />;
    }

    switch (friend.followStatus) {
      case 'none':
        return (
          <>
            <UserPlus color={theme.colors.text.inverse} size={16} />
            <Text style={[styles.followText, { color: theme.colors.text.inverse }]}>Follow</Text>
          </>
        );
      case 'requested':
        return (
          <>
            <User color={theme.colors.text.secondary} size={16} />
            <Text style={[styles.followText, { color: theme.colors.text.secondary }]}>Requested</Text>
          </>
        );
      case 'following':
        return (
          <>
            <Check color={theme.colors.text.inverse} size={16} />
            <Text style={[styles.followText, { color: theme.colors.text.inverse }]}>Following</Text>
          </>
        );
      default:
        return null;
    }
  };

  const getFollowButtonStyle = (friend: Friend) => {
    switch (friend.followStatus) {
      case 'none':
        return { backgroundColor: theme.colors.neural.primary };
      case 'requested':
        return { backgroundColor: theme.colors.glass.secondary, borderColor: theme.colors.glass.border };
      case 'following':
        return { backgroundColor: theme.colors.neural.primary };
      default:
        return { backgroundColor: theme.colors.neural.primary };
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={[styles.friendCard, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.friendAvatar}>{item.avatar}</Text>
          {item.isOnline && (
            <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.neural.primary }]} />
          )}
        </View>
        <View style={styles.friendDetails}>
          <Text style={[styles.friendName, { color: theme.colors.text.primary }]}>
            {item.personalName}
          </Text>
          <Text style={[styles.friendUsername, { color: theme.colors.text.secondary }]}>
            @{item.username}
          </Text>
          {item.bio && (
            <Text style={[styles.friendBio, { color: theme.colors.text.tertiary }]} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
          {item.location && (
            <Text style={[styles.friendLocation, { color: theme.colors.text.tertiary }]}>
              📍 {item.location}
            </Text>
          )}
          {item.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {item.interests.slice(0, 3).map((interest) => (
                <View key={interest} style={[styles.interestChip, { backgroundColor: theme.colors.glass.secondary }]}>
                  <Text style={[styles.interestText, { color: theme.colors.text.primary }]}>
                    {interest}
                  </Text>
                </View>
              ))}
              {item.interests.length > 3 && (
                <Text style={[styles.moreInterests, { color: theme.colors.text.tertiary }]}>
                  +{item.interests.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: theme.colors.neural.primary }]}
          onPress={() => {
            router.push({
              pathname: '/private-chat/[friendId]',
              params: { friendId: item.id }
            });
          }}
        >
          <MessageCircle color={theme.colors.text.inverse} size={16} />
          <Text style={[styles.messageText, { color: theme.colors.text.inverse }]}>Message</Text>
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
            style={[styles.unfriendButton, { backgroundColor: theme.colors.glass.secondary, borderColor: theme.colors.glass.border }]}
            onPress={() => handleUnfriend(item.id, item.personalName)}
            disabled={processingUnfriend === item.id}
          >
            {processingUnfriend === item.id ? (
              <ActivityIndicator size="small" color={theme.colors.text.secondary} />
            ) : (
              <>
                <UserMinus color={theme.colors.text.secondary} size={16} />
                <Text style={[styles.unfriendText, { color: theme.colors.text.secondary }]}>Remove</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
        <LinearGradient
          colors={theme.colors.gradients.neural as [string, string]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={30} style={[styles.header, { borderBottomColor: theme.colors.glass.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.glass.secondary }]}>
              <ArrowLeft color={theme.colors.text.primary} size={24} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>My Friends</Text>
            <View style={styles.headerSpacer} />
          </BlurView>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.text.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>Loading friends...</Text>
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
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>My Friends</Text>
          <View style={styles.headerSpacer} />
        </BlurView>

        {/* Friends Count */}
        <View style={styles.friendsCount}>
          <Text style={[styles.countText, { color: theme.colors.text.primary }]}>
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
              tintColor={theme.colors.text.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users color={theme.colors.text.tertiary} size={48} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No Friends Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                Start connecting with people to build your friend network
              </Text>
              <TouchableOpacity
                style={[styles.findPeopleButton, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}
                onPress={() => router.push('/search')}
              >
                <Text style={[styles.findPeopleText, { color: theme.colors.text.primary }]}>
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