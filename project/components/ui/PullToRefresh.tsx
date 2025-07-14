import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  refreshing,
  children,
  threshold = 80,
}) => {
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      setIsRefreshing(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: threshold,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start rotation animation
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      setIsRefreshing(false);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      rotation.stopAnimation();
    }
  }, [refreshing]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY } = event.nativeEvent;
      
      if (translationY > threshold && !isRefreshing) {
        onRefresh();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const refreshOpacity = translateY.interpolate({
    inputRange: [0, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const refreshScale = translateY.interpolate({
    inputRange: [0, threshold],
    outputRange: [0.5, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={styles.content}>
          {/* Refresh Indicator */}
          <Animated.View
            style={[
              styles.refreshIndicator,
              {
                opacity: refreshOpacity,
                transform: [
                  { translateY: translateY },
                  { scale: refreshScale },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={theme.colors.gradients.neural as [string, string]}
              style={styles.indicatorGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.View
                style={[
                  styles.spinner,
                  {
                    transform: [{ rotate: spin }],
                  },
                ]}
              >
                <Text style={styles.spinnerText}>🔄</Text>
              </Animated.View>
              <Text style={styles.refreshText}>
                {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Content */}
          <Animated.View
            style={[
              styles.childrenContainer,
              {
                transform: [{ translateY: translateY }],
              },
            ]}
          >
            {children}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  refreshIndicator: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  indicatorGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinner: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerText: {
    fontSize: 16,
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  childrenContainer: {
    flex: 1,
  },
}); 