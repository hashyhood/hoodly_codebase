import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Slider, TouchableOpacity } from 'react-native';
import { settingsApi } from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FeedPreferencesSection = () => {
  const [feedDefault, setFeedDefault] = useState<'ranked'|'recent'|'nearby'|'following'>('ranked');
  const [weights, setWeights] = useState({ w_freshness:0.45, w_proximity:0.25, w_engagement:0.20, w_follow:0.06, w_interest:0.04 });

  useEffect(() => {
    (async () => {
      const s = await settingsApi.getSettings();
      if (s.success && s.data) setFeedDefault((s.data.feed_default as any) || 'ranked');
    })();
  }, []);

  const saveDefault = async (val: typeof feedDefault) => {
    setFeedDefault(val);
    await settingsApi.upsertSettings({ feed_default: val });
    await AsyncStorage.setItem('HOODLY_FEED_DEFAULT', val);
  };

  const saveWeights = async () => {
    await settingsApi.upsertFeedWeights(weights);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.h}>Feed Preferences</Text>
      <View style={styles.row}>
        {(['ranked','recent','nearby','following'] as const).map(v => (
          <TouchableOpacity key={v} onPress={() => saveDefault(v)} style={[styles.chip, feedDefault===v && styles.chipActive]}>
            <Text style={feedDefault===v ? styles.chipActiveText : styles.chipText}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subh}>Personalization Weights</Text>
      {Object.entries(weights).map(([k,val]) => (
        <View key={k} style={{marginVertical:8}}>
          <Text>{k.replace('w_','')}: {val.toFixed(2)}</Text>
          {/* @ts-ignore */}
          <Slider minimumValue={0} maximumValue={1} value={val} onValueChange={(nv)=>setWeights(w=>({...w,[k]:nv}))} onSlidingComplete={saveWeights}/>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card:{padding:16,borderRadius:12,backgroundColor:'#111827'},
  h:{fontSize:18,fontWeight:'600',color:'#fff',marginBottom:8},
  subh:{fontSize:16,fontWeight:'600',color:'#fff',marginTop:8},
  row:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:8},
  chip:{paddingVertical:6,paddingHorizontal:12,borderRadius:16,borderWidth:1,borderColor:'#334155'},
  chipActive:{backgroundColor:'#22d3ee',borderColor:'#22d3ee'},
  chipText:{color:'#e5e7eb'}, chipActiveText:{color:'#0f172a',fontWeight:'700'}
});
