import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
  Dimensions,
  ScrollView,
  Animated,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSocial } from '../../contexts/SocialContext';
import { postsApi } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { getColor, getSpacing, getRadius, theme } from '../../lib/theme';
import { CreatePostModal } from '../../components/ui/CreatePostModal';
import { CommentsModal } from '../../components/ui/CommentsModal';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SkeletonList } from '../../components/ui/SkeletonList';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { HoodlyLayout } from '../../components/ui/HoodlyLayout';
import { GradientFAB } from '../../components/ui/GradientFAB';
import { StoryRing } from '../../components/ui/StoryRing';
import { GradientBackground } from '../../components/ui/GradientBackground';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  media_type: 'text' | 'image' | 'video' | 'mixed';
  location?: string;
  visibility: 'public' | 'friends' | 'private';
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  is_liked?: boolean;
  created_at: string;
  user?: any;
  views_count?: number | null;
  reach_count?: number | null;
}

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  views_count: number | null;
  is_viewed?: boolean;
  created_at: string;
  expires_at: string;
  user?: any;
}

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user?: any;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const { posts, stories, isLoadingPosts, refreshPosts, refreshStories } = useSocial();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageFrom, setPageFrom] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'trending' | 'nearby' | 'following'>('trending');
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [newPostLocation, setNewPostLocation] = useState('');
  
  // Location functionality for ranked feed
  const { hasPermission, requestPermission, getCurrentLocation } = useLocationPermission();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [useRankedFeed, setUseRankedFeed] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [showStoryCreationModal, setShowStoryCreationModal] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState<string>('');
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Initialize location and set up ranked feed
  useEffect(() => {
    const initializeLocation = async () => {
      if (hasPermission) {
        try {
          const location = await getCurrentLocation();
          if (location) {
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            setUseRankedFeed(true);
          }
        } catch (error) {
          logger.warn('Failed to get location, falling back to regular feed:', error);
          setUseRankedFeed(false);
        }
      }
    };

    initializeLocation();
  }, [hasPermission, getCurrentLocation]);

  // Load initial feed
  useEffect(() => {
    loadInitialFeed();
  }, [useRankedFeed, userLocation]);

  const loadInitialFeed = async () => {
    try {
      let feedRes;
      
      if (useRankedFeed && userLocation) {
        // Use ranked feed when location is available
        feedRes = await postsApi.getRankedFeed(
          userLocation.latitude,
          userLocation.longitude,
          20,
          0
        );
      } else {
        // Fall back to regular feed
        feedRes = await postsApi.getFeed(20, 0);
      }
      
      if (feedRes.success && feedRes.data) {
        setFilteredPosts(feedRes.data as any);
        setPageFrom(20);
      }
    } catch (error) {
      logger.error('Error loading initial feed:', error);
      // Fall back to regular feed on error
      try {
        const fallbackRes = await postsApi.getFeed(20, 0);
        if (fallbackRes.success && fallbackRes.data) {
          setFilteredPosts(fallbackRes.data as any);
          setPageFrom(20);
        }
      } catch (fallbackError) {
        logger.error('Fallback feed also failed:', fallbackError);
      }
    }
  };

  useEffect(() => {
    if (posts) {
      setFilteredPosts(posts);
    }
  }, [posts]);

  const handleTabSwitch = (tab: 'trending' | 'nearby' | 'following') => {
    setActiveTab(tab);
    
    // Animate tab switch
    Animated.spring(tabAnim, {
      toValue: tab === 'trending' ? 0 : tab === 'nearby' ? 1 : 2,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    
    // Filter posts based on tab
    switch (tab) {
      case 'trending':
        setFilteredPosts(posts.filter(post => post.likes_count && post.likes_count > 5));
        break;
      case 'nearby':
        setFilteredPosts(posts.filter(post => post.location));
        break;
      case 'following':
        setFilteredPosts(posts.filter(post => post.user?.id !== user?.id));
        break;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setPageFrom(0);
      let feedRes;
      
      if (useRankedFeed && userLocation) {
        // Use ranked feed when location is available
        feedRes = await postsApi.getRankedFeed(
          userLocation.latitude,
          userLocation.longitude,
          20,
          0
        );
      } else {
        // Fall back to regular feed
        feedRes = await postsApi.getFeed(20, 0);
      }
      
      if (feedRes.success && feedRes.data) {
        setFilteredPosts(feedRes.data as any);
      }
      
      await refreshStories();
    } catch (error) {
      logger.error('Error refreshing feed:', error);
      // Fall back to regular feed on error
      try {
        const fallbackRes = await postsApi.getFeed(20, 0);
        if (fallbackRes.success && fallbackRes.data) {
          setFilteredPosts(fallbackRes.data as any);
        }
      } catch (fallbackError) {
        logger.error('Fallback refresh also failed:', fallbackError);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const nextFrom = pageFrom + 20;
      let res;
      
      if (useRankedFeed && userLocation) {
        // Use ranked feed when location is available
        res = await postsApi.getRankedFeed(
          userLocation.latitude,
          userLocation.longitude,
          20,
          nextFrom
        );
      } else {
        // Fall back to regular feed
        res = await postsApi.getFeed(20, nextFrom);
      }
      
      if (res.success && res.data && res.data.length > 0) {
        setFilteredPosts(prev => [...prev, ...(res.data as any)]);
        setPageFrom(nextFrom);
      }
    } catch (e) {
      logger.warn('Load more failed', e);
      // Fall back to regular feed on error
      try {
        const fallbackRes = await postsApi.getFeed(20, pageFrom + 20);
        if (fallbackRes.success && fallbackRes.data && fallbackRes.data.length > 0) {
          setFilteredPosts(prev => [...prev, ...(fallbackRes.data as any)]);
          setPageFrom(pageFrom + 20);
        }
      } catch (fallbackError) {
        logger.error('Fallback load more also failed:', fallbackError);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Optimistic UI
      setFilteredPosts(prev => prev.map(post => post.id === postId ? {
        ...post,
        is_liked: !post.is_liked,
        likes_count: Math.max(0, (post.likes_count || 0) + (post.is_liked ? -1 : 1))
      } : post));

      const result = await postsApi.toggleLike(postId);
      if (!result) {
        // Rollback on error
        setFilteredPosts(prev => prev.map(post => post.id === postId ? {
          ...post,
          is_liked: !post.is_liked,
          likes_count: Math.max(0, (post.likes_count || 0) + (post.is_liked ? -1 : 1))
        } : post));
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleComment = async (postId: string) => {
    setSelectedPost(posts.find(p => p.id === postId) || null);
    setShowCommentModal(true);
    await loadComments(postId);
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      logger.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    
    setIsSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: selectedPost.id,
          user_id: user.id,
          content: newComment,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setComments(prev => [data, ...prev]);
      setNewComment('');
      
      // Update post comment count
      setFilteredPosts(prev => prev.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));
    } catch (error) {
      logger.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      await Share.share({
        message: `${post.content}\n\nShared from Hoodly`,
        title: 'Check out this post on Hoodly',
      });
    } catch (error) {
      logger.warn('Error sharing post:', error);
    }
  };

  const handleCreatePost = () => {
    setShowCreatePostModal(true);
  };

  const handleCreateStory = () => {
    setShowStoryCreationModal(true);
  };

  const handleSubmitPost = async () => {
    if (!newPostContent.trim()) return;
    
    setIsSubmittingPost(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: newPostContent,
          media_urls: newPostMedia,
          media_type: 'text',
          location: newPostLocation,
          visibility: newPostVisibility,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Reset form
      setNewPostContent('');
      setNewPostMedia([]);
      setNewPostLocation('');
      setNewPostVisibility('public');
      setShowCreatePostModal(false);
      
      // Refresh posts
      await refreshPosts();
    } catch (error) {
      logger.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleAddMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map(asset => asset.uri);
        setNewPostMedia(prev => [...prev, ...newMedia]);
      }
    } catch (error) {
      logger.warn('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const handleRemoveMedia = (index: number) => {
    setNewPostMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLocation = () => {
    Alert.alert('Coming Soon', 'Location picker will be available soon!');
  };

  const handleVisibilityChange = () => {
    const options = ['public', 'friends', 'private'];
    const currentIndex = options.indexOf(newPostVisibility);
    const nextIndex = (currentIndex + 1) % options.length;
    setNewPostVisibility(options[nextIndex] as 'public' | 'friends' | 'private');
  };

  const handleViewStory = async (story: Story) => {
    setSelectedStory(story);
    setShowStoryModal(true);
    
    // Mark as viewed
    setViewedStories(prev => new Set([...prev, story.id]));
    
    try {
      // Mark story as viewed in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('story_views')
          .insert({
            story_id: story.id,
            user_id: user.id,
          });
      }
    } catch (error) {
      logger.error('Error viewing story:', error);
    }
  };

  const handleStoryCreation = async (mediaUrl: string, caption?: string) => {
    setIsSubmittingStory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: 'image',
          caption,
          views_count: 0,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setNewStoryMedia('');
      setNewStoryCaption('');
      setShowStoryCreationModal(false);
      
      // Refresh stories
      await refreshStories();
    } catch (error) {
      logger.error('Error creating story:', error);
      Alert.alert('Error', 'Failed to create story');
    } finally {
      setIsSubmittingStory(false);
    }
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

  const renderStoryItem = ({ item, index }: { item: Story; index: number }) => {
    const isViewed = viewedStories.has(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.storyItem, isViewed && styles.storyItemViewed]}
        onPress={() => handleViewStory(item)}
        activeOpacity={0.8}
      >
        <View style={styles.storyImageContainer}>
          <LinearGradient
            colors={theme.gradients.primary}
            style={styles.storyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image source={{ uri: item.media_url }} style={styles.storyImage} />
            {!isViewed && <View style={styles.storyUnviewedIndicator} />}
          </LinearGradient>
        </View>
        <Text style={[styles.storyUsername, { color: getColor('textPrimary') }]} numberOfLines={1}>
          {item.user?.full_name || 'Anonymous'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAddStoryItem = () => (
    <TouchableOpacity
      style={styles.addStoryItem}
      onPress={handleCreateStory}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.addStoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.addStoryIcon}>
          <Ionicons name="add-circle-outline" size={20} color={getColor('textPrimary')} />
        </View>
      </LinearGradient>
      <Text style={[styles.addStoryText, { color: getColor('textPrimary') }]}>Add Story</Text>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item, index }: { item: Post; index: number }) => {
    const isLiked = item.is_liked || false;

    return (
      <GlassCard style={styles.postCard}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          }}
        >
          <View style={styles.postHeader}>
            <View style={styles.postUserInfo}>
              <Image
                source={{ uri: item.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face' }}
                style={styles.postAvatar}
              />
              <View style={styles.postUserDetails}>
                <Text style={[styles.postUsername, { color: getColor('textPrimary') }]}>
                  {item.user?.full_name || 'Anonymous'}
                </Text>
                <Text style={[styles.postTime, { color: getColor('textSecondary') }]}>
                  {formatTimeAgo(item.created_at)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.postMoreButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={getColor('textSecondary')} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.postContent, { color: getColor('textPrimary') }]}>
            {item.content}
          </Text>

          {item.media_urls && item.media_urls.length > 0 && (
            <View style={styles.postMedia}>
              <Image source={{ uri: item.media_urls[0] }} style={styles.postImage} />
            </View>
          )}

          {item.location && (
            <View style={styles.postLocation}>
              <Ionicons name="location" size={16} color={getColor('textSecondary')} />
              <Text style={[styles.postLocationText, { color: getColor('textSecondary') }]}>
                {item.location}
              </Text>
            </View>
          )}
          
          <View style={styles.postStats}>
            <View style={styles.postStat}>
              <Ionicons name="eye" size={16} color={getColor('textSecondary')} />
              <Text style={[styles.postStatText, { color: getColor('textSecondary') }]}>
                {formatNumber(item.views_count || 0)}
              </Text>
            </View>
            <View style={styles.postStat}>
              <Ionicons name="people" size={16} color={getColor('textSecondary')} />
              <Text style={[styles.postStatText, { color: getColor('textSecondary') }]}>
                {formatNumber(item.reach_count || 0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.postActions}>
            <TouchableOpacity
              style={[styles.postAction, isLiked && styles.postActionActive]}
              onPress={() => handleLike(item.id)}
            >
              <Ionicons name="heart" size={20} color={isLiked ? getColor('error') : getColor('textSecondary')} />
              <Text style={[styles.postActionText, isLiked && styles.postActionTextActive]}>
                {formatNumber(item.likes_count || 0)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postAction}
              onPress={() => handleComment(item.id)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={getColor('textSecondary')} />
              <Text style={[styles.postActionText, { color: getColor('textSecondary') }]}>
                {formatNumber(item.comments_count || 0)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postAction}
              onPress={() => handleShare(item.id)}
            >
              <Ionicons name="share-outline" size={20} color={getColor('textSecondary')} />
              <Text style={[styles.postActionText, { color: getColor('textSecondary') }]}>
                {formatNumber(item.shares_count || 0)}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GlassCard>
    );
  };

  // Handle location permission changes
  const handleLocationPermissionChange = async () => {
    if (!hasPermission) {
      setIsLocationLoading(true);
      setLocationError(null);
      
      try {
        await requestPermission();
        // Try to get location after permission is granted
        setTimeout(() => {
          updateLocationAndRefresh();
        }, 500);
      } catch (error) {
        setLocationError('Location permission denied. Using chronological feed.');
        setUseRankedFeed(false);
      } finally {
        setIsLocationLoading(false);
      }
    } else {
      // Toggle between ranked and chronological feed
      setUseRankedFeed(!useRankedFeed);
      // Reload feed with new setting
      setTimeout(() => {
        loadInitialFeed();
      }, 100);
    }
  };

  // Update location and refresh feed when location changes
  const updateLocationAndRefresh = async () => {
    setIsLocationLoading(true);
    setLocationError(null);
    
    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setUseRankedFeed(true);
        // Reload feed with new location
        setTimeout(() => {
          loadInitialFeed();
        }, 100);
      }
    } catch (error) {
      logger.warn('Failed to update location:', error);
      setLocationError('Failed to update location. Please try again.');
      setUseRankedFeed(false);
    } finally {
      setIsLocationLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: getColor('bg') }]}>
        <Text style={[styles.loadingText, { color: getColor('textPrimary') }]}>
          Please log in to view the feed
        </Text>
      </View>
    );
  }

  return (
    <HoodlyLayout
      neighborhoodName="Your Feed"
      activeNeighbors={posts.length}
      communityHealth={95}
      socialScore={8.4}
      eventsToday={stories.length}
      showSearch={false}
    >
      {/* Feed Header */}
      <View style={styles.feedHeader}>
        <Text style={[styles.feedTitle, { color: getColor('textPrimary') }]}>
          Your Feed
        </Text>
        
        {/* Location Toggle */}
        <View style={styles.locationToggleContainer}>
          {!hasPermission ? (
            <TouchableOpacity
              style={[
                styles.locationButton, 
                { backgroundColor: getColor('success') },
                isLocationLoading && styles.locationButtonDisabled
              ]}
              onPress={handleLocationPermissionChange}
              disabled={isLocationLoading}
            >
              {isLocationLoading ? (
                <Ionicons name="hourglass-outline" size={16} color="white" />
              ) : (
                <Ionicons name="location-outline" size={16} color="white" />
              )}
              <Text style={styles.locationButtonText}>
                {isLocationLoading ? 'Requesting...' : 'Enable Location'}
              </Text>
            </TouchableOpacity>
          ) : userLocation && useRankedFeed ? (
            <View style={styles.locationButtonGroup}>
              <TouchableOpacity
                style={[
                  styles.locationButton, 
                  { backgroundColor: getColor('navy') },
                  isLocationLoading && styles.locationButtonDisabled
                ]}
                onPress={handleLocationPermissionChange}
                disabled={isLocationLoading}
              >
                <Ionicons name="location" size={16} color="white" />
                <Text style={styles.locationButtonText}>Ranked Feed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.locationRefreshButton, 
                  { backgroundColor: getColor('success') },
                  isLocationLoading && styles.locationButtonDisabled
                ]}
                onPress={updateLocationAndRefresh}
                disabled={isLocationLoading}
              >
                {isLocationLoading ? (
                  <Ionicons name="hourglass-outline" size={14} color="white" />
                ) : (
                  <Ionicons name="refresh" size={14} color="white" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.locationButton, 
                { backgroundColor: getColor('textTertiary') },
                isLocationLoading && styles.locationButtonDisabled
              ]}
              onPress={handleLocationPermissionChange}
              disabled={isLocationLoading}
            >
              <Ionicons name="time-outline" size={16} color="white" />
              <Text style={styles.locationButtonText}>Chronological</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Feed Status Indicator */}
      {hasPermission && (
        <View style={styles.feedStatusContainer}>
          <View style={styles.feedStatusRow}>
            <Ionicons 
              name={useRankedFeed ? "location" : "time-outline"} 
              size={16} 
              color={getColor('textSecondary')} 
            />
            <Text style={[styles.feedStatusText, { color: getColor('textSecondary') }]}>
              {useRankedFeed 
                ? `Showing posts ranked by relevance to your location (${userLocation ? `${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}` : 'Unknown'})`
                : 'Showing posts in chronological order'
              }
            </Text>
          </View>
          {useRankedFeed && userLocation && (
            <Text style={[styles.feedStatusSubtext, { color: getColor('textTertiary') }]}>
              Posts are ranked by freshness, proximity, and engagement
            </Text>
          )}
        </View>
      )}

      {/* Location Error Display */}
      {locationError && (
        <View style={styles.locationErrorContainer}>
          <Ionicons name="warning-outline" size={16} color={getColor('warning')} />
          <Text style={[styles.locationErrorText, { color: getColor('warning') }]}>
            {locationError}
          </Text>
          <TouchableOpacity
            style={styles.locationErrorDismiss}
            onPress={() => setLocationError(null)}
          >
            <Ionicons name="close" size={16} color={getColor('warning')} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <BlurView intensity={20} style={styles.tabBlurContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'trending' && styles.tabActive]}
            onPress={() => handleTabSwitch('trending')}
          >
            <Ionicons name="star" size={18} color={activeTab === 'trending' ? getColor('textPrimary') : getColor('textSecondary')} />
            <Text style={[styles.tabText, activeTab === 'trending' && styles.tabTextActive]}>Trending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nearby' && styles.tabActive]}
            onPress={() => handleTabSwitch('nearby')}
          >
            <Ionicons name="map" size={18} color={activeTab === 'nearby' ? getColor('textPrimary') : getColor('textSecondary')} />
            <Text style={[styles.tabText, activeTab === 'nearby' && styles.tabTextActive]}>Nearby</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'following' && styles.tabActive]}
            onPress={() => handleTabSwitch('following')}
          >
            <Ionicons name="people" size={18} color={activeTab === 'following' ? getColor('textPrimary') : getColor('textSecondary')} />
            <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>Following</Text>
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Stories */}
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
          {renderAddStoryItem()}
          {stories.map((story, index) => (
            <View key={story.id} style={styles.storyWrapper}>
              {renderStoryItem({ item: story, index })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Posts */}
      {isRefreshing && filteredPosts.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <SkeletonList count={6} />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          onEndReachedThreshold={0.25}
          onEndReached={handleLoadMore}
          ListEmptyComponent={
            <EmptyState
              icon="add-circle-outline"
              title="No posts yet 🫥"
              subtitle="Be the first to share something amazing!"
              cta={{
                text: "Create Your First Post",
                onPress: handleCreatePost
              }}
            />
          }
          contentContainerStyle={styles.postsList}
        />
      )}

      {/* Floating Action Button */}
      <GradientFAB
        onPress={handleCreatePost}
        icon="add-circle"
      />
    </HoodlyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabBlurContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  tabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabTextActive: {
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
  },
  storiesContainer: {
    paddingVertical: 20,
    marginBottom: 10,
  },
  storiesScroll: {
    paddingHorizontal: 20,
  },
  storyWrapper: {
    marginRight: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
    marginRight: 12,
  },
  storyItemViewed: {
    opacity: 0.6,
  },
  storyImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  storyGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  storyImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storyUnviewedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  storyUsername: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
  },
  addStoryItem: {
    alignItems: 'center',
    width: 70,
  },
  addStoryGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addStoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
  },
  postsList: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 10,
  },
  postCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  postUserDetails: {
    flex: 1,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  postMoreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  postMedia: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  postLocationText: {
    fontSize: 14,
    marginLeft: 6,
  },
  postStats: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    fontSize: 12,
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  postActionActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  postActionText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  postActionTextActive: {
    fontWeight: '700',
    color: 'rgba(255, 59, 48, 1)',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    fontWeight: '500',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  feedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  locationToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRefreshButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  feedStatusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  feedStatusSubtext: {
    marginTop: 4,
    fontSize: 12,
    marginLeft: 24,
  },
  locationErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  locationErrorText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  locationErrorDismiss: {
    padding: 5,
  },
});