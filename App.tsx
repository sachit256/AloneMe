/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Provider, useSelector} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './src/store';
import {RootState} from './src/store';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import {useUser} from './src/hooks/useUser';
import {getNextOnboardingScreen} from './src/utils/onboarding';
import type {RootStackParamList} from './src/types/navigation';
import {ActivityIndicator, View} from 'react-native';
import type { BaseToastProps } from 'react-native-toast-message';
import { useColorScheme } from 'react-native';

// Screen Imports
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import HumanVerificationScreen from './src/screens/HumanVerificationScreen';
import NameSelectionScreen from './src/screens/NameSelectionScreen';
import EducationSelectionScreen from './src/screens/EducationSelectionScreen';
import EmotionalStoryScreen from './src/screens/EmotionalStoryScreen';
import AnalyzingProfileScreen from './src/screens/AnalyzingProfileScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import IdentityVerificationScreen from './src/screens/IdentityVerificationScreen';
import MainTabs from './src/navigation/MainTabs';
import VerifiedUsersScreen from './src/screens/VerifiedUsersScreen';
import UnverifiedUsersScreen from './src/screens/UnverifiedUsersScreen';
import ChatScreen from './src/screens/ChatScreen';
import UserProfileDetailScreen from './src/screens/UserProfileDetailScreen';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import ContactUsScreen from './src/screens/ContactUsScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const {user, preferences, isLoading} = useUser();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const [isInitialized, setIsInitialized] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const toastBg = isDark ? '#232323' : '#fff';
  const toastText = isDark ? '#fff' : '#232323';

  React.useEffect(() => {
    // Only set initialized once we have loaded the initial state
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  // Debug logging
  console.log('Navigation State:', {
    isLoading,
    isInitialized,
    user: user?.id,
    preferences,
    isAuthenticated,
    onboardingCompleted: preferences?.onboarding_completed,
  });

  const getInitialRouteName = (): keyof RootStackParamList => {
    let route: keyof RootStackParamList = 'Welcome';
    let reason = '';

    // First check if we're authenticated in Redux and have a user
    if (!isAuthenticated || !user) {
      route = 'Welcome';
      reason = 'Not authenticated or no user';
    }
    // If authenticated and onboarding is completed, go to MainApp
    else if (preferences?.onboarding_completed) {
      route = 'MainApp';
      reason = 'Onboarding completed';
    }
    // If authenticated but onboarding not completed
    else {
      route = getNextOnboardingScreen(preferences).screen as keyof RootStackParamList;
      reason = 'Continuing onboarding';
    }

    console.log('Navigation Decision:', { route, reason });
    return route;
  };

  // Show loading indicator while initializing
  if (!isInitialized) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Get the initial route name
  const initialRoute = getInitialRouteName();
  console.log('Selected initial route:', initialRoute);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}>
      {Object.entries(screens).map(([name, Component]) => (
        <Stack.Screen
          key={name}
          name={name as keyof RootStackParamList}
          component={Component}
        />
      ))}
    </Stack.Navigator>
  );
};

// Define screens object with proper typing
const screens: Record<keyof RootStackParamList, React.ComponentType<any>> = {
  Welcome: WelcomeScreen,
  Login: LoginScreen,
  OTP: OTPScreen,
  LanguageSelection: LanguageSelectionScreen,
  PersonalInfo: PersonalInfoScreen,
  ProfileSetup: ProfileSetupScreen,
  Verification: VerificationScreen,
  IdentityVerification: IdentityVerificationScreen,
  HumanVerification: HumanVerificationScreen,
  NameSelection: NameSelectionScreen,
  EducationSelection: EducationSelectionScreen,
  EmotionalStory: EmotionalStoryScreen,
  AnalyzingProfile: AnalyzingProfileScreen,
  MainApp: MainTabs,
  VerifiedUsers: VerifiedUsersScreen,
  UnverifiedUsers: UnverifiedUsersScreen,
  Chat: ChatScreen,
  UserProfileDetail: UserProfileDetailScreen,
  Announcements: AnnouncementsScreen,
  Profile: ProfileScreen,
  TermsOfService: TermsOfServiceScreen,
  PrivacyPolicy: PrivacyPolicyScreen,
  ContactUs: ContactUsScreen,
  Home: MainTabs,
  Settings: MainTabs,
  Search: SearchScreen,
};

const App = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const toastBg = isDark ? '#232323' : '#fff';
  const toastText = isDark ? '#fff' : '#232323';

  const toastConfig = {
    success: (props: BaseToastProps) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#00BFA6', borderRadius: 12, marginTop: 16, backgroundColor: toastBg }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#00BFA6',
        }}
        text2Style={{
          fontSize: 12,
          color: toastText,
        }}
      />
    ),
    error: (props: BaseToastProps) => (
      <ErrorToast
        {...props}
        style={{ borderLeftColor: '#FF5252', borderRadius: 12, marginTop: 16, backgroundColor: toastBg }}
        text1Style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#FF5252',
        }}
        text2Style={{
          fontSize: 12,
          color: toastText,
        }}
      />
    ),
    info: (props: BaseToastProps) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#FFC107', borderRadius: 12, marginTop: 16, backgroundColor: toastBg }}
        text1Style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#FFC107',
        }}
        text2Style={{
          fontSize: 12,
          color: toastText,
        }}
      />
    ),
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} topOffset={60} />
      </PersistGate>
    </Provider>
  );
};

export default App;
