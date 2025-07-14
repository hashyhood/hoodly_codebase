import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Settings, 
  Search, 
  Bell, 
  Edit3, 
  Moon, 
  Sun,
  Users,
  UserPlus,
  Shield,
  MapPin,
  Calendar,
  ShoppingBag,
  Heart,
  Bookmark,
  HelpCircle,
  LogOut,
  Plus,
  MessageCircle,
  Check,
  User
} from 'lucide-react-native';
import { HoodlyLayout } from '../../components/ui/HoodlyLayout';
import { ProfileCustomization } from '../../components/ui/ProfileCustomization';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PostCard } from '../../components/ui/PostCard';
import { getApiUrl } from '../../lib/config';

const { width } = Dimensions.get('window');

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
}

interface UserPost {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  comment_count: number;
}

interface UserComment {
  id: string;
  text: string;
  created_at: string;
  post: {
    id: string;
    content: string;
  }[];
}

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  
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

  const [profileData, setProfileData] = useState<ProfileData>({
    id: user.id,
    personalName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Alex Johnson',
    username: user?.user_metadata?.username || 'alexj',
    bio: 'Tech enthusiast, coffee lover, hood advocate ☕️',
    avatar: '👤',
    interests: ['Programming', 'Coffee', 'Running'],
    location: 'Downtown District, San Francisco',
    website: 'alexjohnson.dev',
    socialLinks: {
      instagram: '@alexj',
      twitter: '@alexjohnson',
    },
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    followStatus: 'none'
  });

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile data from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setProfileData(prev => ({
          ...prev,
          personalName: profile.personalName || prev.personalName,
          username: profile.username || prev.username,
          bio: profile.bio || prev.bio,
          avatar: profile.avatar || prev.avatar,
          interests: profile.interests || prev.interests,
          location: profile.location || prev.location,
        }));
      }

      // Load follower/following counts
      const { count: followersCount } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', user.id);

      const { count: followingCount } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Load posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setProfileData(prev => ({
        ...prev,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        postsCount: postsCount || 0,
      }));

      // Load user content
      await loadUserContent();

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadUserContent = async () => {
    if (!user) return;
    
    try {
      setLoadingContent(true);
      
      // Load user's recent posts
      const postsResponse = await fetch(`${getApiUrl()}/posts/user/${user.id}`);
      const postsData = await postsResponse.json();
      if (postsData.success) {
        setUserPosts(postsData.posts?.slice(0, 5) || []); // Show last 5 posts
      }

      // Load user's recent comments
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          id,
          text,
          created_at,
          post:posts!comments_post_id_fkey(id, content)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error) {
        setUserComments(comments || []);
      }
    } catch (error) {
      console.error('Error loading user content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProfileData();
  };

  const handleFollowToggle = async () => {
    if (!user) return;
    
    setProcessingFollow(true);
    
    try {
      if (profileData.followStatus === 'none') {
        // Send follow request to yourself (for demo purposes)
        Alert.alert('Follow', 'You cannot follow yourself!');
      } else if (profileData.followStatus === 'requested') {
        // Cancel follow request
        const { error } = await supabase
          .from('friend_requests')
          .delete()
          .eq('from_user_id', user.id)
          .eq('to_user_id', user.id);
        
        if (error) throw error;
        
        setProfileData(prev => ({ ...prev, followStatus: 'none' }));
        Alert.alert('Request Cancelled', 'Follow request has been cancelled.');
        
      } else if (profileData.followStatus === 'following') {
        // Unfollow
        const { error } = await supabase
          .from('friends')
          .delete()
          .or(`user_id.eq.${user.id}.and.friend_id.eq.${user.id}`);
        
        if (error) throw error;
        
        setProfileData(prev => ({ ...prev, followStatus: 'none' }));
        Alert.alert('Unfollowed', 'You have unfollowed yourself.');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setProcessingFollow(false);
    }
  };

  const handleAction = (action: string) => {
    setSelectedAction(action);
    console.log(`Action: ${action}`);
  };

  const handleProfileSave = async (newProfile: Partial<ProfileData>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          personalName: newProfile.personalName,
          username: newProfile.username,
          bio: newProfile.bio,
          avatar: newProfile.avatar,
          interests: newProfile.interests,
          location: newProfile.location,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfileData(prev => ({ ...prev, ...newProfile }));
      setShowProfileCustomization(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
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
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const getFollowButtonContent = () => {
    if (processingFollow) {
      return <ActivityIndicator size="small" color={theme.colors.text.inverse} />;
    }

    switch (profileData.followStatus) {
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

  const getFollowButtonStyle = () => {
    switch (profileData.followStatus) {
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

  // Three main action buttons at the top
  const topActions = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: Edit3,
      onPress: () => setShowProfileCustomization(true),
      color: theme.colors.neural.primary,
    },
    {
      id: 'search',
      title: 'Search',
      icon: Search,
      onPress: () => router.push('/search'),
      color: '#FF6B9D',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      onPress: () => console.log('Settings'),
      color: '#4ECDC4',
    },
  ];

  const quickActions = [
    {
      id: 'friend-requests',
      title: 'Friend Requests',
      icon: UserPlus,
      onPress: () => router.push('/friend-requests'),
      color: '#FF6B9D',
    },
    {
      id: 'my-friends',
      title: 'My Friends',
      icon: Users,
      onPress: () => router.push('/friends'),
      color: '#4ECDC4',
    },
    {
      id: 'safety-settings',
      title: 'Safety Settings',
      icon: Shield,
      onPress: () => console.log('Safety Settings'),
      color: '#FFE66D',
    },
  ];

  const appFeatures = [
    {
      id: 'events',
      title: 'My Events',
      icon: Calendar,
      onPress: () => console.log('Events'),
      color: '#FF6B9D',
    },
    {
      id: 'marketplace',
      title: 'My Listings',
      icon: ShoppingBag,
      onPress: () => console.log('Marketplace'),
      color: '#4ECDC4',
    },
    {
      id: 'favorites',
      title: 'Favorites',
      icon: Heart,
      onPress: () => console.log('Favorites'),
      color: '#FF8B94',
    },
    {
      id: 'saved',
      title: 'Saved',
      icon: Bookmark,
      onPress: () => console.log('Saved'),
      color: '#A8E6CF',
    },
  ];

  const appSettings = [
    {
      id: 'theme',
      title: theme.mode === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: theme.mode === 'dark' ? Sun : Moon,
      onPress: toggleTheme,
      color: '#FFD93D',
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: HelpCircle,
      onPress: () => console.log('Help'),
      color: '#6C5CE7',
    },
    {
      id: 'signout',
      title: 'Sign Out',
      icon: LogOut,
      onPress: handleSignOut,
      color: '#FF6B6B',
    },
  ];

  const renderTopActions = () => (
    <View style={styles.topActionsContainer}>
      {topActions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[styles.topActionButton, { backgroundColor: theme.colors.glass.primary }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <action.icon size={24} color={action.color} />
          <Text style={[styles.topActionText, { color: theme.colors.text.primary }]}>
            {action.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{profileData.avatar}</Text>
        <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.status.success }]} />
      </View>
      
      <Text style={[styles.name, { color: theme.colors.text.primary }]}>
        {profileData.personalName}
      </Text>
      
      <Text style={[styles.bio, { color: theme.colors.text.secondary }]}>
        {profileData.bio}
      </Text>
      
      <View style={styles.locationContainer}>
        <MapPin size={16} color={theme.colors.text.tertiary} />
        <Text style={[styles.location, { color: theme.colors.text.tertiary }]}>
          {profileData.location}
        </Text>
      </View>
      
      {user?.email && (
        <Text style={[styles.email, { color: theme.colors.text.tertiary }]}>
          📧 {user.email}
        </Text>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statItem, { backgroundColor: theme.colors.glass.primary }]}>
        <Text style={styles.statIcon}>📱</Text>
        <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
          {profileData.postsCount}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>
          Posts
        </Text>
      </View>
      <View style={[styles.statItem, { backgroundColor: theme.colors.glass.primary }]}>
        <Text style={styles.statIcon}>👥</Text>
        <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
          {profileData.followersCount}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>
          Followers
        </Text>
      </View>
      <View style={[styles.statItem, { backgroundColor: theme.colors.glass.primary }]}>
        <Text style={styles.statIcon}>👤</Text>
        <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
          {profileData.followingCount}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>
          Following
        </Text>
      </View>
    </View>
  );

  const renderUserContent = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        My Recent Posts
      </Text>
      {loadingContent ? (
        <ActivityIndicator size="small" color={theme.colors.neural.primary} />
      ) : userPosts.length > 0 ? (
        userPosts.map((post) => (
          <View key={post.id} style={[styles.contentCard, { backgroundColor: theme.colors.glass.secondary }]}>
            <Text style={[styles.contentText, { color: theme.colors.text.secondary }]}>
              {post.content}
            </Text>
            <View style={styles.contentMeta}>
              <Text style={[styles.contentTime, { color: theme.colors.text.tertiary }]}>
                {new Date(post.created_at).toLocaleDateString()}
              </Text>
              <View style={styles.contentStats}>
                <Text style={[styles.contentStat, { color: theme.colors.text.tertiary }]}>
                  ❤️ {post.like_count}
                </Text>
                <Text style={[styles.contentStat, { color: theme.colors.text.tertiary }]}>
                  💬 {post.comment_count}
                </Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
          No posts yet. Share something with your neighborhood!
        </Text>
      )}
    </View>
  );

  const renderUserComments = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        My Recent Comments
      </Text>
      {loadingContent ? (
        <ActivityIndicator size="small" color={theme.colors.neural.primary} />
      ) : userComments.length > 0 ? (
        userComments.map((comment) => (
          <View key={comment.id} style={[styles.contentCard, { backgroundColor: theme.colors.glass.secondary }]}>
            <Text style={[styles.contentText, { color: theme.colors.text.secondary }]}>
              "{comment.text}"
            </Text>
            <Text style={[styles.commentOnText, { color: theme.colors.text.tertiary }]}>
              on: {comment.post?.[0]?.content?.substring(0, 50)}...
            </Text>
            <Text style={[styles.contentTime, { color: theme.colors.text.tertiary }]}>
              {new Date(comment.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))
      ) : (
        <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
          No comments yet. Start engaging with your community!
        </Text>
      )}
    </View>
  );

  const renderActionSection = (title: string, actions: any[]) => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        {title}
      </Text>
      <View style={styles.actionGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { backgroundColor: theme.colors.glass.primary }]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
              <action.icon size={20} color="white" />
            </View>
            <Text style={[styles.actionTitle, { color: theme.colors.text.primary }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <HoodlyLayout
        neighborhoodName="Downtown West"
        activeNeighbors={47}
        communityHealth={94}
        socialScore={8.4}
        eventsToday={23}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {/* Top Action Buttons */}
          {renderTopActions()}
          
          {/* Profile Header */}
          {renderProfileHeader()}
          
          {/* Stats */}
          {renderStats()}
          
          {/* User Content */}
          {renderUserContent()}
          {renderUserComments()}
          
          {/* Quick Actions */}
          {renderActionSection('Quick Actions', quickActions)}
          
          {/* App Features */}
          {renderActionSection('My Content', appFeatures)}
          
          {/* App Settings */}
          {renderActionSection('Settings', appSettings)}
        </ScrollView>
      </HoodlyLayout>

      {/* Profile Customization Modal */}
      <ProfileCustomization
        isVisible={showProfileCustomization}
        onClose={() => setShowProfileCustomization(false)}
        onSave={handleProfileSave}
        initialData={profileData}
      />
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
  scrollContent: {
    paddingBottom: 120, // Space for tab bar
  },
  topActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  topActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 80,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    marginLeft: 4,
  },
  email: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 64) / 2,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  followText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  contentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentOnText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentTime: {
    fontSize: 12,
  },
  contentStats: {
    flexDirection: 'row',
    gap: 12,
  },
  contentStat: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});