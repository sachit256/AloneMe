import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Switch,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { TabScreenProps } from '../types/navigation';
import { supabase } from '../lib/supabase';
import { typography, spacing, colors } from '../styles/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabParamList, RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

type VerificationStatus = 'unverified' | 'pending' | 'verified' | null;
type AnnouncementItem = { id: string; };

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

// --- Supabase Service Functions ---

// Fetches the current availability status specifically for VideoCall
async function fetchVideoCallAvailability(userId: string): Promise<boolean> {
  console.log('Fetching video call availability for:', userId);
  const { data, error } = await supabase
    .from('user_service_availability')
    .select('is_available')
    .eq('user_id', userId)
    .eq('service_type', 'VideoCall') 
    .single();

  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching video call availability:', error);
    throw error; 
  }
  console.log('Fetched video status:', data?.is_available);
  return data?.is_available || false; 
}

// Saves only the VideoCall availability status using Upsert
async function saveServiceAvailability(userId: string, videoCallEnabled: boolean): Promise<void> {
  console.log(`Saving VideoCall availability for ${userId}: ${videoCallEnabled}`);
  
  // Define only the VideoCall row to be inserted or updated
  const videoCallAvailability = {
    user_id: userId,
    service_type: 'VideoCall', 
    is_available: videoCallEnabled
  };

  // Perform the upsert operation for only the VideoCall row
  const { error } = await supabase
    .from('user_service_availability')
    .upsert(videoCallAvailability, {
      onConflict: 'user_id,service_type', // Matches the composite PRIMARY KEY
    });

  if (error) {
    console.error('Error saving video call availability:', error);
    throw error; 
  }

  console.log('VideoCall availability saved successfully to Supabase.');
}
// --- End of Supabase Service Functions ---

