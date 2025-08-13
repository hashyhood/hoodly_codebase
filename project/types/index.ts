// Database Types for Hoodly App - Updated to match existing database structure

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          phone_number: string | null;
          date_of_birth: string | null;
          gender: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_name: string | null;
          neighborhood: string | null;
          interests: string[] | null;
          is_private: boolean | null;
          is_verified: boolean | null;
          profile_visibility: string | null;
          followers_count: number | null;
          following_count: number | null;
          posts_count: number | null;
          last_active: string | null;
          notification_preferences: any | null;
          created_at: string | null;
          updated_at: string | null;
          location: string | null;
          website: string | null;
          phone: string | null;
          last_seen: string | null;
          status: string | null;
          cover_image_url: string | null;
          role: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone_number?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          neighborhood?: string | null;
          interests?: string[] | null;
          is_private?: boolean | null;
          is_verified?: boolean | null;
          profile_visibility?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          posts_count?: number | null;
          last_active?: string | null;
          notification_preferences?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          location?: string | null;
          website?: string | null;
          phone?: string | null;
          last_seen?: string | null;
          status?: string | null;
          cover_image_url?: string | null;
          role?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone_number?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          neighborhood?: string | null;
          interests?: string[] | null;
          is_private?: boolean | null;
          is_verified?: boolean | null;
          profile_visibility?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          posts_count?: number | null;
          last_active?: string | null;
          notification_preferences?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          location?: string | null;
          website?: string | null;
          phone?: string | null;
          last_seen?: string | null;
          status?: string | null;
          cover_image_url?: string | null;
          role?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          media_urls: string[] | null;
          location_lat: number | null;
          location_lng: number | null;
          location_name: string | null;
          proximity: string | null;
          tags: string[] | null;
          likes_count: number | null;
          comments_count: number | null;
          shares_count: number | null;
          visibility: string | null;
          post_type: string | null;
          is_anonymous: boolean | null;
          is_ai_bot: boolean | null;
          group_id: string | null;
          event_id: string | null;
          marketplace_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          location: string | null;
          media_type: string | null;
          is_active: boolean | null;
          images: string[] | null;
          views_count: number | null;
          reach_count: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          media_urls?: string[] | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          proximity?: string | null;
          tags?: string[] | null;
          likes_count?: number | null;
          comments_count?: number | null;
          shares_count?: number | null;
          visibility?: string | null;
          post_type?: string | null;
          is_anonymous?: boolean | null;
          is_ai_bot?: boolean | null;
          group_id?: string | null;
          event_id?: string | null;
          marketplace_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          location?: string | null;
          media_type?: string | null;
          is_active?: boolean | null;
          images?: string[] | null;
          views_count?: number | null;
          reach_count?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          media_urls?: string[] | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          proximity?: string | null;
          tags?: string[] | null;
          likes_count?: number | null;
          comments_count?: number | null;
          shares_count?: number | null;
          visibility?: string | null;
          post_type?: string | null;
          is_anonymous?: boolean | null;
          is_ai_bot?: boolean | null;
          group_id?: string | null;
          event_id?: string | null;
          marketplace_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          location?: string | null;
          media_type?: string | null;
          is_active?: boolean | null;
          images?: string[] | null;
          views_count?: number | null;
          reach_count?: number | null;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          likes_count: number | null;
          is_anonymous: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          parent_id?: string | null;
          likes_count?: number | null;
          is_anonymous?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          parent_id?: string | null;
          likes_count?: number | null;
          is_anonymous?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          sender_id: string | null;
          receiver_id: string | null;
          type: string;
          post_id: string | null;
          room_id: string | null;
          message: string | null;
          is_read: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          title: string | null;
          user_id: string | null;
          reference_id: string | null;
        };
        Insert: {
          id?: string;
          sender_id?: string | null;
          receiver_id?: string | null;
          type: string;
          post_id?: string | null;
          room_id?: string | null;
          message?: string | null;
          is_read?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          title?: string | null;
          user_id?: string | null;
          reference_id?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string | null;
          receiver_id?: string | null;
          type?: string;
          post_id?: string | null;
          room_id?: string | null;
          message?: string | null;
          is_read?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          title?: string | null;
          user_id?: string | null;
          reference_id?: string | null;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          content: string | null;
          media_url: string | null;
          media_type: string | null;
          duration: number | null;
          views_count: number | null;
          expires_at: string;
          privacy: string | null;
          allowed_users: string[] | null;
          blocked_users: string[] | null;
          is_deleted: boolean | null;
          created_at: string | null;
          is_active: boolean | null;
          caption: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          duration?: number | null;
          views_count?: number | null;
          expires_at: string;
          privacy?: string | null;
          allowed_users?: string[] | null;
          blocked_users?: string[] | null;
          is_deleted?: boolean | null;
          created_at?: string | null;
          is_active?: boolean | null;
          caption?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          duration?: number | null;
          views_count?: number | null;
          expires_at?: string;
          privacy?: string | null;
          allowed_users?: string[] | null;
          blocked_users?: string[] | null;
          is_deleted?: boolean | null;
          created_at?: string | null;
          is_active?: boolean | null;
          caption?: string | null;
        };
      };
      story_views: {
        Row: {
          id: string;
          story_id: string;
          viewer_id: string;
          viewed_at: string | null;
        };
        Insert: {
          id?: string;
          story_id: string;
          viewer_id: string;
          viewed_at?: string | null;
        };
        Update: {
          id?: string;
          story_id?: string;
          viewer_id?: string;
          viewed_at?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          event_name: string;
          user_id: string | null;
          properties: any | null;
          timestamp: string | null;
          platform: string | null;
          app_version: string | null;
          session_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_name: string;
          user_id?: string | null;
          properties?: any | null;
          timestamp?: string | null;
          platform?: string | null;
          app_version?: string | null;
          session_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          event_name?: string;
          user_id?: string | null;
          properties?: any | null;
          timestamp?: string | null;
          platform?: string | null;
          app_version?: string | null;
          session_id?: string | null;
          created_at?: string | null;
        };
      };
      event_attendees: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: string | null;
          created_at?: string | null;
        };
      };
      marketplace_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          price: number | null;
          currency: string | null;
          category: string;
          condition: string | null;
          images: string[] | null;
          location_lat: number | null;
          location_lng: number | null;
          location_name: string | null;
          status: string | null;
          is_negotiable: boolean | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          price?: number | null;
          currency?: string | null;
          category: string;
          condition?: string | null;
          images?: string[] | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          status?: string | null;
          is_negotiable?: boolean | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          price?: number | null;
          currency?: string | null;
          category?: string;
          condition?: string | null;
          images?: string[] | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          status?: string | null;
          is_negotiable?: boolean | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          avatar_url: string | null;
          created_by: string;
          is_public: boolean | null;
          is_private: boolean | null;
          location_lat: number | null;
          location_lng: number | null;
          location_name: string | null;
          radius_miles: number | null;
          member_count: number | null;
          post_count: number | null;
          max_members: number | null;
          group_type: string | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          avatar_url?: string | null;
          created_by: string;
          is_public?: boolean | null;
          is_private?: boolean | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          radius_miles?: number | null;
          member_count?: number | null;
          post_count?: number | null;
          max_members?: number | null;
          group_type?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          avatar_url?: string | null;
          created_by?: string;
          is_public?: boolean | null;
          is_private?: boolean | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          radius_miles?: number | null;
          member_count?: number | null;
          post_count?: number | null;
          max_members?: number | null;
          group_type?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_active?: boolean | null;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string | null;
          joined_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: string | null;
          joined_at?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: string | null;
          joined_at?: string | null;
          is_active?: boolean | null;
        };
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          content: string;
          message_type: string | null;
          file_url: string | null;
          location_data: any | null;
          is_edited: boolean | null;
          edited_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          sender_id: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          content: string;
          message_type?: string | null;
          file_url?: string | null;
          location_data?: any | null;
          is_edited?: boolean | null;
          edited_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          sender_id?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          content?: string;
          message_type?: string | null;
          file_url?: string | null;
          location_data?: any | null;
          is_edited?: boolean | null;
          edited_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          sender_id?: string | null;
        };
      };
      dm_threads: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          created_at?: string | null;
        };
      };
      dm_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          message_type: string | null;
          is_read: boolean | null;
          metadata: any | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          message_type?: string | null;
          is_read?: boolean | null;
          metadata?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          message_type?: string | null;
          is_read?: boolean | null;
          metadata?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      safety_alerts: {
        Row: {
          id: string;
          user_id: string;
          type: 'emergency' | 'warning' | 'info';
          message: string;
          location: any | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'emergency' | 'warning' | 'info';
          message: string;
          location?: any | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'emergency' | 'warning' | 'info';
          message?: string;
          location?: any | null;
          created_at?: string | null;
        };
      };
      invite_links: {
        Row: {
          id: string;
          code: string;
          type: 'user' | 'group' | 'event';
          created_by: string;
          created_at: string | null;
          expires_at: string | null;
          max_uses: number | null;
          current_uses: number | null;
          is_active: boolean | null;
          metadata: any | null;
        };
        Insert: {
          id?: string;
          code: string;
          type: 'user' | 'group' | 'event';
          created_by: string;
          created_at?: string | null;
          expires_at?: string | null;
          max_uses?: number | null;
          current_uses?: number | null;
          is_active?: boolean | null;
          metadata?: any | null;
        };
        Update: {
          id?: string;
          code?: string;
          type?: 'user' | 'group' | 'event';
          created_by?: string;
          created_at?: string | null;
          expires_at?: string | null;
          max_uses?: number | null;
          current_uses?: number | null;
          is_active?: boolean | null;
          metadata?: any | null;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          is_private: boolean | null;
          max_members: number | null;
          group_id: string | null;
          image_url: string | null;
          created_at: string | null;
          updated_at: string | null;
          member_count: number | null;
          last_message: string | null;
          latitude: number | null;
          longitude: number | null;
          city: string | null;
          neighborhood: string | null;
          creator_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by: string;
          is_private?: boolean | null;
          max_members?: number | null;
          group_id?: string | null;
          image_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          member_count?: number | null;
          last_message?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
          neighborhood?: string | null;
          creator_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          is_private?: boolean | null;
          max_members?: number | null;
          group_id?: string | null;
          image_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          member_count?: number | null;
          last_message?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
          neighborhood?: string | null;
          creator_id?: string | null;
        };
      };
      room_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          role: string | null;
          joined_at: string | null;
          last_read_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          role?: string | null;
          joined_at?: string | null;
          last_read_at?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          role?: string | null;
          joined_at?: string | null;
          last_read_at?: string | null;
          is_active?: boolean | null;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string | null;
          friend_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          friend_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          friend_id?: string | null;
          created_at?: string | null;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string | null;
          receiver_id: string | null;
          status: string | null;
          message: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id?: string | null;
          receiver_id?: string | null;
          status?: string | null;
          message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string | null;
          receiver_id?: string | null;
          status?: string | null;
          message?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_locations: {
        Row: {
          id: string;
          user_id: string | null;
          latitude: number | null;
          longitude: number | null;
          city: string | null;
          neighborhood: string | null;
          is_visible: boolean | null;
          privacy_level: string | null;
          last_updated: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
          neighborhood?: string | null;
          is_visible?: boolean | null;
          privacy_level?: string | null;
          last_updated?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
          neighborhood?: string | null;
          is_visible?: boolean | null;
          privacy_level?: string | null;
          last_updated?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: string | null;
          language: string | null;
          timezone: string | null;
          privacy_settings: any | null;
          notification_settings: any | null;
          created_at: string | null;
          updated_at: string | null;
          location_privacy_settings: any | null;
          location_notification_settings: any | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string | null;
          language?: string | null;
          timezone?: string | null;
          privacy_settings?: any | null;
          notification_settings?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          location_privacy_settings?: any | null;
          location_notification_settings?: any | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string | null;
          language?: string | null;
          timezone?: string | null;
          privacy_settings?: any | null;
          notification_settings?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          location_privacy_settings?: any | null;
          location_notification_settings?: any | null;
        };
      };
    };
  };
}

