import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  Animated,
  View
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getColor, getSpacing, getRadius, theme } from '../../lib/theme';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: getSpacing('xs'),
          paddingVertical: getSpacing('xs'),
          borderRadius: getRadius('xs'),
        };
      case 'large':
        return {
          paddingHorizontal: getSpacing('xl'),
          paddingVertical: getSpacing('lg'),
          borderRadius: getRadius('lg'),
        };
      default:
        return {
          paddingHorizontal: getSpacing('md'),
          paddingVertical: getSpacing('sm'),
          borderRadius: getRadius('sm'),
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: getColor('surface'),
            borderColor: getColor('divider'),
          },
          text: {
            color: getColor('textPrimary'),
          },
        };
      case 'secondary':
        return {
          container: {
            borderColor: getColor('success'),
          },
          text: {
            color: getColor('success'),
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: getColor('textSecondary'),
          },
          text: {
            color: getColor('textSecondary'),
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: {
            color: getColor('textPrimary'),
          },
        };
      case 'premium':
        return {
          container: {
            backgroundColor: getColor('success'),
          },
          text: {
            color: getColor('textPrimary'),
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const getDisabledStyles = (): ViewStyle => {
    if (disabled) {
      return {
        opacity: 0.5,
        backgroundColor: getColor('surface'),
      };
    }
    return {};
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          sizeStyles,
          variantStyles.container,
          fullWidth && styles.fullWidth,
          getDisabledStyles(),
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {variant === 'premium' ? (
          <BlurView intensity={30} style={[styles.premiumContainer, sizeStyles]}>
            <LinearGradient
              colors={theme.gradients.primary as [string, string]}
              style={styles.premiumGradient}
            >
              {icon && <View style={styles.iconContainer}>{icon}</View>}
              <Text style={[styles.text, getVariantStyles().text, textStyle]}>
                {loading ? 'Loading...' : title}
              </Text>
            </LinearGradient>
          </BlurView>
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[
              styles.text,
              { fontSize: getTextSize() },
              getVariantStyles().text,
              textStyle,
            ]}>
              {loading ? 'Loading...' : title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  premiumContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
}); 