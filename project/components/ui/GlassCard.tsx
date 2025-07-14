import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../lib/theme';

export const GlassCard: React.FC<ViewProps> = ({ style, children, ...props }) => (
  <BlurView intensity={30} tint="light" style={[styles.glass, style]} {...props}>
    <View style={styles.inner}>{children}</View>
  </BlurView>
);

const styles = StyleSheet.create({
  glass: {
    backgroundColor: theme.colors.glass.primary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  inner: {
    padding: theme.spacing.lg,
  },
}); 