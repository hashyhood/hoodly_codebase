import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const BG_LOCATION_TASK = 'HOODLY_BG_LOCATION';
export const GEOFENCE_TASK = 'HOODLY_GEOFENCE';
const CACHE_KEY = 'HOODLY_LAST_LOCATION';

TaskManager.defineTask(BG_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = data as any;
  if (!locations || !locations[0]) return;
  const loc = locations[0];
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    timestamp: loc.timestamp,
  }));
  // best-effort server sync
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_locations').upsert({
        user_id: user.id,
        location: `SRID=4326;POINT(${loc.coords.longitude} ${loc.coords.latitude})`,
        accuracy_m: loc.coords.accuracy ?? null,
        updated_at: new Date().toISOString()
      });
    }
  } catch {}
});

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const event = data as Location.GeofencingEventType;
  // optional: insert analytics event for entry/exit
});
