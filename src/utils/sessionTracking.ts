import { supabase } from '../lib/supabase';

export async function startSession(listenerId: string, userId: string, sessionType: 'chat' | 'call' | 'video'): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('session_logs')
      .insert({
        listener_id: listenerId,
        user_id: userId,
        session_type: sessionType,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
}

export async function endSession(sessionId: string, durationMinutes: number): Promise<void> {
  try {
    const endTime = new Date().toISOString();
    
    const { error } = await supabase
      .from('session_logs')
      .update({
        end_time: endTime,
        duration_minutes: durationMinutes
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error ending session:', error);
    throw error;
  }
}

export async function getListenerHours(listenerId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('session_logs')
      .select('duration_minutes')
      .eq('listener_id', listenerId)
      .not('duration_minutes', 'is', null);

    if (error) throw error;

    const totalMinutes = data?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) || 0;
    return totalMinutes / 60; // Convert minutes to hours
  } catch (error) {
    console.error('Error getting listener hours:', error);
    return 0;
  }
} 