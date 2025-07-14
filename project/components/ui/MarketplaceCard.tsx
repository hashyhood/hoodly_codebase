import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MapPin, Star, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface MarketplaceListing {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  images: string[];
  tags: string[];
  proximity: 'neighborhood' | 'city' | 'state';
  location: string;
  contactInfo: {
    phone?: string;
    email?: string;
    preferredContact: 'phone' | 'email' | 'in_app';
  };
  status: 'active' | 'sold' | 'pending';
  views: number;
  saves: number;
  createdAt: string;
  isSaved?: boolean;
}

interface MarketplaceCardProps {
  listing: MarketplaceListing;
  onPress?: (listingId: string) => void;
  onSave?: (listingId: string) => void;
  onContact?: (listingId: string) => void;
  onUserPress?: (userId: string) => void;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  listing,
  onPress,
  onSave,
  onContact,
  onUserPress,
}) => {
  const { theme } = useTheme();

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      electronics: '📱',
      furniture: '🪑',
      clothing: '👕',
      books: '📚',
      sports: '⚽',
      vehicles: '🚗',
      services: '🔧',
      food: '🍕',
      other: '📦'
    };
    return emojiMap[category] || '📦';
  };

  const getConditionColor = (condition: string) => {
    const colorMap: Record<string, string> = {
      new: theme.colors.status.success,
      like_new: theme.colors.status.info,
      good: theme.colors.status.warning,
      fair: theme.colors.status.error,
      poor: theme.colors.text.tertiary
    };
    return colorMap[condition] || theme.colors.text.tertiary;
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const listingTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - listingTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { 
        backgroundColor: theme.colors.glass.primary,
        borderColor: theme.colors.glass.border,
      }]}
      onPress={() => onPress?.(listing.id)}
    >
      {/* Listing Image */}
      <View style={styles.imageContainer}>
        {listing.images.length > 0 ? (
          <Image source={{ uri: listing.images[0] }} style={styles.listingImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: theme.colors.glass.secondary }]}>
            <Text style={[styles.placeholderText, { color: theme.colors.text.tertiary }]}>
              {getCategoryEmoji(listing.category)}
            </Text>
          </View>
        )}
        
        {/* Status Badge */}
        {listing.status !== 'active' && (
          <View style={[styles.statusBadge, { 
            backgroundColor: listing.status === 'sold' 
              ? theme.colors.status.error 
              : theme.colors.status.warning 
          }]}>
            <Text style={[styles.statusText, { color: theme.colors.text.inverse }]}>
              {listing.status.toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { 
            backgroundColor: theme.colors.glass.overlay 
          }]}
          onPress={() => onSave?.(listing.id)}
        >
          <Heart 
            size={20} 
            color={listing.isSaved ? theme.colors.status.error : theme.colors.text.primary}
            fill={listing.isSaved ? theme.colors.status.error : 'none'}
          />
        </TouchableOpacity>
        
        {/* Multiple Images Indicator */}
        {listing.images.length > 1 && (
          <View style={[styles.imageCount, { 
            backgroundColor: theme.colors.glass.overlay 
          }]}>
            <Text style={[styles.imageCountText, { color: theme.colors.text.primary }]}>
              +{listing.images.length - 1}
            </Text>
          </View>
        )}
      </View>

      {/* Listing Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: theme.colors.neural.primary }]}>
              {formatPrice(listing.price)}
            </Text>
            <View style={[styles.conditionBadge, { 
              backgroundColor: getConditionColor(listing.condition) + '20',
              borderColor: getConditionColor(listing.condition)
            }]}>
              <Text style={[styles.conditionText, { color: getConditionColor(listing.condition) }]}>
                {listing.condition.replace('_', ' ')}
              </Text>
            </View>
          </View>
          
          <View style={[styles.categoryBadge, { 
            backgroundColor: theme.colors.glass.secondary 
          }]}>
            <Text style={[styles.categoryText, { color: theme.colors.text.secondary }]}>
              {getCategoryEmoji(listing.category)} {listing.category}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {listing.title}
        </Text>

        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {listing.description}
        </Text>

        {/* Location and Stats */}
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <MapPin size={14} color={theme.colors.text.tertiary} />
            <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
              {listing.location}
            </Text>
          </View>
          
          <View style={styles.stats}>
            <Text style={[styles.statText, { color: theme.colors.text.tertiary }]}>
              {listing.views} views
            </Text>
            <Text style={[styles.statText, { color: theme.colors.text.tertiary }]}>
              {listing.saves} saves
            </Text>
          </View>
        </View>

        {/* Tags */}
        {listing.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {listing.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { 
                backgroundColor: theme.colors.glass.secondary 
              }]}>
                <Text style={[styles.tagText, { color: theme.colors.text.secondary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {listing.tags.length > 3 && (
              <Text style={[styles.moreTags, { color: theme.colors.text.tertiary }]}>
                +{listing.tags.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.actions, { borderTopColor: theme.colors.glass.border }]}>
        <TouchableOpacity 
          style={[styles.contactButton, { 
            backgroundColor: theme.colors.neural.primary 
          }]}
          onPress={() => onContact?.(listing.id)}
        >
          <MessageCircle size={16} color={theme.colors.text.inverse} />
          <Text style={[styles.contactButtonText, { color: theme.colors.text.inverse }]}>
            Contact
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.timestamp, { color: theme.colors.text.tertiary }]}>
          {formatTime(listing.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  conditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreTags: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    borderTopWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 