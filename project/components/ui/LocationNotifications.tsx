import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Bell, MapPin, Users, Calendar, AlertCircle, Settings } from 'lucide-react-native';
import { analytics } from '../../lib/analytics';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: 'safety' | 'events' | 'social' | 'business';
}

const LocationNotifications: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'nearby_users',
      title: 'Nearby Users',
      description: 'Get notified when friends are nearby',
      enabled: true,
      icon: <Users size={20} color="#3B82F6" />,
      category: 'social',
    },
    {
      id: 'local_events',
      title: 'Local Events',
      description: 'Receive updates about events in your area',
      enabled: true,
      icon: <Calendar size={20} color="#10B981" />,
      category: 'events',
    },
    {
      id: 'safety_alerts',
      title: 'Safety Alerts',
      description: 'Important safety notifications from your neighborhood',
      enabled: true,
              icon: <AlertCircle size={20} color="#EF4444" />,
      category: 'safety',
    },
    {
      id: 'business_updates',
      title: 'Business Updates',
      description: 'New businesses and offers in your area',
      enabled: false,
      icon: <MapPin size={20} color="#F59E0B" />,
      category: 'business',
    },
    {
      id: 'community_posts',
      title: 'Community Posts',
      description: 'Posts from people in your neighborhood',
      enabled: true,
      icon: <Bell size={20} color="#8B5CF6" />,
      category: 'social',
    },
    {
      id: 'traffic_alerts',
      title: 'Traffic Alerts',
      description: 'Traffic and road condition updates',
      enabled: false,
              icon: <AlertCircle size={20} color="#F59E0B" />,
      category: 'safety',
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      // Load saved notification settings from storage
      // For now, we'll use the default settings
      await analytics.trackEvent('location_notifications_viewed');
    } catch (error) {
      console.error('Error loading notification settings:', error);
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
      await analytics.trackEvent('notification_setting_changed', {
        setting: id,
        enabled: !setting?.enabled,
        category: setting?.category,
      });

      // Save to storage
      // await saveNotificationSettings(updatedSettings);
    } catch (error) {
      console.error('Error toggling notification setting:', error);
      Alert.alert('Error', 'Failed to update notification setting');
    }
  };

  const getCategorySettings = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const renderSettingItem = (setting: NotificationSetting) => (
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

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'This will send a test location notification to verify your settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test',
          onPress: async () => {
            try {
              // Send test notification
              await analytics.trackEvent('test_notification_sent');
              Alert.alert('Success', 'Test notification sent!');
            } catch (error) {
              Alert.alert('Error', 'Failed to send test notification');
            }
          },
        },
      ]
    );
  };

  const handleManageAllSettings = () => {
    Alert.alert('Manage Settings', 'Advanced notification settings coming soon');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Location Notifications</Text>
        <Text style={styles.subtitle}>Manage what you want to be notified about</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={handleTestNotification}>
          <Bell size={20} color="#3B82F6" />
          <Text style={styles.quickActionText}>Test Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={handleManageAllSettings}>
          <Settings size={20} color="#6B7280" />
          <Text style={styles.quickActionText}>Advanced Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Alerts */}
      {renderCategorySection(
        'safety',
        'Safety & Security',
        <AlertCircle size={20} color="#EF4444" />
      )}

      {/* Social Notifications */}
      {renderCategorySection(
        'social',
        'Social & Community',
        <Users size={20} color="#3B82F6" />
      )}

      {/* Events */}
      {renderCategorySection(
        'events',
        'Events & Activities',
        <Calendar size={20} color="#10B981" />
      )}

      {/* Business Updates */}
      {renderCategorySection(
        'business',
        'Business & Offers',
        <MapPin size={20} color="#F59E0B" />
      )}

      {/* Notification Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Notification Tips</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Bell size={16} color="#3B82F6" />
            <Text style={styles.tipText}>Enable safety alerts for important neighborhood updates</Text>
          </View>
          <View style={styles.tipItem}>
            <Users size={16} color="#10B981" />
            <Text style={styles.tipText}>Social notifications help you stay connected with neighbors</Text>
          </View>
          <View style={styles.tipItem}>
            <Calendar size={16} color="#F59E0B" />
            <Text style={styles.tipText}>Event notifications keep you informed about local activities</Text>
          </View>
        </View>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Text style={styles.privacyTitle}>Privacy Notice</Text>
        <Text style={styles.privacyText}>
          Location notifications are based on your general area and respect your privacy. 
          We never share your exact location with other users.
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
});

export default LocationNotifications; 