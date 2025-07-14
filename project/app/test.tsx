import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TestConnection from '@/components/TestConnection';

export default function TestPage() {
  return (
    <View style={styles.container}>
      <TestConnection />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
}); 