import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Supabase credentials from environment (robust fallbacks)
const extras: any = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifest?.extra || {};
const supabaseUrl =
  (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  (extras.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  (process.env.SUPABASE_URL as string | undefined) ||
  (extras.SUPABASE_URL as string | undefined) ||
  (process.env.SUPABASE_URL?.trim?.() as string | undefined);
const supabaseAnonKey =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (extras.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  (process.env.SUPABASE_ANON_KEY as string | undefined) ||
  (extras.SUPABASE_ANON_KEY as string | undefined) ||
  (process.env.SUPABASE_ANON_KEY?.trim?.() as string | undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  // Throw early to prevent silent misconfiguration in production builds
  throw new Error(
    'Supabase environment variables are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env or app.json extra.'
  );
}

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
    // Implement proper error handling instead of mock channel
    // Log the error for debugging
    console.error('Realtime subscription error details:', {
      channelName,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString()
    });
    
    // Return null to indicate subscription failure
    // The calling code should handle this gracefully
    return null;
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
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Storage helpers
export const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return data;
};

/**
 * @deprecated Use createSignedUrl instead for secure file access
 * This function uses public URLs which may expose files to unauthorized access
 */
export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Create a signed URL for secure file access
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise<string> - Signed URL for secure file access
 */
export const createSignedUrl = async (bucket: string, path: string, expiresIn: number = 3600): Promise<string> => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
};

// Realtime subscriptions
export const subscribeToPosts = (callback: (payload: any) => void) => {
  return supabase
    .channel('posts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, callback)
    .subscribe();
};

export const subscribeToMessages = (roomId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages:${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, callback)
    .subscribe();
};

export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${userId}` }, callback)
    .subscribe();
}; 