import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface ActionItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  color: string;
}

const actionItems: ActionItem[] = [
  {
    id: 'events',
    title: 'Events',
    icon: '🎉',
    route: '/events',
    color: '#FF6B9D',
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: '🛍️',
    route: '/marketplace',
    color: '#4ECDC4',
  },
  {
    id: 'groups',
    title: 'Groups',
    icon: '👥',
    route: '/groups',
    color: '#45B7D1',
  },
  {
    id: 'map',
    title: 'Map',
    icon: '🗺️',
    route: '/map',
    color: '#96CEB4',
  },
  {
    id: 'safety',
    title: 'Safety',
    icon: '🛡️',
    route: '/safety',
    color: '#FFE66D',
  },
];

export const FloatingActionButton: React.FC = () => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleActionPress = (item: ActionItem) => {
    setIsExpanded(false);
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    
    // Navigate to the route
    router.push(item.route as any);
  };

  return (
    <View style={styles.container}>
      {/* Action Items */}
      {actionItems.map((item, index) => (
        <Animated.View
          key={item.id}
          style={[
            styles.actionItem,
            {
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(index + 1) * 60],
                  }),
                },
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
              opacity: animation,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: item.color },
            ]}
            onPress={() => handleActionPress(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>{item.icon}</Text>
            <Text style={styles.actionTitle}>{item.title}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Main FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.neural.primary,
            transform: [
              {
                rotate: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              },
            ],
          },
        ]}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <BlurView intensity={20} style={styles.fabBlur}>
          <Text style={styles.fabIcon}>+</Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  actionItem: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
}); 