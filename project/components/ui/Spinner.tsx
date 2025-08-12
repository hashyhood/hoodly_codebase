import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface SpinnerProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  text,
  size = 'large',
  color,
  fullScreen = false
}) => {
  const spinnerColor = color || getColor('textSecondary');
  const spinnerSize = size === 'small' ? theme.components.spinner.size : theme.components.spinner.size * 1.5;

  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.fullScreenContent}>
          <ActivityIndicator size={spinnerSize} color={spinnerColor} />
          {text && (
            <Text style={[styles.text, { opacity: theme.components.spinner.textOpacity }]}>
              {text}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={spinnerSize} color={spinnerColor} />
      {text && (
        <Text style={[styles.text, { opacity: theme.components.spinner.textOpacity }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: getColor('bg'),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  fullScreenContent: {
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  container: {
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  text: {
    marginTop: getSpacing('md'),
    fontSize: theme.typography.body.size,
    color: getColor('textSecondary'),
    textAlign: 'center',
    lineHeight: theme.typography.body.lineHeight,
  },
});
