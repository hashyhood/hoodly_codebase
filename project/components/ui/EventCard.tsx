import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Users, Clock } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { theme } = useTheme();

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
        backgroundColor: theme.colors.glass.primary,
        borderColor: theme.colors.glass.border,
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
              backgroundColor: theme.colors.glass.overlay,
              color: theme.colors.text.primary 
            }]}>
              {getCategoryEmoji(event.category)} {event.category}
            </Text>
          </View>
        </View>
      )}

      {/* Event Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {event.title}
          </Text>
          {event.isCreator && (
            <View style={[styles.creatorBadge, { backgroundColor: theme.colors.neural.primary }]}>
              <Text style={[styles.creatorText, { color: theme.colors.text.inverse }]}>Creator</Text>
            </View>
          )}
        </View>

        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {event.description}
        </Text>

        {/* Event Details */}
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Calendar size={16} color={theme.colors.text.tertiary} />
            <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
              {formatDate(event.date)} • {event.time}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={16} color={theme.colors.text.tertiary} />
            <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
              {event.location}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Users size={16} color={theme.colors.text.tertiary} />
            <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
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
                backgroundColor: theme.colors.glass.secondary 
              }]}>
                <Text style={[styles.tagText, { color: theme.colors.text.secondary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {event.tags.length > 3 && (
              <Text style={[styles.moreTags, { color: theme.colors.text.tertiary }]}>
                +{event.tags.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>

      {/* RSVP Actions */}
      <View style={[styles.actions, { borderTopColor: theme.colors.glass.border }]}>
        <View style={styles.rsvpButtons}>
          <TouchableOpacity 
            style={[styles.rsvpButton, styles.goingButton, {
              backgroundColor: getRSVPStatus() === 'going' 
                ? theme.colors.status.success 
                : theme.colors.glass.secondary
            }]}
            onPress={() => onRSVP?.(event.id, 'going')}
          >
            <Text style={[styles.rsvpButtonText, { 
              color: getRSVPStatus() === 'going' 
                ? theme.colors.text.inverse 
                : theme.colors.text.primary 
            }]}>
              Going
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.rsvpButton, styles.maybeButton, {
              backgroundColor: getRSVPStatus() === 'maybe' 
                ? theme.colors.status.warning 
                : theme.colors.glass.secondary
            }]}
            onPress={() => onRSVP?.(event.id, 'maybe')}
          >
            <Text style={[styles.rsvpButtonText, { 
              color: getRSVPStatus() === 'maybe' 
                ? theme.colors.text.inverse 
                : theme.colors.text.primary 
            }]}>
              Maybe
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.rsvpButton, styles.notGoingButton, {
              backgroundColor: getRSVPStatus() === 'not_going' 
                ? theme.colors.status.error 
                : theme.colors.glass.secondary
            }]}
            onPress={() => onRSVP?.(event.id, 'not_going')}
          >
            <Text style={[styles.rsvpButtonText, { 
              color: getRSVPStatus() === 'not_going' 
                ? theme.colors.text.inverse 
                : theme.colors.text.primary 
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
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
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
    top: 12,
    left: 12,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creatorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
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