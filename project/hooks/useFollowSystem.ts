import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FollowSystemReturn {
  isFollowing: boolean;
  followCount: number;
  followerCount: number;
  isLoading: boolean;
  error: string | null;
  followUser: () => Promise<void>;
  unfollowUser: () => Promise<void>;
  refreshFollowStatus: () => Promise<void>;
}

interface UserFollowStatsReturn {
  followerCount: number;
  followingCount: number;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export const useFollowSystem = (
  currentUserId: string | null,
  targetUserId: string | null
): FollowSystemReturn => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFollowStatus = async () => {
    if (!currentUserId || !targetUserId) return;

    try {
      const { data, error } = await supabase.rpc('check_is_following', {
        follower_user_id: currentUserId,
        target_user_id: targetUserId
      });

      if (error) throw error;
      setIsFollowing(data || false);
    } catch (err) {
      console.error('Error checking follow status:', err);
      setError('Failed to check follow status');
    }
  };

  const getFollowCounts = async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase.rpc('get_follow_counts', {
        user_id: targetUserId
      });

      if (error) throw error;
      if (data) {
        setFollowCount(data.following_count || 0);
        setFollowerCount(data.follower_count || 0);
      }
    } catch (err) {
      console.error('Error getting follow counts:', err);
      setError('Failed to get follow counts');
    }
  };

  const followUser = async () => {
    if (!currentUserId || !targetUserId) {
      setError('User IDs are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.rpc('follow_user_safe', {
        follower_user_id: currentUserId,
        target_user_id: targetUserId
      });

      if (error) throw error;
      
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
    } catch (err) {
      console.error('Error following user:', err);
      setError('Failed to follow user');
    } finally {
      setIsLoading(false);
    }
  };

  const unfollowUser = async () => {
    if (!currentUserId || !targetUserId) {
      setError('User IDs are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.rpc('unfollow_user_safe', {
        follower_user_id: currentUserId,
        target_user_id: targetUserId
      });

      if (error) throw error;
      
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError('Failed to unfollow user');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFollowStatus = async () => {
    await Promise.all([checkFollowStatus(), getFollowCounts()]);
  };

  useEffect(() => {
    if (currentUserId && targetUserId) {
      refreshFollowStatus();
    }
  }, [currentUserId, targetUserId]);

  return {
    isFollowing,
    followCount,
    followerCount,
    isLoading,
    error,
    followUser,
    unfollowUser,
    refreshFollowStatus
  };
};

export const useUserFollowStats = (userId: string | null): UserFollowStatsReturn => {
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFollowStats = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_follow_counts', {
        user_id: userId
      });

      if (error) throw error;
      
      if (data) {
        setFollowerCount(data.follower_count || 0);
        setFollowingCount(data.following_count || 0);
      }
    } catch (err) {
      console.error('Error getting user follow stats:', err);
      setError('Failed to get follow stats');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    await getFollowStats();
  };

  useEffect(() => {
    if (userId) {
      getFollowStats();
    }
  }, [userId]);

  return {
    followerCount,
    followingCount,
    isLoading,
    error,
    refreshStats
  };
}; 