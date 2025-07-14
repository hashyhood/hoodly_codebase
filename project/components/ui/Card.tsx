import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  disabled = false,
  padding = 'medium',
}: CardProps) {
  const getPaddingStyle = () => {
    switch (padding) {
      case 'none': return styles.paddingNone;
      case 'small': return styles.paddingSmall;
      case 'medium': return styles.paddingMedium;
      case 'large': return styles.paddingLarge;
      default: return styles.paddingMedium;
    }
  };

  const cardStyle = [
    styles.base,
    styles[variant],
    getPaddingStyle(),
    disabled && styles.disabled,
    style,
  ];

  const CardContainer = onPress ? TouchableOpacity : View;

  if (variant === 'gradient') {
    return (
      <CardContainer
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 107, 157, 0.1)', 'rgba(74, 144, 226, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientInner}
        >
          {children}
        </LinearGradient>
      </CardContainer>
    );
  }

  return (
    <CardContainer
      style={cardStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {children}
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Variants
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  gradient: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  
  // Padding variants
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: 12,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  gradientInner: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
}); 