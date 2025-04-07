import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import type {RootStackScreenProps} from '../types/navigation';
import {colors, typography, spacing, commonStyles} from '../styles/common';

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

  const handleEducationSelect = (education: string) => {
    setSelectedEducation(education);
  };

  const handleContinue = () => {
    if (!selectedEducation) {
      return;
    }
    navigation.navigate('EmotionalStory', {
      name: route.params?.name,
      education: selectedEducation,
    });
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
              !selectedEducation && commonStyles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedEducation}>
            <Text style={commonStyles.buttonText}>Continue</Text>
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