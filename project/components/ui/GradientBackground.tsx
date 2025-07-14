import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../lib/theme';

export const GradientBackground: React.FC<ViewProps & { colors?: string[] }> = ({
  style,
  children,
  colors = theme.colors.gradients.neural,
  ...props
}) => (
  <LinearGradient
    colors={colors as [string, string]}
    start={[0, 0]}
    end={[1, 1]}
    style={[styles.gradient, style]}
    {...props}
  >
    {children}
  </LinearGradient>
);

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
}); 