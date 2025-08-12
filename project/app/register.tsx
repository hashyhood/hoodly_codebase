import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getColor, getSpacing, getRadius, theme } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../lib/config';

const { width, height } = Dimensions.get('window');

const INTERESTS = [
  'Technology', 'Gaming', 'Music', 'Sports', 'Food', 'Travel',
  'Fitness', 'Art', 'Books', 'Movies', 'Photography', 'Cooking',
  'Programming', 'Design', 'Business', 'Education', 'Health',
  'Fashion', 'Nature', 'Science', 'History', 'Politics'
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    personalName: '',
    email: '',
    password: '',
    bio: '',
    location: '',
    interests: [] as string[],
  });
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=hashir',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=developer',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=innovator',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=designer',
  ];

  // Generate username when personal name changes
  useEffect(() => {
    if (formData.personalName) {
      const base = formData.personalName.toLowerCase().replace(/\s+/g, '');
      setGeneratedUsername(base);
    }
  }, [formData.personalName]);

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest].slice(0, 5) // Max 5 interests
    }));
  };

  const handleRegister = async () => {
    if (!formData.personalName || !formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please fill in your name, email, and password.');
      return;
    }

    if (formData.password.length < CONFIG.USERS.MIN_PASSWORD_LENGTH) {
      Alert.alert('Password Too Short', `Password must be at least ${CONFIG.USERS.MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    if (formData.interests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest.');
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        name: formData.personalName,
        bio: formData.bio,
        location: formData.location,
        avatar_url: avatars[selectedAvatar],
        interests: formData.interests,
      };

      const { data, error } = await signUp(formData.email, formData.password, userData);

      if (error) {
        Alert.alert('Registration Failed', error.message || 'Something went wrong.');
        return;
      }

      if (data?.user) {
        if (!data.user.email_confirmed_at) {
          Alert.alert(
            'Check Your Email! 📧',
            'We\'ve sent you a confirmation email. Please check your inbox and click the confirmation link to complete your registration.',
            [
              {
                text: 'OK',
  onPress: () => router.replace('/auth'),
              },
            ]
          );
        } else {
          // Navigation will be handled by AuthWrapper automatically
          console.log('Registration successful:', data.user.email);
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Connection Error', 'Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor('bg') }]}>
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={30} style={[styles.header, { borderBottomColor: getColor('divider') }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: getColor('surface') }]}>
            <Ionicons name="arrow-back" size={24} color={getColor('textPrimary')} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: getColor('textPrimary') }]}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </BlurView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Avatar Selection */}
            <View style={styles.avatarSection}>
              <Text style={[styles.sectionTitle, { color: getColor('textPrimary') }]}>Choose Your Avatar</Text>
              <View style={styles.avatarGrid}>
                {avatars.map((avatar, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.avatarOption,
                       selectedAvatar === index && { borderColor: getColor('success'), borderWidth: 3 }
                    ]}
                    onPress={() => setSelectedAvatar(index)}
                  >
                    <Text style={styles.avatarText}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Personal Information */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: getColor('textPrimary') }]}>Personal Information</Text>
              
              <View style={[styles.inputContainer, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
                <Ionicons name="person" size={20} color={getColor('textSecondary')} />
                <TextInput
                  style={[styles.input, { color: getColor('textPrimary') }]}
                  placeholder="Full Name"
                  placeholderTextColor={getColor('textTertiary')}
                  value={formData.personalName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, personalName: text }))}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
                <Ionicons name="mail" size={20} color={getColor('textSecondary')} />
                <TextInput
                  style={[styles.input, { color: getColor('textPrimary') }]}
                  placeholder="Email Address"
                  placeholderTextColor={getColor('textTertiary')}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
                <Ionicons name="lock-closed" size={20} color={getColor('textSecondary')} />
                <TextInput
                  style={[styles.input, { color: getColor('textPrimary') }]}
                  placeholder="Password"
                  placeholderTextColor={getColor('textTertiary')}
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  secureTextEntry={true}
                  autoComplete="password"
                />
              </View>

              {generatedUsername && (
                <View style={[styles.usernamePreview, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
                  <Ionicons name="at" size={16} color={getColor('textSecondary')} />
                  <Text style={[styles.usernameText, { color: getColor('textPrimary') }]}>
                    Your username: @{generatedUsername}
                  </Text>
                </View>
              )}

              <View style={[styles.inputContainer, { backgroundColor: getColor('surface'), borderColor: getColor('divider') }]}>
                <Ionicons name="location" size={20} color={getColor('textSecondary')} />
                <TextInput
                  style={[styles.input, { color: getColor('textPrimary') }]}
                  placeholder="Location (optional)"
                  placeholderTextColor={getColor('textTertiary')}
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                />
              </View>

              <TextInput
                style={[styles.bioInput, { 
                  backgroundColor: getColor('surface'), 
                  borderColor: getColor('divider'),
                  color: getColor('textPrimary') 
                }]}
                placeholder="Tell us about yourself (optional)"
                placeholderTextColor={getColor('textTertiary')}
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Interests Selection */}
            <View style={styles.interestsSection}>
              <Text style={[styles.sectionTitle, { color: getColor('textPrimary') }]}>
                Select Your Interests ({formData.interests.length}/5)
              </Text>
              <Text style={[styles.sectionSubtitle, { color: getColor('textSecondary') }]}>
                Choose up to 5 interests to help us personalize your experience
              </Text>
              
              <View style={styles.interestsGrid}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestChip,
                      formData.interests.includes(interest)
                        ? { backgroundColor: getColor('success') }
                        : { backgroundColor: getColor('surface'), borderColor: getColor('divider') }
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[
                      styles.interestText,
                        formData.interests.includes(interest)
                          ? { color: getColor('textPrimary') }
                          : { color: getColor('textPrimary') }
                    ]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Register Button */}
          <BlurView intensity={30} style={[styles.bottomBar, { borderTopColor: getColor('divider') }]}>
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && { opacity: 0.7 }
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={theme.gradients.primary as [string, string]}
                style={styles.registerGradient}
              >
                <Text style={[styles.registerText, { color: getColor('textPrimary') }]}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  avatarSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarText: {
    fontSize: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  usernamePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  usernameText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  bioInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 80,
  },
  interestsSection: {
    marginBottom: 32,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  registerGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    fontWeight: '700',
  },
}); 