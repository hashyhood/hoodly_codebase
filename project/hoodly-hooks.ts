import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useSocial } from './contexts/SocialContext';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

// Hook for managing loading states
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  
  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  
  return { loading, startLoading, stopLoading };
};

// Hook for managing error states
export const useError = () => {
  const [error, setError] = useState<string | null>(null);
  
  const setErrorMessage = useCallback((message: string) => {
    setError(message);
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }, []);
  
  const clearError = useCallback(() => setError(null), []);
  
  return { error, setErrorMessage, clearError };
};

// Hook for managing toast notifications
export const useToast = () => {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
};

// Hook for managing real-time subscriptions (generic) - DEPRECATED: Use scoped hooks instead
export const useRealtimeSubscription = (channel: string, table: string, event: string, callback: (payload: any) => void) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', { 
        event: event as 'INSERT' | 'UPDATE' | 'DELETE', 
        schema: 'public',
        table
      }, callback)
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, channel, table, event, callback]);

  return subscriptionRef.current;
};

// Hook for scoped real-time subscriptions (more secure)
export const useScopedRealtimeSubscription = (
  channel: string, 
  table: string, 
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  filter?: string,
  callback?: (payload: any) => void
) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', { 
        event, 
        schema: 'public', 
        table,
        ...(filter && { filter })
      }, callback || (() => {}))
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, channel, table, event, filter, callback]);

  return subscriptionRef.current;
};

// Hook specifically for room messages (scoped and secure)
export const useRoomMessagesSubscription = (roomId: string, callback: (payload: any) => void) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user || !roomId) return;

    const subscription = supabase
      .channel(`messages:${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `room_id=eq.${roomId}` 
      }, callback)
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, roomId, callback]);

  return subscriptionRef.current;
};

// Hook specifically for user notifications (scoped and secure)
export const useNotificationsSubscription = (callback: (payload: any) => void) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `receiver_id=eq.${user.id}` 
      }, callback)
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, callback]);

  return subscriptionRef.current;
};

// Hook specifically for user posts (scoped and secure)
export const useUserPostsSubscription = (callback: (payload: any) => void) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`posts:${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts', 
        filter: `user_id=eq.${user.id}` 
      }, callback)
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, callback]);

  return subscriptionRef.current;
};

// Hook specifically for friend requests (scoped and secure)
export const useFriendRequestsSubscription = (callback: (payload: any) => void) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`friend_requests:${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'friend_requests', 
        filter: `to_user_id=eq.${user.id}` 
      }, callback)
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, callback]);

  return subscriptionRef.current;
};

// Hook specifically for direct messages (scoped and secure)
export const useDirectMessagesSubscription = (callback: (payload: any) => void) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`direct_messages:${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'dm_messages', 
        filter: `or(sender_id=eq.${user.id},receiver_id=eq.${user.id})` 
      }, callback)
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, callback]);

  return subscriptionRef.current;
};

// Hook for managing user presence
export const usePresence = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            last_seen: new Date().toISOString(),
            is_online: true,
          });
        setIsOnline(true);
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      // Set offline when component unmounts
      if (user) {
        (async () => {
          try {
            await supabase
              .from('user_presence')
              .upsert({
                user_id: user.id,
                last_seen: new Date().toISOString(),
                is_online: false,
              });
          } catch (error) {
            console.error('Error updating presence:', error);
          }
        })();
      }
    };
  }, [user]);

  return { isOnline };
};

// Hook for managing location
export const useLocation = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown');

  const requestLocationPermission = useCallback(async () => {
    try {
      // TODO: Implement proper location permission request
      // This should use expo-location or similar library
      setPermission('granted');
      setLocation({ latitude: 0, longitude: 0 }); // Placeholder coordinates
    } catch (error) {
      setPermission('denied');
      console.error('Location permission denied:', error);
    }
  }, []);

  return { location, permission, requestLocationPermission };
};

