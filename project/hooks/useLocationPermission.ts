import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationPermissionReturn {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<Location.LocationObject | null>;
}

export const useLocationPermission = (): LocationPermissionReturn => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (err) {
      console.error('Error checking location permission:', err);
      setError('Failed to check location permission');
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        setError('Location permission denied');
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setError('Failed to request location permission');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
    if (!hasPermission) {
      setError('Location permission not granted');
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return location;
    } catch (err) {
      console.error('Error getting current location:', err);
      setError('Failed to get current location');
      return null;
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return {
    hasPermission,
    isLoading,
    error,
    checkPermission,
    requestPermission,
    getCurrentLocation,
  };
}; 