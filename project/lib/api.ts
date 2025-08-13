import { supabase } from './supabase';
import { 
  User, Post, Comment, Notification, PrivateMessage, Room, Message, Friend, FriendRequest, ApiResponse, PaginatedResponse 
} from '../types';
import { CONFIG } from './config';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to get auth headers for REST API calls
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

// Helper function to get auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

// Helper function for REST API calls
const restApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = CONFIG.API.DEV.API_URL;
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// ============================================================================
// SUPABASE DIRECT CALLS (Posts, Public Rooms, Notifications)
// ============================================================================

// Posts API - Using Supabase directly
export const postsApi = {
  // Get posts by proximity level
  getPostsByProximity: async (proximity: 'neighborhood' | 'city' | 'state'): Promise<ApiResponse<Post[]>> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('proximity', proximity)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Create a new post
  createPost: async (postData: {
    content: string;
    image_url?: string;
    proximity: 'neighborhood' | 'city' | 'state';
    tags?: string[];
  }): Promise<ApiResponse<Post>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          image_url: postData.image_url,
          proximity: postData.proximity,
          tags: postData.tags || [],
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Toggle like for a post (using reactions table)
  async toggleLike(postId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Check if reaction exists
      const { data: existing, error: checkError } = await supabase
        .from('reactions')
        .select('id')
        .eq('target_type', 'post')
        .eq('target_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        const { error: deleteError } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('reactions')
          .insert({ target_type: 'post', target_id: postId, user_id: user.id, reaction_type: 'like' });
        if (insertError) throw insertError;
      }

      // Get current like count for UI state (triggers handle the database update)
      const { count, error: countError } = await supabase
        .from('reactions')
        .select('id', { count: 'exact', head: true })
        .eq('target_type', 'post')
        .eq('target_id', postId);
      if (countError) throw countError;

      return { liked: !existing };
    } catch (error: any) {
      throw error;
    }
  },

  // Get comments for a post
  async getComments(postId: string, limit = 50, from = 0) {
    return supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(from ?? 0, (from ?? 0) + (limit ?? 50) - 1);
  },

  // Add a comment to a post
  async addComment(postId: string, text: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      return supabase
        .from('comments')
        .insert({ post_id: postId, content: text, user_id: user.id });
    } catch (error: any) {
      throw error;
    }
  },

  // Delete a comment (only if user is owner)
  async deleteComment(commentId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      return supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);
    } catch (error: any) {
      throw error;
    }
  },

  // Subscribe to real-time post updates
  subscribeToPosts: (callback: (payload: any) => void) => {
    return supabase
      .channel('posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, callback)
      .subscribe();
  },

  // Subscribe to real-time comment updates
  subscribeToComments: (callback: (payload: any) => void) => {
    return supabase
      .channel('comments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments'
      }, callback)
      .subscribe();
  },

  // Paginated feed
  getFeed: async (limit = 20, from = 0): Promise<ApiResponse<Post[]>> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey ( id, full_name, avatar_url )
        `)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Ranked feed based on freshness, proximity, and engagement
  getRankedFeed: async (lat: number, lng: number, limit = 20, from = 0) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase.rpc('feed_rank', { 
        u: user.id, 
        lat, 
        lng, 
        limit_n: limit, 
        offset_n: from 
      });
      
      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },
};

// Public Rooms API - Using Supabase directly
export const roomsApi = {
  // Get user's rooms
  getUserRooms: async (): Promise<ApiResponse<Room[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          creator:profiles!rooms_created_by_fkey(*),
          room_members!inner(*)
        `)
        .eq('room_members.user_id', user.id);

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Leave a room
  leaveRoom: async (roomId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Get public rooms
  getPublicRooms: async (): Promise<ApiResponse<Room[]>> => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          creator:profiles!rooms_created_by_fkey(*),
          room_members(count)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Get nearby rooms using simple bounding box around lat/lng
  getNearbyRooms: async (params: { latitude: number; longitude: number; delta?: number }): Promise<ApiResponse<Room[]>> => {
    const { latitude, longitude, delta = 0.1 } = params; // ~11km at equator; tune as needed
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          creator:profiles!rooms_created_by_fkey(*),
          room_members(count)
        `)
        .eq('is_private', false)
        .gte('latitude', latitude - delta)
        .lte('latitude', latitude + delta)
        .gte('longitude', longitude - delta)
        .lte('longitude', longitude + delta)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Create a new room
  createRoom: async (roomData: {
    name: string;
    description?: string;
    is_private: boolean;
    max_members?: number;
  }): Promise<ApiResponse<Room>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: roomData.name,
          description: roomData.description,
          creator_id: user.id,
          is_private: roomData.is_private,
          max_members: roomData.max_members || 100,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Join a room
  joinRoom: async (roomId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Subscribe to real-time room updates
  subscribeToRooms: (callback: (payload: any) => void) => {
    return supabase
      .channel('rooms')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rooms'
      }, callback)
      .subscribe();
  },
};

// Public Messages API - Using Supabase directly
export const messagesApi = {
  // Get messages for a room
  getMessages: async (roomId: string, limit = 50, from = 0): Promise<ApiResponse<Message[]>> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .range(from ?? 0, (from ?? 0) + (limit ?? 50) - 1);

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Send a message to a room
  sendMessage: async (roomId: string, content: string): Promise<ApiResponse<Message>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          sender_id: user.id,
          content,
          message_type: 'text',
        })
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Subscribe to real-time message updates
  subscribeToMessages: (roomId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`messages:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, callback)
      .subscribe();
  },
};

