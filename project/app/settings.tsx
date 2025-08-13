import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, 
  Shield, 
  Bell, 
  Settings, 
  LogOut, 
  HelpCircle, 
  Info, 
  Moon, 
  Sun,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Download,
  Upload,
  Activity,
  BarChart3
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { analytics } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { FeedPreferencesSection } from '../components/ui/FeedPreferencesSection';
import { settingsApi } from '../lib/api';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'toggle' | 'navigate' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  category: 'profile' | 'privacy' | 'notifications' | 'app' | 'data' | 'support';
}

const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { blockUser } = useSocial();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    analytics.trackScreen('settings');
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Load user preferences from storage
      // For now, we'll use default values
      await analytics.trackEvent('settings_viewed');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (settingId: string, value: boolean) => {
    try {
      switch (settingId) {
        case 'dark_mode':
          setIsDarkMode(value);
          await analytics.trackEvent('dark_mode_toggled', { enabled: value });
          break;
        case 'notifications':
          setNotificationsEnabled(value);
          await analytics.trackEvent('notifications_toggled', { enabled: value });
          break;
        case 'location':
          setLocationEnabled(value);
          await analytics.trackEvent('location_toggled', { enabled: value });
          break;
      }
    } catch (error) {
      console.error('Error toggling setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleNavigate = (route: string) => {
    // Use any to bypass strict typing for dynamic routes
    router.push(route as any);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await analytics.trackEvent('user_signed_out');
              await signOut();
router.replace('/auth' as any);
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await analytics.trackEvent('account_deletion_requested');
              // Implement account deletion logic
              Alert.alert('Account Deletion', 'Account deletion feature coming soon');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export feature coming soon');
  };

  const handleImportData = () => {
    Alert.alert('Import Data', 'Data import feature coming soon');
  };

  const settings: SettingItem[] = [
    // Profile Settings
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Edit your profile information',
      icon: <User size={20} color="#3B82F6" />,
      type: 'navigate',
      onPress: () => handleNavigate('/profile'),
      category: 'profile',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Manage your privacy settings',
      icon: <Shield size={20} color="#10B981" />,
      type: 'navigate',
      onPress: () => handleNavigate('/privacy'),
      category: 'privacy',
    },
    {
      id: 'location_privacy',
      title: 'Location Privacy',
      description: 'Control location sharing settings',
      icon: <MapPin size={20} color="#F59E0B" />,
      type: 'navigate',
      onPress: () => handleNavigate('/location-privacy'),
      category: 'privacy',
    },
    {
      id: 'social_privacy',
      title: 'Social Privacy',
      description: 'Manage friend and neighbor visibility',
      icon: <Users size={20} color="#8B5CF6" />,
      type: 'navigate',
      onPress: () => handleNavigate('/social-privacy'),
      category: 'privacy',
    },

    // Notification Settings
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Receive notifications about activity',
      icon: <Bell size={20} color="#EF4444" />,
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: (value) => handleToggleSetting('notifications', value),
      category: 'notifications',
    },
    {
      id: 'notification_preferences',
      title: 'Notification Preferences',
      description: 'Customize notification types',
      icon: <Bell size={20} color="#6B7280" />,
      type: 'navigate',
      onPress: () => handleNavigate('/notification-preferences'),
      category: 'notifications',
    },

    // App Settings
    {
      id: 'dark_mode',
      title: 'Dark Mode',
      description: 'Switch between light and dark themes',
      icon: isDarkMode ? <Moon size={20} color="#8B5CF6" /> : <Sun size={20} color="#F59E0B" />,
      type: 'toggle',
      value: isDarkMode,
      onToggle: (value) => handleToggleSetting('dark_mode', value),
      category: 'app',
    },
    {
      id: 'location',
      title: 'Location Services',
      description: 'Enable location-based features',
      icon: <MapPin size={20} color="#10B981" />,
      type: 'toggle',
      value: locationEnabled,
      onToggle: (value) => handleToggleSetting('location', value),
      category: 'app',
    },
    {
      id: 'analytics',
      title: 'Analytics & Insights',
      description: 'View your activity analytics',
      icon: <BarChart3 size={20} color="#3B82F6" />,
      type: 'navigate',
      onPress: () => handleNavigate('/analytics'),
      category: 'app',
    },

    // Data Settings
    {
      id: 'export_data',
      title: 'Export My Data',
      description: 'Download your personal data',
      icon: <Download size={20} color="#10B981" />,
      type: 'action',
      onPress: handleExportData,
      category: 'data',
    },
    {
      id: 'import_data',
      title: 'Import Data',
      description: 'Import data from another account',
      icon: <Upload size={20} color="#F59E0B" />,
      type: 'action',
      onPress: handleImportData,
      category: 'data',
    },
    {
      id: 'delete_account',
      title: 'Delete Account',
      description: 'Permanently delete your account',
      icon: <Trash2 size={20} color="#EF4444" />,
      type: 'action',
      onPress: handleDeleteAccount,
      category: 'data',
    },

    // Support Settings
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: <HelpCircle size={20} color="#6B7280" />,
      type: 'navigate',
      onPress: () => handleNavigate('/help'),
      category: 'support',
    },
    {
      id: 'about',
      title: 'About Hoodly',
      description: 'App version and information',
      icon: <Info size={20} color="#6B7280" />,
      type: 'navigate',
      onPress: () => handleNavigate('/about'),
      category: 'support',
    },
  ];

  const getCategorySettings = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const renderSettingItem = (setting: SettingItem) => (
    <TouchableOpacity
      key={setting.id}
      style={styles.settingItem}
      onPress={setting.onPress}
      disabled={setting.type === 'toggle'}
    >
      <View style={styles.settingIcon}>{setting.icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{setting.title}</Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
      </View>
      {setting.type === 'toggle' && (
        <Switch
          value={setting.value}
          onValueChange={setting.onToggle}
          trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
          thumbColor={setting.value ? '#FFFFFF' : '#FFFFFF'}
        />
      )}
      {setting.type === 'navigate' && (
        <Text style={styles.navigateArrow}>›</Text>
      )}
    </TouchableOpacity>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your app preferences</Text>
      </View>

      {/* User Info */}
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <User size={24} color="#FFFFFF" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.email || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Profile Settings */}
      {renderCategorySection(
        'profile',
        'Profile',
        <User size={20} color="#3B82F6" />
      )}

      {/* Privacy Settings */}
      {renderCategorySection(
        'privacy',
        'Privacy & Security',
        <Shield size={20} color="#10B981" />
      )}

      {/* Notification Settings */}
      {renderCategorySection(
        'notifications',
        'Notifications',
        <Bell size={20} color="#EF4444" />
      )}

      {/* App Settings */}
      {renderCategorySection(
        'app',
        'App Preferences',
        <Settings size={20} color="#6B7280" />
      )}

      {/* Feed Preferences Section */}
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Settings size={20} color="#6B7280" />
          <Text style={styles.categoryTitle}>Feed Customization</Text>
        </View>
        <FeedPreferencesSection />
      </View>

      {/* Notifications Section */}
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Bell size={20} color="#6B7280" />
          <Text style={styles.categoryTitle}>Notifications</Text>
        </View>
        <View style={styles.notificationsContent}>
          <View style={styles.notificationRow}>
            <Text style={styles.notificationLabel}>Location-based</Text>
            <Switch 
              onValueChange={(v) => settingsApi.upsertSettings({ 
                notification_prefs: { locationBased: v } 
              })}
            />
          </View>
          <TouchableOpacity 
            style={styles.quietHoursButton}
            onPress={() => settingsApi.upsertSettings({ 
              notification_prefs: { 
                quietHours: {start:'22:00', end:'07:00', timezone:'Asia/Karachi'} 
              } 
            })}
          >
            <Text style={styles.quietHoursText}>Set Quiet Hours 22:00–07:00</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Settings */}
      {renderCategorySection(
        'data',
        'Data & Privacy',
        <Activity size={20} color="#8B5CF6" />
      )}

      {/* Support Settings */}
      {renderCategorySection(
        'support',
        'Support',
        <HelpCircle size={20} color="#6B7280" />
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Hoodly v1.0.0</Text>
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
  userCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
  navigateArrow: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  notificationsContent: {
    padding: 16,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  notificationLabel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  quietHoursButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#22d3ee',
    borderRadius: 8,
    alignItems: 'center',
  },
  quietHoursText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen; 