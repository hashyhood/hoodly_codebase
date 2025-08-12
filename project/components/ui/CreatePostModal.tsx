import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { getColor, getSpacing, getRadius, theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreatePostModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (post: { content: string; images?: string[] }) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isVisible,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImage = result.assets[0].uri;
        setImages(prev => [...prev, newImage].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const imageUri of images) {
        const fileName = `posts/${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        // Convert image to blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(fileName, blob);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Error', 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }

    return uploadedUrls;
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Error', 'Please add some content or images');
      return;
    }

    try {
      const uploadedUrls = await uploadImages();
      
      onSave({
        content: content.trim(),
        images: uploadedUrls,
      });

      // Reset form
      setContent('');
      setImages([]);
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      Alert.alert('Error', 'Failed to save post');
    }
  };

  const showImageOptions = () => {
    setShowImagePicker(true);
  };

  if (!isVisible) return null;

  return (
    <View style={[styles.container, { backgroundColor: getColor('bg') }]}>
      <View style={[styles.header, { borderBottomColor: getColor('divider') }]}>
        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: getColor('textTertiary') }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: getColor('textPrimary') }]}>
          Create Post
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!content.trim() || isUploading}
          style={[
            styles.postButton,
            {
              backgroundColor: content.trim()
                ? getColor('success')
                : getColor('surface')
            }
          ]}
        >
          <Text style={[
            styles.postButtonText,
            { color: getColor('textPrimary') }
          ]}>
            {isUploading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          style={[
            styles.textInput,
            {
              color: getColor('textPrimary'),
              borderColor: getColor('divider'),
            }
          ]}
          placeholder="What's happening in your neighborhood?"
          placeholderTextColor={getColor('textTertiary')}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={500}
        />
        <Text style={[styles.characterCount, { color: getColor('textTertiary') }]}>
          {content.length}/500
        </Text>

        {/* Image Upload Section */}
        {images.length < 5 && (
          <TouchableOpacity
            style={[
              styles.imageUploadButton,
              {
                backgroundColor: getColor('surface'),
                borderColor: getColor('divider'),
              }
            ]}
            onPress={showImageOptions}
          >
            <View style={styles.imageUploadContent}>
              <Text style={{ fontSize: 24, color: getColor('textTertiary') }}>📷</Text>
              <Text style={[styles.imageUploadText, { color: getColor('textTertiary') }]}>
                Add Photos ({images.length}/5)
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Selected Images */}
        {images.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={[styles.sectionTitle, { color: getColor('textPrimary') }]}>
              Selected Images
            </Text>
            <View style={styles.imagesGrid}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.image} />
                  <TouchableOpacity
                    style={[styles.tag, { backgroundColor: getColor('surface') }]}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={[styles.tagText, { color: getColor('textSecondary') }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Image Options Modal */}
      {showImagePicker && (
        <View style={styles.imageOptionsModal}>
          <View style={styles.imageOptionsContent}>
            <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={getColor('textPrimary')} />
              <Text style={[styles.imageOptionText, { color: getColor('textPrimary') }]}>
                Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
              <Ionicons name="images" size={24} color={getColor('textPrimary')} />
              <Text style={[styles.imageOptionText, { color: getColor('textPrimary') }]}>
                Choose from Library
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageOption} onPress={() => setShowImagePicker(false)}>
              <Ionicons name="close" size={24} color={getColor('textPrimary')} />
              <Text style={[styles.imageOptionText, { color: getColor('textPrimary') }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  postButton: {
    paddingHorizontal: getSpacing('xl'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getRadius('xl'),
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: getSpacing('xl'),
  },
  textInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: getRadius('sm'),
    padding: getSpacing('lg'),
    fontSize: 16,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: getSpacing('xs'),
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: getSpacing('xl'),
    borderRadius: getRadius('sm'),
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  imageUploadContent: {
    alignItems: 'center',
  },
  imageUploadText: {
    marginTop: getSpacing('xs'),
    fontSize: 16,
  },
  imagesSection: {
    marginTop: getSpacing('xl'),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: getSpacing('sm'),
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing('xs'),
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: getRadius('xs'),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    bottom: getSpacing('xs'),
    left: getSpacing('xs'),
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getRadius('lg'),
  },
  tagText: {
    fontSize: 14,
  },
  imageOptionsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOptionsContent: {
    backgroundColor: getColor('bg'),
    borderRadius: getRadius('lg'),
    padding: getSpacing('xl'),
    width: '80%',
    alignItems: 'center',
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('lg'),
    paddingVertical: getSpacing('sm'),
    paddingHorizontal: getSpacing('xl'),
    borderRadius: getRadius('sm'),
    borderWidth: 1,
    borderColor: getColor('divider'),
  },
  imageOptionText: {
    marginLeft: getSpacing('sm'),
    fontSize: 18,
    fontWeight: '600',
  },
}); 