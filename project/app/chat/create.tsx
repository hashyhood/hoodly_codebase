import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../contexts/AuthContext';
import { roomsApi } from '../../lib/api';
import { getColor, getSpacing, getRadius, theme } from '../../lib/theme';

export default function CreateChatScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 100,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a room');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await roomsApi.createRoom({
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_private: formData.isPrivate,
        max_members: formData.maxMembers,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create room');
        return;
      }

      if (data) {
        Alert.alert(
          'Success!',
          'Room created successfully',
          [
            {
              text: 'Go to Room',
              onPress: () => router.push(`/chat/${data.id}`),
            },
            {
              text: 'Create Another',
              onPress: () => {
                setFormData({
                  name: '',
                  description: '',
                  isPrivate: false,
                  maxMembers: 100,
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={getColor('textPrimary')} />
            </TouchableOpacity>
            <Text style={styles.title}>Create New Room</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Form */}
          <BlurView intensity={20} style={styles.formContainer}>
            <Text style={styles.formTitle}>Room Details</Text>

            {/* Room Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="chatbubbles" size={20} color={getColor('textSecondary')} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Room Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                maxLength={50}
              />
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Ionicons name="document-text" size={20} color={getColor('textSecondary')} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Description (optional)"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* Privacy Toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabel}>
                <Ionicons name="lock-closed" size={20} color={getColor('textSecondary')} />
                <Text style={styles.toggleText}>Private Room</Text>
              </View>
              <Switch
                value={formData.isPrivate}
                onValueChange={(value) => setFormData({ ...formData, isPrivate: value })}
                trackColor={{ false: getColor('surface'), true: getColor('primary') }}
                thumbColor={getColor('textPrimary')}
              />
            </View>

            {/* Max Members */}
            <View style={styles.inputContainer}>
              <Ionicons name="people" size={20} color={getColor('textSecondary')} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Max Members (default: 100)"
                value={formData.maxMembers.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 100;
                  setFormData({ ...formData, maxMembers: Math.min(Math.max(num, 2), 1000) });
                }}
                keyboardType="numeric"
              />
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createButton, isLoading && styles.buttonDisabled]}
              onPress={handleCreateRoom}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[getColor('primary'), getColor('secondary')]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Creating...' : 'Create Room'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: getColor('bg'),
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: getSpacing('lg'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('xl'),
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: getColor('surface'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: getColor('textPrimary'),
  },
  placeholder: {
    width: 44,
  },
  formContainer: {
    backgroundColor: getColor('surface'),
    borderRadius: getRadius('lg'),
    padding: getSpacing('xl'),
    marginHorizontal: getSpacing('sm'),
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: getColor('textPrimary'),
    textAlign: 'center',
    marginBottom: getSpacing('xl'),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getColor('bg'),
    borderRadius: getRadius('md'),
    marginBottom: getSpacing('lg'),
    paddingHorizontal: getSpacing('md'),
    borderWidth: 1,
    borderColor: getColor('border'),
  },
  inputIcon: {
    marginRight: getSpacing('sm'),
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: getColor('textPrimary'),
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('lg'),
    paddingHorizontal: getSpacing('sm'),
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    color: getColor('textPrimary'),
    marginLeft: getSpacing('sm'),
  },
  createButton: {
    borderRadius: getRadius('md'),
    marginTop: getSpacing('lg'),
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: getSpacing('md'),
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
