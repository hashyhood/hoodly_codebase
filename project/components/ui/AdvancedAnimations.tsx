import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface NeuralNode {
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
}

interface AdvancedAnimationsProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  type?: 'neural' | 'particles' | 'waves' | 'pulse';
}

export const AdvancedAnimations: React.FC<AdvancedAnimationsProps> = ({
  children,
  intensity = 'medium',
  type = 'neural'
}) => {
  const { theme } = useTheme();
  const nodes = useRef<NeuralNode[]>([]);
  const animationRef = useRef<Animated.Value>(new Animated.Value(0));

  // Create neural network nodes
  useEffect(() => {
    const nodeCount = intensity === 'high' ? 12 : intensity === 'medium' ? 8 : 4;
    nodes.current = Array.from({ length: nodeCount }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      opacity: new Animated.Value(0.3 + Math.random() * 0.4),
    }));

    // Start neural animation
    const animateNodes = () => {
      const animations = nodes.current.map((node, index) => {
        const duration = 3000 + Math.random() * 2000;
        const delay = index * 200;

        return Animated.parallel([
          Animated.timing(node.x, {
            toValue: Math.random() * width,
            duration,
            delay,
            useNativeDriver: false,
          }),
          Animated.timing(node.y, {
            toValue: Math.random() * height,
            duration,
            delay,
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(node.scale, {
              toValue: 1.2,
              duration: duration / 2,
              useNativeDriver: false,
            }),
            Animated.timing(node.scale, {
              toValue: 0.8,
              duration: duration / 2,
              useNativeDriver: false,
            }),
          ]),
        ]);
      });

      Animated.parallel(animations).start(() => animateNodes());
    };

    animateNodes();

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
        node.x.stopAnimation();
        node.y.stopAnimation();
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
              left: node.x,
              top: node.y,
              transform: [{ scale: node.scale }],
              opacity: node.opacity,
            },
          ]}
        >
          <LinearGradient
            colors={theme.colors.gradients.neural as [string, string]}
            style={styles.nodeGradient}
          />
        </Animated.View>
      ))}
    </>
  );

  const renderParticleSystem = () => (
    <Animated.View
      style={[
        styles.particleContainer,
        {
          opacity: animationRef.current.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.8],
          }),
        },
      ]}
    >
      {Array.from({ length: 20 }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: theme.colors.neural.primary,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: [
                {
                  scale: animationRef.current.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </Animated.View>
  );

  const renderWaveEffect = () => (
    <Animated.View
      style={[
        styles.waveContainer,
        {
          transform: [
            {
              scale: animationRef.current.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.neural.primary + '20', 'transparent']}
        style={styles.wave}
      />
    </Animated.View>
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
              colors={theme.colors.gradients.neural as [string, string]}
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