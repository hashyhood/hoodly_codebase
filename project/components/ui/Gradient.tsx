import React from 'react';
import { ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, getGradient } from '../../lib/theme';

interface GradientProps {
  type: 'primary' | 'fab' | 'chipActive' | 'storyRing';
  style?: ViewStyle;
  children?: React.ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const Gradient: React.FC<GradientProps> = ({
  type,
  style,
  children,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 }
}) => {
  const colors = getGradient(type);
  
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    // Default styles - can be overridden via style prop
  }
});
