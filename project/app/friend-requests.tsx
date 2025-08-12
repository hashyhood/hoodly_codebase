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
    <View style={[styles.requestCard, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
      <View style={styles.requestInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.requestAvatar}>
            {item.fromUser.avatar || item.fromUser.personalName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.requestDetails}>
          <Text style={[styles.requestName, { color: getColor('textPrimary') }]}>
            {item.fromUser.personalName}
          </Text>
          <Text style={[styles.requestUsername, { color: getColor('textSecondary') }]}>
            @{item.fromUser.username}
          </Text>
          {item.fromUser.bio && (
            <Text style={[styles.requestBio, { color: getColor('textTertiary') }]} numberOfLines={2}>
              {item.fromUser.bio}
            </Text>
          )}
          {item.fromUser.location && (
            <Text style={[styles.requestLocation, { color: getColor('textTertiary') }]}>
              📍 {item.fromUser.location}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: getColor('success') }]}
          onPress={() => handleFriendRequest(item.id, 'accept')}
          disabled={processingRequest === item.id}
        >
          {processingRequest === item.id ? (
            <ActivityIndicator size="small" color={getColor('textPrimary')} />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color={getColor('textPrimary')} />
              <Text style={[styles.acceptText, { color: getColor('textPrimary') }]}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.rejectButton, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}
          onPress={() => handleFriendRequest(item.id, 'reject')}
          disabled={processingRequest === item.id}
        >
          {processingRequest === item.id ? (
            <ActivityIndicator size="small" color={getColor('textSecondary')} />
          ) : (
            <>
              <Ionicons name="close" size={16} color={getColor('textSecondary')} />
              <Text style={[styles.rejectText, { color: getColor('textSecondary') }]}>Decline</Text>
            </>
          )}
        </TouchableOpacity>
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
              <Text style={{ color: getColor('textPrimary'), fontSize: 18 }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: getColor('textPrimary') }]}>Friend Requests</Text>
            <View style={styles.headerSpacer} />
          </BlurView>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={getColor('textPrimary')} />
            <Text style={[styles.loadingText, { color: getColor('textSecondary') }]}>Loading requests...</Text>
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
            <Text style={{ color: getColor('textPrimary'), fontSize: 18 }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: getColor('textPrimary') }]}>Friend Requests</Text>
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
              tintColor={getColor('textPrimary')}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="person-add" size={48} color={getColor('textTertiary')} />
              <Text style={[styles.emptyTitle, { color: getColor('textPrimary') }]}>
                No Friend Requests
              </Text>
              <Text style={[styles.emptySubtitle, { color: getColor('textSecondary') }]}>
                When people send you friend requests, they&apos;ll appear here
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
  requestInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0', // Fallback background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestAvatar: {
    fontSize: 24,
    color: '#333', // Fallback text color
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  requestUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  requestBio: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  requestLocation: {
    fontSize: 12,
    marginBottom: 8,
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