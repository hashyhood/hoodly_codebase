import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { logger } from '../../lib/logger';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getColor, getSpacing, getRadius } from '../../lib/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { HeaderScreen, SearchBar, SegmentedChips, StatPillsRow, Card, EmptyState, Spinner, SkeletonCard, GradientFAB } from '../../components/ui';

const { width } = Dimensions.get('window');

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'room' | 'location';
  title: string;
  subtitle?: string;
  description?: string;
  meta?: string;
  avatar?: string;
}

type SearchCategory = 'all' | 'users' | 'posts' | 'rooms' | 'locations';



function useSafeAuth() {
  try {
    return useAuth();
  } catch (error) {
    console.error('Error using useAuth hook:', error);
    return {
      user: null,
      session: null,
      loading: false,
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
      refreshSession: async () => {},
    };
  }
}

export default function SearchScreen() {
  const { user } = useSafeAuth();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadRecentSearches();
    loadSuggestions();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const performSearch = async (searchQuery: string, category: SearchCategory = activeCategory, addToRecent: boolean = true) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      let results: SearchResult[] = [];
      
      // Search based on category
      switch (category) {
        case 'users':
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, personalName, username, bio, avatar, location')
            .or(`personalName.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
            .limit(20);
          
          if (usersError) throw usersError;
          
          results = (users || []).map(user => ({
            id: user.id,
            type: 'user' as const,
            title: user.personalName || user.username || 'Unknown User',
            subtitle: user.username,
            description: user.bio || '',
            avatar: user.avatar || '',
            meta: user.location || ''
          }));
          break;
          
        case 'posts':
          const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select('id, content, image_url, created_at')
            .ilike('content', `%${searchQuery}%`)
            .limit(20);
          
          if (postsError) throw postsError;
          
          results = (posts || []).map(post => ({
            id: post.id,
            type: 'post' as const,
            title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
            description: post.content,
            meta: new Date(post.created_at).toLocaleDateString()
          }));
          break;
          
        case 'rooms':
          const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select('id, name, description, created_at')
            .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            .limit(20);
          
          if (roomsError) throw roomsError;
          
          results = (rooms || []).map(room => ({
            id: room.id,
            type: 'room' as const,
            title: room.name,
            description: room.description || '',
            meta: new Date(room.created_at).toLocaleDateString()
          }));
          break;
          
        case 'locations':
          const { data: locations, error: locationsError } = await supabase
            .from('locations')
            .select('id, name, description, address')
            .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
            .limit(20);
          
          if (locationsError) throw locationsError;
          
          results = (locations || []).map(location => ({
            id: location.id,
            type: 'location' as const,
            title: location.name,
            description: location.description || '',
            meta: location.address || ''
          }));
          break;
          
        default: // 'all'
          // Search across all tables
          const [usersResult, postsResult, roomsResult, locationsResult] = await Promise.all([
            supabase.from('profiles').select('id, personalName, username, bio, avatar, location').or(`personalName.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`).limit(5),
            supabase.from('posts').select('id, content, image_url, created_at').ilike('content', `%${searchQuery}%`).limit(5),
            supabase.from('rooms').select('id, name, description, created_at').or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(5),
            supabase.from('locations').select('id, name, description, address').or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`).limit(5)
          ]);
          
          if (usersResult.error) throw usersResult.error;
          if (postsResult.error) throw postsResult.error;
          if (roomsResult.error) throw roomsResult.error;
          if (locationsResult.error) throw locationsResult.error;
          
          // Combine results
          results = [
            ...(usersResult.data || []).map(user => ({
              id: user.id,
              type: 'user' as const,
              title: user.personalName || user.username || 'Unknown User',
              subtitle: user.username,
              description: user.bio || '',
              avatar: user.avatar || '',
              meta: user.location || ''
            })),
            ...(postsResult.data || []).map(post => ({
              id: post.id,
              type: 'post' as const,
              title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
              description: post.content,
              meta: new Date(post.created_at).toLocaleDateString()
            })),
            ...(roomsResult.data || []).map(room => ({
              id: room.id,
              type: 'room' as const,
              title: room.name,
              description: room.description || '',
              meta: new Date(room.created_at).toLocaleDateString()
            })),
            ...(locationsResult.data || []).map(location => ({
              id: location.id,
              type: 'location' as const,
              title: location.name,
              description: location.description || '',
              meta: location.address || ''
            }))
          ];
          break;
      }
      
      setSearchResults(results);
      
      if (addToRecent && searchQuery.trim()) {
        addToRecentSearches(searchQuery.trim());
      }
    } catch (error) {
      logger.error('Search error:', error);
      Alert.alert('Error', 'Failed to perform search');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      // Load popular search terms from recent searches and trending content
      const { data: recentPosts, error: postsError } = await supabase
        .from('posts')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { data: recentGroups, error: groupsError } = await supabase
        .from('groups')
        .select('name')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (postsError) throw postsError;
      if (groupsError) throw groupsError;
      
      // Extract keywords from recent content
      const suggestions: string[] = [];
      
      // Add trending terms from posts
      (recentPosts || []).forEach(post => {
        const words = post.content.split(' ').filter((word: string) => word.length > 3);
        suggestions.push(...words.slice(0, 3));
      });
      
      // Add group names
      (recentGroups || []).forEach(group => {
        suggestions.push(group.name);
      });
      
      // Add some default suggestions
      suggestions.push('events', 'neighborhood', 'local', 'community');
      
      // Remove duplicates and limit
      const uniqueSuggestions = [...new Set(suggestions)].slice(0, 15);
      setSuggestions(uniqueSuggestions);
    } catch (error) {
      logger.warn('Error loading suggestions:', error);
      // Fallback to default suggestions
      setSuggestions(['events', 'neighborhood', 'local', 'community', 'groups', 'posts']);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      performSearch(text, activeCategory, false);
    } else {
      setSearchResults([]);
    }
  };

  const handleCategoryChange = (category: SearchCategory) => {
    setActiveCategory(category);
    if (searchQuery.trim()) {
      performSearch(searchQuery, category, false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    // Navigate based on result type
    switch (result.type) {
      case 'user':
        router.push(`/profile/${String(result.id)}` as any);
        break;
      case 'post':
        // Navigate to post detail
        break;
      case 'room':
        router.push(`/chat/${String(result.id)}` as any);
        break;
      case 'location':
        // Navigate to location detail
        break;
    }
  };

  const handleRecentSearchPress = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    performSearch(searchTerm);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    // In a real app, you'd also clear from storage
  };

  const addToRecentSearches = (searchTerm: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(term => term !== searchTerm);
      return [searchTerm, ...filtered].slice(0, 10);
    });
  };

  const loadRecentSearches = () => {
    // In a real app, load from storage
    setRecentSearches(['trending', 'events', 'groups']);
  };

  const handleRefresh = async () => {
    await loadSuggestions();
    if (searchQuery.trim()) {
      await performSearch(searchQuery);
    }
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user':
        return 'person';
      case 'post':
        return 'document-text';
      case 'room':
        return 'chatbubbles';
      case 'location':
        return 'location';
      default:
        return 'search';
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.searchResultItem, { backgroundColor: getColor('surfaceStrong') }]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        <View style={[styles.resultIcon, { backgroundColor: getColor('success') }]}> 
          <Ionicons 
            name={getResultIcon(item.type) as any} 
            size={16} 
            color={getColor('textPrimary')} 
          />
        </View>
        <View style={styles.resultText}>
          <Text style={[styles.resultTitle, { color: getColor('textPrimary') }]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.resultSubtitle, { color: getColor('textSecondary') }]}>
              {item.subtitle}
            </Text>
          )}
          {item.description && (
            <Text 
              style={[styles.resultDescription, { color: getColor('textSecondary') }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
        </View>
        {item.meta && (
          <Text style={[styles.resultMeta, { color: getColor('textSecondary') }]}> 
            {item.meta}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSuggestionItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { backgroundColor: getColor('surfaceStrong') }]}
      onPress={() => handleRecentSearchPress(item)}
      activeOpacity={0.7}
    >
      <Ionicons name="time-outline" size={16} color={getColor('textSecondary')} />
      <Text style={[styles.suggestionText, { color: getColor('textPrimary') }]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryButton = (category: SearchCategory, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        activeCategory === category && { backgroundColor: getColor('success') }
      ]}
      onPress={() => handleCategoryChange(category)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={activeCategory === category ? getColor('textPrimary') : getColor('textSecondary')} 
      />
      <Text style={[
        styles.categoryText,
        { color: activeCategory === category ? getColor('textPrimary') : getColor('textSecondary') }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getColor('bg') }]}> 
      <StatusBar barStyle="light-content" />
      
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchContainer, { backgroundColor: getColor('surfaceStrong') }]}> 
          <Ionicons name="search" size={20} color={getColor('textSecondary')} /> 
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: getColor('textPrimary') }]} 
            placeholder="Search Hoodly..."
            placeholderTextColor={getColor('textSecondary')} 
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={getColor('textSecondary')} /> 
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderCategoryButton('all', 'All', 'grid')}
          {renderCategoryButton('users', 'People', 'people')}
          {renderCategoryButton('posts', 'Posts', 'document-text')}
          {renderCategoryButton('rooms', 'Rooms', 'chatbubbles')}
          {renderCategoryButton('locations', 'Places', 'location')}
        </ScrollView>
      </View>

      {/* Search Results or Recent Searches */}
      {searchQuery.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyContainer}>
                <Spinner size="large" color={getColor('success')} /> 
                <Text style={[styles.emptyText, { color: getColor('textSecondary') }]}> 
                  Searching...
                </Text>
              </View>
            ) : (
              <EmptyState
                icon="search"
                title="No results found"
                subtitle="Try adjusting your search terms or browse different categories"
              />
            )
          }
        />
      ) : (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: getColor('textPrimary') }]}>
              Recent Searches
            </Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={[styles.clearButton, { color: getColor('success') }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={recentSearches}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color={getColor('textSecondary')} /> 
                <Text style={[styles.emptyText, { color: getColor('textSecondary') }]}>
                  No recent searches
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  categoryText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
  },
  searchResultItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  resultDescription: {
    fontSize: 12,
  },
  resultMeta: {
    fontSize: 12,
    marginLeft: 8,
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
}); 