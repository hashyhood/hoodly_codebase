import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { authUtils } from './auth';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;
  const { user } = (await supabase.auth.getUser()).data;
  if (!user || !token) return null;

  await supabase.from('device_tokens').upsert({
    user_id: user.id,
    token,
    provider: Platform.OS === 'ios' ? 'apns' : 'fcm',
    device_type: Platform.OS,
  }, { onConflict: 'user_id,token' });
  return token;
}

// Handle incoming notifications
export function setupNotificationHandler(onNotificationReceived: (notification: Notifications.Notification) => void) {
  const subscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
  return subscription;
}

// Handle notification responses (when user taps notification)
export function setupNotificationResponseHandler(onNotificationResponse: (response: Notifications.NotificationResponse) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
  return subscription;
}

// Get current push token
export async function getCurrentPushToken() {
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    console.warn('Failed to get current push token:', error);
    return null;
  }
}

// Remove push token (call this on logout)
export async function removePushToken() {
  try {
    const { user } = (await supabase.auth.getUser()).data;
    if (!user) return;

    const token = await getCurrentPushToken();
    if (token) {
      await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);
    }
  } catch (error) {
    console.warn('Failed to remove push token:', error);
  }
}
