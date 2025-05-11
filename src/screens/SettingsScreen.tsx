import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SettingsStackScreenProps, RootStackParamList } from '../types/navigation';
import { useDispatch } from 'react-redux';
import { resetAuth } from '../store/slices/authSlice';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../hooks/useUser';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Type for the root stack navigation prop
type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsScreen = ({ navigation }: SettingsStackScreenProps<'SettingsScreen'>) => {
  const dispatch = useDispatch();
  const rootNavigation = useNavigation<RootStackNavigationProp>();
  const { user } = useUser();

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(resetAuth());
            // Use rootNavigation for resetting to Welcome, assuming Welcome is in RootStack
            rootNavigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              })
            );
          },
        },
      ]
    );
  };

  const renderSettingItem = (title: string, subtitle?: string, onPress?: () => void) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.chevron}>{onPress ? '›' : ''}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {renderSettingItem('Profile', 'Manage your profile information', () => {
            if (user?.id) {
              rootNavigation.navigate('Profile', { userId: user.id });
            } else {
              Alert.alert("Error", "User information not available.");
              console.log("User ID not available to navigate to Profile");
            }
          })}
          {renderSettingItem('Verification', 'Get verified badge', () => { /* TODO: Navigate to Verification */ })}
          {renderSettingItem('Privacy', 'Control your privacy settings', () => { /* Navigate to Privacy */ })}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {renderSettingItem('Notifications', undefined, () => { /* Navigate to Notifications */ })}
          {renderSettingItem('Language', undefined, () => { /* Navigate to Language */ })}
          {renderSettingItem('Theme', undefined, () => { /* Navigate to Theme */ })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Support</Text>
          {renderSettingItem('Terms of Service', undefined, () => rootNavigation.navigate('TermsOfService'))}
          {renderSettingItem('Privacy Policy', undefined, () => rootNavigation.navigate('PrivacyPolicy'))}
          {renderSettingItem('Contact Us', undefined, () => rootNavigation.navigate('ContactUs'))}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingItem, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFA6',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  chevron: {
    fontSize: 20,
    color: '#888',
  },
  logoutButton: {
    backgroundColor: '#B71C1C40',
    borderColor: '#B71C1C',
    borderWidth: 1,
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FF5252',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SettingsScreen; 