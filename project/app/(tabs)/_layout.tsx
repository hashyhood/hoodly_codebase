import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { TabBar } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
// SocketEvents removed - using Supabase Realtime instead
import { usePathname } from 'expo-router';
import { theme, getColor } from '../../lib/theme';

export default function TabLayout() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract current route from pathname with better error handling
  const getCurrentRoute = () => {
    try {
      if (pathname.includes('/discover')) return 'discover';
      if (pathname.includes('/chat')) return 'chat';
      if (pathname.includes('/notifications')) return 'notifications';
      if (pathname.includes('/profile')) return 'profile';
      return 'index';
    } catch (error) {
      logger.warn('Error getting current route:', error);
      return 'index';
    }
  };

  // Tab items configuration
  const tabItems = [
    { key: 'index', icon: 'home' as const, label: 'Home' },
    { key: 'discover', icon: 'compass' as const, label: 'Discover' },
    { key: 'chat', icon: 'chatbubbles' as const, label: 'Chat' },
    { key: 'notifications', icon: 'notifications' as const, label: 'Notifications' },
    { key: 'profile', icon: 'person' as const, label: 'Profile' },
  ];

  const handleTabPress = (key: string) => {
    if (key === 'index') {
      router.push('/(tabs)/' as any);
    } else {
      router.push(`/(tabs)/${key}` as any);
    }
  };
  
  // Load initial unread count with better error handling
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    loadUnreadCount();
  }, [user?.id]);

  const loadUnreadCount = async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) {
        logger.warn('Unread count error:', error);
        setUnreadCount(0);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      logger.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  // Handle unread count change from real-time updates
  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };
  
  return (
    <View style={styles.container}>
      {/* Tab Content - This was missing! */}
      <View style={styles.content}>
        <Slot />
      </View>
      
      {/* Modern Tab Bar */}
      <TabBar 
        items={tabItems}
        activeTab={getCurrentRoute()}
        onTabPress={handleTabPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingBottom: 120, // Increased space for floating nav bar
  },
});
