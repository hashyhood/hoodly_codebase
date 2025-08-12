import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Switch,
  Animated,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Shield, 
  AlertCircle, 
  Phone, 
  MapPin, 
  Bell, 
  Plus, 
  X,
  Users,
  MessageCircle,
  Navigation,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface SafetyAlert {
  id: string;
  type: 'emergency' | 'warning' | 'info';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
  severity: 'high' | 'medium' | 'low';
  is_active: boolean;
  created_by: string;
  affected_area: number; // radius in meters
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
}

interface SafetyAlertsProps {
  isVisible?: boolean;
  onClose?: () => void;
  onAlertReport?: (alert: SafetyAlert) => void;
  onAlertPress?: (alert: SafetyAlert) => void;
  onEmergencyCall?: () => void;
}

export const SafetyAlerts: React.FC<SafetyAlertsProps> = ({
  isVisible = false,
  onClose,
  onAlertReport,
  onAlertPress,
  onEmergencyCall,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const alertAnimation = useRef(new Animated.Value(0)).current;

  // Configure notifications
  useEffect(() => {
    const configureNotifications = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      setIsNotificationsEnabled(finalStatus === 'granted');
      
      if (finalStatus === 'granted') {
        await Notifications.setNotificationChannelAsync('safety-alerts', {
          name: 'Safety Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    };

    configureNotifications();
  }, []);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for safety features.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Load safety alerts
  const loadSafetyAlerts = async () => {
    try {
      setIsLoading(true);
      
      // Get alerts within user's area
      const { data, error } = await supabase
        .from('safety_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading safety alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load emergency contacts
  const loadEmergencyContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setEmergencyContacts(data || []);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  // Add emergency contact
  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user?.id,
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship,
          is_primary: emergencyContacts.length === 0, // First contact is primary
        })
        .select()
        .single();

      if (error) throw error;

      setEmergencyContacts(prev => [...prev, data]);
      setNewContact({ name: '', phone: '', relationship: '' });
      setShowAddContactModal(false);
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact.');
    }
  };

  // Send emergency alert
  const sendEmergencyAlert = async () => {
    if (!currentLocation) {
      await getCurrentLocation();
      return;
    }

    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to send an emergency alert? This will notify all nearby users and emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            try {
              // Create emergency alert
              const { data: alert, error } = await supabase
                .from('safety_alerts')
                .insert({
                  type: 'emergency',
                  title: 'Emergency Alert',
                  description: 'User has sent an emergency alert',
                  location: {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                  },
                  severity: 'high',
                  is_active: true,
                  created_by: user?.id,
                  affected_area: 5000, // 5km radius
                })
                .select()
                .single();

              if (error) throw error;

              // Notify emergency contacts
              emergencyContacts.forEach(contact => {
                // Implement SMS/call functionality
                handleEmergencyContact(contact);
              });

              // Send push notification to nearby users
              if (isNotificationsEnabled) {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: '🚨 Emergency Alert',
                    body: 'An emergency has been reported in your area. Please check the app for details.',
                    data: { alertId: alert.id },
                  },
                  trigger: null, // Send immediately
                });
              }

              setAlerts(prev => [alert, ...prev]);
              onEmergencyCall?.();
            } catch (error) {
              console.error('Error sending emergency alert:', error);
              Alert.alert('Error', 'Failed to send emergency alert.');
            }
          },
        },
      ]
    );
  };

  // Handle emergency contact communication
  const handleEmergencyContact = async (contact: EmergencyContact) => {
    try {
      // Try to make a phone call first
      const phoneUrl = `tel:${contact.phone}`;
      const canOpenPhone = await Linking.canOpenURL(phoneUrl);
      
      if (canOpenPhone) {
        await Linking.openURL(phoneUrl);
      } else {
        // Fallback to SMS if phone call is not available
        const smsUrl = `sms:${contact.phone}`;
        const canOpenSMS = await Linking.canOpenURL(smsUrl);
        
        if (canOpenSMS) {
          await Linking.openURL(smsUrl);
        } else {
          console.log(`Cannot open phone or SMS for ${contact.name} at ${contact.phone}`);
        }
      }
    } catch (error) {
      console.error(`Error contacting emergency contact ${contact.name}:`, error);
    }
  };

  // Send SMS to emergency contact
  const sendSMSToContact = async (contact: EmergencyContact, message: string) => {
    try {
      const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
      const canOpenSMS = await Linking.canOpenURL(smsUrl);
      
      if (canOpenSMS) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'SMS is not available on this device');
      }
    } catch (error) {
      console.error(`Error sending SMS to ${contact.name}:`, error);
      Alert.alert('Error', 'Failed to send SMS');
    }
  };

  // Make phone call to emergency contact
  const callContact = async (contact: EmergencyContact) => {
    try {
      const phoneUrl = `tel:${contact.phone}`;
      const canOpenPhone = await Linking.canOpenURL(phoneUrl);
      
      if (canOpenPhone) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Phone calls are not available on this device');
      }
    } catch (error) {
      console.error(`Error calling ${contact.name}:`, error);
      Alert.alert('Error', 'Failed to make phone call');
    }
  };

  // Initialize
  useEffect(() => {
    getCurrentLocation();
    loadSafetyAlerts();
    loadEmergencyContacts();
  }, []);

  // Subscribe to real-time alerts
  useEffect(() => {
    const subscription = supabase
      .channel('safety_alerts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'safety_alerts',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAlerts(prev => [payload.new as SafetyAlert, ...prev]);
          
          // Show notification for new alerts
          if (isNotificationsEnabled) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: '⚠️ Safety Alert',
                body: payload.new.title,
                data: { alertId: payload.new.id },
              },
              trigger: null,
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          setAlerts(prev => prev.map(alert => 
            alert.id === payload.new.id ? payload.new as SafetyAlert : alert
          ));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isNotificationsEnabled]);

  // Emergency pulse animation
  useEffect(() => {
    const hasEmergencyAlerts = alerts.some(alert => alert.type === 'emergency' && alert.is_active);
    
    if (hasEmergencyAlerts) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(0);
    }
  }, [alerts]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return colors.status.error;
      case 'medium':
        return colors.status.warning;
      case 'low':
        return colors.status.success;
      default:
        return colors.text.secondary;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderAlertCard = (alert: SafetyAlert) => (
    <TouchableOpacity
      key={alert.id}
      style={[styles.alertCard, { backgroundColor: colors.glass.primary }]}
      onPress={() => onAlertPress?.(alert)}
    >
      <View style={styles.alertHeader}>
        <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
        <View style={styles.alertInfo}>
          <Text style={[styles.alertTitle, { color: colors.text.primary }]}>
            {alert.title}
          </Text>
          <Text style={[styles.alertTime, { color: colors.text.tertiary }]}>
            {formatTimeAgo(alert.created_at)}
          </Text>
        </View>
        <View
          style={[
            styles.severityIndicator,
            { backgroundColor: getSeverityColor(alert.severity) },
          ]}
        />
      </View>
      
      <Text style={[styles.alertDescription, { color: colors.text.secondary }]}>
        {alert.description}
      </Text>
      
      <View style={styles.alertActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MapPin size={16} color={colors.text.secondary} />
          <Text style={[styles.actionText, { color: colors.text.secondary }]}>
            View Location
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Users size={16} color={colors.text.secondary} />
          <Text style={[styles.actionText, { color: colors.text.secondary }]}>
            Affected Area
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmergencyContact = (contact: EmergencyContact) => (
        <View
          style={[styles.contactCard, { backgroundColor: colors.glass.primary }]}
    >
      <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text.primary }]}>
          {contact.name}
        </Text>
          <Text style={[styles.contactPhone, { color: colors.text.secondary }]}>
          {contact.phone}
        </Text>
          <Text style={[styles.contactRelationship, { color: colors.text.tertiary }]}>
          {contact.relationship}
        </Text>
      </View>
      
      <View style={styles.contactActions}>
        {contact.is_primary && (
          <View style={[styles.primaryBadge, { backgroundColor: colors.status.success }]}>
            <Text style={styles.primaryText}>Primary</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.callButton}>
          <Phone size={16} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Safety & Emergency
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Emergency Button */}
            <Animated.View
              style={[
                styles.emergencyButton,
                {
                  transform: [{ scale: pulseAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  })}],
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.emergencyButtonInner, { backgroundColor: colors.status.error }]}
                onPress={sendEmergencyAlert}
              >
                <Shield size={32} color="white" />
                <Text style={styles.emergencyButtonText}>EMERGENCY</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Safety Alerts */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Safety Alerts
                </Text>
                <TouchableOpacity style={styles.notificationToggle}>
                  {isNotificationsEnabled ? (
                    <Bell size={20} color={colors.status.success} />
                  ) : (
                    <Bell size={20} color={colors.text.tertiary} />
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.alertsContainer}>
                {alerts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <AlertCircle size={48} color={colors.text.tertiary} />
                    <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                      No active safety alerts in your area
                    </Text>
                  </View>
                ) : (
                  alerts.map(renderAlertCard)
                )}
              </View>
            </View>

            {/* Emergency Contacts */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Emergency Contacts
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddContactModal(true)}
                >
                  <Plus size={20} color={colors.neural.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.contactsContainer}>
                {emergencyContacts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Users size={48} color={colors.text.tertiary} />
                    <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                      No emergency contacts added
                    </Text>
                  </View>
                ) : (
                  emergencyContacts.map(renderEmergencyContact)
                )}
              </View>
            </View>
          </ScrollView>
        </BlurView>
      </View>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={styles.modalContent}>
            <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Add Emergency Contact
              </Text>
              <TouchableOpacity onPress={() => setShowAddContactModal(false)}>
              <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.glass.primary,
                color: colors.text.primary,
                borderColor: colors.glass.border,
              }]}
              placeholder="Full Name"
              placeholderTextColor={colors.text.tertiary}
              value={newContact.name}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.glass.primary,
                color: colors.text.primary,
                borderColor: colors.glass.border,
              }]}
              placeholder="Phone Number"
              placeholderTextColor={colors.text.tertiary}
              value={newContact.phone}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.glass.primary,
                color: colors.text.primary,
                borderColor: colors.glass.border,
              }]}
              placeholder="Relationship (Optional)"
              placeholderTextColor={colors.text.tertiary}
              value={newContact.relationship}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, relationship: text }))}
            />
            
            <TouchableOpacity
            style={[styles.addContactButton, { backgroundColor: colors.neural.primary }]}
              onPress={addEmergencyContact}
            >
              <Text style={styles.addContactButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emergencyButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emergencyButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    gap: 12,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  notificationToggle: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  alertsContainer: {
    maxHeight: 300,
  },
  contactsContainer: {
    maxHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  alertCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 12,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00d4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },
  addContactButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addContactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 