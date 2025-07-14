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
import { ArrowLeft, Check, X, UserPlus, Users } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  fromUser: {
    id: string;
    personalName: string;
    username: string;
    bio: string;
    location: string;
    interests: string[];
    avatar: string;
  };
}

export default function FriendRequestsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const loadFriendRequests = async () => {
    try {
      if (!user) return;
      
      // Load pending friend requests for current user
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          fromUser:profiles!friend_requests_from_user_id_fkey(
            id,
            personalName,
            username,
            bio,
            location,
            interests,
            avatar
          )
        `)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setFriendRequests([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFriendRequests();
  }, [user]);

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (!user) return;
    
    setProcessingRequest(requestId);
    
    try {
      if (action === 'accept') {
        // Get the request details first
        const { data: requestData, error: fetchError } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // Update request status to accepted
        const { error: updateError } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted' })
          .eq('id', requestId);
        
        if (updateError) throw updateError;
        
        // Create mutual friendship records
        const { error: friendError1 } = await supabase
          .from('friends')
          .insert({
            user_id: requestData.from_user_id,
            friend_id: requestData.to_user_id
          });
        
        if (friendError1) throw friendError1;
        
        const { error: friendError2 } = await supabase
          .from('friends')
          .insert({
            user_id: requestData.to_user_id,
            friend_id: requestData.from_user_id
          });
        
        if (friendError2) throw friendError2;
        
        Alert.alert('Friend Request Accepted!', 'You are now friends!');
        
      } else if (action === 'reject') {
        // Update request status to rejected
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'rejected' })
          .eq('id', requestId);
        
        if (error) throw error;
        
        Alert.alert('Request Declined', 'Friend request has been declined.');
      }
      
      // Remove the request from the list
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
    } catch (error) {
      console.error('Friend request action error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadFriendRequests();
  };

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.requestCard, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}>
      <View style={styles.userInfo}>
        <Text style={styles.userAvatar}>{item.fromUser.avatar}</Text>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
            {item.fromUser.personalName}
          </Text>
          <Text style={[styles.userUsername, { color: theme.colors.text.secondary }]}>
            @{item.fromUser.username}
          </Text>
          {item.fromUser.bio && (
            <Text style={[styles.userBio, { color: theme.colors.text.tertiary }]} numberOfLines={2}>
              {item.fromUser.bio}
            </Text>
          )}
          {item.fromUser.location && (
            <Text style={[styles.userLocation, { color: theme.colors.text.tertiary }]}>
              📍 {item.fromUser.location}
            </Text>
          )}
          {item.fromUser.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {item.fromUser.interests.slice(0, 3).map((interest) => (
                <View key={interest} style={[styles.interestChip, { backgroundColor: theme.colors.glass.secondary }]}>
                  <Text style={[styles.interestText, { color: theme.colors.text.primary }]}>
                    {interest}
                  </Text>
                </View>
              ))}
              {item.fromUser.interests.length > 3 && (
                <Text style={[styles.moreInterests, { color: theme.colors.text.tertiary }]}>
                  +{item.fromUser.interests.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: theme.colors.neural.primary }]}
          onPress={() => handleFriendRequest(item.id, 'accept')}
          disabled={processingRequest === item.id}
        >
          {processingRequest === item.id ? (
            <ActivityIndicator size="small" color={theme.colors.text.inverse} />
          ) : (
            <>
              <Check color={theme.colors.text.inverse} size={16} />
              <Text style={[styles.acceptText, { color: theme.colors.text.inverse }]}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectButton, { backgroundColor: theme.colors.glass.secondary, borderColor: theme.colors.glass.border }]}
          onPress={() => handleFriendRequest(item.id, 'reject')}
          disabled={processingRequest === item.id}
        >
          {processingRequest === item.id ? (
            <ActivityIndicator size="small" color={theme.colors.text.secondary} />
          ) : (
            <>
              <X color={theme.colors.text.secondary} size={16} />
              <Text style={[styles.rejectText, { color: theme.colors.text.secondary }]}>Decline</Text>
            </>
          )}
        </TouchableOpacity>
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
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Friend Requests</Text>
            <View style={styles.headerSpacer} />
          </BlurView>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.text.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>Loading requests...</Text>
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
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Friend Requests</Text>
          <View style={styles.headerSpacer} />
        </BlurView>

        {/* Requests List */}
        <FlatList
          data={friendRequests}
          renderItem={renderFriendRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.requestsContainer}
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
              <UserPlus color={theme.colors.text.tertiary} size={48} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No Friend Requests
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                When people send you friend requests, they&apos;ll appear here
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
  requestsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  requestCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userAvatar: {
    fontSize: 48,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  userLocation: {
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
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rejectText: {
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