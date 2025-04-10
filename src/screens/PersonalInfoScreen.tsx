import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setUserProfile} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import {colors, typography, spacing, commonStyles} from '../styles/common';
import {updateUserPreferences} from '../lib/userPreferences';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';

const PersonalInfoScreen = ({
  navigation,
}: RootStackScreenProps<'PersonalInfo'>) => {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [age, setAge] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    
    return calculatedAge;
  };

  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      const calculatedAge = calculateAge(selectedDate);
      setAge(calculatedAge);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleContinue = async () => {
    if (selectedGender && age >= 18) {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('No authenticated user found');
        }

        // Update user preferences in Supabase
        const { success, error } = await updateUserPreferences(user.id, {
          gender: selectedGender,
          date_of_birth: dateOfBirth.toISOString(),
          age: age,
        });

        if (!success) {
          throw new Error(error?.message || 'Failed to save personal information');
        }

        // Save to Redux state
        dispatch(
          setUserProfile({
            gender: selectedGender,
            dateOfBirth: dateOfBirth.toISOString(),
            age: age,
          }),
        );
        
        // Navigate to human verification with required params
        navigation.navigate('HumanVerification', {
          gender: selectedGender,
          dateOfBirth: dateOfBirth.toISOString(),
          age: age,
        });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to save personal information',
        });
        console.error('Error saving personal information:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (age < 18) {
      Toast.show({
        type: 'error',
        text1: 'Age Restriction',
        text2: 'You must be 18 or older to use this app',
      });
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>
          Help us personalize your experience
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your Gender</Text>
          <View style={styles.genderContainer}>
            {['Male', 'Female', 'Other'].map(gender => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton,
                  selectedGender === gender && styles.genderButtonSelected,
                ]}
                onPress={() => handleGenderSelect(gender)}>
                <Text
                  style={[
                    styles.genderButtonText,
                    selectedGender === gender && styles.genderButtonTextSelected,
                  ]}>
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={showDatepicker}>
            <Text style={styles.dateButtonText}>
              {dateOfBirth.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {age > 0 && (
            <Text style={styles.ageText}>
              You are {age} years old
            </Text>
          )}
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={dateOfBirth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              textColor={colors.text.primary}
            />
          )}
        </View>

        <TouchableOpacity
          style={[
            commonStyles.button,
            (!selectedGender || isLoading) && commonStyles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedGender || isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={commonStyles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  genderButtonSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  genderButtonText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  genderButtonTextSelected: {
    color: colors.primary,
  },
  dateButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  dateButtonText: {
    ...typography.body,
    color: colors.text.primary,
  },
  ageText: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default PersonalInfoScreen; 