import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setUserProfile, setOnboardingComplete} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import {colors, typography, spacing, commonStyles} from '../styles/common';

interface UserProfile {
  name: string;
  age: number;
  bio?: string;
  language?: string;
}

const ProfileSetupScreen = ({
  navigation,
}: RootStackScreenProps<'ProfileSetup'>) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const dispatch = useDispatch();

  const handleContinue = () => {
    if (name.trim() && age.trim()) {
      // Save profile information
      const profile: UserProfile = {
        name: name.trim(),
        age: parseInt(age, 10),
      };
      if (bio.trim()) {
        profile.bio = bio.trim();
      }
      dispatch(setUserProfile(profile));
      // Mark onboarding as complete
      dispatch(setOnboardingComplete(true));
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{name: 'MainApp'}],
      });
    }
  };

  const isValid = name.trim().length > 0 && age.trim().length > 0;

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>
            Tell us a little about yourself to get started
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={colors.text.tertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor={colors.text.tertiary}
              value={age}
              onChangeText={text => {
                // Only allow numbers
                const numericValue = text.replace(/[^0-9]/g, '');
                setAge(numericValue);
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio (Optional)</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.text.tertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            commonStyles.button,
            !isValid && commonStyles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isValid}>
          <Text style={commonStyles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
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
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text.primary,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  bioInput: {
    height: 120,
    paddingTop: spacing.md,
  },
});

export default ProfileSetupScreen; 