// Additional interfaces for the app
export interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  is_private: boolean;
  created_at: string;
  bio?: string;
  neighborhood?: string;
  location?: string;
  phone?: string;
  website?: string;
  interests?: string[];
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  last_active?: string;
  is_verified?: boolean;
  profile_visibility?: string;
  cover_image_url?: string;
  role?: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  user?: User;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
  sender_full_name?: string;
  sender_avatar_url?: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: string;
  file_url?: string;
  location_data?: any;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at?: string;
  sender_id: string;
}

export interface Conversation {
  other_user_id: string;
  other_username: string;
  other_full_name: string;
  other_avatar_url?: string;
  last_message_content: string;
  last_message_time: string;
  unread_count: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  location: string;
  latitude?: number;
  longitude?: number;
  max_members: number;
  tags: string[];
  creator_id: string;
  member_count: number;
  creator_username?: string;
  creator_full_name?: string;
  role?: string;
  joined_at?: string;
}

export interface GroupMember {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  joined_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'friend_request';
  data?: {
    sender_id?: string;
    post_id?: string;
    room_id?: string;
    message?: string;
  };
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  sender?: User;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
}

// Additional interfaces for missing types
export interface Room {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  member_count?: number;
  max_members?: number;
  category?: string;
  tags?: string[];
  avatar_url?: string;
  cover_image_url?: string;
  last_message?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  neighborhood?: string;
  creator_id?: string;
  image_url?: string;
  group_id?: string;
}

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

