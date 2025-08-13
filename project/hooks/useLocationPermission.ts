import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BG_LOCATION_TASK, GEOFENCE_TASK } from '../lib/locationTasks';

type AccuracyMode = 'high'|'balanced'|'low';
type CachedLocation = { latitude:number; longitude:number; accuracy?:number|null; timestamp?:number };
const CACHE_KEY = 'HOODLY_LAST_LOCATION';
const ACC_KEY = 'HOODLY_LOCATION_ACCURACY';
const toExpoAcc = (m:AccuracyMode)=>
  m==='high'?Location.Accuracy.Highest: m==='balanced'?Location.Accuracy.Balanced: Location.Accuracy.Low;

export const useLocationPermission = () => {
  const [hasPermission,setHasPermission]=useState(false);
  const [isLoading,setIsLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [accuracy,setAccuracy]=useState<AccuracyMode>('balanced');
  const [cached,setCached]=useState<CachedLocation|null>(null);

  useEffect(()=>{ AsyncStorage.getItem(ACC_KEY).then(v=>v&&setAccuracy(v as AccuracyMode));
                  AsyncStorage.getItem(CACHE_KEY).then(v=>v&&setCached(JSON.parse(v))); },[]);

  const checkPermission=useCallback(async()=>{
    try{ setIsLoading(true);
      const fg=await Location.getForegroundPermissionsAsync();
      setHasPermission(fg.status==='granted'); setError(null);
    }catch(e:any){ setError(e?.message||'Check permission failed'); }
    finally{ setIsLoading(false); }
  },[]);

  const requestPermission=useCallback(async()=>{
    try{ setIsLoading(true);
      const {status}=await Location.requestForegroundPermissionsAsync();
      setHasPermission(status==='granted'); if(status!=='granted') setError('Location denied');
    }catch(e:any){ setError(e?.message||'Request permission failed'); }
    finally{ setIsLoading(false); }
  },[]);

  const getCurrentLocation=useCallback(async()=>{
    try{
      if(!hasPermission) await requestPermission();
      const loc=await Location.getCurrentPositionAsync({ accuracy: toExpoAcc(accuracy) });
      const snap={ latitude:loc.coords.latitude, longitude:loc.coords.longitude, accuracy:loc.coords.accuracy, timestamp:loc.timestamp };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snap)); setCached(snap); return snap;
    }catch(e:any){ setError(e?.message||'Get location failed'); return null; }
  },[accuracy,hasPermission]);

  const getCachedLocation=useCallback(()=>cached,[cached]);
  const setAccuracyMode=useCallback(async(m:AccuracyMode)=>{ setAccuracy(m); await AsyncStorage.setItem(ACC_KEY,m); },[]);

  const startBackgroundUpdates=useCallback(async()=>{
    const bg=await Location.getBackgroundPermissionsAsync();
    if(bg.status!=='granted'){ const r=await Location.requestBackgroundPermissionsAsync(); if(r.status!=='granted') throw new Error('Background denied'); }
    const reg=await TaskManager.isTaskRegisteredAsync(BG_LOCATION_TASK);
    if(!reg){ await Location.startLocationUpdatesAsync(BG_LOCATION_TASK,{ accuracy: toExpoAcc(accuracy), timeInterval:60000, distanceInterval:50, pausesUpdatesAutomatically:true } as any); }
  },[accuracy]);
  const stopBackgroundUpdates=useCallback(async()=>{ const reg=await TaskManager.isTaskRegisteredAsync(BG_LOCATION_TASK); if(reg) await Location.stopLocationUpdatesAsync(BG_LOCATION_TASK); },[]);
  const startGeofencing=useCallback(async(regions:{latitude:number;longitude:number;radius:number}[])=>{
    if(!regions?.length) return;
    const reg=await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
    if(reg) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    await Location.startGeofencingAsync(GEOFENCE_TASK, regions as any);
  },[]);
  const stopGeofencing=useCallback(async()=>{ const reg=await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK); if(reg) await Location.stopGeofencingAsync(GEOFENCE_TASK); },[]);

  useEffect(()=>{ checkPermission(); },[checkPermission]);

  return { hasPermission,isLoading,error,accuracy,setAccuracyMode,requestPermission,checkPermission,
           getCurrentLocation,getCachedLocation,startBackgroundUpdates,stopBackgroundUpdates,startGeofencing,stopGeofencing };
}; 