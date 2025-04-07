import {CompositeScreenProps} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {NativeStackScreenProps, NativeStackNavigationProp} from '@react-navigation/native-stack';

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
};

export type TabParamList = {
  Home: undefined;
  Chat: undefined;
  Menu: undefined;
  Activity: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 