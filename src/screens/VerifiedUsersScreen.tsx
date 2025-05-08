import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {RootStackScreenProps} from '../types/navigation';
import {commonStyles, typography, spacing, colors} from '../styles/common'; // Assuming colors are defined here
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {RootState} from '../store';
import { supabase } from '../lib/supabase'; // Adjust path to your Supabase client instance
import VerifiedUserCard from './VerifiedUserCard';

// Define theme colors or import from common styles
const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textOnPrimary: '#FFFFFF',
};

// Define the type for user profile fetched from Supabase
// Adjust this based on your actual table structure if needed
type UserProfile = {
  id: string; // Primary key from user_preferences
  user_id: string; // Foreign key to auth.users
  display_name: string | null;
  age: number | null;
  emotional_story: string | null;
  is_online?: boolean;
  rating?: number | null;
  spentHours?: number | null;
};

const VerifiedUsersScreen = ({
  navigation,
}: RootStackScreenProps<'VerifiedUsers'>) => {
  const userPhoneNumber = useSelector((state: RootState) => state.auth.userProfile.phoneNumber);
  const [verifiedUsers, setVerifiedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerifiedUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get the current logged-in user's ID
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.warn('Could not get current user ID to filter list.');
          // Decide how to handle this: fetch all verified or show error?
          // Fetching all verified for now, logged-in user might appear in list.
        }

        // 2. Build the query
        let query = supabase
          .from('user_preferences')
          // Select the new field 'emotional_story' and is_online
          .select('id, user_id, display_name, age, emotional_story, is_online')
          .eq('verification_status', 'verified');

        // 3. Add filter to exclude the current user IF we got their ID
        if (user) {
          query = query.neq('user_id', user.id); // Exclude self
        }

        // 4. Execute the query
        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          // We'll keep the filter for display_name for now
          // Assign fetched data, including the new field
          setVerifiedUsers(data.filter(u => u.display_name));
        }
      } catch (err: any) {
        console.error('Error fetching verified users:', err);
        setError('Failed to load verified users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedUsers();

    // Real-time subscription for is_online changes
    const channel = supabase
      .channel('public:user_preferences:verified_online')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_preferences' },
        (payload) => {
          const updated = payload.new;
          setVerifiedUsers((prev) =>
            prev.map((user) =>
              user.user_id === updated.user_id
                ? { ...user, is_online: updated.is_online }
                : user
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTalkNow = (user: UserProfile) => {
    if (!userPhoneNumber) {
      console.error('Current user phone number not found');
      // Optionally show an alert to the user
      return;
    }
    if (!user.user_id) {
       console.error('Selected user ID not found');
       // Optionally show an alert to the user
       return;
    }

    navigation.navigate('Chat', {
      userName: user.display_name || 'User',
      userId: userPhoneNumber, // Assuming this is the identifier for the *current* user in chat
      otherUserId: user.user_id, // Use user_id (auth ID) or id (profile ID) depending on Chat screen needs
    });
  };

  // Navigation handler for the avatar
  const handleViewProfile = (user: UserProfile) => {
    if (!user.user_id) {
      console.error("Cannot view profile: User ID missing.");
      return;
    }
    navigation.navigate('UserProfileDetail', { userId: user.user_id });
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <VerifiedUserCard
      user={item}
      onTalkNow={handleTalkNow}
      onViewProfile={handleViewProfile}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <View style={styles.centered}>
           <ActivityIndicator size="large" color={themeColors.primary} />
           <Text style={styles.loadingText}>Loading Verified Users...</Text>
         </View>
      </SafeAreaView>
    );
  }

  if (error) {
     return (
       <SafeAreaView style={styles.safeArea}>
         <View style={styles.centered}>
           <Text style={styles.errorText}>{error}</Text>
           {/* Optionally add a retry button */}
         </View>
       </SafeAreaView>
     );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verified Users</Text>
        <View style={{width: 40}} />
      </View>
      {verifiedUsers.length === 0 ? (
         <View style={styles.centered}>
            <Text style={styles.emptyText}>No verified users found yet.</Text>
         </View>
      ) : (
        <FlatList
          data={verifiedUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: themeColors.textPrimary,
  },
  headerPlaceholder: {
    width: 40, // Maintain balance
  },
  listContainer: {
    padding: spacing.md, // Padding around the list
  },
  userCard: {
    backgroundColor: themeColors.surface, // Card background
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md, // Space between cards
    // Optional: Add shadow for elevation (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // Optional: Add elevation for Android
    elevation: 3,
  },
  cardTopSection: {
    flexDirection: 'row',
    alignItems: 'center', // Align avatar and info vertically
    marginBottom: spacing.sm, // Space below top section
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333', // Slightly different avatar bg
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: themeColors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  userInfoContainer: {
    flex: 1, // Take remaining space
  },
  userName: {
    ...typography.bodyStrong,
    color: themeColors.textPrimary,
    marginBottom: 3,
  },
  detailsRow: {
     flexDirection: 'row',
     alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm, // Space between rating and other details
  },
  ratingText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    marginLeft: 3,
    fontWeight: '500',
  },
  userDetails: {
    ...typography.caption,
    color: themeColors.textSecondary,
    flexShrink: 1, // Allow text to shrink if needed
  },
  userStatus: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontStyle: 'normal',
    marginTop: spacing.sm, // Add space above the story
    marginBottom: spacing.md, // Add space below the story
  },
   userStatusPlaceholder: {
     fontStyle: 'italic',
     color: '#666',
  },
  cardBottomSection: {
    alignItems: 'flex-end', // Align button to the right
    marginTop: spacing.sm,
  },
  talkButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg, // Make button slightly wider
    borderRadius: 20, // More rounded button
  },
  talkButtonText: {
    ...typography.buttonSmall,
    color: themeColors.textOnPrimary,
    fontWeight: '600',
  },
  centered: { // New style for centering content
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: { // New style
    marginTop: spacing.md,
    color: themeColors.textSecondary,
    ...typography.body,
  },
  errorText: { // New style
    color: '#FF5252',
    ...typography.body,
    textAlign: 'center',
  },
  emptyText: { // New style
     color: themeColors.textSecondary,
     ...typography.body,
     textAlign: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
});

export default VerifiedUsersScreen; 