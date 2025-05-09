import { supabase } from './supabase';

export async function getOrCreateChatSession(currentUserId: string, otherUserId: string) {
  // 1. Try to find an existing direct chat session
  const { data: existing, error: findError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('type', 'direct')
    .contains('participants', [currentUserId, otherUserId])
    .single();

  if (findError && findError.code !== 'PGRST116') {
    console.error('Error finding chat session:', findError);
    throw findError;
  }

  if (existing) return existing.id;

  // 2. If not found, create a new session
  const { data: created, error: createError } = await supabase
    .from('chat_sessions')
    .insert({
      type: 'direct',
      participants: [currentUserId, otherUserId],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError || !created) {
    console.error('Error creating chat session:', createError);
    throw createError;
  }
  
  return created.id;
}

export type Message = {
  id: string;
  text: string;
  sender_id: string;
  read_by: string[];
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