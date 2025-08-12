import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Safe wrapper for useAuth hook
export const useSafeAuth = () => {
  try {
    return useAuth();
  } catch (error) {
    console.error('Error using useAuth hook:', error);
    return {
      user: null,
      session: null,
      loading: false,
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
      refreshSession: async () => {},
    };
  }
};

// Safe wrapper for any hook that might fail
export const useSafeHook = <T>(
  hookFunction: () => T,
  fallbackValue: T
): T => {
  try {
    return hookFunction();
  } catch (error) {
    console.error('Error using hook:', error);
    return fallbackValue;
  }
};

// Safe wrapper for async operations
export const useSafeAsync = <T>(
  asyncFunction: () => Promise<T>,
  fallbackValue: T
): [T, boolean, string | null] => {
  const [data, setData] = React.useState<T>(fallbackValue);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const execute = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      console.error('Async operation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return [data, loading, error];
}; 