// Additional interfaces for complete-api.ts
export interface Story {
  id: string;
  user_id: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  duration?: number;
  views_count?: number;
  expires_at: string;
  privacy?: string;
  allowed_users?: string[];
  blocked_users?: string[];
  is_deleted?: boolean;
  created_at: string;
  is_active?: boolean;
  caption?: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  message?: string;
  created_at: string;
  updated_at?: string;
  from_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
    created_at?: string;
    updated_at?: string;
  };
}

export interface Event {
  id: string;
  event_name: string;
  user_id?: string;
  properties?: any;
  timestamp?: string;
  platform?: string;
  app_version?: string;
  session_id?: string;
  created_at?: string;
}

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  category: string;
  condition?: string;
  images?: string[];
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  status?: string;
  is_negotiable?: boolean;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

// Add proper interfaces for real-time payloads
export interface RealTimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  table: string;
  schema: string;
}

export interface NotificationPayload extends RealTimePayload<Notification> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Notification;
  old?: Notification;
}

export interface MessagePayload extends RealTimePayload<Message> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Message;
  old?: Message;
}

export interface PrivateMessagePayload extends RealTimePayload<PrivateMessage> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: PrivateMessage;
  old?: PrivateMessage;
}

// Subscription status types
export type SubscriptionStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

// API Response types
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
} 