// Notifications API - Using Supabase directly
export const notificationsApi = {
  // Create a notification + push
  createNotification: async ({ senderId, receiverId, type, postId, roomId, message }: { 
    senderId: string, receiverId: string, type: string, postId?: string, roomId?: string, message?: string 
  }): Promise<ApiResponse<Notification>> => {
    try {
      // derive a simple title if not provided
      const title = type === 'message' ? 'New Message' :
                    type === 'like'    ? 'New Like' :
                    type === 'comment' ? 'New Comment' :
                    type === 'follow'  ? 'New Follower' : 'Notification';

      const { data: notif, error } = await supabase
        .from('notifications')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          type,
          title,                // <-- REQUIRED by schema
          message: message ?? '',
          post_id: postId,
          room_id: roomId,
        })
        .select()
        .single();
      if (error) throw error;

      // fire push in background (best-effort)
      try {
        await supabase.functions.invoke('sendPush', {
          body: {
            receiver_id: receiverId,
            title,
            body: message ?? title,
            data: { type, post_id: postId, room_id: roomId, notification_id: notif.id },
            priority: type === 'urgent' ? 'high' : 'normal',
          },
        });
      } catch (e) {
        // non-fatal
      }

      return { data: notif, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Get notifications for a user (most recent first) with pagination
  getNotifications: async (userId: string, limit = 20, from = 0): Promise<ApiResponse<Notification[]>> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);
      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Mark a notification as read
  markNotificationAsRead: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('receiver_id', user.id);
      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: false, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Mark all notifications as read for the authenticated user
  markAllAsRead: async (): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: false, error: error?.message || 'Unknown error', success: false };
    }
  },
};

// ============================================================================
// REST API CALLS (Secure Logic, Safety Alerts, Moderation)
// ============================================================================

