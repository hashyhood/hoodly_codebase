import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface GestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onLongPress?: () => void;
  enableGestures?: boolean;
}

export const GestureHandler: React.FC<GestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onLongPress,
  enableGestures = true,
}) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const SWIPE_THRESHOLD = 100;
  const SWIPE_VELOCITY_THRESHOLD = 500;

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;

      // Determine swipe direction
      const isHorizontalSwipe = Math.abs(translationX) > Math.abs(translationY);
      const isVerticalSwipe = Math.abs(translationY) > Math.abs(translationX);

      if (isHorizontalSwipe && Math.abs(translationX) > SWIPE_THRESHOLD) {
        if (translationX > 0 && onSwipeRight) {
          triggerSwipeAnimation('right');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeRight();
        } else if (translationX < 0 && onSwipeLeft) {
          triggerSwipeAnimation('left');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeLeft();
        }
      } else if (isVerticalSwipe && Math.abs(translationY) > SWIPE_THRESHOLD) {
        if (translationY > 0 && onSwipeDown) {
          triggerSwipeAnimation('down');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeDown();
        } else if (translationY < 0 && onSwipeUp) {
          triggerSwipeAnimation('up');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeUp();
        }
      } else {
        // Reset position with spring animation
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }
    }
  };

  const triggerSwipeAnimation = (direction: 'left' | 'right' | 'up' | 'down') => {
    const animations = [];

    // Slide out animation
    switch (direction) {
      case 'left':
        animations.push(
          Animated.timing(translateX, {
            toValue: -width,
            duration: 300,
            useNativeDriver: true,
          })
        );
        break;
      case 'right':
        animations.push(
          Animated.timing(translateX, {
            toValue: width,
            duration: 300,
            useNativeDriver: true,
          })
        );
        break;
      case 'up':
        animations.push(
          Animated.timing(translateY, {
            toValue: -height,
            duration: 300,
            useNativeDriver: true,
          })
        );
        break;
      case 'down':
        animations.push(
          Animated.timing(translateY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          })
        );
        break;
    }

    // Fade out animation
    animations.push(
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start(() => {
      // Reset after animation
      translateX.setValue(0);
      translateY.setValue(0);
      opacity.setValue(1);
    });
  };

  const onLongPressHandler = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress();
    }
  };

  if (!enableGestures) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minDist={10}
      >
        <Animated.View
          style={[
            styles.gestureContainer,
            {
              transform: [
                { translateX },
                { translateY },
                { scale },
                { rotate: rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }) },
              ],
              opacity,
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Smooth Page Transition Component
interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isVisible,
  direction = 'right',
  duration = 400,
}) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isVisible) {
      // Enter animation
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(opacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      // Exit animation
      let translateValue = 0;
      switch (direction) {
        case 'left':
          translateValue = -width;
          break;
        case 'right':
          translateValue = width;
          break;
        case 'up':
          translateValue = -height;
          break;
        case 'down':
          translateValue = height;
          break;
      }

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: direction === 'left' || direction === 'right' ? translateValue : 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: direction === 'up' || direction === 'down' ? translateValue : 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, direction]);

  return (
    <Animated.View
      style={[
        styles.pageContainer,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureContainer: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
}); 