import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Shield, MapPin, Users, Eye, EyeOff, Lock, Unlock, Settings } from 'lucide-react-native';
import { analytics } from '../../lib/analytics';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: 'visibility' | 'sharing' | 'tracking' | 'safety';
}

interface LocationPrivacy {
  shareLocation: boolean;
  visibleToFriends: boolean;
  visibleToNeighbors: boolean;
  visibleToPublic: boolean;
  locationAccuracy: 'exact' | 'approximate' | 'general';
  autoShareEvents: boolean;
  shareWithBusinesses: boolean;
  emergencySharing: boolean;
  maxDistance: number;
}

const LocationPrivacySettings: React.FC = () => {
  const [privacy, setPrivacy] = useState<LocationPrivacy>({
    shareLocation: true,
    visibleToFriends: true,
    visibleToNeighbors: false,
    visibleToPublic: false,
    locationAccuracy: 'approximate',
    autoShareEvents: true,
    shareWithBusinesses: false,
    emergencySharing: true,
    maxDistance: 5,
  });

  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'share_location',
      title: 'Share My Location',
      description: 'Allow the app to use your location for features',
      enabled: true,
      icon: <MapPin size={20} color="#3B82F6" />,
      category: 'sharing',
    },
    {
      id: 'visible_to_friends',
      title: 'Visible to Friends',
      description: 'Friends can see your general location',
      enabled: true,
      icon: <Users size={20} color="#10B981" />,
      category: 'visibility',
    },
    {
      id: 'visible_to_neighbors',
      title: 'Visible to Neighbors',
      description: 'People in your area can see you\'re nearby',
      enabled: false,
      icon: <Users size={20} color="#F59E0B" />,
      category: 'visibility',
    },
    {
      id: 'visible_to_public',
      title: 'Public Visibility',
      description: 'Anyone can see your location (not recommended)',
      enabled: false,
      icon: <Eye size={20} color="#EF4444" />,
      category: 'visibility',
    },
    {
      id: 'auto_share_events',
      title: 'Auto-Share Events',
      description: 'Automatically share your location for events',
      enabled: true,
      icon: <MapPin size={20} color="#8B5CF6" />,
      category: 'sharing',
    },
    {
      id: 'share_with_businesses',
      title: 'Share with Businesses',
      description: 'Allow local businesses to see you\'re nearby',
      enabled: false,
      icon: <MapPin size={20} color="#F59E0B" />,
      category: 'sharing',
    },
    {
      id: 'emergency_sharing',
      title: 'Emergency Sharing',
      description: 'Share location in emergency situations',
      enabled: true,
      icon: <Shield size={20} color="#EF4444" />,
      category: 'safety',
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      // Load saved privacy settings from storage
      // For now, we'll use the default settings
      await analytics.trackEvent('location_privacy_viewed');
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (id: string) => {
    try {
      const updatedSettings = settings.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      );
      setSettings(updatedSettings);

      const setting = settings.find(s => s.id === id);
      await analytics.trackEvent('privacy_setting_changed', {
        setting: id,
        enabled: !setting?.enabled,
        category: setting?.category,
      });

      // Update privacy state based on setting
      updatePrivacyState(id, !setting?.enabled);
    } catch (error) {
      console.error('Error toggling privacy setting:', error);
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const updatePrivacyState = (settingId: string, enabled: boolean) => {
    setPrivacy(prev => {
      switch (settingId) {
        case 'share_location':
          return { ...prev, shareLocation: enabled };
        case 'visible_to_friends':
          return { ...prev, visibleToFriends: enabled };
        case 'visible_to_neighbors':
          return { ...prev, visibleToNeighbors: enabled };
        case 'visible_to_public':
          return { ...prev, visibleToPublic: enabled };
        case 'auto_share_events':
          return { ...prev, autoShareEvents: enabled };
        case 'share_with_businesses':
          return { ...prev, shareWithBusinesses: enabled };
        case 'emergency_sharing':
          return { ...prev, emergencySharing: enabled };
        default:
          return prev;
      }
    });
  };

  const updateLocationAccuracy = (accuracy: 'exact' | 'approximate' | 'general') => {
    setPrivacy(prev => ({ ...prev, locationAccuracy: accuracy }));
    analytics.trackEvent('location_accuracy_changed', { accuracy });
  };

  const updateMaxDistance = (distance: number) => {
    setPrivacy(prev => ({ ...prev, maxDistance: distance }));
    analytics.trackEvent('max_distance_changed', { distance });
  };

  const getCategorySettings = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const renderSettingItem = (setting: PrivacySetting) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingIcon}>{setting.icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{setting.title}</Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
      </View>
      <Switch
        value={setting.enabled}
        onValueChange={() => toggleSetting(setting.id)}
        trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
        thumbColor={setting.enabled ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  const renderCategorySection = (category: string, title: string, icon: React.ReactNode) => {
    const categorySettings = getCategorySettings(category);
    if (categorySettings.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          {icon}
          <Text style={styles.categoryTitle}>{title}</Text>
        </View>
        {categorySettings.map(renderSettingItem)}
      </View>
    );
  };

  const renderLocationAccuracySection = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Location Accuracy</Text>
      <Text style={styles.cardDescription}>
        Choose how precise your location sharing should be
      </Text>
      <View style={styles.accuracyOptions}>
        {(['exact', 'approximate', 'general'] as const).map((accuracy) => (
          <TouchableOpacity
            key={accuracy}
            style={[
              styles.accuracyOption,
              privacy.locationAccuracy === accuracy && styles.selectedAccuracy,
            ]}
            onPress={() => updateLocationAccuracy(accuracy)}
          >
            <Text style={[
              styles.accuracyText,
              privacy.locationAccuracy === accuracy && styles.selectedAccuracyText,
            ]}>
              {accuracy.charAt(0).toUpperCase() + accuracy.slice(1)}
            </Text>
            <Text style={[
              styles.accuracyDescription,
              privacy.locationAccuracy === accuracy && styles.selectedAccuracyDescription,
            ]}>
              {accuracy === 'exact' && 'Precise location (within meters)'}
              {accuracy === 'approximate' && 'General area (within blocks)'}
              {accuracy === 'general' && 'Neighborhood only'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMaxDistanceSection = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Maximum Distance</Text>
      <Text style={styles.cardDescription}>
        How far away can people see you? ({privacy.maxDistance}km)
      </Text>
      <View style={styles.distanceOptions}>
        {[1, 3, 5, 10, 20].map((distance) => (
          <TouchableOpacity
            key={distance}
            style={[
              styles.distanceOption,
              privacy.maxDistance === distance && styles.selectedDistance,
            ]}
            onPress={() => updateMaxDistance(distance)}
          >
            <Text style={[
              styles.distanceText,
              privacy.maxDistance === distance && styles.selectedDistanceText,
            ]}>
              {distance}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Privacy Settings',
      'This will reset all location privacy settings to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset to default settings
            setPrivacy({
              shareLocation: true,
              visibleToFriends: true,
              visibleToNeighbors: false,
              visibleToPublic: false,
              locationAccuracy: 'approximate',
              autoShareEvents: true,
              shareWithBusinesses: false,
              emergencySharing: true,
              maxDistance: 5,
            });
            analytics.trackEvent('privacy_settings_reset');
          },
        },
      ]
    );
  };

  const handleExportSettings = () => {
    Alert.alert('Export Settings', 'Privacy settings export feature coming soon');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Location Privacy</Text>
        <Text style={styles.subtitle}>Control who can see your location</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={handleResetSettings}>
          <Settings size={20} color="#EF4444" />
          <Text style={styles.quickActionText}>Reset Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={handleExportSettings}>
          <Shield size={20} color="#6B7280" />
          <Text style={styles.quickActionText}>Export Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Location Accuracy */}
      {renderLocationAccuracySection()}

      {/* Maximum Distance */}
      {renderMaxDistanceSection()}

      {/* Visibility Settings */}
      {renderCategorySection(
        'visibility',
        'Visibility Settings',
        <Eye size={20} color="#3B82F6" />
      )}

      {/* Sharing Settings */}
      {renderCategorySection(
        'sharing',
        'Sharing Preferences',
        <MapPin size={20} color="#10B981" />
      )}

      {/* Safety Settings */}
      {renderCategorySection(
        'safety',
        'Safety & Emergency',
        <Shield size={20} color="#EF4444" />
      )}

      {/* Privacy Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Privacy Tips</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Shield size={16} color="#10B981" />
            <Text style={styles.tipText}>Use approximate location for better privacy</Text>
          </View>
          <View style={styles.tipItem}>
            <EyeOff size={16} color="#F59E0B" />
            <Text style={styles.tipText}>Only share with people you trust</Text>
          </View>
          <View style={styles.tipItem}>
            <Lock size={16} color="#EF4444" />
            <Text style={styles.tipText}>Keep emergency sharing enabled for safety</Text>
          </View>
        </View>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
        <Text style={styles.privacyText}>
          We respect your privacy and never share your exact location without your permission. 
          You can change these settings at any time.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  accuracyOptions: {
    gap: 12,
  },
  accuracyOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedAccuracy: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  accuracyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  selectedAccuracyText: {
    color: '#1E40AF',
  },
  accuracyDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedAccuracyDescription: {
    color: '#3B82F6',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#3B82F6',
    width: 20,
    height: 20,
  },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  privacyNotice: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedDistance: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedDistanceText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default LocationPrivacySettings; 