import { supabase } from '../lib/supabase';

export async function isUserOnline(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('is_online')
    .eq('user_id', userId)
    .single();
  if (error) return false;
  return !!data?.is_online;
} 