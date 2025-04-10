import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {updateUserPreferences} from '../redux/slices/userSlice';
import type {RootStackScreenProps} from '../types/navigation';
import {colors, typography, spacing, commonStyles} from '../styles/common';
import Toast from 'react-native-toast-message';
import {supabase} from '../lib/supabase';
import {useUser} from '../hooks/useUser';

interface Language {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: 'https://images.unsplash.com/photo-1559503061-a2f8138865d1?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: 'https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?w=800&auto=format&fit=crop&q=60',
  },
];

const LanguageSelectionScreen = ({
  navigation,
}: RootStackScreenProps<'LanguageSelection'>) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const {user, preferences} = useUser();

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
  };

  const handleContinue = async () => {
    if (!selectedLanguage || !user) {
      return;
    }

    setIsLoading(true);
    try {
      // First check if a record exists
      const {data: existingPrefs, error: fetchError} = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(fetchError.message);
      }

      let supabaseError;
      if (existingPrefs) {
        // Update existing record
        const {error} = await supabase
          .from('user_preferences')
          .update({
            preferred_language: selectedLanguage,
          })
          .eq('user_id', user.id);
        supabaseError = error;
      } else {
        // Insert new record
        const {error} = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preferred_language: selectedLanguage,
            phone_number: preferences.phone_number,
          });
        supabaseError = error;
      }

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Update Redux store
      dispatch(updateUserPreferences({
        preferred_language: selectedLanguage,
      }));

      // Navigate to next screen
      navigation.navigate('PersonalInfo');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save language preference',
      });
      console.error('Error saving language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>
          Select the language you're most comfortable with
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {languages.map(language => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageCard,
                selectedLanguage === language.id && styles.selectedCard,
              ]}
              onPress={() => handleLanguageSelect(language.id)}
              disabled={isLoading}>
              <View style={styles.cardContent}>
                <Image
                  source={{uri: language.flag}}
                  style={styles.languageImage}
                />
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.nativeName}>{language.nativeName}</Text>
                </View>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedLanguage === language.id && styles.radioOuterSelected,
                    ]}>
                    {selectedLanguage === language.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            commonStyles.button,
            (!selectedLanguage || isLoading) && commonStyles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedLanguage || isLoading}>
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
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  languageCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  languageInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  languageName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  nativeName: {
    ...typography.subtitle,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  radioContainer: {
    marginLeft: spacing.md,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
});

export default LanguageSelectionScreen; 