// Safety Alerts API - Using REST API for secure logic
export const safetyApi = {
  // Send emergency alert
  sendEmergencyAlert: async (alertData: {
    type: 'emergency' | 'warning' | 'info';
    title: string;
    description: string;
    location: {
      latitude: number;
      longitude: number;
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
    affected_area?: number;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await restApiCall('/safety/emergency-alert', {
        method: 'POST',
        body: JSON.stringify(alertData),
      });
      return response;
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Get safety alerts in area
  getSafetyAlerts: async (latitude: number, longitude: number, radius: number = 5000): Promise<ApiResponse<any[]>> => {
    try {
      const response = await restApiCall(`/safety/alerts?lat=${latitude}&lng=${longitude}&radius=${radius}`);
      return response;
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Respond to safety alert
  respondToAlert: async (alertId: string, response: {
    responseType: 'acknowledge' | 'assist' | 'ignore';
    comment?: string;
  }): Promise<ApiResponse<boolean>> => {
    try {
      const apiResponse = await restApiCall(`/safety/respond/${alertId}`, {
        method: 'POST',
        body: JSON.stringify(response),
      });
      return apiResponse;
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },
};

// Moderation API - Using REST API for secure logic
export const moderationApi = {
  // Report content
  reportContent: async (reportData: {
    contentType: 'post' | 'comment' | 'user';
    contentId: string;
    reason: string;
    details?: string;
  }): Promise<ApiResponse<boolean>> => {
    try {
      const response = await restApiCall('/moderation/report', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
      return response;
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Get moderation status
  getModerationStatus: async (contentId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await restApiCall(`/moderation/status/${contentId}`);
      return response;
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },
};

// ============================================================================
// USER & PROFILE API (Mixed - Supabase for basic ops, REST for complex logic)
// ============================================================================

// User API - Using Supabase directly
export const userApi = {
  // Get current user profile
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Search users
  searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  }
};

// Friends API - Using Supabase directly
export const friendsApi = {
  // Get user's friends
  getFriends: async (): Promise<ApiResponse<Friend[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      // Get friends where user_id is the current user
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          friend_id,
          created_at,
          profiles!friend_id (
            id,
            full_name,
            avatar_url,
            email,
            neighborhood,
            bio
          )
        `)
        .eq('user_id', user.id);

      if (friendsError) throw friendsError;

      const friends = friendsData.map((item: any) => ({
        id: item.friend_id,
        user_id: user.id,
        friend_id: item.friend_id,
        created_at: item.created_at,
        friend: {
          id: item.profiles.id,
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
          email: item.profiles.email,
          neighborhood: item.profiles.neighborhood,
          bio: item.profiles.bio,
          created_at: null,
          updated_at: null
        }
      }));

      return { data: friends, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Get pending friend requests
  getPendingRequests: async (): Promise<ApiResponse<FriendRequest[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      // Get pending friend requests where current user is the receiver
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          from_user_id,
          to_user_id,
          status,
          created_at,
          updated_at,
          profiles!friend_requests_from_user_id_fkey (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const requests = data.map((req: any) => ({
        id: req.id,
        from_user_id: req.from_user_id,
        to_user_id: req.to_user_id,
        status: req.status as 'pending',
        created_at: req.created_at,
        updated_at: req.updated_at,
        from_user: {
          id: req.profiles.id,
          full_name: req.profiles.full_name,
          avatar_url: req.profiles.avatar_url,
          email: req.profiles.email,
          created_at: undefined,
          updated_at: undefined
        }
      }));

      return { data: requests, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Send friend request
  sendFriendRequest: async (toUserId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          status: 'pending'
        });

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      // Update the friend request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('to_user_id', user.id);

      if (updateError) throw updateError;

      // Get the friend request details
      const { data: requestData, error: getError } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .eq('id', requestId)
        .single();

      if (getError) throw getError;

      // Add both users as friends
      const { error: friend1Error } = await supabase
        .from('friends')
        .insert({
          user_id: requestData.from_user_id,
          friend_id: requestData.to_user_id
        });

      const { error: friend2Error } = await supabase
        .from('friends')
        .insert({
          user_id: requestData.to_user_id,
          friend_id: requestData.from_user_id
        });

      if (friend1Error || friend2Error) throw friend1Error || friend2Error;

      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Reject friend request
  rejectFriendRequest: async (requestId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('to_user_id', user.id);

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Remove friend
  removeFriend: async (friendId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      // Remove both friendship records
      const { error: error1 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);

      const { error: error2 } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id);

      if (error1 || error2) throw error1 || error2;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  }
};

// ============================================================================
// PRIVATE MESSAGES API (WebSocket + Supabase)
// ============================================================================

// Private Messages API - Using Supabase for persistence, WebSocket for real-time
export const privateMessagesApi = {
  // Get private messages between users
  getPrivateMessages: async (friendId: string, limit = 50, from = 0): Promise<ApiResponse<PrivateMessage[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('dm_messages')
        .select(`
          *,
          sender:profiles!dm_messages_sender_id_fkey(
            full_name,
            avatar_url
          ),
          receiver:profiles!dm_messages_receiver_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .range(from ?? 0, (from ?? 0) + (limit ?? 50) - 1);

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },



  // Send private message (saves to Supabase, real-time via WebSocket)
  sendPrivateMessage: async (receiverId: string, content: string): Promise<ApiResponse<PrivateMessage>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data: threadId, error: rpcErr } = await supabase.rpc('get_or_create_thread', { a: user.id, b: receiverId });
      if (rpcErr) throw rpcErr;

      const { data, error } = await supabase
        .from('dm_messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          message_type: 'text',
        })
        .select(`
          *,
          sender:profiles!dm_messages_sender_id_fkey(
            full_name,
            avatar_url
          ),
          receiver:profiles!dm_messages_receiver_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Mark messages as read
  markAsRead: async (senderId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { error } = await supabase
        .from('dm_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Subscribe to real-time private message updates
  subscribeToPrivateMessages: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`dm_messages:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
        filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
      }, callback)
        .subscribe();
  },
};

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// Export the old messagesAPI for backward compatibility
export const messagesAPI = messagesApi; 