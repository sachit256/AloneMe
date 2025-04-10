import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create custom storage implementation for AsyncStorage
const ExpoAsyncStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to AsyncStorage:', error);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
  }
};

// Use the actual Supabase URL for your project
const supabaseUrl = 'https://ybktfvnhpzdqtzaocsga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlia3Rmdm5ocHpkcXR6YW9jc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODAyMDEsImV4cCI6MjA1OTQ1NjIwMX0.e6oqS-QCmerC91Y-TBdhElxlzdnwQv77e26xjfD-8o0';

// Create Supabase client with custom storage adapter
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoAsyncStorageAdapter,
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    debug: true // Enable debug mode to see what's happening
  }
});

// Function to initiate phone OTP
export const signInWithPhone = async (phoneNumber: string) => {
  try {
    // Format phone number to include country code if not present
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    console.log('Attempting to send OTP to:', formattedPhone);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        // Add channel preference
        channel: 'sms'
      }
    });

    if (error) {
      console.error('Error sending OTP:', error.message);
      console.error('Error details:', error);
      return { success: false, error: error.message };
    }

    console.log('OTP sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Error in signInWithPhone:', error);
    return { success: false, error: 'Failed to send OTP' };
  }
};

// Function to verify OTP
export const verifyOTP = async (phoneNumber: string, otp: string) => {
  try {
    // Format phone number to include country code if not present
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    console.log('Attempting to verify OTP for:', formattedPhone, 'with token:', otp);
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      console.error('Error verifying OTP:', error.message);
      console.error('Error details:', error);
      return { success: false, error: error.message };
    }

    if (!data?.session) {
      console.error('No session returned after verification');
      return { success: false, error: 'Authentication failed - no session created' };
    }

    console.log('OTP verification successful. Session:', data.session);
    
    // Get the user from the session
    const user = data.session.user;
    if (!user) {
      console.error('No user in session after verification');
      return { success: false, error: 'Authentication failed - no user found' };
    }

    return { 
      success: true, 
      session: data.session,
      user: user
    };
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return { success: false, error: 'Failed to verify OTP' };
  }
};

// Function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in signOut:', error);
    return false;
  }
};

export type Message = {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

export const createChatChannel = (chatId: string) => {
  return supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        console.log('Change received!', payload);
      }
    )
    .subscribe();
}; 