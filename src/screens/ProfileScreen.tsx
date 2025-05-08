import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, /* SafeAreaView, */ ScrollView, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native'; // Import Platform
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // Import from library
import { RootStackScreenProps } from '../types/navigation';
import { supabase } from '../lib/supabase'; // Import Supabase client

// Interfaces for fetched data - adjust to your Supabase schema
interface UserProfileDBData {
  display_name: string;
  date_of_birth?: string | null; 
  preferred_language?: string | null;
  gender?: string | null;
}


interface ServiceChargeDBItem {
  id: string | number; // Primary key of the service_charges table
  service_name: string;
  charge_per_min: number;
}

// Helper to calculate age from date_of_birth string
function calculateAge(dobString?: string | null): number | undefined {
  if (!dobString) return undefined;
  try {
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : undefined;
  } catch (e) {
    console.error("Error calculating age:", e);
    return undefined;
  }
}

// Helper to get initials from a name
function getInitials(name?: string | null): string {
  if (!name) return '';
  const nameParts = name.trim().split(' ');
  if (nameParts.length === 1 && nameParts[0].length > 0) {
    return nameParts[0].substring(0, Math.min(2, nameParts[0].length)).toUpperCase();
  }
  if (nameParts.length > 1 && nameParts[0].length > 0 && nameParts[nameParts.length -1].length > 0) {
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  }
  if (nameParts.length > 0 && nameParts[0].length > 0) {
    return nameParts[0][0].toUpperCase();
  }
  return '';
}

type Props = RootStackScreenProps<'Profile'>;

async function fetchUserProfileFromDB(userId: string): Promise<UserProfileDBData> {
  console.log(`Fetching Supabase profile for userId: ${userId}`);
  const { data, error } = await supabase
    .from('user_preferences')
    .select('display_name, date_of_birth, preferred_language, gender')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile from Supabase:', error);
    if (error.code === 'PGRST116') { 
        throw new Error('User profile not found.');
    }
    throw error;
  }
  if (!data) throw new Error('User profile not found.');
  return data as UserProfileDBData;
}


async function fetchServiceChargesFromDB(): Promise<ServiceChargeDBItem[]> {
  console.log("Fetching Supabase service charges");
  const { data, error } = await supabase
    .from('service_charges') 
    .select('id, service_name, charge_per_min');

  if (error) {
    console.error('Error fetching service charges from Supabase:', error);
    throw error;
  }
  console.log('Fetched service charges:', data);
  return data || [];
}

const ProfileScreen = ({ route, navigation }: Props) => {
  const { userId } = route.params;
  const insets = useSafeAreaInsets(); // Get safe area insets

  const [userProfile, setUserProfile] = useState<UserProfileDBData | null>(null);
  const [userAge, setUserAge] = useState<number | undefined>(undefined);
  const [userLanguages, setUserLanguages] = useState<String | undefined | null>(null);
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeDBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, chargesData] = await Promise.all([
        fetchUserProfileFromDB(userId),
        fetchServiceChargesFromDB(),
      ]);

      setUserProfile(profileData);
      setUserAge(calculateAge(profileData.date_of_birth));
      setUserLanguages(profileData.preferred_language);
      
      setServiceCharges(chargesData);
      console.log('Service charges state updated:', chargesData);

    } catch (err: any) {
      console.error("Failed to load profile data from Supabase:", err);
      const errorMessage = err.message || "An unexpected error occurred while fetching profile data.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['bottom', 'left', 'right']}>
        <ActivityIndicator size="large" color="#00BFA6" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['bottom', 'left', 'right']}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['bottom', 'left', 'right']}>
        <Text style={styles.errorText}>User profile information is not available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
       <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={[styles.backButton, { top: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}
       >
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.headerContainer}>
          <View style={[styles.avatar, styles.avatarPlaceholder, styles.avatarRedesigned]}>
            <Text style={styles.avatarPlaceholderText}>{getInitials(userProfile.display_name)}</Text>
          </View>
          <Text style={styles.nameRedesigned}>{userProfile.display_name || 'User'}</Text>
          <View style={styles.pillsRow}>
            {userProfile.gender && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{userProfile.gender}</Text>
              </View>
            )}
            {userAge !== undefined && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{`Age: ${userAge}`}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          {userLanguages ? (
              <Text style={styles.listItem}>{userLanguages}</Text>
          ) : (
            <Text style={styles.emptyStateText}>No preferred language specified.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Charges</Text>
          {serviceCharges.length > 0 ? (
            serviceCharges.map((charge) => (
              <View key={charge.id} style={styles.chargeItem}>
                <Text style={styles.chargeText}>{charge.service_name}:</Text>
                <Text style={styles.chargeValue}>{`₹${charge.charge_per_min} / min`}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyStateText}>Service charges not available.</Text>
          )}
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
  scrollContentContainer: { 
    // paddingTop: 40, // Removed: SafeAreaView with edges prop or insets.top for backButton handles top spacing
  },
  backButton: {
    position: 'absolute',
    // top: 10, // Dynamically set using insets.top
    left: 10,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 22, 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    marginTop: 40, // Added marginTop to give space for the absolute back button
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#333333',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#404040',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 36, 
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  age: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  gender: {
    fontSize: 16,
    color: '#888888',
    marginTop: 2,
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
  listItem: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  chargeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  chargeText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  chargeValue: {
    fontSize: 16,
    color: '#00BFA6',
    fontWeight: 'bold',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 10,
  },
  avatarRedesigned: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00BFA6',
    shadowColor: '#00BFA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 18,
  },
  nameRedesigned: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 2,
  },
  pill: {
    backgroundColor: '#00BFA6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  pillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default ProfileScreen; 