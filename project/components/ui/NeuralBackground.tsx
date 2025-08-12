import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface NeuralBackgroundProps {
  children?: React.ReactNode;
  nodeCount?: number;
  intensity?: number;
}

export const NeuralBackground: React.FC<NeuralBackgroundProps> = ({
  children,
  nodeCount = 50,
  intensity = 1,
}) => {
  const { colors } = useTheme();
  const nodes = useRef<Animated.ValueXY[]>([]);

  useEffect(() => {
    // Initialize nodes
    nodes.current = Array.from({ length: nodeCount }, () => new Animated.ValueXY());

    // Set initial positions
    nodes.current.forEach((node) => {
      node.setValue({
        x: Math.random() * width,
        y: Math.random() * height,
      });
    });

    // Start animations
    const animations = nodes.current.map((node) => {
      const randomX = Math.random() * width;
      const randomY = Math.random() * height;
      const duration = 5000 + Math.random() * 5000;

      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(node.x, {
              toValue: randomX,
              duration,
              useNativeDriver: false,
            }),
            Animated.timing(node.y, {
              toValue: randomY,
              duration,
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(node.x, {
              toValue: Math.random() * width,
              duration,
              useNativeDriver: false,
            }),
            Animated.timing(node.y, {
              toValue: Math.random() * height,
              duration,
              useNativeDriver: false,
            }),
          ]),
        ])
      );
    });

    // Start all animations
    animations.forEach((animation) => animation.start());

    return () => {
      nodes.current.forEach(node => {
        node.x.stopAnimation();
        node.y.stopAnimation();
      });
    };
  }, [nodeCount, intensity]);

  return (
    <View style={styles.container}>
      {nodes.current.map((node, index) => (
        <Animated.View
          key={index}
          style={[
            styles.node,
            {
              left: node.x,
              top: node.y,
              backgroundColor: colors.neural.primary,
            },
          ]}
        />
      ))}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  node: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
}); 