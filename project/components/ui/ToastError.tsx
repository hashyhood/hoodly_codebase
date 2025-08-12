import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface ToastErrorProps {
  message: string;
  onClose?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const ToastError: React.FC<ToastErrorProps> = ({
  message,
  onClose,
  autoHide = true,
  duration = 4000
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Slide in animation
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });

    // Auto-hide after duration
    if (autoHide) {
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const hideToast = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      if (onClose) {
        runOnJS(onClose)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={theme.blur.card} style={styles.blurContainer}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={20} color={getColor('error')} />
          </View>
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
          <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={getColor('textSecondary')} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    paddingHorizontal: getSpacing('lg'),
    paddingTop: getSpacing('xl'),
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 87, 0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.components.toast.padV,
    paddingHorizontal: theme.components.toast.padH,
  },
  iconContainer: {
    marginRight: getSpacing('sm'),
  },
  message: {
    flex: 1,
    fontSize: theme.typography.body.size,
    color: getColor('textPrimary'),
    lineHeight: theme.typography.body.lineHeight,
    marginRight: getSpacing('sm'),
  },
  closeButton: {
    padding: getSpacing('xs'),
  },
});
