import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getColor, getSpacing, getRadius, theme } from '../../lib/theme';
import { SearchBar } from './SearchBar';

const { width } = Dimensions.get('window');

interface HoodlyLayoutProps {
  children: React.ReactNode;
  neighborhoodName?: string;
  activeNeighbors?: number;
  communityHealth?: number;
  socialScore?: number;
  eventsToday?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onNotificationPress?: () => void;
  onAIPress?: () => void;
}

interface FilterState {
  category: string;
  proximity: string;
  date: string;
  search: string;
}

interface ContentItem {
  id: string;
  category?: string;
  proximity?: string;
  created_at?: string;
  title?: string;
  description?: string;
}

export const HoodlyLayout: React.FC<HoodlyLayoutProps> = ({
  children,
  neighborhoodName = 'Hoodly',
  activeNeighbors = 0,
  communityHealth = 0,
  socialScore = 0,
  eventsToday = 0,
  showSearch = false,
  searchPlaceholder = 'Search...',
  onSearch,
  onNotificationPress,
  onAIPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    proximity: '',
    date: '',
    search: ''
  });
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Implement filter functionality
  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    // Apply filters to content
    applyFilters(filterType, value);
  };
  
  const applyFilters = (filterType: string, value: any) => {
    // Apply filters based on type
    switch (filterType) {
      case 'category':
        setFilteredContent(content.filter(item => 
          !value || item.category === value
        ));
        break;
      case 'proximity':
        setFilteredContent(content.filter(item => 
          !value || item.proximity === value
        ));
        break;
      case 'date':
        if (value) {
          const filterDate = new Date(value);
          setFilteredContent(content.filter(item => 
            !item.created_at || new Date(item.created_at) >= filterDate
          ));
        } else {
          setFilteredContent(content);
        }
        break;
      case 'search':
        setFilteredContent(content.filter(item => 
          !value || 
          item.title?.toLowerCase().includes(value.toLowerCase()) ||
          item.description?.toLowerCase().includes(value.toLowerCase())
        ));
        break;
      default:
        setFilteredContent(content);
    }
  };
  
  const clearFilters = () => {
    setFilters({
      category: '',
      proximity: '',
      date: '',
      search: ''
    });
    setFilteredContent(content);
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor('bg') }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        style={styles.backgroundGradient}
        colors={theme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={30} style={[styles.header, { backgroundColor: getColor('surface') }]}>
          <View style={styles.headerContent}>
            {/* Location and Stats */}
            <View style={styles.locationSection}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={getColor('textPrimary')} />
                <Text style={[styles.neighborhoodName, { color: getColor('textPrimary') }]}>
                  {neighborhoodName}
                </Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={12} color={getColor('textTertiary')} />
                  <Text style={[styles.statText, { color: getColor('textTertiary') }]}> 
                    {activeNeighbors} active
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="people" size={12} color={getColor('textTertiary')} />
                  <Text style={[styles.statText, { color: getColor('textTertiary') }]}> 
                    {communityHealth}% health
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="notifications" size={12} color={getColor('textTertiary')} />
                  <Text style={[styles.statText, { color: getColor('textTertiary') }]}> 
                    {socialScore} score
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {onAIPress && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: getColor('surface') }]}
                  onPress={onAIPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.aiIcon}>🤖</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getColor('surface') }]}
                onPress={onNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications" size={20} color={getColor('textPrimary')} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Search Bar */}
          {showSearch && (
            <View style={styles.searchContainer}>
              <SearchBar
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChangeText={handleSearch}
                onSubmit={() => onSearch?.(searchQuery)}
                withMic={true}
              />
            </View>
          )}
        </BlurView>
        
        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  locationSection: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  neighborhoodName: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  aiIcon: {
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
  },
}); 