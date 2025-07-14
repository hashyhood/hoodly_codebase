import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../lib/theme';

export const StoryRing: React.FC<{ label: string; colors?: string[] }> = ({
  label,
  colors = theme.colors.gradients.neural,
}) => (
  <LinearGradient colors={colors as [string, string]} style={styles.ring}>
    <View style={styles.inner}>
      <Text style={styles.text}>{label}</Text>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.glass.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
}); 