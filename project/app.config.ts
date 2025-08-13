import 'dotenv/config';
import * as dotenv from 'dotenv';
if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  dotenv.config({ path: './project/.env' });
}
import type { ConfigContext, ExpoConfig } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'Hoodly',
  slug: 'hoodly-app',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'hoodly',
  userInterfaceStyle: 'automatic',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#1a1a2e' },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.hoodly.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Hoodly uses your location to show hyperlocal content.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Allow background location to enable geofenced alerts and local discovery.',
      NSLocationAlwaysUsageDescription: 'Background location improves hyperlocal features.',
      UIBackgroundModes: ['location', 'processing'],
      NSUserTrackingUsageDescription: 'We use identifiers to improve content relevance.',
    },
  },
  android: {
    package: 'com.hoodly.app',
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'POST_NOTIFICATIONS',
      'INTERNET',
    ],
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-updates',
    'expo-notifications',
    'expo-task-manager',
    'expo-location',
    'expo-image',
  ],
  extra: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_APP_ENVIRONMENT: process.env.EXPO_PUBLIC_APP_ENVIRONMENT || 'development',
    EXPO_PUBLIC_APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '2.0.0',
  },
  experiments: { typedRoutes: true, tsconfigPaths: true },
});
