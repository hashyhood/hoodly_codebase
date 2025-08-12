import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

export const GradientBackground: React.FC<ViewProps & { colors?: string[] }> = ({
  style,
  children,
  colors,
  ...props
}) => {
  const { colors: themeColors } = useTheme();
  const gradient = (colors || themeColors.gradients.primary) as [string, string];
  return (
    <LinearGradient
      colors={gradient}
      start={[0, 0]}
      end={[1, 1]}
      style={[styles.gradient, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
}); 