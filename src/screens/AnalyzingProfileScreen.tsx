import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setUserProfile, setAuthenticated, setOnboardingComplete} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import {colors, typography, spacing, commonStyles} from '../styles/common';
import {CommonActions} from '@react-navigation/native';

const AnalyzingProfileScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'AnalyzingProfile'>) => {
  const {name, education, story} = route.params;
  const dispatch = useDispatch();

  useEffect(() => {
    // Save the final profile information
    dispatch(
      setUserProfile({
        name,
        education,
        story,
      }),
    );

    // Simulate analysis delay
    const timer = setTimeout(() => {
      // Set user as authenticated and onboarding complete
      dispatch(setAuthenticated(true));
      dispatch(setOnboardingComplete(true));
      
      // Reset navigation and go to MainApp
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'MainApp' },
          ],
        })
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [dispatch, navigation, name, education, story]);

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Analyzing Your Profile</Text>
        <Text style={styles.subtitle}>
          Please wait while we process your information
        </Text>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Creating your personalized experience...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default AnalyzingProfileScreen; 