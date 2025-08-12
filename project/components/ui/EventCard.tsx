import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getColor, getSpacing, getRadius, theme } from '../../lib/theme';

interface Event {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxAttendees?: number;
  category: string;
  proximity: 'neighborhood' | 'city' | 'state';
  tags: string[];
  coverImage?: string;
  rsvpCount: number;
  attendees: string[];
  isMember?: boolean;
  isCreator?: boolean;
}

interface EventCardProps {
  event: Event;
  onPress?: (eventId: string) => void;
  onRSVP?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
  onUserPress?: (userId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onRSVP,
  onUserPress,
}) => {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `${diffInDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      general: '🏠',
      events: '🎉',
      business: '💼',
      social: '🤝',
      support: '🤗',
      hobbies: '🎨',
      fitness: '💪',
      food: '🍕',
      pets: '🐕',
      parenting: '👶'
    };
    return emojiMap[category] || '📅';
  };

  const getRSVPStatus = () => {
    // This would be determined by the current user's RSVP status
    return null; // 'going', 'maybe', 'not_going', or null
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { 
        backgroundColor: getColor('surface'),
        borderColor: getColor('divider'),
      }]}
      onPress={() => onPress?.(event.id)}
    >
      {/* Event Image */}
      {event.coverImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: event.coverImage }} style={styles.eventImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.imageContent}>
            <Text style={[styles.categoryBadge, { 
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: getColor('textPrimary') 
            }]}>
              {getCategoryEmoji(event.category)} {event.category}
            </Text>
          </View>
        </View>
      )}

      {/* Event Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: getColor('textPrimary') }]}>
            {event.title}
          </Text>
                      {event.isCreator && (
              <View style={[styles.creatorBadge, { backgroundColor: getColor('success') }]}>
                <Text style={[styles.creatorText, { color: getColor('textPrimary') }]}>Creator</Text>
              </View>
            )}
        </View>

        <Text style={[styles.description, { color: getColor('textSecondary') }]}>
          {event.description}
        </Text>

        {/* Event Details */}
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={getColor('textTertiary')} />
            <Text style={[styles.detailText, { color: getColor('textSecondary') }]}>
              {formatDate(event.date)} • {event.time}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="pin-outline" size={16} color={getColor('textTertiary')} />
            <Text style={[styles.detailText, { color: getColor('textSecondary') }]}>
              {event.location}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color={getColor('textTertiary')} />
            <Text style={[styles.detailText, { color: getColor('textSecondary') }]}>
              {event.rsvpCount} attending
              {event.maxAttendees && ` • ${event.maxAttendees} max`}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {event.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {event.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { 
                backgroundColor: getColor('surface') 
              }]}>
                <Text style={[styles.tagText, { color: getColor('textSecondary') }]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {event.tags.length > 3 && (
              <Text style={[styles.moreTags, { color: getColor('textTertiary') }]}>
                +{event.tags.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>

      {/* RSVP Actions */}
      <View style={[styles.actions, { borderTopColor: getColor('divider') }]}>
        <View style={styles.rsvpButtons}>
          <TouchableOpacity 
            style={[styles.rsvpButton, styles.goingButton, {
              backgroundColor: getRSVPStatus() === 'going' 
                ? getColor('success') 
                : getColor('surface')
            }]}
            onPress={() => onRSVP?.(event.id, 'going')}
          >
            <Text style={[styles.rsvpButtonText, { 
              color: getRSVPStatus() === 'going' 
                ? getColor('textPrimary') 
                : getColor('textPrimary') 
            }]}>
              Going
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.rsvpButton, styles.maybeButton, {
              backgroundColor: getRSVPStatus() === 'maybe' 
                ? getColor('warning') 
                : getColor('surface')
            }]}
            onPress={() => onRSVP?.(event.id, 'maybe')}
          >
            <Text style={[styles.rsvpButtonText, { 
              color: getRSVPStatus() === 'maybe' 
                ? getColor('textPrimary') 
                : getColor('textPrimary') 
            }]}>
              Maybe
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.rsvpButton, styles.notGoingButton, {
              backgroundColor: getRSVPStatus() === 'not_going' 
                ? getColor('error') 
                : getColor('surface')
            }]}
            onPress={() => onRSVP?.(event.id, 'not_going')}
          >
            <Text style={[styles.rsvpButtonText, { 
              color: getRSVPStatus() === 'not_going' 
                ? getColor('textPrimary') 
                : getColor('textPrimary') 
            }]}>
              Not Going
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: getSpacing('xs'),
    marginVertical: getSpacing('xs'),
    borderRadius: getRadius('xs'),
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageContent: {
    position: 'absolute',
    top: getSpacing('xs'),
    left: getSpacing('xs'),
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: getSpacing('xs'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getRadius('xs'),
    textTransform: 'capitalize',
  },
  content: {
    padding: getSpacing('xs'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('xs'),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: getSpacing('xs'),
  },
  creatorBadge: {
    paddingHorizontal: getSpacing('xs'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getRadius('xs'),
  },
  creatorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: getSpacing('xs'),
  },
  details: {
    gap: getSpacing('xs'),
    marginBottom: getSpacing('xs'),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('xs'),
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('xs'),
  },
  tag: {
    paddingHorizontal: getSpacing('xs'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getRadius('xs'),
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
    padding: getSpacing('xs'),
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: getSpacing('xs'),
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: getSpacing('sm'),
    borderRadius: getRadius('xs'),
    alignItems: 'center',
  },
  goingButton: {},
  maybeButton: {},
  notGoingButton: {},
  rsvpButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
}); 