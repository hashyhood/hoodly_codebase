import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Dimensions, Text, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  HeaderScreen, 
  SearchBar, 
  SegmentedChips, 
  StatPillsRow, 
  Card, 
  EmptyState,
  Spinner,
  SkeletonCard,
  GradientFAB
} from '../../components/ui';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface DiscoverFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  onPress: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface SearchResult {
  id: string;
  type: 'group' | 'event' | 'post' | 'business';
  title: string;
  description: string;
  image?: string;
  metadata: any;
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadDiscoverData();
  }, []);

  const loadDiscoverData = async () => {
    setIsLoading(true);
    try {
      // Load initial discover data (stats, features, etc.)
      // For now, we'll just set hasData to true to show the main content
      setHasData(true);
    } catch (error) {
      console.error('Error loading discover data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results: SearchResult[] = [];

      // Search groups
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, description, image_url, member_count')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5);

      if (!groupsError && groups) {
        groups.forEach(group => {
          results.push({
            id: group.id,
            type: 'group',
            title: group.name,
            description: group.description,
            image: group.image_url,
            metadata: { memberCount: group.member_count }
          });
        });
      }

      // Search events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, description, image_url, start_time')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5);

      if (!eventsError && events) {
        events.forEach(event => {
          results.push({
            id: event.id,
            type: 'event',
            title: event.title,
            description: event.description,
            image: event.image_url,
            metadata: { startTime: event.start_time }
          });
        });
      }

      // Search posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, content, image_url, created_at')
        .or(`content.ilike.%${query}%`)
        .limit(5);

      if (!postsError && posts) {
        posts.forEach(post => {
          results.push({
            id: post.id,
            type: 'post',
            title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
            description: post.content,
            image: post.image_url,
            metadata: { createdAt: post.created_at }
          });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    // Filter search results based on selected category
    if (searchResults.length > 0) {
      if (filter === 'all') {
        // Show all results
        return;
      }
      // Filter by type
      const filtered = searchResults.filter(result => result.type === filter.slice(0, -1)); // Remove 's' from end
      setSearchResults(filtered);
    }
  };

  const handleFeaturePress = (featureId: string) => {
    // Navigate to feature screen based on feature ID
    switch (featureId) {
      case 'businesses':
        // router.push('/businesses'); // TODO: Create business directory screen
        console.log('Navigate to businesses');
        break;
      case 'events':
        // router.push('/events'); // TODO: Create events screen
        console.log('Navigate to events');
        break;
      case 'groups':
        router.push('/groups');
        break;
      case 'neighbors':
        // router.push('/neighbors'); // TODO: Create neighbors screen
        console.log('Navigate to neighbors');
        break;
      case 'safety':
        // router.push('/safety'); // TODO: Create safety screen
        console.log('Navigate to safety');
        break;
      default:
        console.log('Feature pressed:', featureId);
        // Default navigation to a generic discover page
        // router.push(`/discover/${featureId}`); // TODO: Create dynamic discover routes
    }
  };

  const handleQuickAction = (actionId: string) => {
    // Handle quick action based on action ID
    switch (actionId) {
      case 'report_issue':
        // router.push('/report-issue'); // TODO: Create report issue screen
        console.log('Navigate to report issue');
        break;
      case 'join_group':
        router.push('/groups');
        break;
      case 'create_event':
        // router.push('/create-event'); // TODO: Create event creation screen
        console.log('Navigate to create event');
        break;
      case 'find_business':
        // router.push('/businesses'); // TODO: Create business directory screen
        console.log('Navigate to find business');
        break;
      case 'emergency':
        // router.push('/safety'); // TODO: Create safety screen
        console.log('Navigate to safety');
        break;
      default:
        console.log('Quick action:', actionId);
        // Show a toast or alert for unknown actions
        Alert.alert('Action', `Quick action: ${actionId}`);
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All', icon: 'grid' as const },
    { key: 'businesses', label: 'Businesses', icon: 'business' as const },
    { key: 'events', label: 'Events', icon: 'calendar' as const },
    { key: 'groups', label: 'Groups', icon: 'people' as const },
  ];

  const quickActions: QuickAction[] = [];

  const discoverFeatures: DiscoverFeature[] = [];

  const stats: any[] = [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <HeaderScreen title="Discover" subtitle="Explore your neighborhood" />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <EmptyState
          emoji="🔍"
          title="Nothing to discover yet"
          subtitle="Start exploring your neighborhood to see local businesses, events, and groups"
          cta={{
            text: "Explore Nearby",
            onPress: () => setHasData(true)
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <HeaderScreen 
        title="Discover" 
        subtitle="Explore your neighborhood"
        rightActions={
          <View style={styles.headerActions}>
            {/* Add any header actions here */}
          </View>
        }
      />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <SearchBar
          placeholder="Search businesses, groups, events..."
          value={searchQuery}
          onChangeText={handleSearch}
          withMic={true}
        />

        {/* Filter Chips */}
        <SegmentedChips
          items={filterOptions}
          value={activeFilter}
          onChange={handleFilterChange}
        />

        {/* Search Results */}
        {searchQuery.trim() && (
          <View style={styles.searchResultsSection}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
              </Text>
              {searchQuery.trim() && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {isSearching ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color={getColor('success')} />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <View style={styles.searchResultsList}>
                {searchResults.map((result) => (
                  <Card key={result.id} variant="default" style={styles.searchResultCard}>
                    <View style={styles.searchResultContent}>
                      {result.image && (
                        <Image 
                          source={{ uri: result.image }} 
                          style={styles.searchResultImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.searchResultInfo}>
                        <View style={styles.searchResultHeader}>
                          <Text style={styles.searchResultType}>{result.type}</Text>
                          <Text style={styles.searchResultTitle}>{result.title}</Text>
                        </View>
                        <Text style={styles.searchResultDescription} numberOfLines={2}>
                          {result.description}
                        </Text>
                        {result.metadata && (
                          <View style={styles.searchResultMetadata}>
                            {result.type === 'group' && result.metadata.memberCount && (
                              <Text style={styles.metadataText}>
                                {result.metadata.memberCount} members
                              </Text>
                            )}
                            {result.type === 'event' && result.metadata.startTime && (
                              <Text style={styles.metadataText}>
                                {new Date(result.metadata.startTime).toLocaleDateString()}
                              </Text>
                            )}
                            {result.type === 'post' && result.metadata.createdAt && (
                              <Text style={styles.metadataText}>
                                {new Date(result.metadata.createdAt).toLocaleDateString()}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : searchQuery.trim() && !isSearching ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
                <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Stats Row */}
        {stats.length > 0 && <StatPillsRow items={stats} />}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <Card variant="default">
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <View key={action.id} style={styles.quickActionItem}>
                  <View style={styles.quickActionIcon}>
                    <Text style={styles.quickActionEmoji}>{action.icon}</Text>
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Features Grid */}
        {discoverFeatures.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>What's Around You</Text>
            <View style={styles.featuresGrid}>
              {discoverFeatures.map((feature) => (
                <Card key={feature.id} variant="default" onPress={feature.onPress}>
                  <View style={styles.featureContent}>
                    <View style={styles.featureHeader}>
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                      {feature.badge && (
                        <View style={styles.featureBadge}>
                          <Text style={styles.featureBadgeText}>{feature.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card variant="default">
            <View style={styles.recentActivity}>
              <View style={styles.recentIcon}>
                <Text style={styles.recentEmoji}>📈</Text>
              </View>
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle}>No recent activity</Text>
                <Text style={styles.recentDescription}>
                  Activity will appear here as you explore your neighborhood
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <GradientFAB
        onPress={() => handleFeaturePress('create')}
        icon="add"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: getColor('bg'),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Account for tab bar
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: getSpacing('md'),
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - getSpacing('lg') * 2 - getSpacing('md') * 3) / 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: getColor('surface'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: getColor('textSecondary'),
    textAlign: 'center',
  },
  featuresSection: {
    marginTop: getSpacing('xl'),
    paddingHorizontal: getSpacing('lg'),
  },
  sectionTitle: {
    fontSize: theme.typography.title.size,
    fontWeight: theme.typography.title.weight as any,
    color: getColor('textPrimary'),
    marginBottom: getSpacing('lg'),
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: getSpacing('md'),
  },
  featureContent: {
    alignItems: 'center',
    padding: getSpacing('md'),
  },
  featureHeader: {
    position: 'relative',
    marginBottom: getSpacing('sm'),
  },
  featureIcon: {
    fontSize: 32,
  },
  featureBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: getColor('success'),
    paddingHorizontal: getSpacing('xs'),
    paddingVertical: 2,
    borderRadius: getRadius('pill'),
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: getColor('textPrimary'),
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: getColor('textPrimary'),
    textAlign: 'center',
    marginBottom: getSpacing('xs'),
  },
  featureDescription: {
    fontSize: 12,
    color: getColor('textSecondary'),
    textAlign: 'center',
    lineHeight: 16,
  },
  recentSection: {
    marginTop: getSpacing('xl'),
    paddingHorizontal: getSpacing('lg'),
    marginBottom: getSpacing('xl'),
  },
  recentActivity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: getColor('surface'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing('md'),
  },
  recentEmoji: {
    fontSize: 24,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('xs'),
  },
  recentDescription: {
    fontSize: 14,
    color: getColor('textSecondary'),
    lineHeight: 20,
  },
  // Search Results Styles
  searchResultsSection: {
    marginTop: getSpacing('lg'),
    paddingHorizontal: getSpacing('lg'),
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: getColor('textPrimary'),
  },
  clearSearchText: {
    fontSize: 14,
    color: getColor('success'),
    fontWeight: '500',
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: getSpacing('lg'),
  },
  searchLoadingText: {
    marginLeft: getSpacing('sm'),
    fontSize: 14,
    color: getColor('textSecondary'),
  },
  searchResultsList: {
    gap: getSpacing('md'),
  },
  searchResultCard: {
    marginBottom: getSpacing('sm'),
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  searchResultImage: {
    width: 60,
    height: 60,
    borderRadius: getRadius('md'),
    marginRight: getSpacing('md'),
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultHeader: {
    marginBottom: getSpacing('xs'),
  },
  searchResultType: {
    fontSize: 12,
    color: getColor('textTertiary'),
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: getSpacing('xs'),
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('xs'),
  },
  searchResultDescription: {
    fontSize: 14,
    color: getColor('textSecondary'),
    lineHeight: 18,
    marginBottom: getSpacing('sm'),
  },
  searchResultMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
  },
  metadataText: {
    fontSize: 12,
    color: getColor('textTertiary'),
    backgroundColor: getColor('surface'),
    paddingHorizontal: getSpacing('xs'),
    paddingVertical: 2,
    borderRadius: getRadius('sm'),
  },
  noResults: {
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: getColor('textSecondary'),
    marginBottom: getSpacing('xs'),
  },
  noResultsSubtext: {
    fontSize: 14,
    color: getColor('textTertiary'),
    textAlign: 'center',
  },
}); 