import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setUserProfile} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import {colors, typography, spacing, commonStyles} from '../styles/common';

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
  const dispatch = useDispatch();

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      // Save selected language to Redux state
      dispatch(setUserProfile({language: selectedLanguage}));
      // Continue to personal info
      navigation.navigate('PersonalInfo');
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
              onPress={() => handleLanguageSelect(language.id)}>
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
            !selectedLanguage && commonStyles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedLanguage}>
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