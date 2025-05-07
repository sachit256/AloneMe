import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '../screens/SettingsScreen';
// We will define SettingsStackParamList in src/types/navigation.ts
// import { SettingsStackParamList } from '../types/navigation'; 

// Temporary placeholder until types are updated
export type SettingsStackParamList = {
  SettingsScreen: undefined;
  // Add other screens like Verification, Privacy here
};

const Stack = createStackNavigator<SettingsStackParamList>();

const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      {/* You can add other screens to this stack later, e.g.:
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} /> 
      */}
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator; 