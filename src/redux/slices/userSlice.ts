import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface UserPreferences {
  name?: string;
  education?: string;
  emotional_story?: string;
  onboarding_completed?: boolean;
  phone_number?: string;
  preferred_language?: string;
  gender?: string;
  date_of_birth?: string;
  age?: number;
  display_name?: string;
}

interface UserState {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  preferences: {},
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUserPreferences: (state, action: PayloadAction<UserPreferences>) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {updateUserPreferences, setLoading, setError} = userSlice.actions;
export default userSlice.reducer; 