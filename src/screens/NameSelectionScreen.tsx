import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

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
  const [names, setNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);

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

  const handleContinue = () => {
    if (!selectedName) {
      return;
    }
    navigation.navigate('EducationSelection', {name: selectedName});
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
          onPress={generateRandomNames}>
          <Text style={styles.generateButtonText}>Generate New Names</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedName && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedName}>
          <Text style={styles.continueButtonText}>Continue</Text>
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