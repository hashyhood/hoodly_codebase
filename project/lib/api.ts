import { supabase } from './supabase';
import { 
  User, Post, Comment, Event, MarketplaceListing, Group, GroupPost, 
  Notification, Message, PrivateMessage, Room, Friend, FriendRequest,
  UserLocation, UserPreferences, ApiResponse, PaginatedResponse 
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
          profiles (
            full_name,
            avatar_url
          ),
          comments (count),
          likes (count)
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

  // Toggle like for a post (optimistic, updates likes array and like_count)
  async toggleLike(postId: string, userId: string) {
    // Get current likes
    const { data: post, error } = await supabase
      .from('posts')
      .select('likes, like_count')
      .eq('id', postId)
      .single();
    if (error || !post) throw error || new Error('Post not found');
    let likes: string[] = post.likes || [];
    let like_count: number = post.like_count || 0;
    const liked = likes.includes(userId);
    if (liked) {
      likes = likes.filter((id: string) => id !== userId);
      like_count = Math.max(0, like_count - 1);
    } else {
      likes = [...likes, userId];
      like_count = like_count + 1;
    }
    // Update post
    const { error: updateError } = await supabase
      .from('posts')
      .update({ likes, like_count })
      .eq('id', postId);
    if (updateError) throw updateError;
    return { liked: !liked, like_count };
  },

  // Get comments for a post
  async getComments(postId: string) {
    return supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
  },

  // Add a comment to a post
  async addComment(postId: string, text: string, userId: string) {
    return supabase
      .from('comments')
      .insert({ post_id: postId, text, user_id: userId });
  },

  // Delete a comment (only if user is owner)
  async deleteComment(commentId: string, userId: string) {
    return supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
  },

  // Subscribe to real-time post updates
  subscribeToPosts: (callback: (payload: any) => void) => {
    return supabase
      .channel('posts')
      .on('postgres_changes', {
        event: '*',
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
        event: '*',
        schema: 'public',
        table: 'comments'
      }, callback)
      .subscribe();
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
        event: '*',
        schema: 'public',
        table: 'rooms'
      }, callback)
      .subscribe();
  },
};

// Public Messages API - Using Supabase directly
export const messagesApi = {
  // Get messages for a room
  getMessages: async (roomId: string): Promise<ApiResponse<Message[]>> => {
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
        .order('created_at', { ascending: true });

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
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, callback)
      .subscribe();
  },
};

// Notifications API - Using Supabase directly
export const notificationsApi = {
  // Create a notification
  createNotification: async ({ userId, type, data }: { userId: string, type: string, data: any }): Promise<ApiResponse<Notification>> => {
    try {
      const { data: notif, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          data,
        })
        .select()
        .single();
      if (error) throw error;
      return { data: notif, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Get notifications for a user (most recent first)
  getNotifications: async (userId: string): Promise<ApiResponse<Notification[]>> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Mark a notification as read
  markNotificationAsRead: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: false, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
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

      const { data, error } = await supabase
        .rpc('get_user_friends', { user_uuid: user.id });

      if (error) throw error;

      const friends = data.map((friend: any) => ({
        id: friend.friend_id,
          user_id: user.id,
        friend_id: friend.friend_id,
        created_at: new Date().toISOString(),
        friend: {
          id: friend.friend_id,
          full_name: friend.friend_name,
          avatar_url: friend.friend_avatar,
          email: null,
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

      const { data, error } = await supabase
        .rpc('get_pending_friend_requests', { user_uuid: user.id });

      if (error) throw error;
      
      const requests = data.map((req: any) => ({
        id: req.request_id,
        from_user_id: req.from_user_id,
        to_user_id: user.id,
        status: 'pending' as const,
        created_at: req.created_at,
        updated_at: req.created_at,
        from_user: {
          id: req.from_user_id,
          full_name: req.from_user_name,
          avatar_url: req.from_user_avatar,
          email: null,
          created_at: null,
          updated_at: null
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
      const { data, error } = await supabase
        .rpc('send_friend_request', { to_user_uuid: toUserId });

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data, error } = await supabase
        .rpc('accept_friend_request', { request_uuid: requestId });

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Reject friend request
  rejectFriendRequest: async (requestId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data, error } = await supabase
        .rpc('reject_friend_request', { request_uuid: requestId });

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Unknown error', success: false };
    }
  },

  // Remove friend
  removeFriend: async (friendId: string): Promise<ApiResponse<boolean>> => {
    try {
      const { data, error } = await supabase
        .rpc('remove_friend', { friend_uuid: friendId });

      if (error) throw error;
      return { data, error: null, success: true };
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
  getPrivateMessages: async (friendId: string): Promise<ApiResponse<PrivateMessage[]>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated', success: false };
      }

      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:profiles!private_messages_sender_id_fkey(
            full_name,
            avatar_url
          ),
          receiver:profiles!private_messages_receiver_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

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

      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          message_type: 'text',
          is_read: false,
        })
        .select(`
          *,
          sender:profiles!private_messages_sender_id_fkey(
            full_name,
            avatar_url
          ),
          receiver:profiles!private_messages_receiver_id_fkey(
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
        .from('private_messages')
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
      .channel(`private_messages:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'private_messages',
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