const AvailabilityModal = (
    { visible, onClose, currentVideoStatus, onSave }: 
    { 
        visible: boolean; 
        onClose: () => void; 
        currentVideoStatus: boolean;
        onSave: (isVideoEnabled: boolean) => void;
    }
) => {
    const [isVideoCallEnabled, setIsVideoCallEnabled] = useState(currentVideoStatus);

    useEffect(() => {
        setIsVideoCallEnabled(currentVideoStatus);
    }, [currentVideoStatus, visible]);

    const handleSave = () => {
        onSave(isVideoCallEnabled);
    };

    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Set Availability</Text>
                    
                    <View style={styles.availabilityItem}>
                        <Text style={styles.availabilityLabel}>Chat</Text>
                        <Switch trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={"#f4f3f4"} ios_backgroundColor="#3e3e3e" value={true} disabled={true} />
                    </View>
                    <View style={styles.availabilityItem}>
                        <Text style={styles.availabilityLabel}>Audio Call</Text>
                        <Switch trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={"#f4f3f4"} ios_backgroundColor="#3e3e3e" value={true} disabled={true} />
                    </View>
                    <View style={styles.availabilityItem}>
                        <Text style={styles.availabilityLabel}>Video Call</Text>
                        <Switch 
                            trackColor={{ false: "#767577", true: "#00BFA6" }}
                            thumbColor={isVideoCallEnabled ? "#00BFA6" : "#f4f3f4"}
                            onValueChange={setIsVideoCallEnabled} 
                            value={isVideoCallEnabled} 
                        />
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                            <Text style={styles.modalButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const HomeScreen = ({ navigation }: Props) => {
  const [isOnline, setIsOnline] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(null);
  const [displayName, setDisplayName] = useState<string>('User');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);

  // New states for availability modal
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [initialVideoCallStatus, setInitialVideoCallStatus] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingOnlineStatus, setIsUpdatingOnlineStatus] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchInitialData = useCallback(async () => {
      setLoadingProfile(true);
      setProfileError(null);
      let userIdToSet: string | null = null;

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw authError || new Error('User not authenticated');
        }
        userIdToSet = user.id;
        setCurrentUserId(user.id);

        const { data: profileData, error: profileFetchError } = await supabase
          .from('user_preferences')
          .select('display_name, verification_status, is_online')
          .eq('user_id', user.id)
          .single();

        if (profileFetchError) {
          if (profileFetchError.code === 'PGRST116') {
            setVerificationStatus('unverified');
            setDisplayName('User');
            setIsOnline(false);
          } else {
            throw profileFetchError;
          }
        } else if (profileData) {
          setDisplayName(profileData.display_name || 'User');
          const status = profileData.verification_status as VerificationStatus;
          setVerificationStatus(status === 'unverified' || status === 'pending' || status === 'verified' ? status : 'unverified');
          setIsOnline(!!profileData.is_online);
        } else {
          setVerificationStatus('unverified');
          setDisplayName('User');
          setIsOnline(false);
        }
      } catch (err: any) {
        console.error('Error fetching home screen data:', err);
        setProfileError('Failed to load profile information.');
        setVerificationStatus(null);
        setIsOnline(false);
      } finally {
        setLoadingProfile(false);
      }
      return userIdToSet; // Return user ID for subsequent fetches if needed
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      fetchInitialData();
      
      const channel = supabase
        .channel('public:announcements:home_badge_simple')
        .on<AnnouncementItem>(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'announcements' },
          (payload) => {
            if (isMounted) setShowNotificationBadge(true);
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') console.log('Realtime channel subscribed for badge!');
        });

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }, [fetchInitialData])
  );

  const handleSetAvailabilityPress = async () => {
    if (!currentUserId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'User not identified. Please try again.' });
        return;
    }
    setIsSavingAvailability(true); 
    try {
        const videoStatus = await fetchVideoCallAvailability(currentUserId);
        setInitialVideoCallStatus(videoStatus);
        setAvailabilityModalVisible(true);
    } catch (error: any) {
        console.error("Failed to fetch availability settings", error);
        Toast.show({ type: 'error', text1: 'Error', text2: error?.message || 'Could not load availability settings.' });
    }
    setIsSavingAvailability(false);
  };

  const handleSaveAvailability = async (isVideoEnabled: boolean) => {
    if (!currentUserId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'User not identified. Cannot save settings.' });
        return;
    }
    setIsSavingAvailability(true);
    try {
        await saveServiceAvailability(currentUserId, isVideoEnabled);
        setInitialVideoCallStatus(isVideoEnabled); 
        Toast.show({ type: 'success', text1: 'Success', text2: 'Availability settings saved!' });
    } catch (error: any) {
        console.error("Failed to save availability settings", error);
        Toast.show({ type: 'error', text1: 'Error', text2: error?.message || 'Could not save availability settings.' });
    } finally {
        setIsSavingAvailability(false);
        setAvailabilityModalVisible(false);
    }
  };

  const handleVerifyPress = () => navigation.navigate('Verification' as never);
  const handleNotificationPress = () => {
    setShowNotificationBadge(false);
    navigation.navigate('Announcements' as never);
  };

  const handleSearchChange = (query: string) => {
      setSearchQuery(query);
      console.log('Search Query:', query);
  };

  const handleClearSearch = () => {
      setSearchQuery('');
  };

  const handleSearchPress = () => {
    navigation.navigate('Search' as never);
  };

  const renderVerifiedSection = () => {
    if (verificationStatus !== 'verified') return null;
    return (
      <View style={styles.verifiedSection}>
        <View style={styles.verifiedBadge}>
          <Icon name="check-decagram" size={28} color="#00BFA6" />
          <Text style={styles.verifiedText}>Your profile is verified!</Text>
        </View>
      </View>
    );
  };

  const renderVerificationBanner = () => {
    if (verificationStatus === 'verified') {
      return null;
    }

    if (loadingProfile) {
      return (
        <View style={styles.verificationBanner}>
           <ActivityIndicator color="#00BFA6" />
        </View>
      );
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
              <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
              <Text style={styles.nameText}>{loadingProfile ? 'Loading...' : displayName}</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.statusToggle, isOnline && styles.statusToggleActive]}
                  onPress={async () => {
                    if (!currentUserId || isUpdatingOnlineStatus) return;
                    setIsUpdatingOnlineStatus(true);
                    const newStatus = !isOnline;
                    const { error } = await supabase
                      .from('user_preferences')
                      .update({ is_online: newStatus })
                      .eq('user_id', currentUserId);
                    if (error) {
                      console.error('Failed to update online status:', error);
                      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update online status.' });
                      setIsUpdatingOnlineStatus(false);
                      return;
                    }
                    setIsOnline(newStatus);
                    setIsUpdatingOnlineStatus(false);
                  }}>
                  {isUpdatingOnlineStatus ? (
                    <ActivityIndicator size="small" color={isOnline ? '#00BFA6' : '#FF5252'} style={{ marginRight: 8 }} />
                  ) : (
                    <View
                      style={[
                        styles.toggleHandle,
                        isOnline && styles.toggleHandleActive,
                      ]}
                    />
                  )}
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
        <TouchableOpacity 
          style={styles.searchSection}
          onPress={handleSearchPress}
        >
          <View style={styles.searchBarContainer}>
            <Icon name="magnify" size={22} color={colors.text.secondary} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search users, topics...</Text>
          </View>
        </TouchableOpacity>

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
            <TouchableOpacity style={styles.actionCard} onPress={handleSetAvailabilityPress} disabled={isSavingAvailability}>
              <View style={[styles.actionIcon, {backgroundColor: '#0D47A1'}]}>
                {isSavingAvailability ? <ActivityIndicator size="small" color="#FFFFFF"/> : <Text style={styles.actionIconText}>⚙️</Text>}
              </View>
              <Text style={styles.actionText}>Set Availability</Text>
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

        {verificationStatus === 'verified' ? renderVerifiedSection() : renderVerificationBanner()}
      </ScrollView>
      <AvailabilityModal 
        visible={availabilityModalVisible} 
        onClose={() => setAvailabilityModalVisible(false)} 
        currentVideoStatus={initialVideoCallStatus}
        onSave={handleSaveAvailability}
      />
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
    backgroundColor: "#00BFA6",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  availabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  availabilityLabel: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#424242',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#00BFA6",
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  verifiedSection: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#182C22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00BFA6',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifiedText: {
    fontSize: 16,
    color: '#00BFA6',
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default HomeScreen; 