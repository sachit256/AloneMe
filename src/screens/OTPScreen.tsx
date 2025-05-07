import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setVerificationStatus, setAuthenticated, setUserProfile} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import Toast from 'react-native-toast-message';
import {colors, typography, spacing, commonStyles} from '../styles/common';
import { verifyOTP, signInWithPhone } from '../lib/supabase';
import { createUserPreferences } from '../lib/userPreferences';
import { supabase } from '../lib/supabase';

const OTP_LENGTH = 6;

const OTPScreen = ({route, navigation}: RootStackScreenProps<'OTP'>) => {
  const {phoneNumber} = route.params;
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow single digit numeric input
    const digit = value.slice(-1).replace(/[^0-9]/g, '');
    if (!digit && value !== '') {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Move to next input if we have a digit
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace') {
      const newOtp = [...otp];
      
      // Clear current input if it has a value
      if (newOtp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
        return;
      }
      
      // Move to previous input if current is empty
      if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    console.log('OTP array:', otp);
    console.log('OTP string:', otpString);
    console.log('OTP length:', otpString.length);

    // Validate we have exactly 6 digits
    if (otpString.length !== 6 || !otp.every(digit => digit !== '')) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter all 6 digits' + otpString +" "+ otp,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call the actual Supabase verifyOTP function
      const { success, error, session } = await verifyOTP(phoneNumber, otpString);

      if (success && session) {
        console.log('OTP Verified Successfully. Session:', session);

        // --- Check if preferences already exist --- START ---
        console.log(`Checking for preferences for user_id: ${session.user.id}`); // Log the ID being checked
        const { data: existingPrefs, error: checkError } = await supabase
          .from('user_preferences')
          .select('id') // Select a minimal column just to check existence
          .eq('user_id', session.user.id)
          .maybeSingle(); // Use maybeSingle() - returns null if not found, doesn't error

        if (checkError) {
            console.error('Error checking for existing user preferences:', checkError.message);
             Toast.show({ type: 'error', text1: 'Error', text2: 'Could not verify profile status.' });
             // Potentially return or throw to stop flow if this check fails critically
        }

        console.log('Result of preference check:', { existingPrefs }); // Log the result

        // If preferences DON'T exist, create them
        if (!existingPrefs) {
             console.log('No existing preferences found for user, attempting to create...');
             const { success: prefSuccess, error: prefError } = await createUserPreferences({
                 user_id: session.user.id,
                 phone_number: phoneNumber,
                 onboarding_completed: false
             });

             if (!prefSuccess) {
                 // This is critical if creation fails
                 console.error('Critical: Failed to create user preferences:', prefError?.message || prefError);
                 Toast.show({
                     type: 'error',
                     text1: 'Account Setup Failed',
                     text2: 'Could not create user profile. Please try logging in again.',
                     visibilityTime: 4000
                 });
                 return; // Stop if we couldn't create essential profile
             } else {
                  console.log('User preferences created successfully.');
             }
        } else {
             console.log('Existing user preferences found. Skipping creation.');
             // Preferences already exist, no need to create.
        }
         // --- Check if preferences already exist --- END ---

        // --- Proceed with Redux dispatch and navigation --- START ---
        // This block now runs whether prefs were just created or already existed
        dispatch(setAuthenticated(true));
        dispatch(
          setVerificationStatus({
            isVerified: true,
            phoneNumber: phoneNumber,
          }),
        );
        dispatch(
          setUserProfile({
            // Set phone number and potentially other details from session if available
            phoneNumber: phoneNumber,
            // Example: You might get email from session.user.email etc.
          }),
        );

        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Phone number verified successfully',
        });

        // Navigate to the next screen in the onboarding flow
        navigation.navigate('LanguageSelection');

      } else {
        // Verification failed
        console.error('OTP Verification Failed:', error);

        // Check for specific errors like expired token
        const isTokenExpired = error?.toLowerCase().includes('expired') ||
                             error?.toLowerCase().includes('invalid token') ||
                             error?.toLowerCase().includes('not found'); // Include "token not found"

        if (isTokenExpired) {
          Toast.show({
            type: 'error',
            text1: 'Session Issue',
            text2: 'Verification session expired or invalid. Please request a new OTP.',
          });
          // Reset timer to allow immediate resend
          setTimer(0);
        } else {
          // Generic verification failure
          Toast.show({
            type: 'error',
            text1: 'Verification Failed',
            text2: error || 'Invalid OTP. Please try again.',
          });
        }

        // Clear OTP input on failure
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
       // Catch unexpected errors during the process
      console.error('Unexpected Error during OTP verification:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'An unexpected error occurred.',
      });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    setIsLoading(true);
    try {
      const { success, error } = await signInWithPhone(phoneNumber);
      
      if (success) {
        setTimer(30);
        setOtp(['', '', '', '', '', '']);
        Toast.show({
          type: 'success',
          text1: 'OTP Resent',
          text2: 'Please check your phone for the new code',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to resend OTP',
          text2: error || 'Please try again',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to resend OTP. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to {phoneNumber}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  isLoading && styles.otpInputDisabled
                ]}
                value={digit}
                onChangeText={value => handleOtpChange(value, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={index === 0}
                selectTextOnFocus
                editable={!isLoading}
                returnKeyType="next"
                blurOnSubmit={false}
                contextMenuHidden={true}
                textContentType="oneTimeCode"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!otp.every(d => d !== '') || isLoading) && styles.submitButtonDisabled
            ]}
            onPress={handleVerifyOTP}
            disabled={!otp.every(d => d !== '') || isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resendButton,
              (timer > 0 || isLoading) && styles.resendButtonDisabled
            ]}
            onPress={handleResendOTP}
            disabled={timer > 0 || isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.resendButtonText,
                  timer > 0 && styles.resendButtonTextDisabled,
                ]}>
                {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </Text>
            )}
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  otpInputDisabled: {
    opacity: 0.5,
  },
  resendButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  resendButtonTextDisabled: {
    color: colors.text.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.background,
    textAlign: 'center',
  },
});

export default OTPScreen; 