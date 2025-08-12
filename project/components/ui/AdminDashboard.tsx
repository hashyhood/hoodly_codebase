import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Users, Activity, Shield, Settings, BarChart3, AlertCircle, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { analytics } from '../../lib/analytics';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalGroups: number;
  totalEvents: number;
  pendingReports: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

interface AdminAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalGroups: 0,
    totalEvents: 0,
    pendingReports: 0,
    systemHealth: 'good',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Fetch user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

      // Fetch content stats
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      const { count: totalGroups } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true });

      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Fetch reports
      const { count: pendingReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPosts: totalPosts || 0,
        totalGroups: totalGroups || 0,
        totalEvents: totalEvents || 0,
        pendingReports: pendingReports || 0,
        systemHealth: (pendingReports || 0) > 10 ? 'warning' : 'good',
      });

      await analytics.trackEvent('admin_dashboard_viewed');
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      Alert.alert('Error', 'Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleUserManagement = () => {
    Alert.alert('User Management', 'User management features coming soon');
  };

  const handleContentModeration = () => {
    Alert.alert('Content Moderation', 'Content moderation features coming soon');
  };

  const handleSystemSettings = () => {
    Alert.alert('System Settings', 'System settings features coming soon');
  };

  const handleAnalytics = () => {
    Alert.alert('Analytics', 'Analytics dashboard coming soon');
  };

  const handleReports = () => {
    Alert.alert('Reports', 'Reports management coming soon');
  };

  const handleSystemHealth = () => {
    Alert.alert('System Health', 'System health monitoring coming soon');
  };

  const adminActions: AdminAction[] = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <Users size={24} color="#3B82F6" />,
      onPress: handleUserManagement,
      color: '#3B82F6',
    },
    {
      id: 'moderation',
      title: 'Content Moderation',
      description: 'Review and moderate content',
      icon: <Shield size={24} color="#10B981" />,
      onPress: handleContentModeration,
      color: '#10B981',
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: <Settings size={24} color="#6B7280" />,
      onPress: handleSystemSettings,
      color: '#6B7280',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed analytics and insights',
      icon: <BarChart3 size={24} color="#8B5CF6" />,
      onPress: handleAnalytics,
      color: '#8B5CF6',
    },
    {
      id: 'reports',
      title: 'Reports',
      description: `Manage ${stats.pendingReports} pending reports`,
              icon: <AlertCircle size={24} color="#F59E0B" />,
      onPress: handleReports,
      color: '#F59E0B',
    },
    {
      id: 'health',
      title: 'System Health',
      description: 'Monitor system performance',
      icon: <Activity size={24} color="#EF4444" />,
      onPress: handleSystemHealth,
      color: '#EF4444',
    },
  ];

  const getHealthIcon = () => {
    switch (stats.systemHealth) {
      case 'good':
        return <CheckCircle size={20} color="#10B981" />;
      case 'warning':
        return <AlertCircle size={20} color="#F59E0B" />;
      case 'critical':
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <CheckCircle size={20} color="#10B981" />;
    }
  };

  const getHealthColor = () => {
    switch (stats.systemHealth) {
      case 'good':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      default:
        return '#10B981';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={styles.healthIndicator}>
          {getHealthIcon()}
          <Text style={[styles.healthText, { color: getHealthColor() }]}>
            System {stats.systemHealth}
          </Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPosts}</Text>
          <Text style={styles.statLabel}>Total Posts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingReports}</Text>
          <Text style={styles.statLabel}>Pending Reports</Text>
        </View>
      </View>

      {/* Admin Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
        {adminActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <View style={styles.actionIcon}>{action.icon}</View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </View>
            <View style={[styles.actionIndicator, { backgroundColor: action.color }]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{stats.totalGroups}</Text>
            <Text style={styles.quickStatLabel}>Groups</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{stats.totalEvents}</Text>
            <Text style={styles.quickStatLabel}>Events</Text>
          </View>
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  actionIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  quickStatsContainer: {
    padding: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  quickStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default AdminDashboard; 