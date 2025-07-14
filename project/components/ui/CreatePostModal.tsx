import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Image as ImageIcon, MapPin, Hash, Send } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (post: { content: string; image?: string; proximity: string; tags: string[] }) => void;
  currentProximity?: 'neighborhood' | 'city' | 'state';
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSubmit,
  currentProximity = 'neighborhood',
}) => {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string>('');
  const [proximity, setProximity] = useState(currentProximity);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const proximityOptions = [
            { value: 'neighborhood', label: 'Hood', emoji: '🏠' },
    { value: 'city', label: 'City', emoji: '🏙️' },
    { value: 'state', label: 'State', emoji: '🗺️' },
  ];

  const suggestedTags = [
    'Local', 'Community', 'Events', 'Food', 'Music', 'Art', 'Sports', 'Business', 'Help', 'Recommendation'
  ];

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    onSubmit({
      content: content.trim(),
      image: image || undefined,
      proximity,
      tags,
    });

    // Reset form
    setContent('');
    setImage('');
    setProximity(currentProximity);
    setTags([]);
    setTagInput('');
    onClose();
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().replace('#', '');
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 5) {
      setTags([...tags, cleanTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputSubmit = () => {
    if (tagInput.trim()) {
      addTag(tagInput);
      setTagInput('');
    }
  };

  if (!visible) return null;

  return (
    <BlurView intensity={20} style={styles.overlay}>
      <View style={[styles.modal, { 
        backgroundColor: theme.colors.glass.primary,
        borderColor: theme.colors.glass.border,
      }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.glass.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Create Post
          </Text>
          <TouchableOpacity 
            style={[styles.submitButton, { 
              backgroundColor: content.trim() ? theme.colors.neural.primary : theme.colors.interactive.disabled 
            }]}
            onPress={handleSubmit}
            disabled={!content.trim()}
          >
            <Send size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Proximity Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
              Share with
            </Text>
            <View style={styles.proximityOptions}>
              {proximityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.proximityOption, {
                    backgroundColor: proximity === option.value 
                      ? theme.colors.neural.primary 
                      : theme.colors.glass.secondary,
                    borderColor: theme.colors.glass.border,
                  }]}
                  onPress={() => setProximity(option.value as any)}
                >
                  <Text style={styles.proximityEmoji}>{option.emoji}</Text>
                  <Text style={[styles.proximityLabel, { 
                    color: proximity === option.value 
                      ? theme.colors.text.inverse 
                      : theme.colors.text.primary 
                  }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.section}>
            <TextInput
              style={[styles.contentInput, { 
                color: theme.colors.text.primary,
                borderColor: theme.colors.glass.border,
              }]}
              placeholder="What's happening in your hood?"
              placeholderTextColor={theme.colors.text.tertiary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.characterCount, { color: theme.colors.text.tertiary }]}>
              {content.length}/500
            </Text>
          </View>

          {/* Image Upload */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.imageUpload, { 
                backgroundColor: theme.colors.glass.secondary,
                borderColor: theme.colors.glass.border,
              }]}
              onPress={() => {
                // TODO: Implement image picker
                Alert.alert('Coming Soon', 'Image upload will be available soon!');
              }}
            >
              <ImageIcon size={24} color={theme.colors.text.tertiary} />
              <Text style={[styles.imageUploadText, { color: theme.colors.text.tertiary }]}>
                Add Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
              Tags
            </Text>
            
            {/* Tag Input */}
            <View style={styles.tagInputContainer}>
              <Hash size={16} color={theme.colors.text.tertiary} />
              <TextInput
                style={[styles.tagInput, { color: theme.colors.text.primary }]}
                placeholder="Add a tag..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleTagInputSubmit}
                returnKeyType="done"
              />
            </View>

            {/* Selected Tags */}
            {tags.length > 0 && (
              <View style={styles.selectedTags}>
                {tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { 
                    backgroundColor: theme.colors.neural.primary + '20',
                    borderColor: theme.colors.neural.primary,
                  }]}>
                    <Text style={[styles.tagText, { color: theme.colors.neural.primary }]}>
                      #{tag}
                    </Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <X size={12} color={theme.colors.neural.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Tags */}
            <Text style={[styles.suggestedTitle, { color: theme.colors.text.tertiary }]}>
              Suggested:
            </Text>
            <View style={styles.suggestedTags}>
              {suggestedTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.suggestedTag, { 
                    backgroundColor: theme.colors.glass.secondary 
                  }]}
                  onPress={() => addTag(tag)}
                >
                  <Text style={[styles.suggestedTagText, { color: theme.colors.text.secondary }]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  proximityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  proximityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  proximityEmoji: {
    fontSize: 16,
  },
  proximityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  contentInput: {
    minHeight: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  imageUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    fontSize: 14,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestedTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestedTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestedTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 