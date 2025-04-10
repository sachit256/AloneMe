import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useUser} from './useUser';
import {getNextOnboardingScreen} from '../utils/onboarding';
import type {RootStackParamList} from '../types/navigation';

export const useOnboardingNavigation = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {user, preferences, isLoading} = useUser();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for user and preferences to be loaded
      if (isLoading || !user) {
        return;
      }

      console.log('Checking onboarding status:', {
        user: user?.id,
        preferences,
        onboardingCompleted: preferences?.onboarding_completed,
      });

      // If user is authenticated and onboarding is completed, go to main app
      if (user && preferences?.onboarding_completed) {
        navigation.reset({
          index: 0,
          routes: [{name: 'MainApp'}],
        });
        return;
      }

      // If user is authenticated but onboarding is not completed
      if (user && !preferences?.onboarding_completed) {
        const {screen, params} = getNextOnboardingScreen(preferences);
        
        // Only navigate if we're not already on the target screen
        const currentRoute = navigation.getState().routes[navigation.getState().index];
        if (screen && currentRoute?.name !== screen) {
          navigation.reset({
            index: 0,
            routes: [{name: screen as keyof RootStackParamList, params}],
          });
        }
      }
    };

    checkOnboardingStatus();
  }, [user, preferences, isLoading, navigation]);

  return null;
}; 