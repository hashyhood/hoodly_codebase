import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, FlatList, Alert } from 'react-native';
import { HoodlyLayout } from '../../components/ui/HoodlyLayout';
import { ProximityRadar } from '../../components/ui/ProximityRadar';
import { ActivityCard } from '../../components/ui/ActivityCard';
import { DynamicIsland } from '../../components/ui/DynamicIsland';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { SkeletonList } from '../../components/ui/SkeletonList';
import { PostCard } from '../../components/ui/PostCard';
import { CommentsModal } from '../../components/ui/CommentsModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getApiUrl } from '../../lib/config';

interface Post {
  id: string;
  userId: string;
  user: {
    id: string;
    personalName: string;
    username: string;
    avatar: string;
    location: string;
    distance: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  proximity: 'neighborhood' | 'city' | 'state';
  tags: string[];
  isAIBot: boolean;
  userLiked?: boolean;
}

// Dummy notifications for Dynamic Island
const notifications = [
  {
    id: '1',
    type: 'message' as const,
    title: 'New Message',
    message: 'Sarah sent you a message about coffee',
    time: '2m ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'event' as const,
    title: 'Event Reminder',
    message: 'Block party starts in 30 minutes',
    time: '5m ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'neighbor' as const,
    title: 'New Neighbor',
    message: 'Mike joined your hood',
    time: '10m ago',
    isRead: true,
  },
];

export default function FeedScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showAI, setShowAI] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);

  // Load posts from API
  const loadPosts = async (refresh = false) => {
    if (!user) return;

    try {
      setIsLoading(!refresh);
      setIsRefreshing(refresh);

      const response = await fetch(`${getApiUrl()}/posts/feed/neighborhood?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
      } else {
        console.error('Failed to load posts:', data.error);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle post like
  const handlePostLike = (postId: string, liked: boolean) => {
    // Update local state optimistically
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            likes: liked ? post.likes + 1 : post.likes - 1,
            userLiked: liked 
          }
        : post
    ));
  };

  // Handle post comment
  const handlePostComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
  };

  // Handle comment added
  const handleCommentAdded = (comment: any) => {
    // Update post comment count
    setPosts(prev => prev.map(post => 
      post.id === selectedPostId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
  };

  // Handle post share
  const handlePostShare = (postId: string) => {
    Alert.alert('Share Post', 'Sharing functionality coming soon!');
  };

  // Handle user press
  const handleUserPress = (userId: string) => {
    // Navigate to user profile
    console.log('Navigate to user profile:', userId);
  };

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, [user]);

  const handleAIPress = () => {
    setShowAI(!showAI);
  };

  const handleNotificationPress = () => {
    // Handle notifications
    console.log('Notifications pressed');
  };

  const handleRefresh = async () => {
    await loadPosts(true);
  };

  const handleDynamicIslandNotificationPress = (notification: any) => {
    console.log('Notification pressed:', notification);
    // Handle notification tap
  };

  const handleMarkAllRead = () => {
    console.log('Mark all notifications as read');
    // Update notifications to read
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={handlePostLike}
      onComment={handlePostComment}
      onShare={handlePostShare}
      onUserPress={handleUserPress}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Island */}
      <DynamicIsland
        isExpanded={isDynamicIslandExpanded}
        onToggle={() => setIsDynamicIslandExpanded(!isDynamicIslandExpanded)}
        notifications={notifications}
        onNotificationPress={handleDynamicIslandNotificationPress}
        onMarkAllRead={handleMarkAllRead}
      />
      
      <HoodlyLayout
        neighborhoodName="Downtown West"
        activeNeighbors={47}
        communityHealth={94}
        socialScore={8.4}
        eventsToday={23}
        onAIPress={handleAIPress}
        onNotificationPress={handleNotificationPress}
      >
        <PullToRefresh
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          {isLoading ? (
            <SkeletonList count={3} />
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <>
                  {/* Proximity Radar */}
                  <ProximityRadar neighborsCount={3} maxDistance={100} />

                  {/* AI Insights Panel */}
                  {showAI && (
                    <View style={[styles.aiPanel, { 
                      backgroundColor: `${theme.colors.neural.tertiary}20`,
                      borderColor: `${theme.colors.neural.tertiary}40`,
                    }]}>
                      <View style={styles.aiHeader}>
                        <Text style={styles.aiIcon}>🧠</Text>
                        <Text style={[styles.aiTitle, { color: theme.colors.neural.tertiary }]}>
                          AI Neighborhood Insights
                        </Text>
                      </View>
                      <View style={[styles.aiSuggestion, { backgroundColor: theme.colors.glass.tertiary }]}>
                        <Text style={[styles.suggestionText, { color: theme.colors.text.secondary }]}>
                          🎯 Based on your interests, you might enjoy the "Tech Entrepreneurs Meetup" at Café Luna tonight at 7 PM. 3 neighbors you follow are attending.
                        </Text>
                      </View>
                      <View style={[styles.aiSuggestion, { backgroundColor: theme.colors.glass.tertiary }]}>
                        <Text style={[styles.suggestionText, { color: theme.colors.text.secondary }]}>
                          🏃‍♂️ Your usual running partner Mike is active nearby. Perfect weather for your morning jog route!
                        </Text>
                      </View>
                      <View style={[styles.aiSuggestion, { backgroundColor: theme.colors.glass.tertiary }]}>
                        <Text style={[styles.suggestionText, { color: theme.colors.text.secondary }]}>
                          🛍️ The local farmers market has fresh produce deals. Sarah from your building just posted about amazing strawberries!
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
                    No posts yet. Be the first to share something with your neighborhood!
                  </Text>
                </View>
              }
            />
          )}
        </PullToRefresh>
      </HoodlyLayout>

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsModalVisible}
        postId={selectedPostId || ''}
        onClose={() => {
          setCommentsModalVisible(false);
          setSelectedPostId(null);
        }}
        onCommentAdded={handleCommentAdded}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { 
          backgroundColor: theme.colors.gradients.neural[0],
          bottom: 120, // Adjusted for tab bar
        }]} 
        activeOpacity={0.8}
      >
        <Text style={[styles.fabIcon, { color: theme.colors.text.primary }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120, // Space for the tab bar
  },
  aiPanel: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiIcon: {
    fontSize: 16,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiSuggestion: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
});