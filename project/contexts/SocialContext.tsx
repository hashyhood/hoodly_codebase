import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { useAuth } from './AuthContext';

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

interface Notification {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  actor?: any;
  target_data?: any;
}

interface SocialContextType {
  // Posts
  posts: Post[];
  isLoadingPosts: boolean;
  refreshPosts: () => Promise<void>;
  createPost: (content: string, mediaUrls?: string[], mediaType?: string, location?: string, visibility?: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  
  // Stories
  stories: Story[];
  isLoadingStories: boolean;
  refreshStories: () => Promise<void>;
  createStory: (mediaUrl: string, mediaType: 'image' | 'video', caption?: string) => Promise<void>;
  viewStory: (storyId: string) => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  isLoadingNotifications: boolean;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  
  // Friend Requests
  pendingRequests: any[];
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  
  // Block User
  blockUser: (userId: string) => Promise<void>;
  
  // Real-time features
  isOnline: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  
  // General
  error: string | null;
  clearError: () => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const refreshPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      logger.error('Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const createPost = async (
    content: string, 
    mediaUrls?: string[], 
    mediaType: string = 'text',
    location?: string,
    visibility: string = 'public'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          media_urls: mediaUrls,
          media_type: mediaType,
          location,
          visibility,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add to posts list
      setPosts(prev => [data, ...prev]);
    } catch (err) {
      logger.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  const likePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        // Update post likes count
        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        await supabase
          .from('posts')
          .update({ likes_count: Math.max(0, (currentPost?.likes_count || 0) - 1) })
          .eq('id', postId);

        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: Math.max(0, (post.likes_count || 0) - 1), is_liked: false }
            : post
        ));
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        // Update post likes count
        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        await supabase
          .from('posts')
          .update({ likes_count: (currentPost?.likes_count || 0) + 1 })
          .eq('id', postId);

        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: (post.likes_count || 0) + 1, is_liked: true }
            : post
        ));
      }
    } catch (err) {
      logger.error('Error liking post:', err);
      setError('Failed to like post');
    }
  };

  const refreshStories = async () => {
    setIsLoadingStories(true);
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (err) {
      logger.error('Error loading stories:', err);
      setError('Failed to load stories');
    } finally {
      setIsLoadingStories(false);
    }
  };

  const createStory = async (mediaUrl: string, mediaType: 'image' | 'video', caption?: string) => {
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
          media_type: mediaType,
          caption,
          views_count: 0,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add to stories list
      setStories(prev => [data, ...prev]);
    } catch (err) {
      logger.error('Error creating story:', err);
      setError('Failed to create story');
    }
  };

  const viewStory = async (storyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mark story as viewed
      await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          user_id: user.id,
        });

      // Update story views count
      const { data: currentStory } = await supabase
        .from('stories')
        .select('views_count')
        .eq('id', storyId)
        .single();
      
      await supabase
        .from('stories')
        .update({ views_count: (currentStory?.views_count || 0) + 1 })
        .eq('id', storyId);

      // Update local state
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, views_count: (story.views_count || 0) + 1, is_viewed: true }
          : story
      ));
    } catch (err) {
      logger.warn('Error viewing story:', err);
    }
  };

  const refreshNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      logger.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('receiver_id', user.id);

      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      ));
    } catch (err) {
      logger.warn('Error marking notification as read:', err);
    }
  };

  const setupRealTimeSubscriptions = (currentUserId?: string | null) => {
    setConnectionStatus('connecting');

    // Subscribe to posts changes
    const postsChannel = supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        setTimeout(() => {
          refreshPosts();
        }, 100);
      })
      .subscribe();

    // Subscribe to stories changes
    const storiesChannel = supabase
      .channel('stories')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => {
        setTimeout(() => {
          refreshStories();
        }, 100);
      })
      .subscribe();

    // Subscribe to notifications changes
    const notificationsChannel = currentUserId
      ? supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${currentUserId}` },
            () => {
              setTimeout(() => {
                refreshNotifications();
              }, 100);
            }
          )
          .subscribe()
      : null;

    // Check connection status
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('posts').select('count').limit(1);
        if (error) throw error;
        
        setIsOnline(true);
        setConnectionStatus('connected');
      } catch (err) {
        setIsOnline(false);
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => {
      postsChannel.unsubscribe();
      storiesChannel.unsubscribe();
      notificationsChannel?.unsubscribe?.();
      clearInterval(interval);
    };
  };

  const cleanupSubscriptions = () => {
    // This will be called when the component unmounts
    setConnectionStatus('disconnected');
    setIsOnline(false);
  };

  // Initialize data and subscriptions
  useEffect(() => {
    refreshPosts();
    refreshStories();
    if (user?.id) {
      refreshNotifications();
    } else {
      setNotifications([]);
    }

    const cleanup = setupRealTimeSubscriptions(user?.id);

    return () => {
      cleanup();
      cleanupSubscriptions();
    };
  }, [user?.id]);

  const clearError = () => {
    setError(null);
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      // Implementation for accepting friend request
      console.log('Accepting friend request:', requestId);
    } catch (error) {
      setError('Failed to accept friend request');
      console.error('Error accepting friend request:', error);
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      // Implementation for declining friend request
      console.log('Declining friend request:', requestId);
    } catch (error) {
      setError('Failed to decline friend request');
      console.error('Error declining friend request:', error);
    }
  };

  const blockUser = async (userId: string) => {
    try {
      // Implementation for blocking user
      console.log('Blocking user:', userId);
    } catch (error) {
      setError('Failed to block user');
      console.error('Error blocking user:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const { error } = await supabase.from('posts').select('id', { count: 'exact', head: true }).limit(1);
      if (error) throw error;
      setIsOnline(true);
      setConnectionStatus('connected');
    } catch (err) {
      setIsOnline(false);
      setConnectionStatus('disconnected');
    }
  };

  const value: SocialContextType = {
    posts,
    isLoadingPosts,
    refreshPosts,
    createPost,
    likePost,
    stories,
    isLoadingStories,
    refreshStories,
    createStory,
    viewStory,
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length,
    isLoadingNotifications,
    refreshNotifications,
    markNotificationAsRead,
    pendingRequests,
    acceptFriendRequest,
    declineFriendRequest,
    blockUser,
    isOnline,
    connectionStatus,
    error,
    clearError,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}; 