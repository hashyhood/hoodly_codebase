import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Animated, 
  Dimensions,
  Modal,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface ProfileData {
  personalName: string;
  username: string;
  bio: string;
  avatar: string;
  interests: string[];
  location: string;
  website: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface ProfileCustomizationProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (profile: ProfileData) => void;
  initialData?: ProfileData;
}

const AVATAR_OPTIONS = [
  '👤', '👩‍💻', '🏃‍♂️', '👩‍🎨', '👨‍🍳', '👩‍⚕️', '👨‍🏫', '👩‍🎤',
  '🦸‍♂️', '🧙‍♀️', '🤖', '🐱', '🐶', '🦄', '🌟', '🎭'
];

const INTEREST_CATEGORIES = {
  '🏃‍♂️ Fitness': ['Running', 'Yoga', 'Gym', 'Swimming', 'Cycling'],
  '🎨 Creative': ['Art', 'Music', 'Photography', 'Writing', 'Design'],
  '🍳 Food': ['Cooking', 'Baking', 'Restaurants', 'Coffee', 'Wine'],
  '💻 Tech': ['Programming', 'AI', 'Gaming', 'Startups', 'Crypto'],
  '🌍 Travel': ['Adventure', 'Culture', 'Photography', 'Food', 'Nature'],
  '📚 Learning': ['Books', 'Courses', 'Languages', 'Science', 'History'],
};

export const ProfileCustomization: React.FC<ProfileCustomizationProps> = ({
  isVisible,
  onClose,
  onSave,
  initialData,
}) => {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<ProfileData>(initialData || {
    personalName: '',
    username: '',
    bio: '',
    avatar: '👤',
    interests: [],
    location: '',
    website: '',
    socialLinks: {},
  });
  
  const [activeTab, setActiveTab] = useState<'basic' | 'interests' | 'social'>('basic');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnimation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnimation, {
          toValue: height,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleSave = () => {
    onSave(profile);
    onClose();
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest].slice(0, 5), // Max 5 interests
    }));
  };

  const renderBasicInfo = () => (
    <View style={styles.tabContent}>
      {/* Avatar Selection */}
          <TouchableOpacity
            style={[styles.avatarSection, { backgroundColor: colors.glass.primary }]}
        onPress={() => setShowAvatarPicker(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.currentAvatar}>{profile.avatar}</Text>
        <View style={styles.avatarInfo}>
              <Text style={[styles.avatarTitle, { color: colors.text.primary }]}>
            Profile Avatar
          </Text>
              <Text style={[styles.avatarSubtitle, { color: colors.text.secondary }]}>
            Tap to change
          </Text>
        </View>
      </TouchableOpacity>

      {/* Name Input */}
          <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Name</Text>
        <TextInput
              style={[styles.textInput, { color: colors.text.primary }]}
          value={profile.personalName}
          onChangeText={(text) => setProfile(prev => ({ ...prev, personalName: text }))}
          placeholder="Your name"
              placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {/* Username Input */}
          <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Username</Text>
        <TextInput
              style={[styles.textInput, { color: colors.text.primary }]}
          value={profile.username}
          onChangeText={(text) => setProfile(prev => ({ ...prev, username: text }))}
          placeholder="@username"
              placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {/* Bio Input */}
          <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Bio</Text>
        <TextInput
              style={[styles.textArea, { color: colors.text.primary }]}
          value={profile.bio}
          onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
          placeholder="Tell us about yourself..."
              placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Location Input */}
          <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Location</Text>
        <TextInput
              style={[styles.textInput, { color: colors.text.primary }]}
          value={profile.location}
          onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
          placeholder="Your city"
              placeholderTextColor={colors.text.tertiary}
        />
      </View>
    </View>
  );

  const renderInterests = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Select your interests (max 5)
      </Text>
      
      {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
        <View key={category} style={styles.interestCategory}>
          <Text style={[styles.categoryTitle, { color: colors.text.secondary }]}>
            {category}
          </Text>
          <View style={styles.interestsGrid}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestChip,
                  { backgroundColor: colors.glass.primary },
                  profile.interests.includes(interest) && {
                    backgroundColor: colors.neural.primary,
                  },
                ]}
                onPress={() => toggleInterest(interest)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.interestText,
                    { color: colors.text.primary },
                    profile.interests.includes(interest) && {
                      color: colors.text.inverse,
                    },
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderSocial = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Social Links
      </Text>
      
      <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Website</Text>
        <TextInput
          style={[styles.textInput, { color: colors.text.primary }]}
          value={profile.website}
          onChangeText={(text) => setProfile(prev => ({ ...prev, website: text }))}
          placeholder="https://yourwebsite.com"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Instagram</Text>
        <TextInput
          style={[styles.textInput, { color: colors.text.primary }]}
          value={profile.socialLinks.instagram || ''}
          onChangeText={(text) => setProfile(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, instagram: text }
          }))}
          placeholder="@username"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Twitter</Text>
        <TextInput
          style={[styles.textInput, { color: colors.text.primary }]}
          value={profile.socialLinks.twitter || ''}
          onChangeText={(text) => setProfile(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, twitter: text }
          }))}
          placeholder="@username"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnimation }]}>
        <BlurView intensity={20} style={styles.blurOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnimation }],
                backgroundColor: colors.neural.background,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeText, { color: colors.text.primary }]}>✕</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                Edit Profile
              </Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={[styles.saveText, { color: colors.neural.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabNavigation}>
              {[
                { id: 'basic', label: 'Basic', icon: '👤' },
                { id: 'interests', label: 'Interests', icon: '⭐' },
                { id: 'social', label: 'Social', icon: '🔗' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabButton,
                    activeTab === tab.id && {
                      backgroundColor: colors.neural.primary,
                    },
                  ]}
                  onPress={() => setActiveTab(tab.id as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: colors.text.primary },
                      activeTab === tab.id && { color: colors.text.inverse },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'interests' && renderInterests()}
            {activeTab === 'social' && renderSocial()}

            {/* Avatar Picker Modal */}
            <Modal
              visible={showAvatarPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowAvatarPicker(false)}
            >
              <View style={styles.avatarPickerOverlay}>
                <BlurView intensity={30} style={styles.avatarPickerBlur}>
                  <View style={[styles.avatarPickerContainer, { backgroundColor: colors.glass.primary }]}>
                    <Text style={[styles.avatarPickerTitle, { color: colors.text.primary }]}>
                      Choose Avatar
                    </Text>
                    <View style={styles.avatarGrid}>
                      {AVATAR_OPTIONS.map((avatar) => (
                        <TouchableOpacity
                          key={avatar}
                          style={[
                            styles.avatarOption,
                            profile.avatar === avatar && {
                              backgroundColor: colors.neural.primary,
                            },
                          ]}
                          onPress={() => {
                            setProfile(prev => ({ ...prev, avatar }));
                            setShowAvatarPicker(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.avatarOptionText}>{avatar}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowAvatarPicker(false)}
                    >
                      <Text style={[styles.cancelText, { color: colors.text.secondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </View>
            </Modal>
          </Animated.View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentAvatar: {
    fontSize: 48,
    marginRight: 16,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  avatarSubtitle: {
    fontSize: 14,
  },
  inputSection: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  textArea: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  interestCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  avatarPickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  avatarPickerBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarPickerContainer: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarOptionText: {
    fontSize: 24,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 