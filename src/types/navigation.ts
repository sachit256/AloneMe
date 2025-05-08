import {CompositeScreenProps} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {NativeStackScreenProps, NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OTP: {
    phoneNumber: string;
  };
  LanguageSelection: undefined;
  PersonalInfo: undefined;
  ProfileSetup: undefined;
  MainApp: undefined;
  Verification: undefined;
  IdentityVerification: undefined;
  HumanVerification: {
    gender: string;
    dateOfBirth: string;
    age: number;
  };
  NameSelection: undefined;
  EducationSelection: {
    name: string;
  };
  EmotionalStory: {
    name: string;
    education: string;
  };
  AnalyzingProfile: {
    name: string;
    education: string;
    story: string;
  };
  VerifiedUsers: undefined;
  UnverifiedUsers: undefined;
  Chat: { 
    userName: string;
    userId: string;
    otherUserId: string;
    otherUserName: string;
  };
  UserProfileDetail: { userId: string };
  Announcements: undefined;
  Profile: { userId: string };
  Home: undefined;
  Settings: undefined;
  Search: undefined;
};

// New Stack Navigator for Settings flow
export type SettingsStackParamList = {
  SettingsScreen: undefined; // Initial screen in the Settings stack
  // Profile: undefined; // Profile is now moved to RootStack
  // Add other settings-related screens here if needed, e.g.,
  // VerificationSettings: undefined;
  // PrivacySettings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Chat: undefined;
  Menu: undefined;
  Activity: undefined;
  Settings: { screen: keyof SettingsStackParamList; params?: SettingsStackParamList[keyof SettingsStackParamList] }; // Updated for nested stack
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>; // Using NativeStackNavigationProp
  route: RouteProp<RootStackParamList, T>; // Using RouteProp
};

// Prop type for screens within the SettingsStack
export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, T>, // Props from the stack navigator
  BottomTabScreenProps<TabParamList> // Props from the parent tab navigator
>;

// Updated TabScreenProps for direct screens in TabParamList
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList> // Assuming tabs are inside a root stack
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 