import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {UserPreferences} from '../../lib/userPreferences';

export interface UserState {
  preferences: Partial<UserPreferences>;
  error: string | null;
}

const initialState: UserState = {
  preferences: {},
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetUser: (state) => {
      state.preferences = {};
      state.error = null;
    },
  },
});

export const {
  updateUserPreferences,
  setError,
  clearError,
  resetUser,
} = userSlice.actions;

export default userSlice.reducer; 