import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import {RootStackScreenProps} from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

const VerificationScreen = ({navigation}: RootStackScreenProps<'Verification'>) => {
  const handleVerifyNow = () => {
    navigation.navigate('IdentityVerification');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Benefits</Text>
          
          <View style={styles.badgeContainer}>
            <View style={styles.checkmark}>
              <Icon name="check" size={40} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Icon name="account-group-outline" size={24} color="#00BFA6" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>5x more Users</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="cash-multiple" size={24} color="#00BFA6" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>3x more Earning</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="shield-check-outline" size={24} color="#00BFA6" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>Get Verified Badge</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>Verify in 3 easy steps</Text>

          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={handleVerifyNow}>
            <Text style={styles.verifyButtonText}>Verify Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  badgeContainer: {
    marginBottom: 40,
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00BFA6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitsContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 40,
  },
  benefitItem: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    marginRight: 15,
  },
  benefitText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 25,
  },
  verifyButton: {
    width: width - 40,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00BFA6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#00BFA6',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

export default VerificationScreen; 