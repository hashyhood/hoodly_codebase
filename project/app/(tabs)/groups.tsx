import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { logger } from '../../lib/logger';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  HeaderScreen,
  Card,
  EmptyState,
  Spinner,
  GradientFAB
} from '../../components/ui';
import { theme, getSpacing, getColor, getRadius } from '../../lib/theme';

interface Group {
  id: string;
  name: string;
  description: string;
  category: 'community' | 'safety' | 'hobby' | 'business' | 'social' | 'sports';
  memberCount: number;
  isPrivate: boolean;
  isJoined: boolean;
  isAdmin?: boolean;
  lastActivity: string;
  image?: string;
  tags: string[];
  activityLevel: 'high' | 'medium' | 'low';
}

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

export default function GroupsScreen() {
  const { user } = useSafeAuth();
  const router = useRouter();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadGroups();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const loadGroups = async () => {
    setIsLoading(true);
    
    try {
      if (!user) {
        setGroups([]);
        return;
      }

      // Fetch groups from Supabase
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(
            user_id,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (groupsError) {
        throw groupsError;
      }

      // Fetch user's group memberships to determine join status
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id);

      if (membershipsError) {
        throw membershipsError;
      }

      // Transform the data to match the Group interface
      const transformedGroups: Group[] = (groupsData || []).map(group => {
        const membership = memberships?.find(m => m.group_id === group.id);
        const isJoined = !!membership;
        const isAdmin = membership?.role === 'admin';
        
        // Map database fields to component interface
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          category: 'community' as const, // Default category since it's not in DB
          memberCount: group.member_count,
          isPrivate: group.is_private,
          isJoined,
          isAdmin,
          lastActivity: group.created_at, // Using created_at as fallback
          image: group.image_url,
          tags: [], // Tags not in DB schema
          activityLevel: 'medium' as const, // Default activity level
        };
      });

      setGroups(transformedGroups);
    } catch (error) {
      logger.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups. Please try again.');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const joinGroup = async (groupId: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join groups');
      return;
    }

    try {
      // Add user to group_members table
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) {
        throw joinError;
      }

      // Get current member count and update it
      const { data: currentGroup, error: fetchError } = await supabase
        .from('groups')
        .select('member_count')
        .eq('id', groupId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newMemberCount = (currentGroup?.member_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('groups')
        .update({ member_count: newMemberCount })
        .eq('id', groupId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, isJoined: true, memberCount: newMemberCount }
          : group
      ));
      
      Alert.alert('Success', 'You have joined the group!');
    } catch (error) {
      logger.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to leave groups');
      return;
    }

    try {
      // Remove user from group_members table
      const { error: leaveError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (leaveError) {
        throw leaveError;
      }

      // Get current member count and update it
      const { data: currentGroup, error: fetchError } = await supabase
        .from('groups')
        .select('member_count')
        .eq('id', groupId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newMemberCount = Math.max(0, (currentGroup?.member_count || 0) - 1);

      const { error: updateError } = await supabase
        .from('groups')
        .update({ member_count: newMemberCount })
        .eq('id', groupId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, isJoined: false, memberCount: newMemberCount }
          : group
      ));
      
      Alert.alert('Success', 'You have left the group');
    } catch (error) {
      logger.error('Error leaving group:', error);
      Alert.alert('Error', 'Failed to leave group. Please try again.');
    }
  };

  const handleGroupPress = (group: Group) => {
    if (group.isJoined) {
      router.push(`/chat/${group.id}`);
    } else {
      Alert.alert(
        'Join Group',
        `Would you like to join "${group.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join', onPress: () => joinGroup(group.id) }
        ]
      );
    }
  };

  const createGroup = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create groups');
      return;
    }

    // For now, show a simple alert with form fields
    // In a full implementation, this would open a modal with form inputs
    Alert.prompt(
      'Create Group',
      'Enter group name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (groupName) => {
            if (!groupName || groupName.trim().length === 0) {
              Alert.alert('Error', 'Group name cannot be empty');
              return;
            }

            try {
              // Create the group
              const { data: newGroup, error: groupError } = await supabase
                .from('groups')
                .insert({
                  name: groupName.trim(),
                  description: 'A new community group',
                  creator_id: user.id,
                  is_private: false,
                  member_count: 1
                })
                .select()
                .single();

              if (groupError) {
                throw groupError;
              }

              // Add creator as admin member
              const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                  group_id: newGroup.id,
                  user_id: user.id,
                  role: 'admin'
                });

              if (memberError) {
                throw memberError;
              }

              // Refresh groups list
              await loadGroups();

              Alert.alert('Success', `Group "${groupName}" created successfully!`);
            } catch (error) {
              logger.error('Error creating group:', error);
              Alert.alert('Error', 'Failed to create group. Please try again.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'community':
        return 'people';
      case 'safety':
        return 'shield-checkmark';
      case 'hobby':
        return 'heart';
      case 'business':
        return 'briefcase';
      case 'social':
        return 'chatbubbles';
      case 'sports':
        return 'football';
      default:
        return 'people';
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#22c55e';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getActivityLabel = (level: string) => {
    switch (level) {
      case 'high':
        return 'Very Active';
      case 'medium':
        return 'Active';
      case 'low':
        return 'Quiet';
      default:
        return 'Unknown';
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: getColor('surface') }]}
      onPress={() => handleGroupPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <View style={[styles.groupIcon, { backgroundColor: getColor('success') }]}> 
            <Ionicons 
              name={getCategoryIcon(item.category) as any} 
              size={20} 
              color={getColor('textPrimary')} 
            />
          </View>
          <View style={styles.groupDetails}>
            <Text style={[styles.groupName, { color: getColor('textPrimary') }]}>
              {item.name}
            </Text>
            <Text style={[styles.groupDescription, { color: getColor('textSecondary') }]}>
              {item.description}
            </Text>
          </View>
        </View>
        <View style={styles.groupMeta}>
          {item.isPrivate && (
            <Ionicons name="lock-closed" size={16} color={getColor('textSecondary')} />
          )}
          <Text style={[styles.memberCount, { color: getColor('textSecondary') }]}>
            {formatNumber(item.memberCount)} members
          </Text>
        </View>
      </View>
      
      <View style={styles.groupFooter}>
        <View style={styles.groupTags}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: getColor('success') + '20' }]}>
              <Text style={[styles.tagText, { color: getColor('success') }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={styles.groupActions}>
          <View style={[styles.activityIndicator, { backgroundColor: getActivityColor(item.activityLevel) }]} />
          <Text style={[styles.activityText, { color: getActivityColor(item.activityLevel) }]}>
            {getActivityLabel(item.activityLevel)}
          </Text>
          
          {item.isJoined ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: getColor('error') }]}
              onPress={() => leaveGroup(item.id)}
            >
              <Text style={[styles.actionButtonText, { color: getColor('textPrimary') }]}>
                Leave
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: getColor('success') }]}
              onPress={() => joinGroup(item.id)}
            >
              <Text style={[styles.actionButtonText, { color: getColor('textPrimary') }]}>
                Join
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getColor('bg') }]}> 
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <HeaderScreen
        title="Groups"
        subtitle="Connect with your community"
        rightActions={[
          <TouchableOpacity
            key="create"
            style={[styles.createButton, { backgroundColor: getColor('success') }]}
            onPress={createGroup}
          >
            <Ionicons name="add" size={20} color={getColor('textPrimary')} />
          </TouchableOpacity>
        ]}
      />

      {/* Groups List */}
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        style={styles.groupsList}
        contentContainerStyle={styles.groupsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={getColor('success')}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <Spinner size="large" color={getColor('success')} />
              <Text style={[styles.emptyText, { color: getColor('textSecondary') }]}>
                Loading groups...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={48} color={getColor('textSecondary')} />
              <Text style={[styles.emptyText, { color: getColor('textSecondary') }]}>
                No groups found
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupsList: {
    flex: 1,
  },
  groupsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  groupCard: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  groupMeta: {
    alignItems: 'flex-end',
  },
  memberCount: {
    fontSize: 12,
    marginTop: 4,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTags: {
    flexDirection: 'row',
    flex: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activityText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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