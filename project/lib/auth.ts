import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseUrl, supabaseAnonKey } from './config';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Frontend utility functions
export const authUtils = {
  // Get current user from Supabase
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Check if user is logged in
  async isLoggedIn() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  // Create user profile
  async createUserProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId, ...profileData }])
      .select()
      .single();
    
    return { data, error };
  }
}; 