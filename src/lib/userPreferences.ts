import { supabase } from './supabase';

export interface UserPreferences {
  id?: string;
  user_id?: string;
  phone_number: string;
  preferred_language?: string;
  gender?: string;
  date_of_birth?: string;
  age?: number;
  onboarding_completed?: boolean;
  display_name?: string;
  education?: string;
  created_at?: string;
  updated_at?: string;
}

export const createUserPreferences = async (preferences: UserPreferences) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert([preferences])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating user preferences:', error.message);
    return { success: false, error };
  }
};

export const updateUserPreferences = async (
  userId: string, 
  updates: Partial<UserPreferences>,
  phoneNumber?: string
) => {
  try {
    // First check if the record exists
    const { data: existingData, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existingData) {
      // If no record exists, we need the phone number
      if (!phoneNumber) {
        throw new Error('Phone number is required to create new user preferences');
      }

      // Create new record with phone number
      const { data: insertData, error: insertError } = await supabase
        .from('user_preferences')
        .insert([{ 
          user_id: userId,
          phone_number: phoneNumber,
          ...updates 
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      return { success: true, data: insertData };
    }

    // If record exists, update it
    const { data: updateData, error: updateError } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;
    return { success: true, data: updateData };
  } catch (error: any) {
    console.error('Error updating user preferences:', error.message);
    return { success: false, error };
  }
};

export const getUserPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching user preferences:', error.message);
    return { success: false, error };
  }
}; 