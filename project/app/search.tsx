import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getColor, getSpacing, getRadius } from '../lib/theme';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
}

export default function SearchScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'people' | 'groups' | 'posts'>('people');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    try {
      if (searchCategory === 'people') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .neq('id', user?.id) // Exclude current user
          .limit(20);

        if (error) throw error;
        setSearchResults(data || []);
      } else if (searchCategory === 'groups') {
        const { data, error } = await supabase
          .from('groups')
          .select('id, name, description, member_count')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;
        // Convert groups to User format for consistency
        setSearchResults((data || []).map(group => ({
          id: group.id,
          username: group.name,
          full_name: group.description || '',
          bio: `${group.member_count || 0} members`,
        })));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPress = (selectedUser: User) => {
    if (searchCategory === 'people') {
      // Start private chat
      router.push(`/private-chat/${selectedUser.id}`);
    } else if (searchCategory === 'groups') {
      // Navigate to group - use a valid route
      router.push(`/(tabs)/groups`);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userAvatar}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={24} color={getColor('textSecondary')} />
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        {item.full_name && (
          <Text style={styles.fullName}>{item.full_name}</Text>
        )}
        {item.bio && (
          <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
        )}
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={getColor('textSecondary')} 
      />
    </TouchableOpacity>
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(handleSearch, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchCategory]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={getColor('textPrimary')} />
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={getColor('textSecondary')} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people, groups, or posts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={getColor('textSecondary')} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        {['people', 'groups', 'posts'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              searchCategory === category && styles.categoryTabActive
            ]}
            onPress={() => setSearchCategory(category as any)}
          >
            <Text style={[
              styles.categoryText,
              searchCategory === category && styles.categoryTextActive
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={getColor('success')} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        ) : searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={getColor('textSecondary')} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search terms
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={getColor('textSecondary')} />
            <Text style={styles.emptyTitle}>Start searching</Text>
            <Text style={styles.emptySubtitle}>
              Find people, groups, or posts in your neighborhood
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: getColor('bg'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing('lg'),
    paddingVertical: getSpacing('md'),
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: getColor('surface'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: getColor('textPrimary'),
  },
  placeholder: {
    width: 44,
  },
  searchContainer: {
    paddingHorizontal: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getColor('surface'),
    borderRadius: getRadius('lg'),
    paddingHorizontal: getSpacing('md'),
    borderWidth: 1,
    borderColor: getColor('divider'),
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: getColor('textPrimary'),
    marginLeft: getSpacing('sm'),
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
  },
  categoryTab: {
    flex: 1,
    paddingVertical: getSpacing('sm'),
    marginHorizontal: getSpacing('xs'),
    borderRadius: getRadius('md'),
    backgroundColor: getColor('surface'),
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: getColor('success'),
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: getColor('textSecondary'),
  },
  categoryTextActive: {
    color: 'white',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: getSpacing('md'),
    fontSize: 16,
    color: getColor('textSecondary'),
  },
  resultsList: {
    paddingHorizontal: getSpacing('lg'),
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getSpacing('md'),
    paddingHorizontal: getSpacing('md'),
    backgroundColor: getColor('surface'),
    borderRadius: getRadius('md'),
    marginBottom: getSpacing('sm'),
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: getColor('divider'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing('md'),
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('textPrimary'),
    marginBottom: getSpacing('xs'),
  },
  fullName: {
    fontSize: 14,
    color: getColor('textSecondary'),
    marginBottom: getSpacing('xs'),
  },
  bio: {
    fontSize: 12,
    color: getColor('textSecondary'),
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getSpacing('xl'),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: getColor('textPrimary'),
    marginTop: getSpacing('lg'),
    marginBottom: getSpacing('sm'),
  },
  emptySubtitle: {
    fontSize: 16,
    color: getColor('textSecondary'),
    textAlign: 'center',
    lineHeight: 22,
  },
});
