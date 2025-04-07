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
} from 'react-native';
import type {RootStackScreenProps} from '../types/navigation';
import Toast from 'react-native-toast-message';

const MIN_CHARACTERS = 200;

const EmotionalStoryScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'EmotionalStory'>) => {
  const [story, setStory] = useState('');
  const inputRef = useRef(null);

  const handleContinue = () => {
    if (story.length < MIN_CHARACTERS) {
      Toast.show({
        type: 'error',
        text1: 'Story Too Short',
        text2: `Please write at least ${MIN_CHARACTERS} characters`,
      });
      return;
    }

    navigation.navigate('AnalyzingProfile', {
      name: route.params.name,
      education: route.params.education,
      story: story.trim(),
    });
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
                story.length < MIN_CHARACTERS && styles.continueButtonDisabled,
              ]}
              onPress={() => {
                if (story.length >= MIN_CHARACTERS) {
                  console.log('Button pressed, navigating...');
                  navigation.navigate('AnalyzingProfile', {
                    name: route.params.name,
                    education: route.params.education,
                    story: story.trim(),
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: 'Story Too Short',
                    text2: `Please write at least ${MIN_CHARACTERS} characters`,
                  });
                }
              }}
              activeOpacity={0.7}
              disabled={story.length < MIN_CHARACTERS}>
              <Text style={styles.continueButtonText}>Share Story</Text>
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