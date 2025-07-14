import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Lock, MessageCircle, Calendar } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Group {
  id: string;
  userId: string; // creator
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  proximity: 'neighborhood' | 'city' | 'state';
  tags: string[];
  rules: string[];
  coverImage?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  isMember?: boolean;
  isCreator?: boolean;
}

interface GroupCardProps {
  group: Group;
  onPress?: (groupId: string) => void;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onUserPress?: (userId: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onPress,
  onJoin,
  onLeave,
  onUserPress,
}) => {
  const { theme } = useTheme();

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

  const formatMemberCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const groupTime = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - groupTime.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Created today';
    if (diffInDays === 1) return 'Created yesterday';
    if (diffInDays < 7) return `Created ${diffInDays} days ago`;
    if (diffInDays < 30) return `Created ${Math.floor(diffInDays / 7)} weeks ago`;
    return `Created ${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { 
        backgroundColor: theme.colors.glass.primary,
        borderColor: theme.colors.glass.border,
      }]}
      onPress={() => onPress?.(group.id)}
    >
      {/* Group Cover Image */}
      <View style={styles.imageContainer}>
        {group.coverImage ? (
          <Image source={{ uri: group.coverImage }} style={styles.groupImage} />
        ) : (
          <LinearGradient
            colors={theme.colors.gradients.neural as [string, string]}
            style={styles.placeholderImage}
          >
            <Text style={styles.placeholderEmoji}>{getCategoryEmoji(group.category)}</Text>
          </LinearGradient>
        )}
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.imageOverlay}
        />
        
        {/* Privacy Badge */}
        <View style={[styles.privacyBadge, { 
          backgroundColor: group.isPrivate 
            ? theme.colors.status.warning 
            : theme.colors.status.success 
        }]}>
          {group.isPrivate ? (
            <Lock size={12} color={theme.colors.text.inverse} />
          ) : (
            <Users size={12} color={theme.colors.text.inverse} />
          )}
          <Text style={[styles.privacyText, { color: theme.colors.text.inverse }]}>
            {group.isPrivate ? 'Private' : 'Public'}
          </Text>
        </View>
        
        {/* Creator Badge */}
        {group.isCreator && (
          <View style={[styles.creatorBadge, { 
            backgroundColor: theme.colors.neural.primary 
          }]}>
            <Text style={[styles.creatorText, { color: theme.colors.text.inverse }]}>
              Creator
            </Text>
          </View>
        )}
        
        {/* Member Count */}
        <View style={[styles.memberCount, { 
          backgroundColor: theme.colors.glass.overlay 
        }]}>
          <Users size={14} color={theme.colors.text.primary} />
          <Text style={[styles.memberCountText, { color: theme.colors.text.primary }]}>
            {formatMemberCount(group.memberCount)}
          </Text>
        </View>
      </View>

      {/* Group Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.colors.text.primary }]}>
            {group.name}
          </Text>
          <View style={[styles.categoryBadge, { 
            backgroundColor: theme.colors.glass.secondary 
          }]}>
            <Text style={[styles.categoryText, { color: theme.colors.text.secondary }]}>
              {getCategoryEmoji(group.category)} {group.category}
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {group.description}
        </Text>

        {/* Tags */}
        {group.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {group.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { 
                backgroundColor: theme.colors.glass.secondary 
              }]}>
                <Text style={[styles.tagText, { color: theme.colors.text.secondary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {group.tags.length > 3 && (
              <Text style={[styles.moreTags, { color: theme.colors.text.tertiary }]}>
                +{group.tags.length - 3} more
              </Text>
            )}
          </View>
        )}

        {/* Rules Preview */}
        {group.rules.length > 0 && (
          <View style={styles.rulesPreview}>
            <Text style={[styles.rulesTitle, { color: theme.colors.text.tertiary }]}>
              Rules: {group.rules.length}
            </Text>
            <Text style={[styles.rulesText, { color: theme.colors.text.tertiary }]}>
              {group.rules[0]}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.actions, { borderTopColor: theme.colors.glass.border }]}>
        <View style={styles.actionInfo}>
          <Text style={[styles.createdTime, { color: theme.colors.text.tertiary }]}>
            {formatTime(group.createdAt)}
          </Text>
          <Text style={[styles.proximityBadge, { 
            backgroundColor: theme.colors.glass.secondary,
            color: theme.colors.text.secondary 
          }]}>
            {group.proximity}
          </Text>
        </View>
        
        {!group.isCreator && (
          <TouchableOpacity 
            style={[styles.joinButton, { 
              backgroundColor: group.isMember 
                ? theme.colors.status.error 
                : theme.colors.neural.primary 
            }]}
            onPress={() => group.isMember 
              ? onLeave?.(group.id) 
              : onJoin?.(group.id)
            }
          >
            <Text style={[styles.joinButtonText, { color: theme.colors.text.inverse }]}>
              {group.isMember ? 'Leave' : 'Join'}
            </Text>
          </TouchableOpacity>
        )}
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
    height: 140,
    position: 'relative',
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  privacyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  privacyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  creatorBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creatorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  memberCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
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
  name: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
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
  rulesPreview: {
    marginBottom: 8,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  rulesText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    borderTopWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionInfo: {
    flex: 1,
  },
  createdTime: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  proximityBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    textTransform: 'capitalize',
  },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 