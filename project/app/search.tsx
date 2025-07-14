import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Search, UserPlus, Check, X, Users } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface User {
  id: string;
  personalName: string;
  username: string;
  bio: string;
  location: string;
  interests: string[];
  avatar: string;
}

interface SearchResult {
  user: User;
  isFriend: boolean;
  hasPendingRequest: boolean;
  hasReceivedRequest: boolean;
}

export default function SearchScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`http://localhost:5002/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data.success) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleFriendRequest = async (userId: string, action: 'send' | 'accept' | 'reject') => {
    setIsLoading(true);
    
    try {
      const endpoint = action === 'send' ? 'send-request' : 'respond-request';
      const method = action === 'send' ? 'POST' : 'PUT';
      
      const response = await fetch(`http://localhost:5002/api/users/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: userId,
          action: action === 'accept' ? 'accept' : action === 'reject' ? 'reject' : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the search results
        setSearchResults(prev => prev.map(result => {
          if (result.user.id === userId) {
            if (action === 'send') {
              return { ...result, hasPendingRequest: true };
            } else if (action === 'accept') {
              return { ...result, isFriend: true, hasReceivedRequest: false };
            } else if (action === 'reject') {
              return { ...result, hasReceivedRequest: false };
            }
          }
          return result;
        }));

        Alert.alert(
          'Success!',
          action === 'send' ? 'Friend request sent!' :
          action === 'accept' ? 'Friend request accepted!' :
          'Friend request rejected.'
        );
      } else {
        Alert.alert('Error', data.error || 'Something went wrong.');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserCard = ({ item }: { item: SearchResult }) => (
    <View style={[styles.userCard, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}>
      <View style={styles.userInfo}>
        <Text style={styles.userAvatar}>{item.user.avatar}</Text>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
            {item.user.personalName}
          </Text>
          <Text style={[styles.userUsername, { color: theme.colors.text.secondary }]}>
            @{item.user.username}
          </Text>
          {item.user.bio && (
            <Text style={[styles.userBio, { color: theme.colors.text.tertiary }]} numberOfLines={2}>
              {item.user.bio}
            </Text>
          )}
          {item.user.location && (
            <Text style={[styles.userLocation, { color: theme.colors.text.tertiary }]}>
              📍 {item.user.location}
            </Text>
          )}
          {item.user.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {item.user.interests.slice(0, 3).map((interest, index) => (
                <View key={interest} style={[styles.interestChip, { backgroundColor: theme.colors.glass.secondary }]}>
                  <Text style={[styles.interestText, { color: theme.colors.text.primary }]}>
                    {interest}
                  </Text>
                </View>
              ))}
              {item.user.interests.length > 3 && (
                <Text style={[styles.moreInterests, { color: theme.colors.text.tertiary }]}>
                  +{item.user.interests.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
        {item.isFriend ? (
          <View style={[styles.friendBadge, { backgroundColor: theme.colors.neural.primary }]}>
            <Check color={theme.colors.text.inverse} size={16} />
            <Text style={[styles.friendText, { color: theme.colors.text.inverse }]}>Friends</Text>
          </View>
        ) : item.hasPendingRequest ? (
          <View style={[styles.pendingBadge, { backgroundColor: theme.colors.glass.secondary }]}>
            <Text style={[styles.pendingText, { color: theme.colors.text.secondary }]}>Request Sent</Text>
          </View>
        ) : item.hasReceivedRequest ? (
          <View style={styles.requestButtons}>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: theme.colors.neural.primary }]}
              onPress={() => handleFriendRequest(item.user.id, 'accept')}
              disabled={isLoading}
            >
              <Check color={theme.colors.text.inverse} size={16} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectButton, { backgroundColor: theme.colors.glass.secondary }]}
              onPress={() => handleFriendRequest(item.user.id, 'reject')}
              disabled={isLoading}
            >
              <X color={theme.colors.text.secondary} size={16} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.glass.secondary, borderColor: theme.colors.glass.border }]}
            onPress={() => handleFriendRequest(item.user.id, 'send')}
            disabled={isLoading}
          >
            <UserPlus color={theme.colors.text.primary} size={16} />
            <Text style={[styles.addText, { color: theme.colors.text.primary }]}>Add Friend</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Find People</Text>
          <View style={styles.headerSpacer} />
        </BlurView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.glass.primary, borderColor: theme.colors.glass.border }]}>
            <Search color={theme.colors.text.secondary} size={20} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="Search by name or username..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {isSearching && (
              <ActivityIndicator size="small" color={theme.colors.text.secondary} />
            )}
          </View>
        </View>

        {/* Results */}
        <FlatList
          data={searchResults}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users color={theme.colors.text.tertiary} size={48} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {searchQuery.trim().length < 2 ? 'Start typing to search' : 'No users found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                {searchQuery.trim().length < 2 
                  ? 'Search for people by their name or username'
                  : 'Try a different search term'
                }
              </Text>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
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
    justifyContent: 'center',
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  friendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
}); 