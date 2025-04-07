import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {setUserProfile, setAuthenticated} from '../store/slices/authSlice';
import type {RootStackScreenProps} from '../types/navigation';
import {typography, spacing, commonStyles} from '../styles/common';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import {CommonActions} from '@react-navigation/native';

const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textOnPrimary: '#FFFFFF',
};

type VerificationStep = 'selfie' | 'aadhaar' | 'video' | 'review';

interface MediaAsset {
  uri?: string;
  type?: string;
  fileName?: string;
}

const IdentityVerificationScreen = ({
  navigation,
}: RootStackScreenProps<'IdentityVerification'>) => {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('selfie');
  const [selfieImage, setSelfieImage] = useState<MediaAsset | null>(null);
  const [aadhaarImage, setAadhaarImage] = useState<MediaAsset | null>(null);
  const [verificationVideo, setVerificationVideo] = useState<MediaAsset | null>(null);
  const dispatch = useDispatch();

  const handleImagePicker = async (type: 'camera' | 'gallery', mediaType: 'photo' | 'video') => {
    const options = {
      mediaType,
      quality: 0.8 as const,
      saveToPhotos: true,
      cameraType: 'front' as const,
      includeBase64: false,
    };

    try {
      const result = type === 'camera'
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        switch (currentStep) {
          case 'selfie':
            setSelfieImage(asset);
            break;
          case 'aadhaar':
            setAadhaarImage(asset);
            break;
          case 'video':
            setVerificationVideo(asset);
            break;
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to capture media. Please try again.',
      });
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'selfie':
        if (!selfieImage) {
          Toast.show({
            type: 'error',
            text1: 'Required',
            text2: 'Please upload a smiling selfie',
          });
          return;
        }
        setCurrentStep('aadhaar');
        break;
      case 'aadhaar':
        if (!aadhaarImage) {
          Toast.show({
            type: 'error',
            text1: 'Required',
            text2: 'Please upload your Aadhaar card',
          });
          return;
        }
        setCurrentStep('video');
        break;
      case 'video':
        if (!verificationVideo) {
          Toast.show({
            type: 'error',
            text1: 'Required',
            text2: 'Please record a short verification video',
          });
          return;
        }
        dispatch(
          setUserProfile({
            verificationMedia: {
              selfie: selfieImage?.uri,
              aadhaar: aadhaarImage?.uri,
              video: verificationVideo?.uri,
            },
            verificationStatus: 'pending',
          }),
        );
        setCurrentStep('review');
        break;
      case 'review':
        dispatch(setAuthenticated(true));
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'MainApp',
                },
              ],
            }),
          );
        }, 50);
        break;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'selfie':
        return (
          <View style={styles.stepContainer}>
            <Icon name="camera-party-mode" size={40} color={themeColors.primary} style={{marginBottom: spacing.md}} />
            <Text style={styles.stepTitle}>Take a Smiling Selfie</Text>
            <Text style={styles.stepDescription}>
              Please take a clear selfie while smiling. Ensure good lighting and a clean background.
            </Text>
            {selfieImage?.uri ? (
              <Image source={{uri: selfieImage.uri}} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadContainer}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePicker('camera', 'photo')}>
                  <Icon name="camera-outline" size={20} color={themeColors.primary} />
                  <Text style={styles.uploadButtonText}>Take Selfie</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePicker('gallery', 'photo')}>
                  <Icon name="image-outline" size={20} color={themeColors.primary} />
                  <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'aadhaar':
        return (
          <View style={styles.stepContainer}>
            <Icon name="card-account-details-outline" size={40} color={themeColors.primary} style={{marginBottom: spacing.md}} />
            <Text style={styles.stepTitle}>Upload Aadhaar Card</Text>
            <Text style={styles.stepDescription}>
              Please upload a clear photo of your Aadhaar card. Make sure all details are visible.
            </Text>
            {aadhaarImage?.uri ? (
              <Image source={{uri: aadhaarImage.uri}} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadContainer}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePicker('camera', 'photo')}>
                  <Icon name="camera-outline" size={20} color={themeColors.primary} />
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePicker('gallery', 'photo')}>
                  <Icon name="image-outline" size={20} color={themeColors.primary} />
                  <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'video':
        return (
          <View style={styles.stepContainer}>
            <Icon name="video-outline" size={40} color={themeColors.primary} style={{marginBottom: spacing.md}} />
            <Text style={styles.stepTitle}>Record Verification Video</Text>
            <Text style={styles.stepDescription}>
              Record a short video saying "Hi, I'm verifying my AloneMe profile."
            </Text>
            {verificationVideo?.uri ? (
              <View style={styles.videoPreview}>
                <Icon name="play-circle-outline" size={60} color={themeColors.primary} />
                <Text style={styles.videoFileName}>{verificationVideo.fileName || 'Video Selected'}</Text>
              </View>
            ) : (
              <View style={styles.uploadContainer}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePicker('camera', 'video')}>
                  <Icon name="record-circle-outline" size={20} color={themeColors.primary} />
                  <Text style={styles.uploadButtonText}>Record Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePicker('gallery', 'video')}>
                  <Icon name="folder-video-outline" size={20} color={themeColors.primary} />
                  <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'review':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.reviewIconContainer}>
              <Icon name="check-decagram" size={64} color={themeColors.primary} />
            </View>
            <Text style={styles.reviewTitle}>Verification Submitted!</Text>
            <Text style={styles.reviewDescription}>
              Your profile is under review. We'll notify you once it's complete (usually within 24-48 hours).
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[commonStyles.safeArea, {backgroundColor: themeColors.background}]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Icon name="chevron-left" size={24} color={themeColors.textPrimary} />
      </TouchableOpacity>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}>
        
        <View style={styles.progressContainer}>
          {['selfie', 'aadhaar', 'video'].map((step, index) => {
            const stepIndex = ['selfie', 'aadhaar', 'video'].indexOf(step);
            const currentStepIndex = ['selfie', 'aadhaar', 'video', 'review'].indexOf(currentStep);
            const isActive = currentStep === step;
            const isComplete = currentStepIndex > stepIndex;
            const isFirst = index === 0;
            
            return (
              <View key={step} style={[styles.progressWrapper, isFirst && styles.progressWrapperFirst]}>
                {!isFirst && <View style={[styles.progressLine, (isActive || isComplete) && styles.progressLineActive]} />} 
                <View
                  style={[
                    styles.progressStep,
                    isActive && styles.progressStepActive,
                    isComplete && styles.progressStepComplete,
                  ]}>
                  <Text style={[styles.progressNumber, (isActive || isComplete) && styles.progressNumberActive]}>
                    {isComplete ? <Icon name="check" size={16} color={themeColors.textOnPrimary} /> : index + 1}
                  </Text>
                </View>
              </View>
            );
          })} 
        </View>

        {renderStepContent()}

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === 'review' ? 'Go to Home' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl * 2,
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 15,
    zIndex: 10,
    padding: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl * 1.5,
    paddingHorizontal: spacing.lg,
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressWrapperFirst: {
    flex: 0,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: themeColors.surface,
    marginHorizontal: spacing.sm,
  },
  progressLineActive: {
    backgroundColor: themeColors.primary,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: themeColors.surface,
  },
  progressStepActive: {
    borderColor: themeColors.primary,
    backgroundColor: themeColors.surface,
  },
  progressStepComplete: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  progressNumber: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  progressNumberActive: {
    color: themeColors.textOnPrimary,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  stepTitle: {
    ...typography.h3,
    color: themeColors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepDescription: {
    ...typography.body,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: '90%',
  },
  uploadContainer: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.primary,
    gap: spacing.sm,
  },
  uploadButtonText: {
    ...typography.button,
    color: themeColors.primary,
    marginLeft: spacing.xs,
  },
  previewImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.surface,
  },
  videoPreview: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: themeColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.surface,
  },
  videoFileName: {
    ...typography.caption,
    color: themeColors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  nextButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  nextButtonText: {
    ...typography.button,
    color: themeColors.textOnPrimary,
    fontWeight: '600',
  },
  reviewIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 191, 166, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  reviewTitle: {
    ...typography.h2,
    color: themeColors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  reviewDescription: {
    ...typography.body,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    lineHeight: (typography.body.fontSize ?? 14) * 1.5,
  },
});

export default IdentityVerificationScreen; 