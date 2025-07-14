import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Users, Wifi, WifiOff, Settings } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

interface NearbyUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  distance: number;
  last_seen: string;
  is_online: boolean;
  interests: string[];
  bio: string | null;
}

interface ProximityRadarProps {
  neighborsCount?: number;
  maxDistance?: number; // in meters
  refreshInterval?: number; // in seconds
  onUserSelect?: (user: NearbyUser) => void;
}

export const ProximityRadar: React.FC<ProximityRadarProps> = ({
  neighborsCount = 10,
  maxDistance = 1000, // 1km default
  refreshInterval = 30, // 30 seconds default
  onUserSelect,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const radarAnimation = useRef(new Animated.Value(0)).current;
  
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const scanInterval = useRef<NodeJS.Timeout | null>(null);

  // Request location permissions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        await startLocationTracking();
      } else {
        Alert.alert(
          'Location Permission Required',
          'This feature needs location access to find nearby users.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);

      // Update user location in database
      if (user) {
        await supabase
          .from('user_locations')
          .upsert({
            user_id: user.id,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            updated_at: new Date().toISOString(),
          });
      }

      // Start continuous location updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          setCurrentLocation(location);
          
          // Update user location in database
          if (user) {
            supabase
              .from('user_locations')
              .upsert({
                user_id: user.id,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                updated_at: new Date().toISOString(),
              });
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Scan for nearby users
  const scanForNearbyUsers = async () => {
    if (!currentLocation || !user) return;

    try {
      setIsScanning(true);

      // Get all users with recent location updates
      const { data: userLocations, error } = await supabase
        .from('user_locations')
        .select(`
          user_id,
          latitude,
          longitude,
          updated_at,
          profiles:profiles!user_locations_user_id_fkey(
            id,
            full_name,
            avatar_url,
            bio,
            last_seen
          )
        `)
        .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .neq('user_id', user.id);

      if (error) throw error;

      // Calculate distances and filter nearby users
      const nearby = userLocations
        ?.map((location: any) => {
          const distance = calculateDistance(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            location.latitude,
            location.longitude
          );

          return {
            id: location.user_id,
            full_name: location.profiles?.full_name || 'Unknown User',
            avatar_url: location.profiles?.avatar_url,
            distance,
            last_seen: location.profiles?.last_seen || location.updated_at,
            is_online: new Date(location.updated_at).getTime() > Date.now() - 2 * 60 * 1000, // Online if updated in last 2 minutes
            interests: [], // TODO: Add interests from user profile
            bio: location.profiles?.bio,
          };
        })
        .filter((user) => user.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance) || [];

      setNearbyUsers(nearby);
    } catch (error) {
      console.error('Error scanning for nearby users:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Start scanning
  const startScanning = () => {
    if (!locationPermission) {
      requestLocationPermission();
      return;
    }

    scanForNearbyUsers();
    
    // Set up periodic scanning
    scanInterval.current = setInterval(scanForNearbyUsers, refreshInterval * 1000) as any;
  };

  // Stop scanning
  const stopScanning = () => {
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
    setIsScanning(false);
  };

  // Toggle online status
  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    // TODO: Update online status in database
  };

  // Initialize
  useEffect(() => {
    requestLocationPermission();
    startScanning();

    return () => {
      stopScanning();
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Animations
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scanAnimation.setValue(0);
      pulseAnimation.setValue(0);
    }
  }, [isScanning]);

  // Radar animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(radarAnimation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const renderRadarCircle = (radius: number, opacity: number, delay: number = 0) => (
    <Animated.View
      style={[
        styles.radarCircle,
        {
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderWidth: 2,
          borderColor: theme.colors.neural.primary + opacity.toString(16).padStart(2, '0'),
          transform: [
            {
              scale: radarAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            },
          ],
          opacity: radarAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, opacity, 0],
          }),
        },
      ]}
    />
  );

  const renderUserCard = (nearbyUser: NearbyUser) => (
    <TouchableOpacity
      key={nearbyUser.id}
      style={[styles.userCard, { backgroundColor: theme.colors.glass.primary }]}
      onPress={() => onUserSelect?.(nearbyUser)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {nearbyUser.avatar_url ? '👤' : '👤'}
          </Text>
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: nearbyUser.is_online ? theme.colors.status.success : theme.colors.status.error },
            ]}
          />
        </View>
        
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
            {nearbyUser.full_name}
          </Text>
          <Text style={[styles.userDistance, { color: theme.colors.text.secondary }]}>
            {formatDistance(nearbyUser.distance)} away
          </Text>
          {nearbyUser.bio && (
            <Text style={[styles.userBio, { color: theme.colors.text.tertiary }]} numberOfLines={1}>
              {nearbyUser.bio}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity style={styles.connectButton}>
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Radar Display */}
      <View style={styles.radarContainer}>
        <View style={styles.radarCenter}>
          <Animated.View
            style={[
              styles.scanIndicator,
              {
                transform: [
                  {
                    rotate: scanAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={theme.colors.gradients.neural as [string, string]}
              style={styles.scanGradient}
            />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.pulseIndicator,
              {
                transform: [{ scale: pulseAnimation }],
                opacity: pulseAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          >
            <View style={[styles.pulseCircle, { backgroundColor: theme.colors.neural.primary }]} />
          </Animated.View>
        </View>
        
        {/* Radar circles */}
        {renderRadarCircle(50, 0.3)}
        {renderRadarCircle(100, 0.2)}
        {renderRadarCircle(150, 0.1)}
      </View>

      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: theme.colors.glass.overlay }]}>
        <View style={styles.statusInfo}>
          <TouchableOpacity
            style={[styles.statusIndicator, { backgroundColor: isOnline ? theme.colors.status.success : theme.colors.status.error }]}
            onPress={toggleOnlineStatus}
          >
            {isOnline ? <Wifi size={16} color="white" /> : <WifiOff size={16} color="white" />}
          </TouchableOpacity>
          <Text style={[styles.statusText, { color: theme.colors.text.secondary }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        <View style={styles.statusInfo}>
          <MapPin size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.statusText, { color: theme.colors.text.secondary }]}>
            {nearbyUsers.length} nearby
          </Text>
        </View>
        
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={16} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Nearby Users */}
      <View style={styles.usersContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Nearby Users
        </Text>
        
        {nearbyUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={theme.colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              {isScanning ? 'Scanning for nearby users...' : 'No users found nearby'}
            </Text>
          </View>
        ) : (
          nearbyUsers.map(renderUserCard)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  radarContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarCenter: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  scanGradient: {
    width: '100%',
    height: '100%',
  },
  pulseIndicator: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  radarCircle: {
    position: 'absolute',
    borderStyle: 'dashed',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 4,
  },
  usersContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userDistance: {
    fontSize: 14,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 12,
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
  },
}); 