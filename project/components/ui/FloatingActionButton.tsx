import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Camera, Edit, MapPin } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface FloatingActionButtonProps {
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'camera';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  label?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  label,
}) => {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return 48;
      case 'large':
        return 72;
      default:
        return 56;
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'camera':
        return <Camera size={24} color={colors.text.inverse} />;
      case 'secondary':
        return <Edit size={24} color={colors.text.primary} />;
      default:
        return <Plus size={24} color={colors.text.inverse} />;
    }
  };

  const getGradientColors = () => {
    switch (variant) {
      case 'camera':
        return [colors.status.error, colors.status.warning];
      case 'secondary':
        return [colors.glass.primary, colors.glass.secondary];
      default:
        return [colors.neural.primary, colors.neural.secondary];
    }
  };

  const buttonSize = getSize();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <BlurView
          intensity={30}
          style={[
            styles.blurContainer,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              borderColor: colors.glass.border,
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors() as [string, string]}
            style={[
              styles.gradient,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {getIcon()}
          </LinearGradient>
        </BlurView>
        
        {label && (
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  blurContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    right: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 