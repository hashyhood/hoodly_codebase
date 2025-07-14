import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Dimensions } from 'react-native';
import { HoodlyLayout } from '../../components/ui/HoodlyLayout';
import { SearchBar } from '../../components/ui/SearchBar';
import { BusinessDirectory } from '../../components/ui/BusinessDirectory';
import { SafetyAlerts } from '../../components/ui/SafetyAlerts';
import { NeighborhoodGroups } from '../../components/ui/NeighborhoodGroups';
import { ImageOptimizer } from '../../components/ui/ImageOptimizer';
import { EventCreation } from '../../components/ui/EventCreation';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

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
  members: any[];
  recentPosts: any[];
  rules: string[];
}

export default function DiscoverScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBusinessDirectory, setShowBusinessDirectory] = useState(false);
  const [showSafetyAlerts, setShowSafetyAlerts] = useState(false);
  const [showNeighborhoodGroups, setShowNeighborhoodGroups] = useState(false);
  const [showImageOptimizer, setShowImageOptimizer] = useState(false);
  const [showEventCreation, setShowEventCreation] = useState(false);

  const handleBusinessSelect = (business: Business) => {
    console.log('Selected business:', business);
    setShowBusinessDirectory(false);
  };

  const handleAlertReport = (alert: any) => {
    console.log('New alert reported:', alert);
  };

  const handleGroupSelect = (group: NeighborhoodGroup) => {
    console.log('Selected group:', group);
    setShowNeighborhoodGroups(false);
  };

  const handleImageSelect = (image: string) => {
    console.log('Selected image:', image);
    setShowImageOptimizer(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  const handleFilter = () => {
    console.log('Filter pressed');
  };

  const handleVoice = () => {
    console.log('Voice search pressed');
  };

  const discoverFeatures = [
    {
      id: 'businesses',
      title: 'Local Businesses',
      description: 'Find restaurants, shops, and services',
      icon: '🏪',
      color: theme.colors.gradients.neural,
      onPress: () => setShowBusinessDirectory(true),
      badge: 'New',
    },
    {
      id: 'safety',
      title: 'Safety Alerts',
      description: 'Stay informed about your neighborhood',
      icon: '🛡️',
      color: theme.colors.gradients.cyber,
      onPress: () => setShowSafetyAlerts(true),
      badge: 'Live',
    },
    {
      id: 'groups',
      title: 'Neighborhood Groups',
      description: 'Join local communities and discussions',
      icon: '👥',
      color: theme.colors.gradients.sunset,
      onPress: () => setShowNeighborhoodGroups(true),
    },
    {
      id: 'events',
      title: 'Create Event',
      description: 'Organize meetups and activities',
      icon: '🎉',
      color: theme.colors.gradients.aurora,
      onPress: () => setShowEventCreation(true),
    },
    {
      id: 'marketplace',
      title: 'Local Marketplace',
      description: 'Buy and sell with neighbors',
      icon: '🛍️',
      color: theme.colors.gradients.ocean,
      onPress: () => console.log('Marketplace'),
    },
    {
      id: 'optimizer',
      title: 'Image Optimizer',
      description: 'Enhance your photos with AI',
      icon: '✨',
      color: theme.colors.gradients.neural,
      onPress: () => setShowImageOptimizer(true),
      badge: 'AI',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <HoodlyLayout
        neighborhoodName="Discover"
        activeNeighbors={47}
        communityHealth={94}
        socialScore={8.4}
        eventsToday={23}
        showSearch={true}
        searchPlaceholder="Search businesses, groups, events..."
        onSearch={handleSearch}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <SearchBar
              placeholder="Search businesses, groups, events..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSearch={() => handleSearch(searchQuery)}
              onFilter={handleFilter}
              onVoice={handleVoice}
              showFilter={true}
              showVoice={true}
            />
          </View>

          {/* Featured Section */}
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Featured
            </Text>
            <View style={[styles.featuredCard, { backgroundColor: theme.colors.glass.primary }]}>
              <Text style={[styles.featuredTitle, { color: theme.colors.text.primary }]}>
                Welcome to Hoodly Discover! 🎉
              </Text>
              <Text style={[styles.featuredDescription, { color: theme.colors.text.secondary }]}>
                Explore your neighborhood like never before. Find local businesses, join groups, stay safe, and connect with your community.
              </Text>
              <View style={styles.featuredStats}>
                <View style={styles.stat}>
                  <Text style={[styles.statNumber, { color: theme.colors.neural.primary }]}>47</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Active Neighbors</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNumber, { color: theme.colors.neural.primary }]}>23</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Events Today</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNumber, { color: theme.colors.neural.primary }]}>8.4</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Community Score</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Discover Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Explore
            </Text>
            <View style={styles.featuresGrid}>
              {discoverFeatures.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={[styles.featureCard, { backgroundColor: theme.colors.glass.primary }]}
                  onPress={feature.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.featureIcon, { backgroundColor: feature.color[0] }]}>
                    <Text style={styles.iconText}>{feature.icon}</Text>
                  </View>
                  <Text style={[styles.featureTitle, { color: theme.colors.text.primary }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: theme.colors.text.secondary }]}>
                    {feature.description}
                  </Text>
                  {feature.badge && (
                    <View style={[styles.featureBadge, { backgroundColor: theme.colors.status.error }]}>
                      <Text style={[styles.badgeText, { color: 'white' }]}>{feature.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Performance & Coming Soon */}
          <View style={styles.performanceSection}>
            <View style={[styles.performanceCard, { backgroundColor: theme.colors.glass.primary }]}>
              <Text style={[styles.performanceTitle, { color: theme.colors.text.primary }]}>
                Community Performance
              </Text>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceItem}>
                  <Text style={[styles.performanceValue, { color: theme.colors.neural.secondary }]}>94%</Text>
                  <Text style={[styles.performanceLabel, { color: theme.colors.text.tertiary }]}>Health</Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={[styles.performanceValue, { color: theme.colors.neural.secondary }]}>8.4</Text>
                  <Text style={[styles.performanceLabel, { color: theme.colors.text.tertiary }]}>Score</Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={[styles.performanceValue, { color: theme.colors.neural.secondary }]}>23</Text>
                  <Text style={[styles.performanceLabel, { color: theme.colors.text.tertiary }]}>Events</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.comingSoonSection}>
            <View style={[styles.comingSoonCard, { backgroundColor: theme.colors.glass.primary }]}>
              <Text style={[styles.comingSoonTitle, { color: theme.colors.text.primary }]}>
                Coming Soon
              </Text>
              <Text style={[styles.comingSoonDescription, { color: theme.colors.text.secondary }]}>
                We&apos;re constantly adding new features to make your neighborhood experience even better.
              </Text>
              <View style={styles.comingSoonFeatures}>
                <Text style={[styles.comingSoonFeature, { color: theme.colors.text.tertiary }]}>
                  • Augmented reality features
                </Text>
                <Text style={[styles.comingSoonFeature, { color: theme.colors.text.tertiary }]}>
                  • Advanced analytics dashboard
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </HoodlyLayout>

      {/* Modals */}
      <BusinessDirectory
        isVisible={showBusinessDirectory}
        onClose={() => setShowBusinessDirectory(false)}
        onBusinessSelect={handleBusinessSelect}
      />

      <SafetyAlerts
        isVisible={showSafetyAlerts}
        onClose={() => setShowSafetyAlerts(false)}
        onAlertReport={handleAlertReport}
      />

      <NeighborhoodGroups
        isVisible={showNeighborhoodGroups}
        onClose={() => setShowNeighborhoodGroups(false)}
        onGroupSelect={handleGroupSelect}
      />

      <ImageOptimizer
        isVisible={showImageOptimizer}
        onClose={() => setShowImageOptimizer(false)}
        onImageSelect={handleImageSelect}
      />

      <EventCreation
        isVisible={showEventCreation}
        onClose={() => setShowEventCreation(false)}
        onSave={(event) => console.log('Event created:', event)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 120, // Space for the tab bar
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    marginBottom: 24,
  },
  featuredSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  featuredCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  featuredStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    width: (width - 64 - 16) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  featureBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  performanceSection: {
    marginBottom: 24,
  },
  performanceCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
  },
  comingSoonSection: {
    marginBottom: 24,
  },
  comingSoonCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  comingSoonFeatures: {
    gap: 8,
  },
  comingSoonFeature: {
    fontSize: 12,
  },
}); 