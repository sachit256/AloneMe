import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Share,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { RootStackScreenProps } from '../types/navigation';
import { supabase } from '../lib/supabase';
import { typography, spacing, colors } from '../styles/common'; // Adjust path if needed
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Rating } from 'react-native-ratings';
import Toast from 'react-native-toast-message';

// Define theme colors (or import from common styles)
const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  danger: '#FF5252', // Define a danger color
};

// Type for the fetched profile data
interface ProfileData {
  display_name: string | null;
  age: number | null;
  emotional_story: string | null;
  aloneme_user_id: string | null;
  gender: string | null;
  total_hours_spent: number | null;
}

const UserProfileDetailScreen = ({
  route,
  navigation,
}: RootStackScreenProps<'UserProfileDetail'>) => {
  const { userId: reviewedUserId } = route.params; // Renamed for clarity
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRating, setCurrentUserRating] = useState<number>(0); // State for user's rating input
  const [reviewText, setReviewText] = useState(''); // State for review text
  const [isSubmittingReview, setIsSubmittingReview] = useState(false); // Renamed state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch profile and current user ID
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!reviewedUserId) {
        setError('User ID is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Could not get current user session.');
        }
        setCurrentUserId(user.id);

        // Fetch profile being viewed
        const { data: profileData, error: profileError } = await supabase
          .from('user_preferences')
          .select('display_name, age, emotional_story, aloneme_user_id, gender, total_hours_spent')
          .eq('user_id', reviewedUserId)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setError('User profile not found.');
          } else {
            throw profileError;
          }
        } else {
          setProfile(profileData);
          // TODO: Fetch existing rating/review for this user pair here
          // const { data: existingReview } = await supabase.from('reviews')...
          // if (existingReview) {
          //   setCurrentUserRating(existingReview.rating);
          //   setReviewText(existingReview.review_text || '');
          // }
        }
      } catch (err: any) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [reviewedUserId]);

  // --- Action Handlers ---

  const handleShareProfile = async () => {
    if (!profile) return;
    const name = profile.display_name || 'Anonymous';
    try {
      await Share.share({
        // Customize the message and title
        message: `${name}'s profile on AloneMe: ${profile.emotional_story?.substring(0, 100) ?? ''}...`,
        // title: `${name}'s Profile`, // iOS only
      });
    } catch (shareError: any) {
      Alert.alert('Error', 'Could not share profile.');
      console.error('Share error:', shareError);
    }
  };

  const handleCopyName = () => {
    if (!profile || !profile.display_name) return;
    Clipboard.setString(profile.display_name);
    Toast.show({ type: 'success', text1: 'Copied!', text2: `${profile.display_name} copied to clipboard.` });
  };

  const handleRatingChange = (rating: number) => {
    setCurrentUserRating(rating);
  };

  const handleSubmitReviewAndRating = async () => {
    if (currentUserRating === 0) {
        Toast.show({ type: 'error', text1: 'Missing Rating', text2: 'Please select a star rating first.' });
        return;
    }
    if (!currentUserId || !reviewedUserId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Cannot submit review. User info missing.' });
      return;
    }
     if (currentUserId === reviewedUserId) {
      Toast.show({ type: 'info', text1: 'Info', text2: 'You cannot review your own profile.' });
      return;
    }

    Keyboard.dismiss(); // Dismiss keyboard before submitting
    setIsSubmittingReview(true);

    try {
      const { error: upsertError } = await supabase
        .from('reviews')
        .upsert(
          {
            reviewer_user_id: currentUserId,
            reviewed_user_id: reviewedUserId,
            rating: currentUserRating, // Use state value
            review_text: reviewText.trim() || null, // Send trimmed text or null
          },
          {
            onConflict: 'reviewer_user_id, reviewed_user_id',
          }
        );

      if (upsertError) {
        throw upsertError;
      }

      Toast.show({ type: 'success', text1: 'Review Submitted', text2: `Thank you for your feedback!` });

    } catch (submitError: any) {
      console.error('Error submitting review:', submitError);
      Toast.show({ type: 'error', text1: 'Submission Failed', text2: submitError.message || 'Could not submit review.' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // --- Render Logic ---

  if (loading) {
      return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centered}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        </SafeAreaView>
        );
  }
  if (error) {
      return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
                </TouchableOpacity>
                <View style={{width: 40}} />{/* Placeholder */}
            </View>
            <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            </View>
        </SafeAreaView>
        );
  }
  if (!profile) {
      // Should ideally be caught by error state, but as a fallback
      return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
                </TouchableOpacity>
                <View style={{width: 40}} />{/* Placeholder */}
            </View>
            <View style={styles.centered}>
            <Text style={styles.errorText}>Profile data unavailable.</Text>
            </View>
        </SafeAreaView>
        );
  }

  const name = profile.display_name || 'Anonymous';
  const avatarText = name.charAt(0).toUpperCase();
  // Provide a default fontSize for the calculation if typography.body.fontSize is undefined
  const defaultFontSize = 14;
  const storyLineHeight = (typography.body?.fontSize ?? defaultFontSize) * 1.5;

  // Determine if submit button should be enabled
  const canSubmit = currentUserRating > 0 && !isSubmittingReview && currentUserId !== reviewedUserId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}'s Profile</Text>
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShareProfile} style={styles.iconButton}>
            <Icon name="share-variant-outline" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopyName} style={styles.iconButton}>
            <Icon name="content-copy" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Profile Header */}
        <View style={styles.profileHeader}>
           {/* ... avatar, name, age ... */}
           <View style={styles.avatar}>
             <Text style={styles.avatarText}>{avatarText}</Text>
           </View>
           <Text style={styles.profileName}>{name}</Text>
           {profile?.aloneme_user_id && (
             <Text style={styles.profileId}>{profile.aloneme_user_id}</Text>
           )}
           {profile?.age && (
             <Text style={styles.profileAge}>{profile.age} years old</Text>
           )}
        </View>

        {/* Emotional Story Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Emotional Story</Text>
          <Text style={[styles.storyText, {lineHeight: storyLineHeight}]}>
            {profile.emotional_story || 'No story shared yet.'}
          </Text>
        </View>

        {/* Rating & Review Section */}
        <View style={styles.sectionContainer}>
           <Text style={styles.sectionTitle}>Leave a Review</Text>
           <Rating
             type='star'
             ratingCount={5}
             imageSize={35}
             showRating={false}
             startingValue={currentUserRating}
             onFinishRating={handleRatingChange}
             tintColor={themeColors.surface}
             style={styles.ratingStars}
             readonly={isSubmittingReview || currentUserId === reviewedUserId}
           />
           <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)..."
              placeholderTextColor={themeColors.textSecondary}
              multiline={true}
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              editable={!isSubmittingReview && currentUserId !== reviewedUserId}
              maxLength={500}
           />
           <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmitReviewAndRating}
              disabled={!canSubmit}
            >
              {isSubmittingReview ? (
                 <ActivityIndicator color={themeColors.background} size="small" />
               ) : (
                 <Text style={styles.submitButtonText}>Submit Review</Text>
               )}
            </TouchableOpacity>
        </View>

        {/* Add more sections for other details if fetched */}
        {profile?.gender?.toLowerCase() === 'female' && profile.total_hours_spent !== null && (
          <View style={styles.hoursContainer}>
            <Text style={styles.hoursLabel}>Hours Spent Listening</Text>
            <Text style={styles.hoursValue}>{profile.total_hours_spent.toFixed(1)}</Text>
          </View>
        )}

      </ScrollView>
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
    paddingHorizontal: spacing.xs, // Reduce horizontal padding for icons
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surface,
  },
  backButton: {
      padding: spacing.xs,
  },
  headerTitle: {
      ...typography.h3,
      color: themeColors.textPrimary,
      textAlign: 'center',
      flex: 1, 
      marginHorizontal: spacing.sm, 
  },
  headerActions: { // Container for right-side icons
     flexDirection: 'row',
     alignItems: 'center',
  },
  iconButton: { // Style for header action buttons
     padding: spacing.sm,
     marginLeft: spacing.xs,
  },
  scrollContainer: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 2,
  },
  profileHeader: {
      alignItems: 'center',
      marginBottom: spacing.xl,
  },
  avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
  },
  avatarText: {
      color: themeColors.primary,
      fontSize: 40,
      fontWeight: '600',
  },
  profileName: {
      ...typography.h2,
      color: themeColors.textPrimary,
      marginBottom: spacing.xs,
  },
  profileAge: {
      ...typography.body,
      color: themeColors.textSecondary,
      marginBottom: spacing.md,
  },
  sectionContainer: {
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.lg,
  },
  sectionTitle: {
      ...typography.h4,
      color: themeColors.textPrimary,
      marginBottom: spacing.sm,
  },
  storyText: {
    ...typography.body,
    color: themeColors.textSecondary,
    // lineHeight is now set dynamically in the component
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: themeColors.danger, // Use defined danger color
    ...typography.body,
    textAlign: 'center',
  },
  ratingStars: {
     paddingVertical: spacing.md,
     alignSelf: 'center',
     marginBottom: spacing.md,
  },
  reviewInput: {
     backgroundColor: themeColors.background,
     borderRadius: 6,
     padding: spacing.md,
     color: themeColors.textPrimary,
     textAlignVertical: 'top',
     minHeight: 80,
     marginBottom: spacing.md,
     borderWidth: 1,
     borderColor: '#444',
     fontSize: typography.body?.fontSize ?? 14,
  },
  submitButton: {
     backgroundColor: themeColors.primary,
     paddingVertical: spacing.md,
     borderRadius: 8,
     alignItems: 'center',
  },
  submitButtonDisabled: {
     backgroundColor: colors.disabled,
     opacity: 0.6,
  },
  submitButtonText: {
     ...typography.button,
     color: '#FFFFFF',
     fontWeight: '600',
  },
  profileId: {
    ...typography.body,
    color: themeColors.textSecondary,
    marginBottom: spacing.xs,
  },
  hoursContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  hoursValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default UserProfileDetailScreen; 