import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { TabScreenProps } from '../types/navigation';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const { width } = Dimensions.get('window');

interface SessionStats {
  chatHours: number;
  callHours: number;
  videoHours: number;
  totalSessions: number;
  totalHours: number;
  dailyStats: {
    date: string;
    hours: number;
    sessions: number;
  }[];
}

const ActivityScreen = ({ navigation }: TabScreenProps<'Activity'>) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    chatHours: 0,
    callHours: 0,
    videoHours: 0,
    totalSessions: 0,
    totalHours: 0,
    dailyStats: [],
  });

  const userId = useSelector((state: RootState) => state.auth.userProfile.userId);
  const gender = useSelector((state: RootState) => state.auth.userProfile.gender);

  useEffect(() => {
    if (gender?.toLowerCase() !== 'female') {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('session_logs')
          .select('session_type, duration_minutes, start_time')
          .eq('listener_id', userId)
          .not('duration_minutes', 'is', null);

        if (error) throw error;

        const newStats: SessionStats = {
          chatHours: 0,
          callHours: 0,
          videoHours: 0,
          totalSessions: data?.length || 0,
          totalHours: 0,
          dailyStats: [],
        };

        // Process session data
        const dailyMap = new Map<string, { hours: number; sessions: number }>();

        data?.forEach(session => {
          const hours = (session.duration_minutes || 0) / 60;
          
          // Update session type hours
          switch (session.session_type) {
            case 'chat':
              newStats.chatHours += hours;
              break;
            case 'call':
              newStats.callHours += hours;
              break;
            case 'video':
              newStats.videoHours += hours;
              break;
          }

          // Update daily stats
          const date = new Date(session.start_time).toLocaleDateString();
          const existing = dailyMap.get(date) || { hours: 0, sessions: 0 };
          dailyMap.set(date, {
            hours: existing.hours + hours,
            sessions: existing.sessions + 1,
          });
        });

        // Convert daily map to array and sort by date
        newStats.dailyStats = Array.from(dailyMap.entries())
          .map(([date, stats]) => ({
            date,
            hours: stats.hours,
            sessions: stats.sessions,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        newStats.totalHours = newStats.chatHours + newStats.callHours + newStats.videoHours;

        setStats(newStats);
      } catch (err) {
        console.error('Error fetching activity stats:', err);
        setError('Failed to load activity statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, gender]);

  if (gender?.toLowerCase() !== 'female') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.messageText}>Activity tracking is only available for listeners.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00BFA6" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>

        {/* Overall Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="clock-outline" size={24} color="#00BFA6" />
            <Text style={styles.statValue}>{stats.totalHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="account-multiple-outline" size={24} color="#00BFA6" />
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
        </View>

        {/* Session Type Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Breakdown</Text>
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownItem}>
              <Icon name="chat-outline" size={24} color="#00BFA6" />
              <Text style={styles.breakdownValue}>{stats.chatHours.toFixed(1)}h</Text>
              <Text style={styles.breakdownLabel}>Chat</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Icon name="phone-outline" size={24} color="#00BFA6" />
              <Text style={styles.breakdownValue}>{stats.callHours.toFixed(1)}h</Text>
              <Text style={styles.breakdownLabel}>Voice</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Icon name="video-outline" size={24} color="#00BFA6" />
              <Text style={styles.breakdownValue}>{stats.videoHours.toFixed(1)}h</Text>
              <Text style={styles.breakdownLabel}>Video</Text>
            </View>
          </View>
        </View>

        {/* Daily Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Activity</Text>
          {stats.dailyStats.map((day, index) => (
            <View key={day.date} style={styles.dailyItem}>
              <Text style={styles.dailyDate}>{day.date}</Text>
              <View style={styles.dailyStats}>
                <Text style={styles.dailyHours}>{day.hours.toFixed(1)}h</Text>
                <Text style={styles.dailySessions}>{day.sessions} sessions</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-around',
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: (width - 60) / 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00BFA6',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00BFA6',
    marginVertical: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#888',
  },
  dailyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  dailyDate: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dailyStats: {
    alignItems: 'flex-end',
  },
  dailyHours: {
    fontSize: 16,
    color: '#00BFA6',
    fontWeight: '500',
  },
  dailySessions: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});

export default ActivityScreen; 