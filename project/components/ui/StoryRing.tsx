import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

export const StoryRing: React.FC<{ label: string; colors?: string[] }> = ({
  label,
  colors,
}) => {
  const { colors: themeColors } = useTheme();
  const ringColors = (colors || themeColors.gradients.primary) as [string, string];
  return (
    <LinearGradient colors={ringColors} style={styles.ring}>
      <View style={[styles.inner, { backgroundColor: themeColors.glass.primary }]}>
        <Text style={[styles.text, { color: themeColors.text.primary }]}>{label}</Text>
      </View>
    </LinearGradient>
  );
};

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 