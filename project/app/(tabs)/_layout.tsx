import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AuthWrapper from '../../components/AuthWrapper';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import SocketEvents from '../../components/ui/SocketEvents';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Load initial unread count
  useEffect(() => {
    if (!user) return;
    
    loadUnreadCount();
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Handle unread count change from real-time updates
  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };
  
  return (
    <AuthWrapper>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: [styles.tabBar, {
              backgroundColor: theme.colors.glass.overlay,
              borderColor: theme.colors.glass.border,
            }],
            tabBarBackground: () => (
              <BlurView intensity={30} style={styles.blurView} />
            ),
            tabBarActiveTintColor: theme.colors.neural.primary,
            tabBarInactiveTintColor: theme.colors.text.tertiary,
            tabBarLabelStyle: styles.tabLabel,
            tabBarIconStyle: styles.tabIcon,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <Text style={[styles.tabIconText, { color, fontSize: size }]}>🏠</Text>
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="discover"
            options={{
              title: 'Discover',
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <Text style={[styles.tabIconText, { color, fontSize: size }]}>🔍</Text>
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: 'Chat',
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <Text style={[styles.tabIconText, { color, fontSize: size }]}>💬</Text>
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: 'Notifications',
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <Text style={[styles.tabIconText, { color, fontSize: size }]}>🔔</Text>
                  {unreadCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: theme.colors.status.error }]}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <View style={styles.iconContainer}>
                  <Text style={[styles.tabIconText, { color, fontSize: size }]}>👤</Text>
                </View>
              ),
            }}
          />
        </Tabs>
        
        {/* Floating Action Button for secondary features */}
        <FloatingActionButton />
        
        {/* Socket events for real-time notifications */}
        <SocketEvents
          onUnreadCountChange={handleUnreadCountChange}
        />
      </View>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    elevation: 0,
    height: 80,
    paddingBottom: 15,
    paddingTop: 10,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIcon: {
    marginBottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconText: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});