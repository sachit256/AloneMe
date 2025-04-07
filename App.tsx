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
import Toast from 'react-native-toast-message';

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

import {RootStackParamList} from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const hasCompletedOnboarding = useSelector(
    (state: RootState) => state.auth.hasCompletedOnboarding,
  );

  const getInitialRouteName = (): keyof RootStackParamList => {
    if (isAuthenticated && hasCompletedOnboarding) {
      return 'MainApp';
    }
    return 'Welcome';
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="IdentityVerification" component={IdentityVerificationScreen} />
      <Stack.Screen name="HumanVerification" component={HumanVerificationScreen} />
      <Stack.Screen name="NameSelection" component={NameSelectionScreen} />
      <Stack.Screen name="EducationSelection" component={EducationSelectionScreen} />
      <Stack.Screen name="EmotionalStory" component={EmotionalStoryScreen} />
      <Stack.Screen name="AnalyzingProfile" component={AnalyzingProfileScreen} />
      <Stack.Screen name="MainApp" component={MainTabs} />
      <Stack.Screen name="VerifiedUsers" component={VerifiedUsersScreen} />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <Toast />
      </PersistGate>
    </Provider>
  );
};

export default App;
