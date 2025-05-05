import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { TabScreenProps } from '../types/navigation';
import { supabase } from '../lib/supabase';
import { typography, spacing, colors } from '../styles/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabParamList, RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

type VerificationStatus = 'unverified' | 'pending' | 'verified' | null;
type AnnouncementItem = { id: string; /* Minimal type needed for listener */ };

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen = ({ navigation }: Props) => {
  const [isOnline, setIsOnline] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(null);
  const [displayName, setDisplayName] = useState<string>('User');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfileData = async () => {
      setLoadingProfile(true);
      setProfileError(null);

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw authError || new Error('User not authenticated');
        }
        if (!isMounted) return;

        const { data: profileData, error: profileFetchError } = await supabase
          .from('user_preferences')
          .select('display_name, verification_status')
          .eq('user_id', user.id)
          .single();

        if (!isMounted) return;

        if (profileFetchError) {
          if (profileFetchError.code === 'PGRST116') {
            console.warn('User profile not found, assuming unverified.');
            setVerificationStatus('unverified');
            setDisplayName('User');
          } else {
            throw profileFetchError;
          }
        } else if (profileData) {
          setDisplayName(profileData.display_name || 'User');
          const status = profileData.verification_status as VerificationStatus;
          setVerificationStatus(status === 'unverified' || status === 'pending' || status === 'verified' ? status : 'unverified');
        } else {
          setVerificationStatus('unverified');
          setDisplayName('User');
        }

      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching home screen data:', err);
        setProfileError('Failed to load profile information.');
        setVerificationStatus(null);
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    fetchUserProfileData();

    const channel = supabase
      .channel('public:announcements:home_badge_simple')
      .on<AnnouncementItem>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          console.log('Announcement change detected, showing badge:', payload);
          if (isMounted) {
            setShowNotificationBadge(true);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') { console.log('Realtime channel subscribed for badge!'); }
        if (status === 'CHANNEL_ERROR') { console.error('Realtime channel error:', err); }
        if (status === 'TIMED_OUT') { console.warn('Realtime channel timed out.'); }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleVerifyPress = () => {
    navigation.navigate('Verification');
  };

  const handleNotificationPress = () => {
    setShowNotificationBadge(false);
    navigation.navigate('Announcements');
  };

  const renderVerificationBanner = () => {
    if (loadingProfile) {
      return (
        <View style={styles.verificationBanner}>
           <ActivityIndicator color="#00BFA6" />
        </View>
      );
    }

    if (profileError || verificationStatus === 'verified') {
      return null;
    }

    if (verificationStatus === 'pending') {
      return (
        <View style={[styles.verificationBanner, styles.pendingBanner]}>
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>Verification Pending</Text>
            <Text style={styles.verificationText}>
              Your documents are under review. We'll notify you soon.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.verificationBanner}>
        <View style={styles.verificationContent}>
          <Text style={styles.verificationTitle}>Complete Verification</Text>
          <Text style={styles.verificationText}>
            Get verified to unlock all features and start earning
          </Text>
        </View>
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerifyPress}
        >
          <Text style={styles.verifyButtonText}>Verify Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View>
              <Text style={styles.greetingText}>Good Evening 👋</Text>
              <Text style={styles.nameText}>{loadingProfile ? 'Loading...' : displayName}</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.statusToggle, isOnline && styles.statusToggleActive]}
                  onPress={() => setIsOnline(!isOnline)}>
                  <View
                    style={[
                      styles.toggleHandle,
                      isOnline && styles.toggleHandleActive,
                    ]}
                  />
                  <Text style={[styles.statusText, isOnline && styles.statusTextActive]}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNotificationPress} style={styles.notificationButtonContainer}>
                    <Icon name="bell-outline" size={26} color="#FFFFFF" />
                    {showNotificationBadge && (
                        <View style={styles.badge} />
                    )}
                </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0h</Text>
            <Text style={styles.statLabel}>Listen Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </ScrollView>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, {backgroundColor: '#4A148C'}]}>
                <Text style={styles.actionIconText}>🎯</Text>
              </View>
              <Text style={styles.actionText}>Set Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, {backgroundColor: '#1A237E'}]}>
                <Text style={styles.actionIconText}>📊</Text>
              </View>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, {backgroundColor: '#004D40'}]}>
                <Text style={styles.actionIconText}>💰</Text>
              </View>
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, {backgroundColor: '#B71C1C'}]}>
                <Text style={styles.actionIconText}>❤️</Text>
              </View>
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderVerificationBanner()}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    padding: 20,
    paddingBottom: 0,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 20,
    width: 100,
    marginRight: spacing.sm,
  },
  statusToggleActive: {
    backgroundColor: '#00513A',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF5252',
    marginRight: 8,
  },
  toggleHandleActive: {
    backgroundColor: '#00BFA6',
  },
  statusText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#00BFA6',
  },
  notificationButtonContainer: {
    padding: spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: colors.danger || '#FF5252',
    borderRadius: 5,
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: colors.background || '#121212',
  },
  statsScroll: {
    paddingBottom: 20,
  },
  statsContainer: {
    paddingHorizontal: 15,
    gap: 15,
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    width: width * 0.4,
    minWidth: 140,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00BFA6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    width: (width - 40 - 15) / 2,
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIconText: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  verificationBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00BFA6',
  },
  pendingBanner: {
     borderColor: '#FFC107',
  },
  verificationContent: {
    marginBottom: 15,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  verificationText: {
    fontSize: 14,
    color: '#888',
  },
  verifyButton: {
    backgroundColor: '#00BFA6',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: { 
     color: '#FF5252', 
     textAlign: 'center',
     padding: spacing.md, 
  },
});

export default HomeScreen; 