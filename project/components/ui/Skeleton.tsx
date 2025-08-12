import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  radius,
  style
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-200, 200]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const skeletonRadius = radius !== undefined ? radius : getRadius('sm');

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: skeletonRadius,
        },
        style
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]} />
    </View>
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; height?: number }> = ({
  lines = 1,
  height = 16
}) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={height}
        style={index === lines - 1 ? { ...styles.textLine, width: '60%' } : styles.textLine}
      />
    ))}
  </View>
);

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Skeleton
    width={size}
    height={size}
    radius={size / 2}
  />
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.cardContainer}>
    <View style={styles.cardHeader}>
      <SkeletonAvatar size={40} />
      <View style={styles.cardHeaderText}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
    <SkeletonText lines={3} />
    <Skeleton width="100%" height={200} radius={getRadius('md')} />
    <View style={styles.cardActions}>
      <Skeleton width={60} height={20} />
      <Skeleton width={60} height={20} />
      <Skeleton width={60} height={20} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: getColor('surface'),
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: getColor('surfaceStrong'),
    opacity: 0.3,
  },
  textContainer: {
    gap: getSpacing('xs'),
  },
  textLine: {
    marginBottom: getSpacing('xs'),
  },
  cardContainer: {
    padding: getSpacing('lg'),
    gap: getSpacing('md'),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  cardHeaderText: {
    flex: 1,
    gap: getSpacing('xs'),
  },
  cardActions: {
    flexDirection: 'row',
    gap: getSpacing('md'),
    marginTop: getSpacing('sm'),
  },
});
