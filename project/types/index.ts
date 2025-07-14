// Database Types for Hoodly App

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          location: string
          start_time: string
          end_time: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          location: string
          start_time: string
          end_time: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string
          start_time?: string
          end_time?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      event_rsvps: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'going' | 'maybe' | 'not_going'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'going' | 'maybe' | 'not_going'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'going' | 'maybe' | 'not_going'
          created_at?: string
        }
      }
      marketplace_listings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          price: number
          category: string
          image_url: string | null
          status: 'active' | 'sold' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          price: number
          category: string
          image_url?: string | null
          status?: 'active' | 'sold' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          price?: number
          category?: string
          image_url?: string | null
          status?: 'active' | 'sold' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string
          is_private: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          is_private?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          is_private?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'moderator' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
      }
      group_posts: {
        Row: {
          id: string
          group_id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: any
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: any
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: any
          is_read?: boolean
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      private_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          role: 'admin' | 'moderator' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          role?: 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          created_at?: string
        }
      }
      friend_requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      user_locations: {
        Row: {
          id: string
          user_id: string
          latitude: number
          longitude: number
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          latitude: number
          longitude: number
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          latitude?: number
          longitude?: number
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'auto'
          notifications_enabled: boolean
          email_notifications: boolean
          push_notifications: boolean
          privacy_level: 'public' | 'friends' | 'private'
          location_sharing: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'auto'
          notifications_enabled?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          privacy_level?: 'public' | 'friends' | 'private'
          location_sharing?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'auto'
          notifications_enabled?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          privacy_level?: 'public' | 'friends' | 'private'
          location_sharing?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_friends: {
        Args: {
          user_uuid: string
        }
        Returns: {
          friend_id: string
          friend_name: string
          friend_avatar: string
        }[]
      }
      get_pending_friend_requests: {
        Args: {
          user_uuid: string
        }
        Returns: {
          request_id: string
          from_user_id: string
          from_user_name: string
          from_user_avatar: string
          created_at: string
        }[]
      }
      accept_friend_request: {
        Args: {
          request_uuid: string
        }
        Returns: boolean
      }
      reject_friend_request: {
        Args: {
          request_uuid: string
        }
        Returns: boolean
      }
      send_friend_request: {
        Args: {
          to_user_uuid: string
        }
        Returns: boolean
      }
      remove_friend: {
        Args: {
          friend_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// App-specific types
export interface User {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
  user?: User
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user?: User
}

export interface Event {
  id: string
  title: string
  description: string
  location: string
  start_time: string
  end_time: string
  created_by: string
  created_at: string
  updated_at: string
  creator?: User
  rsvp_status?: 'going' | 'maybe' | 'not_going'
  rsvp_count?: number
}

export interface MarketplaceListing {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  category: string
  image_url: string | null
  status: 'active' | 'sold' | 'inactive'
  created_at: string
  updated_at: string
  seller?: User
}

export interface Group {
  id: string
  name: string
  description: string
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
  creator?: User
  member_count?: number
  user_role?: 'admin' | 'moderator' | 'member'
}

export interface GroupPost {
  id: string
  group_id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: any
  is_read: boolean
  created_at: string
}

export interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: User
}

export interface PrivateMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  sender?: User
  receiver?: User
}

export interface Room {
  id: string
  name: string
  description: string | null
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
  creator?: User
  member_count?: number
  user_role?: 'admin' | 'moderator' | 'member'
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  friend?: User
}

export interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  from_user?: User
  to_user?: User
}

export interface UserLocation {
  id: string
  user_id: string
  latitude: number
  longitude: number
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'auto'
  notifications_enabled: boolean
  email_notifications: boolean
  push_notifications: boolean
  privacy_level: 'public' | 'friends' | 'private'
  location_sharing: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  latitude: number
  longitude: number
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Navigation types
export type RootStackParamList = {
  Home: undefined
  Login: undefined
  Register: undefined
  Profile: { userId?: string }
  Chat: { roomId: string }
  PrivateChat: { friendId: string }
  CreatePost: undefined
  CreateEvent: undefined
  CreateListing: undefined
  CreateGroup: undefined
  Search: undefined
  Friends: undefined
  FriendRequests: undefined
  Settings: undefined
}

// Theme types
export interface Theme {
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    error: string
    success: string
    warning: string
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  borderRadius: {
    sm: number
    md: number
    lg: number
  }
} 