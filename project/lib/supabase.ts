import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase credentials
const supabaseUrl = 'https://ikeocbgjivpifvwzllkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZW9jYmdqaXZwaWZ2d3psbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzkwMDMsImV4cCI6MjA2NzkxNTAwM30.qUuQhufz_ddMI0c__i7SovJZVU74TXQc1OPOV99aRl0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});

// Error handling for Supabase Realtime
export const createRealtimeSubscription = (channelName: string, callback: (payload: any) => void) => {
  try {
    const channel = supabase.channel(channelName);
    
    // Add error handling for connection issues
    channel.on('system', { event: 'disconnect' }, (payload) => {
      console.warn('Supabase Realtime disconnected:', payload);
    });
    
    channel.on('system', { event: 'reconnect' }, (payload) => {
      console.log('Supabase Realtime reconnected:', payload);
    });
    
    // Add timeout handling
    const timeoutId = setTimeout(() => {
      console.warn('Supabase Realtime connection timeout - this is normal for inactive projects');
    }, 10000); // 10 second timeout
    
    channel.subscribe((status) => {
      clearTimeout(timeoutId);
      
      if (status === 'SUBSCRIBED') {
        console.log(`Supabase Realtime subscribed to ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.warn(`Supabase Realtime error for ${channelName} - this is normal for inactive projects`);
      } else if (status === 'TIMED_OUT') {
        console.warn(`Supabase Realtime timeout for ${channelName} - this is normal for inactive projects`);
      }
    });
    
    return channel;
  } catch (error) {
    console.warn('Failed to create Supabase Realtime subscription:', error);
    // Return a mock channel that doesn't block rendering
    return {
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    };
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          neighborhood: string | null;
          phone: string | null;
          bio: string | null;
          date_of_birth: string | null;
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          is_verified: boolean;
          last_seen: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          neighborhood?: string | null;
          phone?: string | null;
          bio?: string | null;
          date_of_birth?: string | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          is_verified?: boolean;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          neighborhood?: string | null;
          phone?: string | null;
          bio?: string | null;
          date_of_birth?: string | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          is_verified?: boolean;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          location: any | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          location?: any | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          location?: any | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          location: any;
          start_time: string;
          end_time: string;
          organizer_id: string;
          image_url: string | null;
          max_attendees: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          location: any;
          start_time: string;
          end_time: string;
          organizer_id: string;
          image_url?: string | null;
          max_attendees?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location?: any;
          start_time?: string;
          end_time?: string;
          organizer_id?: string;
          image_url?: string | null;
          max_attendees?: number | null;
          created_at?: string;
        };
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: 'going' | 'maybe' | 'not_going';
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status: 'going' | 'maybe' | 'not_going';
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: 'going' | 'maybe' | 'not_going';
          created_at?: string;
        };
      };
      marketplace_listings: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          category: string;
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          seller_id: string;
          image_urls: string[];
          location: any;
          status: 'active' | 'sold' | 'expired';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: number;
          category: string;
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          seller_id: string;
          image_urls?: string[];
          location?: any;
          status?: 'active' | 'sold' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price?: number;
          category?: string;
          condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          seller_id?: string;
          image_urls?: string[];
          location?: any;
          status?: 'active' | 'sold' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          creator_id: string;
          image_url: string | null;
          is_private: boolean;
          member_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          creator_id: string;
          image_url?: string | null;
          is_private?: boolean;
          member_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          creator_id?: string;
          image_url?: string | null;
          is_private?: boolean;
          member_count?: number;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'admin' | 'moderator' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'admin' | 'moderator' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: 'admin' | 'moderator' | 'member';
          joined_at?: string;
        };
      };
      group_posts: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'post' | 'comment' | 'like' | 'event' | 'marketplace' | 'group';
          reference_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'post' | 'comment' | 'like' | 'event' | 'marketplace' | 'group';
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'post' | 'comment' | 'like' | 'event' | 'marketplace' | 'group';
          reference_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          content: string;
          message_type: 'text' | 'image' | 'file' | 'location';
          file_url: string | null;
          location_data: any | null;
          is_edited: boolean;
          edited_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'file' | 'location';
          file_url?: string | null;
          location_data?: any | null;
          is_edited?: boolean;
          edited_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'file' | 'location';
          file_url?: string | null;
          location_data?: any | null;
          is_edited?: boolean;
          edited_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      private_messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          message_type: 'text' | 'image' | 'file' | 'location';
          file_url: string | null;
          location_data: any | null;
          is_read: boolean;
          read_at: string | null;
          is_edited: boolean;
          edited_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'file' | 'location';
          file_url?: string | null;
          location_data?: any | null;
          is_read?: boolean;
          read_at?: string | null;
          is_edited?: boolean;
          edited_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'file' | 'location';
          file_url?: string | null;
          location_data?: any | null;
          is_read?: boolean;
          read_at?: string | null;
          is_edited?: boolean;
          edited_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          creator_id: string;
          is_private: boolean;
          max_members: number;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          creator_id: string;
          is_private?: boolean;
          max_members?: number;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          creator_id?: string;
          is_private?: boolean;
          max_members?: number;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      room_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          role: 'admin' | 'moderator' | 'member';
          joined_at: string;
          last_read_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          role?: 'admin' | 'moderator' | 'member';
          joined_at?: string;
          last_read_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          role?: 'admin' | 'moderator' | 'member';
          joined_at?: string;
          last_read_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          message: string | null;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      user_locations: {
        Row: {
          id: string;
          user_id: string;
          location: any;
          accuracy: number | null;
          is_public: boolean;
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location: any;
          accuracy?: number | null;
          is_public?: boolean;
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location?: any;
          accuracy?: number | null;
          is_public?: boolean;
          last_updated?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          notification_settings: any;
          privacy_settings: any;
          theme_preference: 'light' | 'dark' | 'system';
          language_preference: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_settings?: any;
          privacy_settings?: any;
          theme_preference?: 'light' | 'dark' | 'system';
          language_preference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_settings?: any;
          privacy_settings?: any;
          theme_preference?: 'light' | 'dark' | 'system';
          language_preference?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Storage helpers
export const storage = {
  uploadImage: async (file: any, path: string) => {
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, file);
    return { data, error };
  },

  getPublicUrl: (path: string) => {
    return supabase.storage.from('uploads').getPublicUrl(path);
  },

  deleteImage: async (path: string) => {
    const { error } = await supabase.storage
      .from('uploads')
      .remove([path]);
    return { error };
  },
};

// Real-time subscriptions
export const realtime = {
  subscribeToPosts: (callback: (payload: any) => void) => {
    return supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
      .subscribe();
  },

  subscribeToComments: (callback: (payload: any) => void) => {
    return supabase
      .channel('comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, callback)
      .subscribe();
  },

  subscribeToMessages: (roomId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`messages:${roomId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, 
        callback
      )
      .subscribe();
  },

  subscribeToPrivateMessages: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`private_messages:${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'private_messages', filter: `sender_id=eq.${userId} OR receiver_id=eq.${userId}` }, 
        callback
      )
      .subscribe();
  },

  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
        callback
      )
      .subscribe();
  },

  subscribeToFriendRequests: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`friend_requests:${userId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friend_requests', filter: `sender_id=eq.${userId} OR receiver_id=eq.${userId}` }, 
        callback
      )
      .subscribe();
  },
}; 