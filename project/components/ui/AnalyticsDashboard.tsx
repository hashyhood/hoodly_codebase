import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BarChart3, Users, Activity, Eye, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { analytics } from '../../lib/analytics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AnalyticsData {
  userGrowth: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    growthRate: number;
  };
  engagement: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    engagementRate: number;
  };
  activity: {
    activeUsers: number;
    averageSessionTime: number;
    postsPerDay: number;
    interactionsPerDay: number;
  };
  topContent: {
    mostLikedPost: string;
    mostCommentedPost: string;
    mostSharedPost: string;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    userGrowth: {
      total: 0,
      newThisWeek: 0,
      newThisMonth: 0,
      growthRate: 0,
    },
    engagement: {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      engagementRate: 0,
    },
    activity: {
      activeUsers: 0,
      averageSessionTime: 0,
      postsPerDay: 0,
      interactionsPerDay: 0,
    },
    topContent: {
      mostLikedPost: '',
      mostCommentedPost: '',
      mostSharedPost: '',
    },
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Calculate average session time from real data
  const calculateAverageSessionTime = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return 0;
    
    const totalTime = sessions.reduce((sum, session) => {
      const startTime = new Date(session.start_time).getTime();
      const endTime = new Date(session.end_time || new Date()).getTime();
      return sum + (endTime - startTime);
    }, 0);
    
    return Math.round(totalTime / sessions.length / (1000 * 60)); // Convert to minutes
  };

  // Fetch real analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        if (!user?.id) return;
        
        // Fetch user sessions from Supabase
        const { data: sessions, error: sessionsError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
          .order('start_time', { ascending: false });
        
        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
        } else {
          // setAverageSessionTime(calculateAverageSessionTime(sessions || [])); // This line was removed from the new_code, so it's removed here.
        }
        
        // Fetch other analytics data
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        if (!postsError && posts) {
          // setTotalPosts(posts.length); // This line was removed from the new_code, so it's removed here.
        }
        
        // Fetch engagement metrics
        const { data: likes, error: likesError } = await supabase
          .from('likes')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        if (!likesError && likes) {
          // setTotalLikes(likes.length); // This line was removed from the new_code, so it's removed here.
        }
        
        // Fetch comments
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        if (!commentsError && comments) {
          // setTotalComments(comments.length); // This line was removed from the new_code, so it's removed here.
        }
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      fetchAnalyticsData();
    }
  }, [user?.id]);

  const renderMetricCard = (title: string, value: string | number, subtitle: string, icon: React.ReactNode, color: string) => (
    <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <View style={styles.metricContent}>
          <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );

  const renderGrowthCard = () => (
    <View style={styles.growthCard}>
      <View style={styles.growthHeader}>
        <Text style={styles.growthTitle}>User Growth</Text>
        <View style={styles.growthRate}>
          <BarChart3 size={16} color="#10B981" />
          <Text style={styles.growthRateText}>+{data.userGrowth.growthRate}%</Text>
        </View>
      </View>
      <View style={styles.growthStats}>
        <View style={styles.growthStat}>
          <Text style={styles.growthStatValue}>{data.userGrowth.total}</Text>
          <Text style={styles.growthStatLabel}>Total Users</Text>
        </View>
        <View style={styles.growthStat}>
          <Text style={styles.growthStatValue}>{data.userGrowth.newThisWeek}</Text>
          <Text style={styles.growthStatLabel}>New This Week</Text>
        </View>
        <View style={styles.growthStat}>
          <Text style={styles.growthStatValue}>{data.userGrowth.newThisMonth}</Text>
          <Text style={styles.growthStatLabel}>New This Month</Text>
        </View>
      </View>
    </View>
  );

  const renderEngagementCard = () => (
    <View style={styles.engagementCard}>
      <Text style={styles.cardTitle}>Engagement Overview</Text>
      <View style={styles.engagementGrid}>
        <View style={styles.engagementItem}>
          <Eye size={20} color="#3B82F6" />
          <Text style={styles.engagementValue}>{data.engagement.totalPosts}</Text>
          <Text style={styles.engagementLabel}>Posts</Text>
        </View>
        <View style={styles.engagementItem}>
          <Heart size={20} color="#EF4444" />
          <Text style={styles.engagementValue}>{data.engagement.totalLikes}</Text>
          <Text style={styles.engagementLabel}>Likes</Text>
        </View>
        <View style={styles.engagementItem}>
          <MessageCircle size={20} color="#10B981" />
          <Text style={styles.engagementValue}>{data.engagement.totalComments}</Text>
          <Text style={styles.engagementLabel}>Comments</Text>
        </View>
        <View style={styles.engagementItem}>
          <Share2 size={20} color="#8B5CF6" />
          <Text style={styles.engagementValue}>{data.engagement.totalShares}</Text>
          <Text style={styles.engagementLabel}>Shares</Text>
        </View>
      </View>
      <View style={styles.engagementRate}>
        <Text style={styles.engagementRateLabel}>Engagement Rate</Text>
        <Text style={styles.engagementRateValue}>{data.engagement.engagementRate}%</Text>
      </View>
    </View>
  );

  const renderActivityCard = () => (
    <View style={styles.activityCard}>
      <Text style={styles.cardTitle}>Activity Metrics</Text>
      <View style={styles.activityGrid}>
        <View style={styles.activityItem}>
          <Users size={20} color="#3B82F6" />
          <Text style={styles.activityValue}>{data.activity.activeUsers}</Text>
          <Text style={styles.activityLabel}>Active Users</Text>
        </View>
        <View style={styles.activityItem}>
          <Activity size={20} color="#10B981" />
          <Text style={styles.activityValue}>{data.activity.averageSessionTime}min</Text>
          <Text style={styles.activityLabel}>Avg Session</Text>
        </View>
        <View style={styles.activityItem}>
          <BarChart3 size={20} color="#F59E0B" />
          <Text style={styles.activityValue}>{data.activity.postsPerDay}</Text>
          <Text style={styles.activityLabel}>Posts/Day</Text>
        </View>
        <View style={styles.activityItem}>
          <MessageCircle size={20} color="#8B5CF6" />
          <Text style={styles.activityValue}>{data.activity.interactionsPerDay}</Text>
          <Text style={styles.activityLabel}>Interactions/Day</Text>
        </View>
      </View>
    </View>
  );

  const renderTopContentCard = () => (
    <View style={styles.topContentCard}>
      <Text style={styles.cardTitle}>Top Content</Text>
      <View style={styles.topContentList}>
        <View style={styles.topContentItem}>
          <Heart size={16} color="#EF4444" />
          <Text style={styles.topContentText} numberOfLines={1}>
            {data.topContent.mostLikedPost}
          </Text>
        </View>
        <View style={styles.topContentItem}>
          <MessageCircle size={16} color="#10B981" />
          <Text style={styles.topContentText} numberOfLines={1}>
            {data.topContent.mostCommentedPost}
          </Text>
        </View>
        <View style={styles.topContentItem}>
          <Share2 size={16} color="#8B5CF6" />
          <Text style={styles.topContentText} numberOfLines={1}>
            {data.topContent.mostSharedPost}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
        <TouchableOpacity
              key={period}
          style={[
                styles.periodButton,
                selectedPeriod === period && styles.selectedPeriod,
          ]}
              onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
                  styles.periodText,
                  selectedPeriod === period && styles.selectedPeriodText,
            ]}
          >
                {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
      </View>

        {/* Key Metrics */}
      <View style={styles.metricsContainer}>
                  {renderMetricCard(
                    'Total Users',
                    data.userGrowth.total.toLocaleString(),
          `${data.userGrowth.newThisWeek} new this week`,
          <Users size={24} color="#3B82F6" />,
          '#3B82F6'
                  )}
                  {renderMetricCard(
          'Engagement Rate',
          `${data.engagement.engagementRate}%`,
          `${data.engagement.totalPosts} total posts`,
          <BarChart3 size={24} color="#10B981" />,
          '#10B981'
                  )}
                  {renderMetricCard(
          'Active Users',
          data.activity.activeUsers.toLocaleString(),
          `${data.activity.averageSessionTime}min avg session`,
          <Activity size={24} color="#F59E0B" />,
          '#F59E0B'
        )}
      </View>

      {/* Growth Card */}
      {renderGrowthCard()}

      {/* Engagement Card */}
      {renderEngagementCard()}

      {/* Activity Card */}
      {renderActivityCard()}

      {/* Top Content Card */}
      {renderTopContentCard()}
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedPeriod: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedPeriodText: {
    color: '#111827',
  },
  metricsContainer: {
    padding: 16,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  metricSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  growthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  growthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  growthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  growthRate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthRateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  growthStats: {
    flexDirection: 'row',
    gap: 16,
  },
  growthStat: {
    flex: 1,
    alignItems: 'center',
  },
  growthStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  growthStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  engagementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  engagementGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  engagementItem: {
    flex: 1,
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  engagementLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  engagementRate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  engagementRateLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  engagementRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  activityItem: {
    flex: 1,
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  topContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topContentList: {
    gap: 12,
  },
  topContentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topContentText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
}); 

export default AnalyticsDashboard; 