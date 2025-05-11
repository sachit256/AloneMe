import React, { useEffect } from 'react';
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

const PrivacyPolicyScreen = ({ navigation }: RootStackScreenProps<'PrivacyPolicy'>) => {
  useEffect(() => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }
    return () => {
      if (parentNav) {
        parentNav.setOptions({
          tabBarStyle: { display: 'flex' },
        });
      }
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.text}>
            We collect information that you provide directly to us, including your name, email address, phone number, and other profile information. We also collect usage data and device information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.text}>
            We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure platform safety and security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.text}>
            We do not sell your personal information. We may share your information with other users as part of the service, and with service providers who assist in operating our platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.text}>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.text}>
            You have the right to access, correct, or delete your personal information. You can also opt out of certain data collection and use.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.text}>
            We retain your information for as long as necessary to provide our services and comply with legal obligations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.text}>
            Our services are not intended for users under 18 years of age. We do not knowingly collect information from children.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to Privacy Policy</Text>
          <Text style={styles.text}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
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

export default PrivacyPolicyScreen; 