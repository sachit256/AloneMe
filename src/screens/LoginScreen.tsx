import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useDispatch} from 'react-redux';
import type {RootStackScreenProps} from '../types/navigation';
import {setVerificationStatus} from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';
import {colors, typography, spacing, commonStyles} from '../styles/common';

const LoginScreen = ({navigation}: RootStackScreenProps<'Login'>) => {
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const dispatch = useDispatch();

  const handleContinue = () => {
    if (phoneNumberInput.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid phone number',
      });
      return;
    }

    // Dispatch phone number to Redux store
    dispatch(
      setVerificationStatus({
        isVerified: false,
        phoneNumber: phoneNumberInput,
      }),
    );

    Toast.show({
      type: 'success',
      text1: 'OTP Sent',
      text2: 'Please check your phone for the verification code',
    });
    
    navigation.navigate('OTP', {
      phoneNumber: phoneNumberInput,
    });
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to continue
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.text.placeholder}
                keyboardType="number-pad"
                value={phoneNumberInput}
                onChangeText={setPhoneNumberInput}
                maxLength={10}
              />
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              commonStyles.button,
              phoneNumberInput.length < 10 && commonStyles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={phoneNumberInput.length < 10}>
            <Text style={commonStyles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xl * 2,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
  },
  prefix: {
    ...typography.body,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
});

export default LoginScreen; 