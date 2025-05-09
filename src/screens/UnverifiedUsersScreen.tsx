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
// Adjust import path based on your navigation setup
import { RootStackScreenProps } from '../types/navigation';
// Adjust import paths based on your project structure
import { commonStyles, typography, spacing, colors } from '../styles/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';
import { getOrCreateChatSession } from '../lib/chat';

// Theme colors (keep consistent or import)
const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textOnPrimary: '#FFFFFF',
};

// User profile type (same as VerifiedUsersScreen)
type UserProfile = {
  id: string; // Primary key from user_preferences
  user_id: string; // Foreign key to auth.users
  display_name: string | null;
  age: number | null;
  is_online?: boolean;
};

// Component name and prop type updated
const UnverifiedUsersScreen = ({
  navigation,
  // Update the screen name in RootStackScreenProps
}: RootStackScreenProps<'UnverifiedUsers'>) => {
  // State remains similar, adjust names if preferred
  const userId = useSelector((state: RootState) => state.auth.userProfile.userId);
  const [unverifiedUsers, setUnverifiedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Renamed function for clarity
    const fetchUnverifiedUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get the current logged-in user's ID
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.warn('Could not get current user ID to filter list.');
          // Fetching all unverified for now, logged-in user might appear in list.
        }

        // 2. Build the query
        let query = supabase
          .from('user_preferences')
          .select('id, user_id, display_name, age, is_online')
          // Fetch 'unverified' users instead of 'verified'
          .eq('verification_status', 'unverified');

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
          // Filter out users without essential info (optional)
          setUnverifiedUsers(data.filter(u => u.display_name));
        }
      } catch (err: any) {
        // Update error message context
        console.error('Error fetching unverified users:', err);
        setError('Failed to load unverified users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUnverifiedUsers();

    // Real-time subscription for is_online changes
    const channel = supabase
      .channel('public:user_preferences:unverified_online')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_preferences' },
        (payload) => {
          const updated = payload.new;
          setUnverifiedUsers((prev) =>
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

  // handleTalkNow remains the same logic
  const handleTalkNow = async (user: UserProfile) => {
    if (!userId) {
      console.error('Current user ID not found');
      return;
    }
    if (!user.user_id) {
       console.error('Selected user ID not found');
       return;
    }
    try {
      const chatId = await getOrCreateChatSession(userId, user.user_id);
      navigation.navigate('Chat', {
        chatId,
        userName: user.display_name || 'User',
        userId: userId,
        otherUserId: user.user_id,
        otherUserName: user.display_name || 'User',
      });
    } catch (err) {
      console.error('Could not start chat', err);
    }
  };

  // renderUserItem remains the same structure
  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const name = item.display_name || 'Anonymous';
    const avatarText = name.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => handleTalkNow(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarText}</Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.is_online ? '#00C853' : '#888' },
              ]}
            />
          </View>
        </View>

        {/* User Info Section */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName} numberOfLines={1}>{name}</Text>
          <Text style={styles.userDetails} numberOfLines={1}>
            {item.age ? `${item.age} yrs` : 'Age not specified'}
          </Text>
        </View>

        {/* Talk Now Button */}
        <TouchableOpacity
          style={styles.talkButton}
          onPress={() => handleTalkNow(item)}
        >
          <Text style={styles.talkButtonText}>Talk Now</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Loading and Error states remain the same
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <View style={styles.centered}>
           <ActivityIndicator size="large" color={themeColors.primary} />
           {/* Update loading text */}
           <Text style={styles.loadingText}>Loading Unverified Users...</Text>
         </View>
      </SafeAreaView>
    );
  }

  if (error) {
     return (
       <SafeAreaView style={styles.safeArea}>
         <View style={styles.centered}>
           <Text style={styles.errorText}>{error}</Text>
         </View>
       </SafeAreaView>
     );
  }

  // Main return structure remains the same
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
        </TouchableOpacity>
        {/* Update header title */}
        <Text style={styles.headerTitle}>Unverified Users</Text>
        <View style={{width: 40}} />
      </View>
      {/* Check the correct state variable and update empty text */}
      {unverifiedUsers.length === 0 ? (
         <View style={styles.centered}>
            <Text style={styles.emptyText}>No unverified users found.</Text>
         </View>
      ) : (
        <FlatList
          // Use the correct data source
          data={unverifiedUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

// Styles remain largely the same, copied from VerifiedUsersScreen
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
    width: 40,
  },
  listContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surface,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: themeColors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: themeColors.background,
  },
  userInfoContainer: {
    flex: 1,
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
  userName: {
    ...typography.bodyStrong,
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  userDetails: {
    ...typography.caption,
    color: themeColors.textSecondary,
  },
  talkButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 15,
    alignSelf: 'center',
    marginLeft: 'auto',
  },
  talkButtonText: {
    ...typography.buttonSmall,
    color: themeColors.textOnPrimary,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    color: themeColors.textSecondary,
    ...typography.body,
  },
  errorText: {
    color: '#FF5252',
    ...typography.body,
    textAlign: 'center',
  },
  emptyText: {
     color: themeColors.textSecondary,
     ...typography.body,
     textAlign: 'center',
  },
});

// Export the new component
export default UnverifiedUsersScreen; 