import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import type {RootStackScreenProps} from '../types/navigation';
import {colors, typography, spacing, commonStyles} from '../styles/common';
import {useSelector} from 'react-redux';
import type {RootState} from '../store';
import {useUser} from '../hooks/useUser';
import {supabase} from '../lib/supabase';

const CAROUSEL_DATA = [
  {
    id: '1',
    title: 'Welcome to AloneMe',
    description: 'Your safe space for sharing and connecting',
  },
  {
    id: '2',
    title: 'Share Your Story',
    description: 'Express yourself in a supportive environment',
  },
  {
    id: '3',
    title: 'Find Support',
    description: 'Connect with others who understand',
  },
];

const {width: screenWidth} = Dimensions.get('window');

const WelcomeScreen = ({navigation}: RootStackScreenProps<'Welcome'>) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const {user, isLoading} = useUser();
  const preferences = useSelector((state: RootState) => state.user?.preferences);
  const isAuthenticated = useSelector((state: RootState) => state.auth?.isAuthenticated);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Get current session
        const {data: {session}} = await supabase.auth.getSession();
        console.log('Current session:', session?.user?.id);
        console.log('Auth state:', {
          isLoading,
          isAuthenticated,
          userId: user?.id,
          sessionUserId: session?.user?.id,
          preferences,
          onboardingCompleted: preferences?.onboarding_completed
        });

        if (!isLoading && session?.user && isAuthenticated && preferences?.onboarding_completed) {
          console.log('User is authenticated and onboarding completed, navigating to MainApp');
          navigation.replace('MainApp');
        } else if (!isLoading && session?.user && isAuthenticated && !preferences?.onboarding_completed) {
          console.log('User is authenticated but onboarding not completed');
          // Let the app navigator handle the routing to the appropriate onboarding screen
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    checkAuthState();
  }, [isLoading, isAuthenticated, user, preferences, navigation]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentIndex(index);
  };

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.container}>
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}>
            {CAROUSEL_DATA.map((item) => (
              <View key={item.id} style={styles.carouselItem}>
                <Text style={styles.carouselTitle}>{item.title}</Text>
                <Text style={styles.carouselDescription}>{item.description}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.pagination}>
            {CAROUSEL_DATA.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleGetStarted}>
            <Text style={commonStyles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.xl,
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  carouselItem: {
    width: screenWidth,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  carouselDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.tertiary,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default WelcomeScreen; 