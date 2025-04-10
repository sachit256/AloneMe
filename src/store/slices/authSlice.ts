import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';

export interface UserProfile {
  name?: string;
  displayName?: string;
  age?: number;
  bio?: string;
  language?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  gender?: string;
  dateOfBirth?: string;
  isHumanVerified?: boolean;
  education?: string;
  story?: string;
  verificationMedia?: {
    selfie?: string;
    aadhaar?: string;
    video?: string;
  };
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  onboardingCompleted?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  userProfile: UserProfile;
  verificationStatus: {
    isVerified: boolean;
    phoneNumber?: string;
  };
}

const initialState: AuthState = {
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  userProfile: {},
  verificationStatus: {
    isVerified: false,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setOnboardingComplete: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedOnboarding = action.payload;
    },
    setUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      state.userProfile = {
        ...state.userProfile,
        ...action.payload,
      };
    },
    setVerificationStatus: (
      state,
      action: PayloadAction<{isVerified: boolean; phoneNumber?: string}>,
    ) => {
      state.verificationStatus = action.payload;
      state.userProfile.isVerified = action.payload.isVerified;
      if (action.payload.phoneNumber) {
        state.userProfile.phoneNumber = action.payload.phoneNumber;
      }
    },
    resetAuth: state => {
      state.isAuthenticated = false;
      state.hasCompletedOnboarding = false;
      state.userProfile = {};
      state.verificationStatus = {
        isVerified: false,
      };
      supabase.auth.signOut();
    },
  },
});

export const {
  setAuthenticated,
  setOnboardingComplete,
  setUserProfile,
  setVerificationStatus,
  resetAuth,
} = authSlice.actions;

export default authSlice.reducer; 