// Hook for managing camera/gallery access
export const useMediaPicker = () => {
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [isPicking, setIsPicking] = useState(false);

  const pickFromGallery = useCallback(async () => {
    setIsPicking(true);
    try {
      // TODO: Implement proper gallery picker using expo-image-picker
      // For now, return empty array until implementation is complete
      setSelectedMedia([]);
    } catch (error) {
      console.error('Error picking from gallery:', error);
    } finally {
      setIsPicking(false);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    setIsPicking(true);
    try {
      // TODO: Implement proper camera access using expo-image-picker
      // For now, return empty array until implementation is complete
      setSelectedMedia([]);
    } catch (error) {
      console.error('Error taking photo:', error);
    } finally {
      setIsPicking(false);
    }
  }, []);

  const clearSelectedMedia = useCallback(() => {
    setSelectedMedia([]);
  }, []);

  return {
    selectedMedia,
    isPicking,
    pickFromGallery,
    takePhoto,
    clearSelectedMedia,
  };
};

// Hook for managing search
export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Implement proper search using Supabase API
      // For now, return empty results until API is implemented
      const results: any[] = [];
      setSearchResults(results);
      
      await analytics.trackEvent('search_performed', {
        query,
        results_count: results.length,
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    performSearch,
    clearSearch,
  };
};

// Hook for managing pagination
export const usePagination = <T>(fetchFunction: (page: number) => Promise<T[]>) => {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const newData = await fetchFunction(page);
      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newData]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchFunction]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const newData = await fetchFunction(1);
      setData(newData);
      setPage(2);
      setHasMore(newData.length > 0);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFunction]);

  return {
    data,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  };
};

// Hook for managing friend requests
export const useFriendRequests = () => {
  const { pendingRequests, acceptFriendRequest, declineFriendRequest } = useSocial();
  const { loading, startLoading, stopLoading } = useLoading();
  const { error, setErrorMessage, clearError } = useError();

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    startLoading();
    clearError();
    try {
      await acceptFriendRequest(requestId);
      await analytics.trackEvent('friend_request_accepted', { request_id: requestId });
    } catch (error) {
      setErrorMessage('Failed to accept friend request');
      console.error('Error accepting friend request:', error);
    } finally {
      stopLoading();
    }
  }, [acceptFriendRequest, startLoading, stopLoading, clearError, setErrorMessage]);

  const handleDeclineRequest = useCallback(async (requestId: string) => {
    startLoading();
    clearError();
    try {
      await declineFriendRequest(requestId);
      await analytics.trackEvent('friend_request_declined', { request_id: requestId });
    } catch (error) {
      setErrorMessage('Failed to decline friend request');
      console.error('Error declining friend request:', error);
    } finally {
      stopLoading();
    }
  }, [declineFriendRequest, startLoading, stopLoading, clearError, setErrorMessage]);

  return {
    pendingRequests,
    loading,
    error,
    handleAcceptRequest,
    handleDeclineRequest,
  };
};

// Hook for managing posts
export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPost = useCallback(async (content: string, images?: string[]) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content,
          images: images || [],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setPosts(prev => [data, ...prev]);
      await analytics.trackEvent('post_created', { post_id: data.id });
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }, [user]);

  return {
    posts,
    loading,
    fetchPosts,
    createPost,
  };
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: any) => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
  };
};

// Hook for managing app state
export const useAppState = () => {
  const [isActive, setIsActive] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setIsActive(nextAppState === 'active');
      
      if (nextAppState === 'active' && user) {
        analytics.trackEvent('app_foregrounded');
      } else if (nextAppState === 'background' && user) {
        analytics.trackEvent('app_backgrounded');
      }
    };

    // TODO: Implement proper app state listener using expo-app-state
    // For now, this is a placeholder implementation
    return () => {
      // Cleanup
    };
  }, [user]);

  return { isActive };
}; 