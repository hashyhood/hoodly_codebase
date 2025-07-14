import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';

// Only import Marker on native platforms
let Marker: any;
if (Platform.OS !== 'web') {
  try {
    Marker = require('react-native-maps').Marker;
  } catch (error) {
    Marker = null;
  }
}

interface MapBubbleProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  emoji: string;
  count: number;
  onPress: () => void;
  pulseAnim: Animated.Value;
}

export function MapBubble({ 
  coordinate, 
  title, 
  emoji, 
  count, 
  onPress, 
  pulseAnim 
}: MapBubbleProps) {
  // Return null on web to prevent native module errors
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        <BlurView intensity={80} style={styles.bubble}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.count}>{count}k vibing</Text>
        </BlurView>
        <View style={styles.glow} />
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 80,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    zIndex: -1,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  count: {
    fontSize: 10,
    color: '#FFFFFF80',
    marginTop: 2,
  },
});