import React from 'react';
import { View, StyleSheet } from 'react-native';

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.skeleton} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    height: 60,
    backgroundColor: '#eee',
    borderRadius: 12,
    marginVertical: 8,
    opacity: 0.5,
  },
}); 