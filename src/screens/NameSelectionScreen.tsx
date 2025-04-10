import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {setUserProfile} from '../store/slices/authSlice';
import {updateUserPreferences} from '../redux/slices/userSlice';
import {supabase} from '../lib/supabase';
import Toast from 'react-native-toast-message';
import {colors, typography, spacing, commonStyles} from '../styles/common';
import {useUser} from '../hooks/useUser';

// List of girl names to randomly select from
const GIRL_NAMES = [
  'Aarohi', 'Aisha', 'Ananya', 'Anika', 'Anvi', 'Arya', 'Avni', 'Bhavya',
  'Chhavi', 'Dia', 'Diya', 'Esha', 'Ira', 'Ishani', 'Ishita', 'Kavya',
  'Kiara', 'Mahi', 'Meera', 'Misha', 'Myra', 'Navya', 'Nisha', 'Pari',
  'Prisha', 'Riya', 'Saanvi', 'Sara', 'Shreya', 'Siya', 'Tara', 'Trisha',
  'Vanya', 'Vedika', 'Vidhi', 'Yashvi', 'Zara', 'Zoya'
];

const NameSelectionScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [names, setNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useUser();
  
  const phoneNumber = useSelector((state: any) => {
    const fromProfile = state.auth?.userProfile?.phoneNumber;
    const fromVerification = state.auth?.verificationStatus?.phoneNumber;
    return fromProfile || fromVerification;
  });

  // Function to generate 12 unique random names
  const generateRandomNames = () => {
    const shuffled = [...GIRL_NAMES].sort(() => 0.5 - Math.random());
    setNames(shuffled.slice(0, 12));
  };

  useEffect(() => {
    generateRandomNames();
  }, []);

  const handleNameSelect = (name: string) => {
    setSelectedName(name);
  };

  const handleContinue = async () => {
    if (!selectedName) {
      return;
    }

    setIsLoading(true);
    try {
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get phone number from Supabase session if not in Redux
      let userPhoneNumber = phoneNumber;
      if (!userPhoneNumber) {
        const { data: { session } } = await supabase.auth.getSession();
        userPhoneNumber = session?.user?.phone || null;
      }

      if (!userPhoneNumber) {
        // Try to get phone from user preferences
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('phone_number')
          .eq('user_id', user.id)
          .single();
          
        userPhoneNumber = preferences?.phone_number;
      }

      if (!userPhoneNumber) {
        throw new Error('Please complete phone verification first');
      }

      // Update user preferences in Supabase
      const {error: supabaseError} = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          display_name: selectedName,
          onboarding_completed: true,
          phone_number: userPhoneNumber
        }, {
          onConflict: 'user_id'
        });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Update Redux store
      dispatch(updateUserPreferences({
        display_name: selectedName,
        onboarding_completed: true,
        phone_number: userPhoneNumber
      }));

      // Update auth state
      dispatch(setUserProfile({
        displayName: selectedName,
        onboardingCompleted: true,
        phoneNumber: userPhoneNumber
      }));

      // Navigate to next screen
      navigation.navigate('EducationSelection', {
        name: selectedName
      });
    } catch (error: any) {
      console.error('Error in handleContinue:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save name preference',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderNameItem = ({item}: {item: string}) => (
    <TouchableOpacity
      style={[
        styles.nameButton,
        selectedName === item && styles.nameButtonSelected,
      ]}
      onPress={() => handleNameSelect(item)}>
      <Text
        style={[
          styles.nameButtonText,
          selectedName === item && styles.nameButtonTextSelected,
        ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your Name</Text>
        <Text style={styles.subtitle}>
          Select a name that you like or generate new ones
        </Text>

        <View style={styles.namesContainer}>
          <FlatList
            data={names}
            renderItem={renderNameItem}
            keyExtractor={item => item}
            numColumns={3}
            contentContainerStyle={styles.namesList}
          />
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateRandomNames}
          disabled={isLoading}>
          <Text style={styles.generateButtonText}>Generate New Names</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedName || isLoading) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedName || isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
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
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  namesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  namesList: {
    paddingBottom: 16,
  },
  nameButton: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    minWidth: '31%',
  },
  nameButtonSelected: {
    backgroundColor: '#007AFF',
  },
  nameButtonText: {
    fontSize: 15,
    color: '#CCCCCC',
  },
  nameButtonTextSelected: {
    color: '#FFFFFF',
  },
  generateButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
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

export default NameSelectionScreen; 