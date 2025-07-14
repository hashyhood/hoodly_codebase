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
import { 
  Bell, 
  MapPin, 
  Users, 
  TrendingUp, 
  Zap,
  Search,
  Filter
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilter = () => {
    // TODO: Implement filter functionality
    console.log('Filter pressed');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neural.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        style={styles.backgroundGradient}
        colors={theme.colors.gradients.neural as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={30} style={[styles.header, { backgroundColor: theme.colors.glass.overlay }]}>
          <View style={styles.headerContent}>
            {/* Location and Stats */}
            <View style={styles.locationSection}>
              <View style={styles.locationRow}>
                <MapPin size={16} color={theme.colors.text.primary} />
                <Text style={[styles.neighborhoodName, { color: theme.colors.text.primary }]}>
                  {neighborhoodName}
                </Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Users size={12} color={theme.colors.text.tertiary} />
                  <Text style={[styles.statText, { color: theme.colors.text.tertiary }]}>
                    {activeNeighbors} active
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <TrendingUp size={12} color={theme.colors.text.tertiary} />
                  <Text style={[styles.statText, { color: theme.colors.text.tertiary }]}>
                    {communityHealth}% health
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Zap size={12} color={theme.colors.text.tertiary} />
                  <Text style={[styles.statText, { color: theme.colors.text.tertiary }]}>
                    {socialScore} score
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {onAIPress && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.glass.primary }]}
                  onPress={onAIPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.aiIcon}>🤖</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.glass.primary }]}
                onPress={onNotificationPress}
                activeOpacity={0.7}
              >
                <Bell size={20} color={theme.colors.text.primary} />
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
                onSearch={() => onSearch?.(searchQuery)}
                onFilter={handleFilter}
                showFilter={true}
                showVoice={true}
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