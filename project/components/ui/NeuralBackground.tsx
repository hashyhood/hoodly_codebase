import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

interface NeuralNode {
  id: number;
  scale: Animated.Value;
  opacity: Animated.Value;
}

export const NeuralBackground: React.FC = () => {
  const nodes = useRef<NeuralNode[]>([]);

  useEffect(() => {
    // Create neural nodes with simplified animations
    for (let i = 0; i < 15; i++) {
      const node: NeuralNode = {
        id: i,
        scale: new Animated.Value(1),
        opacity: new Animated.Value(0.7),
      };
      nodes.current.push(node);

      // Animate node pulse (only using native driver compatible properties)
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(node.scale, {
              toValue: 1.5,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(node.opacity, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(node.scale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(node.opacity, {
              toValue: 0.7,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Neural Nodes */}
      {nodes.current.map((node, index) => (
        <Animated.View
          key={`node-${node.id}`}
          style={[
            styles.node,
            {
              left: Math.random() * width,
              top: Math.random() * height,
              transform: [{ scale: node.scale }],
              opacity: node.opacity,
            },
          ]}
        />
      ))}
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
    backgroundColor: theme.colors.neural.primary,
  },
}); 