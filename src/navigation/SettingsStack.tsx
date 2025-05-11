import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../types/navigation';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="SettingsScreen" 
        component={SettingsScreen}
      />
    </Stack.Navigator>
  );
};

export default SettingsStack; 