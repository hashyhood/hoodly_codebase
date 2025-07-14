import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

interface SkeletonCardProps {
  lines?: number;
  avatar?: boolean;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width: skeletonWidth = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}) => {
  const { theme } = useTheme();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, []);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.skeleton, { width: skeletonWidth, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            theme.colors.glass.primary,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  lines = 3, 
  avatar = false,
  style 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.glass.primary }, style]}>
      {avatar && (
        <View style={styles.avatarContainer}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <View style={styles.avatarContent}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
          </View>
        </View>
      )}
      
      <View style={styles.content}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === 0 ? '90%' : index === lines - 1 ? '60%' : '100%'}
            height={index === 0 ? 18 : 14}
            style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
          />
        ))}
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ marginBottom: 16 }} />
      ))}
    </View>
  );
};

export const SkeletonGrid: React.FC<{ columns?: number; count?: number }> = ({ 
  columns = 2, 
  count = 6 
}) => {
  return (
    <View style={[styles.grid, { gap: 12 }]}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          width={`${100 / columns - 4}%`}
          height={120}
          borderRadius={16}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContent: {
    flex: 1,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
}); 