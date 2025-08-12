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
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Business {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  address: string;
  phone: string;
  website?: string;
  hours: string;
  isOpen: boolean;
  image?: string;
  tags: string[];
  description: string;
}

interface BusinessDirectoryProps {
  isVisible: boolean;
  onClose: () => void;
  onBusinessSelect: (business: Business) => void;
}

const BUSINESS_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🏪', color: '#00d4ff' },
  { id: 'food', label: 'Food & Drink', icon: '🍕', color: '#ff6b9d' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#fbbf24' },
  { id: 'health', label: 'Health & Beauty', icon: '💊', color: '#10b981' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#7c3aed' },
  { id: 'services', label: 'Services', icon: '🔧', color: '#059669' },
];

  // Businesses will be loaded from Supabase

export const BusinessDirectory: React.FC<BusinessDirectoryProps> = ({
  isVisible,
  onClose,
  onBusinessSelect,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'name'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const searchAnimation = useRef(new Animated.Value(0)).current;

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
    filterBusinesses();
  }, [searchQuery, selectedCategory, sortBy]);

  const filterBusinesses = () => {
    let filtered: Business[] = [];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(business => business.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(business =>
        business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort businesses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredBusinesses(filtered);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push('☆');
    }

    return stars.join('');
  };

  const renderBusinessCard = ({ item }: { item: Business }) => (
    <TouchableOpacity
      style={[styles.businessCard, { backgroundColor: colors.glass.primary }]}
      onPress={() => onBusinessSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.businessHeader}>
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, { color: colors.text.primary }]}>
            {item.name}
          </Text>
          <Text style={[styles.businessCategory, { color: colors.text.secondary }]}>
            {BUSINESS_CATEGORIES.find(cat => cat.id === item.category)?.label}
          </Text>
        </View>
        <View style={styles.businessRating}>
          <Text style={styles.stars}>{renderStars(item.rating)}</Text>
          <Text style={[styles.ratingText, { color: colors.text.secondary }]}>
            {item.rating} ({item.reviewCount})
          </Text>
        </View>
      </View>

      <Text style={[styles.businessDescription, { color: colors.text.secondary }]}>
        {item.description}
      </Text>

      <View style={styles.businessDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={[styles.detailText, { color: colors.text.secondary }]}>
            {item.distance} • {item.address}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🕐</Text>
          <Text style={[styles.detailText, { color: colors.text.secondary }]}>
            {item.hours}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.isOpen ? colors.status.success : colors.status.error }
          ]}>
            <Text style={[styles.statusText, { color: colors.text.inverse }]}>
              {item.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tagsContainer}>
        {item.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={[styles.tagChip, { backgroundColor: colors.glass.secondary }]}>
            <Text style={[styles.tagText, { color: colors.text.secondary }]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
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
                Local Businesses
              </Text>
              <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
                <Text style={[styles.filterIcon, { color: colors.text.primary }]}>⚙️</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.glass.primary }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search businesses..."
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
              {BUSINESS_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: colors.glass.primary },
                    selectedCategory === category.id && {
                      backgroundColor: category.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: colors.text.primary },
                      selectedCategory === category.id && { color: colors.text.inverse },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filters Panel */}
            {showFilters && (
              <View style={[styles.filtersPanel, { backgroundColor: colors.glass.primary }]}>
                <Text style={[styles.filtersTitle, { color: colors.text.primary }]}>
                  Sort by
                </Text>
                <View style={styles.sortOptions}>
                  {[
                    { id: 'rating', label: 'Rating' },
                    { id: 'distance', label: 'Distance' },
                    { id: 'name', label: 'Name' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.sortOption,
                        sortBy === option.id && {
                          backgroundColor: colors.neural.primary,
                        },
                      ]}
                      onPress={() => setSortBy(option.id as any)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          { color: colors.text.primary },
                          sortBy === option.id && { color: colors.text.inverse },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Business List */}
            <FlatList
              data={filteredBusinesses}
              renderItem={renderBusinessCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.businessList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🏪</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                    No businesses found
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    Try adjusting your search or filters
                  </Text>
                </View>
              }
            />
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtersPanel: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  businessList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  businessCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
  },
  businessRating: {
    alignItems: 'flex-end',
  },
  stars: {
    fontSize: 12,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  businessDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  businessDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 