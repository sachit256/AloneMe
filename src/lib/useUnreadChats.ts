console.log('useUnreadChats module loaded');
import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabase';

export interface ChatSession {
  id: string;
  participants: string[];
  last_message: string;
  last_message_time: string;
  unread_count: number;
  otherUserName: string;
}

export const useUnreadChats = (userId: string | null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let mounted = true;

    // Function to fetch unread messages count
    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, read_by')
          .not('sender_id', 'eq', userId) // Messages not sent by current user
          .contains('read_by', []) // Messages with empty read_by array
          .or(`read_by.not.cs.{${userId}}`); // Or read_by doesn't contain current user

        if (error) {
          console.error('Error fetching unread messages:', error);
          return;
        }

        if (mounted) {
          setUnreadCount(data?.length || 0);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchUnreadCount:', error);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Refetch count when messages change
          await fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unreadCount, loading };
};

export function useUnreadChatsOld(currentUserId: string | null) {
  console.log('useUnreadChats hook CALLED');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);

  const fetchChatSessions = async () => {
    if (!currentUserId) return;
    console.log('[useUnreadChats] currentUserId:', currentUserId, 'type:', typeof currentUserId);
    const { data: sessions, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, participants, last_message, last_message_time')
      .contains('participants', [currentUserId]);
    if (sessionError) return;
    const sessionList: ChatSession[] = [];
    let totalUnread = 0;
    for (const session of sessions || []) {
      const otherUserId = session.participants.find((id: string) => id !== currentUserId);
      let otherUserName = 'User';
      if (otherUserId) {
        const { data: userData } = await supabase
          .from('user_preferences')
          .select('display_name')
          .eq('user_id', otherUserId)
          .single();
        if (userData?.display_name) otherUserName = userData.display_name;
      }
      const { count: unread } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('chat_id', session.id)
        .neq('sender_id', currentUserId)
        .not('read_by', 'cs', `{${currentUserId}}`);
      sessionList.push({
        id: session.id,
        participants: session.participants,
        last_message: session.last_message,
        last_message_time: session.last_message_time,
        unread_count: unread || 0,
        otherUserName,
      });
      totalUnread += unread || 0;
    }
    setChatSessions(sessionList);
    setUnreadCount(totalUnread);
  };

  useEffect(() => {
    fetchChatSessions();
    if (!currentUserId) return;
    const channel = supabase
      .channel(`user-chats:${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new && payload.new.chat_id) {
            fetchChatSessions();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new && payload.new.chat_id) {
            fetchChatSessions();
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
    // eslint-disable-next-line
  }, [currentUserId]);

  return { unreadCount, chatSessions, refetch: fetchChatSessions };
} 