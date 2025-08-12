import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  Dimensions, 
  Alert, 
  RefreshControl, 
  Image,
  Animated,
  Platform,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { 
  HeaderScreen,
  Card,
  EmptyState,
  Spinner,
  GradientFAB,
  Gradient
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PostCard } from '../../components/ui/PostCard';
import { getApiUrl } from '../../lib/config';
import { postsApi } from '../../lib/api';
import { logger } from '../../lib/logger';
import { useUserFollowStats } from '../../hooks/useFollowSystem';
import { ProfileCustomization } from '../../components/ui/ProfileCustomization';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { Database } from '../../types';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileData {
  id: string;
  personalName: string;
  username: string;
  bio: string;
  avatar: string;
  interests: string[];
  location: string;
  website: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  followersCount: number;
  followingCount: number;
  postsCount: number;
  followStatus: 'none' | 'requested' | 'following';
  socialScore: number;
  communityLevel: number;
  badges: string[];
}

interface UserPost {
  id: string;
  content: string;
  created_at: string;
  like_count: number | null;
  comment_count: number | null;
}

interface UserComment {
  id: string;
  content: string;
  created_at: string;
  post: {
    id: string;
    content: string;
  }[];
}

export default function ProfileScreen() {
  const { user, signOut, profile } = useAuth();
  const { followerCount, followingCount } = useUserFollowStats(user?.id || null);
  
  // Safe check for user
  if (!user) return null;
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showProfileCustomization, setShowProfileCustomization] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingFollow, setProcessingFollow] = useState(false);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'achievements'>('posts');

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const avatarScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });
  const statsOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    id: user.id,
    personalName: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
    username: (profile as any)?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'anonymous',
    bio: profile?.bio || 'Sharing moments, building connections ✨',
    avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    interests: (profile as any)?.interests || ['Community', 'Connection', 'Growth'],
    location: profile?.neighborhood || 'Your Neighborhood',
    website: '',
    socialLinks: {},
    followersCount: followerCount || 0,
    followingCount: followingCount || 0,
    postsCount: 0,
    followStatus: 'none' as const,
    socialScore: 8.4,
    communityLevel: 5,
    badges: ['Early Adopter', 'Community Builder', 'Active Member'],
  });

  useEffect(() => {
    loadProfileData();
    loadUserContent();
  }, [user?.id]);

  useEffect(() => {
    // Update profile data when follow stats change
    setProfileData(prev => ({
      ...prev,
      followersCount: followerCount || 0,
      followingCount: followingCount || 0,
    }));
  }, [followerCount, followingCount]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Get user's posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setProfileData(prev => ({
        ...prev,
        postsCount: postsCount || 0,
      }));

    } catch (error) {
      logger.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadUserContent = async () => {
    try {
      setLoadingContent(true);
      
      // Load user's posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) throw postsError;
      setUserPosts(posts || []);

      // Load user's comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          post:posts(id, content)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (commentsError) throw commentsError;
      setUserComments(comments || []);

    } catch (error) {
      logger.error('Error loading user content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProfileData();
    loadUserContent();
  };

  const handleFollowToggle = async () => {
    if (processingFollow) return;
    
    setProcessingFollow(true);
    try {
      // This would be implemented with your follow system
      Alert.alert('Coming Soon', 'Follow functionality will be available soon!');
    } catch (error) {
      logger.warn('Follow toggle error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setProcessingFollow(false);
    }
  };

  const handleAction = (action: string) => {
    setSelectedAction(action);
    // Handle different actions
    switch (action) {
      case 'edit':
        setShowProfileCustomization(true);
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'logout':
        handleSignOut();
        break;
      default:
        break;
    }
  };

  const handleProfileSave = async (newProfile: Partial<ProfileData>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: newProfile.personalName,
          username: newProfile.username,
          bio: newProfile.bio,
          avatar_url: newProfile.avatar,
          neighborhood: newProfile.location,
        });

      if (error) throw error;

      setProfileData(prev => ({ ...prev, ...newProfile }));
      setShowProfileCustomization(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      logger.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth');
            } catch (error) {
              logger.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const getFollowButtonContent = () => {
    switch (profileData.followStatus) {
      case 'following':
        return { text: 'Following', icon: 'checkmark-circle' as const };
      case 'requested':
        return { text: 'Requested', icon: 'calendar' as const };
      default:
        return { text: 'Follow', icon: 'person-add' as const };
    }
  };

  const getFollowButtonStyle = () => {
    const isFollowing = profileData.followStatus === 'following';
    return {
      backgroundColor: isFollowing ? 'rgba(255, 255, 255, 0.1)' : getColor('success'),
      borderColor: isFollowing ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
    };
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'just now';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderPremiumHeader = () => (
    <View style={styles.headerContainer}>
              <Animated.View style={[styles.headerBackground, { opacity: headerOpacity }]}>
          <BlurView intensity={30} style={styles.headerBlur}>
            <Gradient type="primary" style={styles.headerGradient} />
          </BlurView>
        </Animated.View>
        
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: getColor('surface') }]}
            onPress={() => handleAction('settings')}
          >
            <Ionicons name="settings-outline" size={20} color={getColor('textPrimary')} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: getColor('surface') }]}
            onPress={() => handleAction('edit')}
          >
            <Ionicons name="pencil-outline" size={20} color={getColor('textPrimary')} />
          </TouchableOpacity>
        </View>
    </View>
  );

  const renderHeroSection = () => (
    <View style={styles.heroSection}>
      <Animated.View style={[styles.avatarContainer, { transform: [{ scale: avatarScale }] }]}>
        <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
        <View style={styles.avatarBorder} />
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera-outline" size={16} color={getColor('textPrimary')} />
        </TouchableOpacity>
        
        {/* Premium Badge */}
        <View style={styles.premiumBadge}>
          <Ionicons name="star-outline" size={12} color="#FFD700" />
        </View>
      </Animated.View>
      
      <View style={styles.profileInfo}>
        <Text style={[styles.personalName, { color: getColor('textPrimary') }]}>
          {profileData.personalName}
        </Text>
        <Text style={[styles.username, { color: getColor('textSecondary') }]}>
          @{profileData.username}
        </Text>
        
        {/* Social Score */}
        <View style={styles.socialScoreContainer}>
          <Ionicons name="star-outline" size={14} color="#FFD700" />
          <Text style={[styles.socialScore, { color: '#FFD700' }]}>
            {profileData.socialScore} Social Score
          </Text>
        </View>
        
        <Text style={[styles.bio, { color: getColor('textPrimary') }]}>
          {profileData.bio}
        </Text>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color={getColor('textSecondary')} />
          <Text style={[styles.location, { color: getColor('textSecondary') }]}>
            {profileData.location}
          </Text>
        </View>
        
        {/* Badges */}
        <View style={styles.badgesContainer}>
          {profileData.badges.map((badge, index) => (
            <View key={index} style={[styles.badge, { backgroundColor: getColor('surface') }]}>
              <Ionicons name="star-outline" size={12} color={getColor('success')} />
              <Text style={[styles.badgeText, { color: getColor('textPrimary') }]}>
                {badge}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStats = () => (
    <Animated.View style={[styles.statsContainer, { opacity: statsOpacity }]}>
      <Card style={styles.statCard}>
        <Text style={[styles.statNumber, { color: getColor('textPrimary') }]}>
          {formatNumber(profileData.postsCount)}
        </Text>
        <Text style={[styles.statLabel, { color: getColor('textSecondary') }]}>
          Posts
        </Text>
      </Card>
      
      <Card style={styles.statCard}>
        <Text style={[styles.statNumber, { color: getColor('textPrimary') }]}>
          {formatNumber(profileData.followersCount)}
        </Text>
        <Text style={[styles.statLabel, { color: getColor('textSecondary') }]}>
          Followers
        </Text>
      </Card>
      
      <Card style={styles.statCard}>
        <Text style={[styles.statNumber, { color: getColor('textPrimary') }]}>
          {formatNumber(profileData.followingCount)}
        </Text>
        <Text style={[styles.statLabel, { color: getColor('textSecondary') }]}>
          Following
        </Text>
      </Card>
    </Animated.View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'posts', label: 'Posts', icon: 'grid' as const },
        { key: 'comments', label: 'Comments', icon: 'chatbubbles' as const },
        { key: 'achievements', label: 'Achievements', icon: 'star' as const },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && { backgroundColor: getColor('success') }
          ]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Ionicons
            name={tab.icon}
            size={18} 
            color={activeTab === tab.key ? getColor('textPrimary') : getColor('textSecondary')} 
          />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === tab.key ? getColor('textPrimary') : getColor('textSecondary') }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPosts();
      case 'comments':
        return renderComments();
      case 'achievements':
        return renderAchievements();
      default:
        return renderPosts();
    }
  };

  const renderPosts = () => (
    <View style={styles.contentSection}>
      {loadingContent ? (
        <Spinner size="large" color={getColor('success')} />
      ) : userPosts.length > 0 ? (
        userPosts.map((post) => (
          <Card key={post.id} style={styles.postItem}>
            <Text style={[styles.postContent, { color: getColor('textPrimary') }]}>
              {post.content}
            </Text>
            <View style={styles.postMeta}>
              <Text style={[styles.postTime, { color: getColor('textSecondary') }]}>
                {formatTimeAgo(post.created_at)}
              </Text>
              <View style={styles.postStats}>
                <Ionicons name="heart-outline" size={14} color={getColor('textSecondary')} />
                <Text style={[styles.postStatText, { color: getColor('textSecondary') }]}>
                  {formatNumber(post.like_count || 0)}
                </Text>
                <Ionicons name="chatbubble-outline" size={14} color={getColor('textSecondary')} />
                <Text style={[styles.postStatText, { color: getColor('textSecondary') }]}>
                  {formatNumber(post.comment_count || 0)}
                </Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState
          icon="people-outline"
          title="No posts yet 🫥"
          subtitle="Share your first post with the community!"
          cta={{
            text: "Create Your First Post",
            onPress: () => router.push('/(tabs)')
          }}
        />
      )}
    </View>
  );

  const renderComments = () => (
    <View style={styles.contentSection}>
      {userComments.length > 0 ? (
        userComments.map((comment) => (
          <Card key={comment.id} style={styles.commentItem}>
            <Text style={[styles.commentContent, { color: getColor('textPrimary') }]}>
              {comment.content}
            </Text>
            <Text style={[styles.commentTime, { color: getColor('textSecondary') }]}>
              {formatTimeAgo(comment.created_at)}
            </Text>
          </Card>
        ))
      ) : (
        <EmptyState
          icon="chatbubbles-outline"
          title="No comments yet 💬"
          subtitle="Start engaging with the community!"
        />
      )}
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.contentSection}>
      <View style={styles.achievementsGrid}>
        {[
          { title: 'Early Adopter', icon: 'star', color: '#FFD700', description: 'Joined in the first month' },
          { title: 'Community Builder', icon: 'people', color: '#4CAF50', description: 'Helped grow the community' },
          { title: 'Active Member', icon: 'people', color: '#2196F3', description: 'Consistent engagement' },
          { title: 'Influencer', icon: 'star', color: '#9C27B0', description: 'High social impact' },
        ].map((achievement, index) => (
          <Card key={index} style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
              <Ionicons name={achievement.icon as any} size={24} color={achievement.color} />
            </View>
            <Text style={[styles.achievementTitle, { color: getColor('textPrimary') }]}>
              {achievement.title}
            </Text>
            <Text style={[styles.achievementDescription, { color: getColor('textSecondary') }]}>
              {achievement.description}
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: getColor('bg') }]}>
        <Spinner size="large" color={getColor('success')} />
        <Text style={[styles.loadingText, { color: getColor('textPrimary') }]}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getColor('bg') }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {renderPremiumHeader()}
        {renderHeroSection()}
        {renderStats()}
        {renderTabBar()}
        {renderContent()}
      </Animated.ScrollView>

      <GradientFAB
        icon="add-circle-outline"
        onPress={() => router.push('/(tabs)')}
      />

      {showProfileCustomization && (
        <ProfileCustomization
          isVisible={showProfileCustomization}
          onClose={() => setShowProfileCustomization(false)}
          onSave={handleProfileSave}
          initialData={profileData}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerBlur: {
    flex: 1,
  },
  headerGradient: {
    flex: 1,
    opacity: 0.8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 63,
    opacity: 0.8,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  personalName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 18,
    marginBottom: 8,
    opacity: 0.8,
  },
  socialScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialScore: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    marginLeft: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  postItem: {
    marginBottom: 16,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: 12,
    marginLeft: 4,
    marginRight: 12,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentTime: {
    fontSize: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});