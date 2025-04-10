import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import type {RootStackScreenProps} from '../types/navigation';
import Toast from 'react-native-toast-message';
import {supabase} from '../lib/supabase';
import {useDispatch} from 'react-redux';
import {updateUserPreferences} from '../redux/slices/userSlice';
import {useUser} from '../hooks/useUser';
import {CommonActions} from '@react-navigation/native';

const MIN_CHARACTERS = 200;
const CONNECTIVITY_CHECK_URL = 'https://www.google.com';

const EmotionalStoryScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'EmotionalStory'>) => {
  const [story, setStory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const {user, preferences} = useUser();

  const checkNetworkConnectivity = async () => {
    try {
      const response = await fetch(CONNECTIVITY_CHECK_URL, {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const saveStoryToSupabase = async () => {
    try {
      const dataToSave = {
        display_name: route.params.name,
        education: route.params.education,
        emotional_story: story,
        onboarding_completed: true,
        user_id: user?.id,
        preferred_language: preferences?.preferred_language,
        phone_number: preferences?.phone_number,
      };

      console.log('Attempting to save story with data:', dataToSave);

      // First try to update
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update(dataToSave)
        .eq('user_id', user?.id);

      if (updateError) {
        console.log('Update failed, attempting insert:', updateError);
        // If update fails, try insert
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert([dataToSave]);

        if (insertError) {
          console.error('Insert also failed:', insertError);
          throw insertError;
        }
      }

      // Update Redux store
      dispatch(updateUserPreferences({
        ...preferences,
        display_name: route.params.name,
        education: route.params.education,
        emotional_story: story,
        onboarding_completed: true,
      }));

      Toast.show({
        type: 'success',
        text1: 'Story saved successfully',
        position: 'bottom',
      });

      // Navigate to main app after successful save
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        })
      );

    } catch (error) {
      console.error('Error saving story:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save story',
        text2: error instanceof Error ? error.message : 'Please try again',
        position: 'bottom',
      });
    }
  };

  const handleContinue = async () => {
    if (isSubmitting) return;

    if (story.length < MIN_CHARACTERS) {
      Toast.show({
        type: 'error',
        text1: 'Story Too Short',
        text2: `Please write at least ${MIN_CHARACTERS} characters to help us understand your situation better.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'No Internet Connection',
          text2: 'Please check your internet connection and try again.',
        });
        return;
      }

      // Save to Supabase
      await saveStoryToSupabase();
    } catch (error: any) {
      console.error('Full error details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = Math.max(0, MIN_CHARACTERS - story.length);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.greeting}>Hi {route.params.name},</Text>
            <Text style={styles.title}>
              Please Share your Story of Emotionally hard time.
            </Text>
            <Text style={styles.subtitle}>
              Your story should be at least {MIN_CHARACTERS} characters long.
            </Text>

            <View style={styles.storyContainer}>
              <TextInput
                ref={inputRef}
                style={styles.storyInput}
                multiline
                placeholder="Share your story here..."
                placeholderTextColor="#666666"
                value={story}
                onChangeText={setStory}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            {remainingChars > 0 && (
              <Text style={styles.characterCount}>
                {remainingChars} more characters needed
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.continueButton,
                (story.length < MIN_CHARACTERS || isSubmitting) && styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              activeOpacity={0.7}
              disabled={story.length < MIN_CHARACTERS || isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>Share Story</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  storyContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    minHeight: 250,
    marginBottom: 12,
  },
  storyInput: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 230,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'right',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueButtonDisabled: {
    backgroundColor: '#333333',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmotionalStoryScreen; 