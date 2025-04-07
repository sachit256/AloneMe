import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setUserProfile} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import {colors, typography, spacing, commonStyles} from '../styles/common';

const PersonalInfoScreen = ({
  navigation,
}: RootStackScreenProps<'PersonalInfo'>) => {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [age, setAge] = useState<number>(0);
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

  const handleContinue = () => {
    if (selectedGender) {
      // Save gender and DOB information
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
            !selectedGender && commonStyles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedGender}>
          <Text style={commonStyles.buttonText}>Continue</Text>
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