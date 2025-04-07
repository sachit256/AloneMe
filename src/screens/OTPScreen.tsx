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
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setVerificationStatus} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import Toast from 'react-native-toast-message';
import {colors, typography, spacing, commonStyles} from '../styles/common';

const OTP_LENGTH = 6;

const OTPScreen = ({route, navigation}: RootStackScreenProps<'OTP'>) => {
  const {phoneNumber} = route.params;
  const [timer, setTimer] = useState(30);
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
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    if (newOtp.every(digit => digit) && newOtp.join('').length === OTP_LENGTH) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = (code: string) => {
    if (code.length === OTP_LENGTH) {
      // Set verification status but don't set authenticated yet
      dispatch(
        setVerificationStatus({
          isVerified: true,
          phoneNumber: phoneNumber,
        }),
      );
      
      Toast.show({
        type: 'success',
        text1: 'OTP Verified',
        text2: 'Let\'s set up your profile!',
      });
      
      // Navigate to language selection
      navigation.navigate('LanguageSelection');
    }
  };

  const handleResendOTP = () => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    Toast.show({
      type: 'success',
      text1: 'OTP Resent',
      text2: 'Please check your phone for the new code',
    });
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
                style={styles.otpInput}
                value={digit}
                onChangeText={value => handleOtpChange(value.slice(-1), index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={index === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
            onPress={handleResendOTP}
            disabled={timer > 0}>
            <Text
              style={[
                styles.resendButtonText,
                timer > 0 && styles.resendButtonTextDisabled,
              ]}>
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </Text>
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
});

export default OTPScreen; 