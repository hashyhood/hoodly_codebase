import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { colors } = useTheme();
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.skeleton, { backgroundColor: colors.glass.secondary, borderColor: colors.glass.border }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    height: 60,
    borderRadius: 12,
    marginVertical: 8,
    opacity: 0.6,
    borderWidth: 1,
  },
}); 