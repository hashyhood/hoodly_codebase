import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, loading, error } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    
    if (isAuthenticated) {
      // User is authenticated, ensure they're on a protected route
      if (pathname === '/auth' || pathname === '/login' || pathname === '/register') {
        router.replace('/(tabs)');
      }
    } else {
      // User is not authenticated, redirect to auth
      if (!pathname.startsWith('/auth') && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        router.replace('/auth');
      }
    }
  }, [isAuthenticated, loading, pathname]);

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'white', marginTop: 16, fontSize: 16 }}>
          Loading Hoodly...
        </Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
          Error: {error}
        </Text>
        <Text style={{ color: 'white', fontSize: 14, textAlign: 'center' }}>
          Please try restarting the app
        </Text>
      </LinearGradient>
    );
  }

  return <>{children}</>;
} 