import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackScreenProps } from '../types/navigation';

const TermsOfServiceScreen = ({ navigation }: RootStackScreenProps<'TermsOfService'>) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing and using the AloneMe application, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. User Eligibility</Text>
          <Text style={styles.text}>
            You must be at least 18 years old to use AloneMe. By using the service, you represent and warrant that you are at least 18 years old.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Conduct</Text>
          <Text style={styles.text}>
            Users are expected to maintain respectful and appropriate behavior. Harassment, hate speech, or any form of abuse will not be tolerated.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Privacy</Text>
          <Text style={styles.text}>
            Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Service Modifications</Text>
          <Text style={styles.text}>
            We reserve the right to modify or discontinue the service at any time without notice. We shall not be liable to you or any third party.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Termination</Text>
          <Text style={styles.text}>
            We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.text}>
            The AloneMe application and its original content, features, and functionality are owned by AloneMe and are protected by international copyright laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact</Text>
          <Text style={styles.text}>
            If you have any questions about these Terms, please contact us through the provided channels in the app.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: March 2024</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00BFA6',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
});

export default TermsOfServiceScreen; 