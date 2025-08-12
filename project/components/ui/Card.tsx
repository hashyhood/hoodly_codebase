import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'post' | 'room' | 'notification';
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress
}) => {
  const cardStyle = [
    styles.card,
    styles[variant],
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <BlurView intensity={theme.blur.card} style={cardStyle}>
          {children}
        </BlurView>
      </TouchableOpacity>
    );
  }

  return (
    <BlurView intensity={theme.blur.card} style={cardStyle}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.components.card.bg,
    borderRadius: theme.components.card.radius,
    padding: theme.components.card.pad,
    marginBottom: getSpacing('md'),
    marginHorizontal: getSpacing('lg'),
  },
  default: {
    // Base card styles
  },
  post: {
    // Post-specific styles
  },
  room: {
    // Room-specific styles
  },
  notification: {
    // Notification-specific styles
  },
}); 