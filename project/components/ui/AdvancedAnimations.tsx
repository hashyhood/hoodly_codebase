import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AdvancedAnimationsProps {
  children?: React.ReactNode;
  type?: 'neural' | 'particles' | 'waves' | 'pulse';
  intensity?: number;
  duration?: number;
}

export const AdvancedAnimations: React.FC<AdvancedAnimationsProps> = ({
  children,
  type = 'neural',
  intensity = 1,
  duration = 3000,
}) => {
  const { colors } = useTheme();
  const animationRef = useRef(new Animated.Value(0));
  const nodes = useRef<Array<{
    x: Animated.ValueXY;
    scale: Animated.Value;
    opacity: Animated.Value;
  }>>([]);

  useEffect(() => {
    // Initialize neural nodes
    const nodeCount = Math.floor(intensity * 20);
    nodes.current = Array.from({ length: nodeCount }, () => ({
      x: new Animated.ValueXY(),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.8),
    }));

    // Randomize initial positions
    nodes.current.forEach((node) => {
      node.x.setValue({
        x: Math.random() * width,
        y: Math.random() * height,
      });
    });

    // Start animations
    const animations = nodes.current.map((node, index) => {
      const randomX = Math.random() * width;
      const randomY = Math.random() * height;
      const randomDuration = duration + Math.random() * 2000;

      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(node.x.x, {
              toValue: randomX,
              duration: randomDuration,
              useNativeDriver: false,
            }),
            Animated.timing(node.x.y, {
              toValue: randomY,
              duration: randomDuration,
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(node.x.x, {
              toValue: Math.random() * width,
              duration: randomDuration,
              useNativeDriver: false,
            }),
            Animated.timing(node.x.y, {
              toValue: Math.random() * height,
              duration: randomDuration,
              useNativeDriver: false,
            }),
          ]),
        ])
      );
    });

    // Start all animations
    animations.forEach((animation) => animation.start());

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationRef.current, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(animationRef.current, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => {
      nodes.current.forEach(node => {
        node.x.x.stopAnimation();
        node.x.y.stopAnimation();
        node.scale.stopAnimation();
        node.opacity.stopAnimation();
      });
      animationRef.current.stopAnimation();
    };
  }, [intensity]);

  const renderNeuralNodes = () => (
    <>
      {nodes.current.map((node, index) => (
        <Animated.View
          key={index}
          style={[
            styles.neuralNode,
            {
              left: node.x.x,
              top: node.x.y,
              transform: [{ scale: node.scale }],
              opacity: node.opacity,
            },
          ]}
        >
          <LinearGradient
            colors={colors.gradients.primary as [string, string]}
            style={styles.nodeGradient}
          />
        </Animated.View>
      ))}
    </>
  );

  const renderParticleSystem = () => (
    <View style={styles.particleContainer}>
      {Array.from({ length: 50 }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: colors.neural.primary,
              left: Math.random() * width,
              top: Math.random() * height,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderWaveEffect = () => (
    <View style={styles.waveContainer}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.wave,
            {
              borderColor: colors.neural.primary,
              transform: [
                {
                  scale: animationRef.current.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2],
                  }),
                },
              ],
              opacity: animationRef.current.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 0],
              }),
            },
          ]}
        />
      ))}
    </View>
  );

  const renderContent = () => {
    switch (type) {
      case 'neural':
        return renderNeuralNodes();
      case 'particles':
        return renderParticleSystem();
      case 'waves':
        return renderWaveEffect();
      case 'pulse':
        return (
          <Animated.View
            style={[
              styles.pulseContainer,
              {
                transform: [
                  {
                    scale: animationRef.current.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
                opacity: animationRef.current.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={colors.gradients.primary as [string, string]}
              style={styles.pulseGradient}
            />
          </Animated.View>
        );
      default:
        return renderNeuralNodes();
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  neuralNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 0,
  },
  nodeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  waveContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  wave: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  pulseContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: 'center',
    top: '50%',
    marginTop: -100,
    zIndex: 0,
  },
  pulseGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
}); 