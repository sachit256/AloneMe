import type {UserPreferences} from '../redux/slices/userSlice';

export const getNextOnboardingScreen = (preferences: UserPreferences | null) => {
  if (!preferences) {
    return {screen: 'Login'};
  }

  // If onboarding is completed, always return MainApp
  if (preferences.onboarding_completed) {
    console.log('Onboarding completed, returning MainApp');
    return {screen: 'MainApp'};
  }

  // Check if all required fields are present
  const hasAllRequiredFields = 
    preferences.phone_number &&
    preferences.preferred_language &&
    preferences.display_name &&
    preferences.education &&
    preferences.emotional_story;

  // If all required fields are present, mark onboarding as completed
  if (hasAllRequiredFields) {
    console.log('All required fields present, returning MainApp');
    return {screen: 'MainApp'};
  }

  // Check each step in sequence
  if (!preferences.phone_number) {
    return {screen: 'Login'};
  }

  if (!preferences.preferred_language) {
    return {screen: 'LanguageSelection'};
  }

  if (!preferences.display_name) {
    return {screen: 'NameSelection'};
  }

  if (!preferences.education) {
    return {screen: 'EducationSelection', params: {name: preferences.display_name}};
  }

  if (!preferences.emotional_story) {
    return {
      screen: 'EmotionalStory',
      params: {
        name: preferences.display_name,
        education: preferences.education,
      },
    };
  }

  // Default to MainApp if we can't determine the state
  return {screen: 'MainApp'};
}; 