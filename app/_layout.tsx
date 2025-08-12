import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../project/contexts/AuthContext';
import { ThemeProvider } from '../project/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <Stack />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
} 