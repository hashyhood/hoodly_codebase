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
  FlatList,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'moderator' | 'member';
  joinedDate: Date;
}

interface GroupPost {
  id: string;
  author: GroupMember;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  media?: string;
}

interface NeighborhoodGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  avatar: string;
  coverImage?: string;
  tags: string[];
  createdAt: Date;
  members: GroupMember[];
  recentPosts: GroupPost[];
  rules: string[];
}

interface NeighborhoodGroupsProps {
  isVisible: boolean;
  onClose: () => void;
  onGroupSelect: (group: NeighborhoodGroup) => void;
}

const GROUP_CATEGORIES = [
  { id: 'all', label: 'All Groups', icon: '🏘️', color: '#00d4ff' },
  { id: 'social', label: 'Social', icon: '🎉', color: '#ff6b9d' },
  { id: 'fitness', label: 'Fitness', icon: '🏃‍♂️', color: '#10b981' },
  { id: 'creative', label: 'Creative', icon: '🎨', color: '#7c3aed' },
  { id: 'food', label: 'Food & Cooking', icon: '🍕', color: '#fbbf24' },
  { id: 'tech', label: 'Tech', icon: '💻', color: '#059669' },
  { id: 'parenting', label: 'Parenting', icon: '👶', color: '#ec4899' },
  { id: 'business', label: 'Business', icon: '💼', color: '#8b5cf6' },
];

  // Groups will be loaded from Supabase

export const NeighborhoodGroups: React.FC<NeighborhoodGroupsProps> = ({
  isVisible,
  onClose,
  onGroupSelect,
}) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [filteredGroups, setFilteredGroups] = useState<NeighborhoodGroup[]>([]);
  
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

  useEffect(() => {
    filterGroups();
  }, [searchQuery, selectedCategory]);

  const filterGroups = () => {
    let filtered: NeighborhoodGroup[] = [];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(group => group.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredGroups(filtered);
  };

  const renderGroupCard = ({ item }: { item: NeighborhoodGroup }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: colors.glass.primary }]}
      onPress={() => onGroupSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupAvatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <View style={styles.groupInfo}>
          <View style={styles.groupTitleRow}>
            <Text style={[styles.groupName, { color: colors.text.primary }]}>
              {item.name}
            </Text>
            {item.isPrivate && (
              <View style={[styles.privateBadge, { backgroundColor: colors.status.warning }]}>
                <Text style={[styles.privateText, { color: colors.text.inverse }]}>
                  Private
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.groupCategory, { color: colors.text.secondary }]}>
            {GROUP_CATEGORIES.find(cat => cat.id === item.category)?.label}
          </Text>
          <Text style={[styles.groupMembers, { color: colors.text.tertiary }]}>
            {item.memberCount} members • {item.maxMembers} max
          </Text>
        </View>
      </View>

      <Text style={[styles.groupDescription, { color: colors.text.secondary }]}>
        {item.description}
      </Text>

      <View style={styles.groupTags}>
        {item.tags.map((tag, index) => (
          <View key={index} style={[styles.tagChip, { backgroundColor: colors.glass.secondary }]}>
            <Text style={[styles.tagText, { color: colors.text.secondary }]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>

      {item.recentPosts.length > 0 && (
        <View style={styles.recentActivity}>
          <Text style={[styles.activityTitle, { color: colors.text.secondary }]}>
            Recent Activity
          </Text>
          <View style={styles.activityItem}>
            <Text style={styles.activityAvatar}>{item.recentPosts[0].author.avatar}</Text>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: colors.text.secondary }]}>
                {item.recentPosts[0].content}
              </Text>
              <Text style={[styles.activityTime, { color: colors.text.tertiary }]}>
                {formatTimeAgo(item.recentPosts[0].timestamp)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.groupActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.neural.primary }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: colors.text.inverse }]}>
            Join Group
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.glass.secondary }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: colors.text.primary }]}>
            View Details
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
                Neighborhood Groups
              </Text>
              <TouchableOpacity 
                onPress={() => setShowCreateGroup(true)} 
                style={[styles.createButton, { backgroundColor: colors.neural.primary }]}
              >
                <Text style={[styles.createText, { color: colors.text.inverse }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.glass.primary }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search groups..."
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
              {GROUP_CATEGORIES.map((category) => (
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

            {/* Groups List */}
            <FlatList
              data={filteredGroups}
              renderItem={renderGroupCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.groupsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🏘️</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                    No groups found
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    Try adjusting your search or create a new group
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
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  createText: {
    fontSize: 14,
    fontWeight: '600',
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
  groupsList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  groupCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  privateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  privateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  groupCategory: {
    fontSize: 14,
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 12,
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  recentActivity: {
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityAvatar: {
    fontSize: 16,
    marginRight: 8,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
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