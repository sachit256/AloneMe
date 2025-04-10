import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setUserProfile} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import {colors, typography, spacing, commonStyles} from '../styles/common';
import {updateUserPreferences} from '../lib/userPreferences';
import {supabase} from '../lib/supabase';
import Toast from 'react-native-toast-message';

interface EducationGroup {
  title: string;
  options: string[];
}

const EDUCATION_GROUPS: EducationGroup[] = [
  {
    title: 'School Education',
    options: ['High School', 'Intermediate'],
  },
  {
    title: 'Undergraduate',
    options: ['Diploma', 'BTech', 'BSc', 'BA', 'BCom'],
  },
  {
    title: 'Postgraduate',
    options: ['MBA', 'MTech', 'MSc', 'MA'],
  },
  {
    title: 'Research',
    options: ['PhD', 'Other'],
  },
];

const EducationSelectionScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'EducationSelection'>) => {
  const [selectedEducation, setSelectedEducation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  
  // Get phone number from Redux state
  const phoneNumber = useSelector((state: any) => {
    const fromProfile = state.auth.userProfile.phoneNumber;
    const fromVerification = state.auth.verificationStatus.phoneNumber;
    return fromProfile || fromVerification;
  });

  const handleEducationSelect = (education: string) => {
    setSelectedEducation(education);
  };

  const handleContinue = async () => {
    if (!selectedEducation) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting education selection with phone:', phoneNumber);
      
      const {
        data: {user},
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('Got Supabase user:', user);

      // Get phone number from Supabase session if not in Redux
      let userPhoneNumber = phoneNumber;
      if (!userPhoneNumber) {
        const { data: { session } } = await supabase.auth.getSession();
        userPhoneNumber = session?.user?.phone || null;
        console.log('Phone from session:', {
          sessionPhone: session?.user?.phone,
          session: session
        });
      }

      if (!userPhoneNumber) {
        // Try to get phone from user preferences
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('phone_number')
          .eq('user_id', user.id)
          .single();
          
        userPhoneNumber = preferences?.phone_number;
        console.log('Phone from preferences:', {
          preferencesPhone: preferences?.phone_number,
          preferences: preferences
        });
      }

      if (!userPhoneNumber) {
        throw new Error('Please complete phone verification first');
      }

      console.log('Using phone number:', userPhoneNumber);

      // Update user preferences in Supabase
      const {success, error, data} = await updateUserPreferences(
        user.id,
        {
          education: selectedEducation,
          phone_number: userPhoneNumber
        },
        userPhoneNumber
      );

      console.log('Update preferences result:', {success, error, data});

      if (!success) {
        throw new Error(error?.message || 'Failed to save education preference');
      }

      // Save to Redux state
      dispatch(setUserProfile({
        education: selectedEducation,
        phoneNumber: userPhoneNumber
      }));

      // Navigate to next screen
      navigation.navigate('EmotionalStory', {
        name: route.params?.name,
        education: selectedEducation,
      });
    } catch (error: any) {
      console.error('Error in handleContinue:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save education preference',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Education Level</Text>
        <Text style={styles.subtitle}>
          Choose your highest level of education
        </Text>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          {EDUCATION_GROUPS.map((group, index) => (
            <View 
              key={group.title} 
              style={[
                styles.groupContainer,
                index === 0 && styles.firstGroup,
              ]}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.optionsGrid}>
                {group.options.map(education => (
                  <TouchableOpacity
                    key={education}
                    style={[
                      styles.optionButton,
                      selectedEducation === education && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleEducationSelect(education)}>
                    <Text
                      style={[
                        styles.optionButtonText,
                        selectedEducation === education && styles.optionButtonTextSelected,
                      ]}>
                      {education}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              commonStyles.button,
              (!selectedEducation || isLoading) && commonStyles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedEducation || isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={commonStyles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  groupContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  firstGroup: {
    borderTopWidth: 0,
  },
  groupTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  optionButton: {
    width: '48%',
    marginHorizontal: '1%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  optionButtonSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  optionButtonText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  optionButtonTextSelected: {
    color: colors.primary,
  },
  bottomContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
});

export default EducationSelectionScreen; 