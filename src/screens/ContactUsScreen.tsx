import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackScreenProps } from '../types/navigation';
import { supabase } from '../lib/supabase';

const ContactUsScreen = ({ navigation }: RootStackScreenProps<'ContactUs'>) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          subject: subject.trim(),
          message: message.trim(),
        });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your message has been sent. We will get back to you soon.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.text}>
            Have a question or concern? We're here to help. Send us a message and we'll respond as soon as possible.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter subject"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here..."
            placeholderTextColor="#888"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!subject.trim() || !message.trim() || isSending) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!subject.trim() || !message.trim() || isSending}
          >
            <Text style={styles.submitButtonText}>
              {isSending ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alternativeSection}>
          <Text style={styles.sectionTitle}>Other Ways to Reach Us</Text>
          
          <TouchableOpacity style={styles.contactOption}>
            <Icon name="email-outline" size={24} color="#00BFA6" />
            <View style={styles.contactOptionText}>
              <Text style={styles.contactOptionTitle}>Email</Text>
              <Text style={styles.contactOptionValue}>support@aloneme.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactOption}>
            <Icon name="phone-outline" size={24} color="#00BFA6" />
            <View style={styles.contactOptionText}>
              <Text style={styles.contactOptionTitle}>Phone</Text>
              <Text style={styles.contactOptionValue}>+1 (555) 123-4567</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactOption}>
            <Icon name="map-marker-outline" size={24} color="#00BFA6" />
            <View style={styles.contactOptionText}>
              <Text style={styles.contactOptionTitle}>Address</Text>
              <Text style={styles.contactOptionValue}>123 Support Street, Help City, 12345</Text>
            </View>
          </TouchableOpacity>
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
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#00BFA6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativeSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00BFA6',
    marginBottom: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  contactOptionText: {
    marginLeft: 16,
  },
  contactOptionTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  contactOptionValue: {
    fontSize: 14,
    color: '#888',
  },
});

export default ContactUsScreen; 