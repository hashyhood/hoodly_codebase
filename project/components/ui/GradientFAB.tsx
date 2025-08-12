import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gradient } from './Gradient';
import { theme, getSpacing, getRadius } from '../../lib/theme';

interface GradientFABProps {
  onPress: () => void;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const GradientFAB: React.FC<GradientFABProps> = ({
  onPress,
  style,
  icon = 'add'
}) => {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    // Bounce animation on appear
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ]
  }));

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Gradient type="fab" style={styles.gradient}>
          <Ionicons name={icon} size={24} color="white" />
        </Gradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: getSpacing('xl'),
    right: getSpacing('xl'),
    zIndex: 1000,
  },
  fab: {
    width: theme.components.fab.size,
    height: theme.components.fab.size,
    borderRadius: theme.components.fab.size / 2,
    elevation: 8,
    shadowColor: theme.shadows.soft.color,
    shadowOffset: { width: 0, height: theme.shadows.soft.offsetY },
    shadowOpacity: 0.3,
    shadowRadius: theme.shadows.soft.blur,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: theme.components.fab.size / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
