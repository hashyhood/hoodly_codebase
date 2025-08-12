import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FloatingNavBarProps {
  currentRoute?: string;
  unreadCount?: number;
}

const FloatingNavBar: React.FC<FloatingNavBarProps> = ({ currentRoute, unreadCount = 0 }) => {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(currentRoute || 'index');
  const [slideAnimation] = useState(new Animated.Value(0));

  const tabs = [
    { key: 'index', icon: 'home', label: 'Feed', route: '/(tabs)' },
    { key: 'discover', icon: 'compass', label: 'Discover', route: '/(tabs)/discover' },
    { key: 'chat', icon: 'chatbubbles', label: 'Chat', route: '/(tabs)/chat' },
    { key: 'notifications', icon: 'notifications', label: 'Alerts', route: '/(tabs)/notifications' },
    { key: 'profile', icon: 'person', label: 'Profile', route: '/(tabs)/profile' },
  ];

  useEffect(() => {
    if (currentRoute) {
      setActiveTab(currentRoute);
      // Animate to the correct position
      const tabIndex = tabs.findIndex(t => t.key === currentRoute);
      if (tabIndex !== -1) {
        Animated.spring(slideAnimation, {
          toValue: tabIndex * (width / tabs.length),
          useNativeDriver: false,
        }).start();
      }
    }
  }, [currentRoute]);

  const handleTabPress = (tab: typeof tabs[0]) => {
    try {
      setActiveTab(tab.key);
      
      // Use push instead of replace to prevent navigation issues
      router.push(tab.route as any);
      
      // Animate the active tab
      const tabIndex = tabs.findIndex(t => t.key === tab.key);
      if (tabIndex !== -1) {
        Animated.spring(slideAnimation, {
          toValue: tabIndex * (width / tabs.length),
          useNativeDriver: false,
        }).start();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to basic navigation
      router.push(tab.route as any);
    }
  };

  const getTabStyle = (tab: typeof tabs[0]) => {
    const isActive = activeTab === tab.key;
    return {
      ...styles.tab,
      backgroundColor: isActive 
        ? 'rgba(99, 102, 241, 0.9)'
        : 'transparent',
    };
  };

  const getIconStyle = (tab: typeof tabs[0]) => {
    const isActive = activeTab === tab.key;
    return {
      ...styles.tabIcon,
      color: isActive 
        ? '#FFFFFF'
        : '#6B7280',
    };
  };

  const getLabelStyle = (tab: typeof tabs[0]) => {
    const isActive = activeTab === tab.key;
    return {
      ...styles.tabLabel,
      color: isActive 
        ? '#FFFFFF'
        : '#6B7280',
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
      <Animated.View 
        style={[
          styles.slider,
          {
            backgroundColor: 'rgba(99, 102, 241, 0.9)',
            transform: [{ translateX: slideAnimation }],
            width: width / tabs.length,
          }
        ]} 
      />
      
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={getTabStyle(tab)}
          onPress={() => handleTabPress(tab)}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={tab.icon as any} 
                size={24} 
                style={getIconStyle(tab)} 
              />
              {tab.key === 'notifications' && unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={getLabelStyle(tab)}>{tab.label}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px)',
  },
  slider: {
    position: 'absolute',
    height: '100%',
    borderRadius: 25,
    zIndex: -1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 25,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  tabIcon: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
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

export default FloatingNavBar; 