import * as Sentry from 'sentry-expo';

Sentry.init({ 
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined, 
  enableInExpoDevelopment: true,
  environment: process.env.EXPO_PUBLIC_APP_ENVIRONMENT || 'development',
  release: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  debug: process.env.EXPO_PUBLIC_APP_ENVIRONMENT === 'development',
  tracesSampleRate: 1.0,
});

import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SocialProvider } from '../contexts/SocialContext';
import AuthWrapper from '../components/AuthWrapper';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <SocialProvider>
            <AuthWrapper>
              <Stack />
            </AuthWrapper>
          </SocialProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
