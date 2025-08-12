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
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface EventData {
  title: string;
  description: string;
  category: string;
  date: Date;
  time: string;
  location: string;
  maxAttendees: number;
  isPublic: boolean;
  tags: string[];
  image?: string;
}

interface EventCreationProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (event: EventData) => void;
}

const EVENT_CATEGORIES = [
  { id: 'social', label: 'Social', icon: '🎉', color: '#ff6b9d' },
  { id: 'fitness', label: 'Fitness', icon: '🏃‍♂️', color: '#00d4ff' },
  { id: 'food', label: 'Food & Drink', icon: '🍕', color: '#fbbf24' },
  { id: 'creative', label: 'Creative', icon: '🎨', color: '#7c3aed' },
  { id: 'tech', label: 'Tech', icon: '💻', color: '#10b981' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌲', color: '#059669' },
  { id: 'music', label: 'Music', icon: '🎵', color: '#ec4899' },
  { id: 'learning', label: 'Learning', icon: '📚', color: '#8b5cf6' },
];

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

export const EventCreation: React.FC<EventCreationProps> = ({
  isVisible,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const [event, setEvent] = useState<EventData>({
    title: '',
    description: '',
    category: '',
    date: new Date(),
    time: '18:00',
    location: '',
    maxAttendees: 20,
    isPublic: true,
    tags: [],
  });
  
  const [activeStep, setActiveStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: activeStep / 4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeStep]);

  const handleSave = () => {
    if (!event.title || !event.category || !event.location) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    onSave(event);
    onClose();
  };

  const nextStep = () => {
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !event.tags.includes(tag.trim())) {
      setEvent(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()].slice(0, 5), // Max 5 tags
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEvent(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { backgroundColor: colors.glass.secondary }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: colors.neural.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: colors.text.secondary }]}>
        Step {activeStep} of 4
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
        Event Details
      </Text>
      
      <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
          Event Title *
        </Text>
        <TextInput
          style={[styles.textInput, { color: colors.text.primary }]}
          value={event.title}
          onChangeText={(text) => setEvent(prev => ({ ...prev, title: text }))}
          placeholder="What's your event called?"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
          Description
        </Text>
        <TextInput
          style={[styles.textArea, { color: colors.text.primary }]}
          value={event.description}
          onChangeText={(text) => setEvent(prev => ({ ...prev, description: text }))}
          placeholder="Tell people what to expect..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.categoryButton, { backgroundColor: colors.glass.primary }]}
        onPress={() => setShowCategoryPicker(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.categoryButtonText, { color: colors.text.primary }]}>
          {event.category ? `Category: ${event.category}` : 'Select Category *'}
        </Text>
        <Text style={styles.categoryButtonIcon}>▶</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
        Date & Time
      </Text>
      
      <TouchableOpacity
        style={[styles.dateTimeButton, { backgroundColor: colors.glass.primary }]}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.dateTimeIcon}>📅</Text>
        <View style={styles.dateTimeInfo}>
          <Text style={[styles.dateTimeLabel, { color: colors.text.secondary }]}>
            Date
          </Text>
          <Text style={[styles.dateTimeValue, { color: colors.text.primary }]}>
            {event.date.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.dateTimeButton, { backgroundColor: colors.glass.primary }]}
        onPress={() => setShowTimePicker(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.dateTimeIcon}>🕐</Text>
        <View style={styles.dateTimeInfo}>
          <Text style={[styles.dateTimeLabel, { color: colors.text.secondary }]}>
            Time
          </Text>
          <Text style={[styles.dateTimeValue, { color: colors.text.primary }]}>
            {event.time}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
        Location & Capacity
      </Text>
      
      <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
          Location *
        </Text>
        <TextInput
          style={[styles.textInput, { color: colors.text.primary }]}
          value={event.location}
          onChangeText={(text) => setEvent(prev => ({ ...prev, location: text }))}
          placeholder="Where is your event?"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
          Max Attendees
        </Text>
        <TextInput
          style={[styles.textInput, { color: colors.text.primary }]}
          value={event.maxAttendees.toString()}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setEvent(prev => ({ ...prev, maxAttendees: Math.max(1, Math.min(100, num)) }));
          }}
          placeholder="20"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
        />
      </View>

      <View style={[styles.toggleSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
          Public Event
        </Text>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: event.isPublic 
                ? colors.neural.primary 
                : colors.glass.secondary,
            },
          ]}
          onPress={() => setEvent(prev => ({ ...prev, isPublic: !prev.isPublic }))}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: event.isPublic ? colors.text.inverse : colors.text.secondary }]}>
            {event.isPublic ? 'Yes' : 'No'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
        Tags & Final Details
      </Text>
      
      <View style={[styles.inputSection, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
          Add Tags (optional)
        </Text>
        <TextInput
          style={[styles.textInput, { color: colors.text.primary }]}
          placeholder="Add a tag and press Enter"
          placeholderTextColor={colors.text.tertiary}
          onSubmitEditing={(e) => {
            addTag(e.nativeEvent.text);
          }}
        />
      </View>

      {event.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {event.tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, { backgroundColor: colors.neural.primary }]}
              onPress={() => removeTag(tag)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tagText, { color: colors.text.inverse }]}>
                {tag} ✕
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.summaryCard, { backgroundColor: colors.glass.primary }]}>
        <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
          Event Summary
        </Text>
        <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
          {event.title}
        </Text>
        <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
          {event.date.toLocaleDateString()} at {event.time}
        </Text>
        <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
          {event.location}
        </Text>
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
                Create Event
              </Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={[styles.saveText, { color: colors.neural.primary }]}>Create</Text>
              </TouchableOpacity>
            </View>

            {renderProgressBar()}

            {/* Step Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {activeStep === 1 && renderStep1()}
              {activeStep === 2 && renderStep2()}
              {activeStep === 3 && renderStep3()}
              {activeStep === 4 && renderStep4()}
            </ScrollView>

            {/* Navigation */}
            <View style={styles.navigation}>
              {activeStep > 1 && (
                <TouchableOpacity
                  style={[styles.navButton, { backgroundColor: colors.glass.primary }]}
                  onPress={prevStep}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navButtonText, { color: colors.text.primary }]}>
                    Previous
                  </Text>
                </TouchableOpacity>
              )}
              
              {activeStep < 4 ? (
                <TouchableOpacity
                  style={[styles.navButton, { backgroundColor: colors.neural.primary }]}
                  onPress={nextStep}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navButtonText, { color: colors.text.inverse }]}>
                    Next
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.navButton, { backgroundColor: colors.neural.primary }]}
                  onPress={handleSave}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navButtonText, { color: colors.text.inverse }]}>
                    Create Event
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Category Picker Modal */}
            <Modal
              visible={showCategoryPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCategoryPicker(false)}
            >
              <View style={styles.pickerOverlay}>
                <BlurView intensity={30} style={styles.pickerBlur}>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.glass.primary }]}>
                    <Text style={[styles.pickerTitle, { color: colors.text.primary }]}>
                      Select Category
                    </Text>
                    <View style={styles.categoryGrid}>
                      {EVENT_CATEGORIES.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryOption,
                            { backgroundColor: category.color },
                          ]}
                          onPress={() => {
                            setEvent(prev => ({ ...prev, category: category.label }));
                            setShowCategoryPicker(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                          <Text style={[styles.categoryOptionText, { color: '#ffffff' }]}>
                            {category.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowCategoryPicker(false)}
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
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
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
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryButtonIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  dateTimeIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  pickerContainer: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  categoryOption: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOptionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
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