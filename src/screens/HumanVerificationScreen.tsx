import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setUserProfile, setOnboardingComplete} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import Toast from 'react-native-toast-message';
import {colors, typography, spacing, commonStyles} from '../styles/common';

const {width} = Dimensions.get('window');
const SLIDER_WIDTH = width - (spacing.lg * 2);
const THRESHOLD = SLIDER_WIDTH * 0.8; // 80% of slider width

const HumanVerificationScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'HumanVerification'>) => {
  const [isSliderComplete, setIsSliderComplete] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const slideValue = useRef(new Animated.Value(0)).current;
  const dispatch = useDispatch();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx >= 0 && gestureState.dx <= SLIDER_WIDTH) {
          slideValue.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= THRESHOLD) {
          Animated.timing(slideValue, {
            toValue: SLIDER_WIDTH,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setIsSliderComplete(true);
            setIsVerified(true);
            
            // Mark verification as complete
            dispatch(setUserProfile({ isHumanVerified: true }));
            
            Toast.show({
              type: 'success',
              text1: 'Verification Complete',
              text2: 'You have been verified as human',
            });

            // Navigate to name selection after a short delay
            setTimeout(() => {
              navigation.navigate('NameSelection');
            }, 1500);
          });
        } else {
          Animated.spring(slideValue, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Human Verification</Text>
        <Text style={styles.subtitle}>
          Slide the button to verify you are human
        </Text>

        <View style={styles.section}>
          <View style={styles.sliderContainer}>
            <Animated.View
              style={[
                styles.slider,
                {
                  width: slideValue.interpolate({
                    inputRange: [0, SLIDER_WIDTH],
                    outputRange: [0, SLIDER_WIDTH],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sliderButton,
                {
                  transform: [
                    {
                      translateX: slideValue.interpolate({
                        inputRange: [0, SLIDER_WIDTH],
                        outputRange: [0, SLIDER_WIDTH - 50],
                      }),
                    },
                  ],
                },
              ]}
              {...panResponder.panHandlers}>
              <Text style={styles.sliderButtonText}>→</Text>
            </Animated.View>
          </View>
          <Text style={styles.instructionText}>
            Slide the button all the way to the right
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  sliderContainer: {
    height: 50,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 25,
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  slider: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 25,
    position: 'absolute',
    left: 0,
  },
  sliderButton: {
    width: 50,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: 25,
    position: 'absolute',
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sliderButtonText: {
    ...typography.title,
    color: colors.primary,
  },
  instructionText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default HumanVerificationScreen; 