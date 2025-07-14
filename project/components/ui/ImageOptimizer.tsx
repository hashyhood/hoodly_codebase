import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Animated, 
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OptimizedImageProps {
  source: string;
  alt?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  onPress?: () => void;
  priority?: 'low' | 'medium' | 'high';
  placeholder?: string;
  fallback?: string;
}

interface ImageOptimizerProps {
  isVisible: boolean;
  onClose: () => void;
  onImageSelect: (image: string) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  alt,
  width: imgWidth = 200,
  height: imgHeight = 200,
  borderRadius = 12,
  onPress,
  priority = 'medium',
  placeholder = '🖼️',
  fallback = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Image',
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSource, setCurrentSource] = useState(source);
  
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const blurAnimation = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(blurAnimation, {
          toValue: 5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blurAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (currentSource !== fallback) {
      setCurrentSource(fallback);
    }
  };

  const ImageComponent = onPress ? TouchableOpacity : View;

  return (
    <ImageComponent
      style={[
        styles.imageContainer,
        {
          width: imgWidth,
          height: imgHeight,
          borderRadius,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Placeholder */}
      {isLoading && (
        <Animated.View
          style={[
            styles.placeholder,
            {
              opacity: fadeAnimation,
              borderRadius,
              backgroundColor: theme.colors.glass.primary,
            },
          ]}
        >
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </Animated.View>
      )}

      {/* Main Image */}
      <Animated.Image
        source={{ uri: currentSource }}
        style={[
          styles.image,
          {
            width: imgWidth,
            height: imgHeight,
            borderRadius,
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }],
          },
        ]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode="cover"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <Animated.View
          style={[
            styles.loadingOverlay,
            {
              opacity: fadeAnimation,
              borderRadius,
            },
          ]}
        >
          <View style={styles.loadingSpinner}>
            <Text style={styles.spinnerText}>⏳</Text>
          </View>
        </Animated.View>
      )}

      {/* Error State */}
      {hasError && currentSource === fallback && (
        <View style={[styles.errorOverlay, { borderRadius }]}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            Failed to load image
          </Text>
        </View>
      )}

      {/* Priority Badge */}
      {priority === 'high' && (
        <View style={[styles.priorityBadge, { backgroundColor: theme.colors.status.warning }]}>
          <Text style={[styles.priorityText, { color: theme.colors.text.inverse }]}>
            High
          </Text>
        </View>
      )}
    </ImageComponent>
  );
};

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  isVisible,
  onClose,
  onImageSelect,
}) => {
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [optimizationLevel, setOptimizationLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [imageQuality, setImageQuality] = useState(80);
  
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

  const sampleImages = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  ];

  const handleImageSelect = (image: string) => {
    setSelectedImage(image);
    onImageSelect(image);
  };

  const getOptimizedUrl = (url: string, quality: number) => {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=400&h=300&fit=crop&q=${quality}`;
  };

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
                backgroundColor: theme.colors.neural.background,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeText, { color: theme.colors.text.primary }]}>✕</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Image Optimizer
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Optimization Controls */}
            <View style={[styles.controlsContainer, { backgroundColor: theme.colors.glass.primary }]}>
              <Text style={[styles.controlsTitle, { color: theme.colors.text.primary }]}>
                Optimization Settings
              </Text>
              
              <View style={styles.controlRow}>
                <Text style={[styles.controlLabel, { color: theme.colors.text.secondary }]}>
                  Quality: {imageQuality}%
                </Text>
                <View style={styles.qualitySlider}>
                  <TouchableOpacity
                    style={[styles.qualityButton, { backgroundColor: theme.colors.glass.secondary }]}
                    onPress={() => setImageQuality(Math.max(10, imageQuality - 10))}
                  >
                    <Text style={[styles.qualityButtonText, { color: theme.colors.text.primary }]}>
                      -
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.qualityBar, { backgroundColor: theme.colors.glass.secondary }]}>
                    <View
                      style={[
                        styles.qualityFill,
                        {
                          width: `${imageQuality}%`,
                          backgroundColor: theme.colors.gradients.neural[0],
                        },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.qualityButton, { backgroundColor: theme.colors.glass.secondary }]}
                    onPress={() => setImageQuality(Math.min(100, imageQuality + 10))}
                  >
                    <Text style={[styles.qualityButtonText, { color: theme.colors.text.primary }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.priorityOptions}>
                <Text style={[styles.controlLabel, { color: theme.colors.text.secondary }]}>
                  Priority:
                </Text>
                {[
                  { id: 'low', label: 'Low', color: theme.colors.status.info },
                  { id: 'medium', label: 'Medium', color: theme.colors.status.warning },
                  { id: 'high', label: 'High', color: theme.colors.status.error },
                ].map((priority) => (
                  <TouchableOpacity
                    key={priority.id}
                    style={[
                      styles.priorityOption,
                      { backgroundColor: priority.color },
                      optimizationLevel === priority.id && {
                        borderWidth: 2,
                        borderColor: theme.colors.text.primary,
                      },
                    ]}
                    onPress={() => setOptimizationLevel(priority.id as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.priorityOptionText, { color: theme.colors.text.inverse }]}>
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Image Gallery */}
            <ScrollView style={styles.galleryContainer} showsVerticalScrollIndicator={false}>
              <Text style={[styles.galleryTitle, { color: theme.colors.text.primary }]}>
                Sample Images
              </Text>
              
              <View style={styles.imageGrid}>
                {sampleImages.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageItem}
                    onPress={() => handleImageSelect(image)}
                    activeOpacity={0.7}
                  >
                    <OptimizedImage
                      source={getOptimizedUrl(image, imageQuality)}
                      width={150}
                      height={150}
                      borderRadius={12}
                      priority={optimizationLevel}
                    />
                    <View style={styles.imageInfo}>
                      <Text style={[styles.imageSize, { color: theme.colors.text.secondary }]}>
                        {imageQuality}% quality
                      </Text>
                      <Text style={[styles.imagePriority, { color: theme.colors.text.tertiary }]}>
                        {optimizationLevel} priority
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // OptimizedImage styles
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderText: {
    fontSize: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  spinnerText: {
    fontSize: 16,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
  },
  priorityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // ImageOptimizer styles
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
  headerSpacer: {
    width: 40,
  },
  controlsContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  controlRow: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  qualitySlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  qualityBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
    borderRadius: 4,
  },
  priorityOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  galleryContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  imageItem: {
    alignItems: 'center',
  },
  imageInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  imageSize: {
    fontSize: 12,
    fontWeight: '500',
  },
  imagePriority: {
    fontSize: 10,
  },
}); 