import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { TabParamList, TabScreenProps } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../lib/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Chat session and message types
interface ChatSession {
  id: string;
  participants: string[];
  last_message: string;
  last_message_time: string;
  unread_count: number;
  otherUserName: string;
}

const ChatsScreen = ({ navigation }: TabScreenProps<'Chat'>) => {
  const currentUserId = useSelector((state: RootState) => state.auth.userProfile.userId);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  // Format the timestamp to a readable format
  const formatMessageTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 7) {
      // Show date for messages older than a week
      return date.toLocaleDateString();
    } else if (days > 0) {
      // Show day name for messages within a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      // Show time for messages from today
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  // Fetch chat sessions and unread counts
  const fetchChatSessions = async () => {
    console.log('Fetching chat sessions for user:', currentUserId);
    setIsLoading(true);
    setError(null);
    
    if (!currentUserId) {
      console.log('No current user ID found');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Get all chat sessions for the user
      const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, participants, last_message, last_message_time')
        .contains('participants', [currentUserId]);

      if (sessionError) {
        console.error('Error fetching chat sessions:', sessionError);
        setError('Failed to load chat sessions');
        setIsLoading(false);
        return;
      }

      console.log('Fetched sessions:', sessions);

      // 2. For each session, get unread count and other user name
      const sessionList: ChatSession[] = [];
      let totalUnread = 0;

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          try {
            // Get the other participant
            const otherUserId = session.participants.find((id: string) => id !== currentUserId);
            console.log('Processing session:', session.id, 'Other user:', otherUserId);

            // Get other user's display name
            let otherUserName = 'User';
            if (otherUserId) {
              const { data: userData, error: userError } = await supabase
                .from('user_preferences')
                .select('display_name')
                .eq('user_id', otherUserId)
                .single();

              if (userError) {
                console.error('Error fetching user data:', userError);
              } else if (userData?.display_name) {
                otherUserName = userData.display_name;
              }
            }

            // Get unread count for this session
            const { count: unread, error: countError } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('chat_id', session.id)
              .neq('sender_id', currentUserId)
              .not('read_by', 'cs', `{${currentUserId}}`);

            if (countError) {
              console.error('Error fetching unread count:', countError);
            }

            sessionList.push({
              id: session.id,
              participants: session.participants,
              last_message: session.last_message || 'No messages yet',
              last_message_time: session.last_message_time || '',
              unread_count: unread || 0,
              otherUserName,
            });
            totalUnread += unread || 0;
          } catch (err) {
            console.error('Error processing chat session:', err);
          }
        }
      }

      console.log('Processed session list:', sessionList);
      setChatSessions(sessionList);
    } catch (err) {
      console.error('Unexpected error in fetchChatSessions:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time subscription for new messages and chat session updates
  useEffect(() => {
    fetchChatSessions();
    if (!currentUserId) return;

    const channel = supabase
      .channel(`user-chats:${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_sessions' },
        async (payload) => {
          const updatedSession = payload.new;
          if (!updatedSession) return;

          // Only update if this session involves the current user
          if (!updatedSession.participants?.includes(currentUserId)) return;

          // Get the other user's name if needed
          const otherUserId = updatedSession.participants.find((id: string) => id !== currentUserId);
          let otherUserName = 'User';
          
          if (otherUserId) {
            const { data: userData } = await supabase
              .from('user_preferences')
              .select('display_name')
              .eq('user_id', otherUserId)
              .single();
            
            if (userData?.display_name) {
              otherUserName = userData.display_name;
            }
          }

          // Update only the changed session in the state
          setChatSessions(prevSessions => {
            const sessionIndex = prevSessions.findIndex(s => s.id === updatedSession.id);
            if (sessionIndex === -1) {
              // If session doesn't exist, add it
              return [...prevSessions, {
                id: updatedSession.id,
                participants: updatedSession.participants,
                last_message: updatedSession.last_message || 'No messages yet',
                last_message_time: updatedSession.last_message_time || '',
                unread_count: 0, // Will be updated by the messages subscription
                otherUserName
              }];
            }

            // Update existing session
            const newSessions = [...prevSessions];
            newSessions[sessionIndex] = {
              ...newSessions[sessionIndex],
              last_message: updatedSession.last_message || newSessions[sessionIndex].last_message,
              last_message_time: updatedSession.last_message_time || newSessions[sessionIndex].last_message_time
            };
            return newSessions;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMessage = payload.new;
          if (!newMessage || !newMessage.chat_id) return;

          // Only update unread count if message is from other user
          if (newMessage.sender_id !== currentUserId) {
            setChatSessions(prevSessions => {
              return prevSessions.map(session => {
                if (session.id === newMessage.chat_id) {
                  return {
                    ...session,
                    unread_count: session.unread_count + 1,
                    last_message: newMessage.text,
                    last_message_time: newMessage.created_at
                  };
                }
                return session;
              });
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMessage = payload.new;
          if (!updatedMessage || !updatedMessage.chat_id) return;

          // Update unread count if message was read
          if (updatedMessage.read_by?.includes(currentUserId)) {
            setChatSessions(prevSessions => {
              return prevSessions.map(session => {
                if (session.id === updatedMessage.chat_id) {
                  const newUnreadCount = Math.max(0, session.unread_count - 1);
                  return {
                    ...session,
                    unread_count: newUnreadCount
                  };
                }
                return session;
              });
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [currentUserId]);

  const handleChatPress = (session: ChatSession) => {
    // Get the other user's ID from the participants array
    const otherUserId = session.participants.find(id => id !== currentUserId);
    
    // Navigate to the Chat screen with all necessary parameters
    navigation.getParent()?.navigate('Chat', {
      chatId: session.id,
      userName: 'You', // Current user's name
      userId: currentUserId,
      otherUserId: otherUserId,
      otherUserName: session.otherUserName,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#00BFA6" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : chatSessions.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.noChatsText}>No chats yet</Text>
        </View>
      ) : (
        <FlatList
          data={chatSessions}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.otherUserName[0]}</Text>
              </View>
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.nameText}>{item.otherUserName}</Text>
                  <Text style={styles.timeText}>
                    {formatMessageTime(item.last_message_time)}
                  </Text>
                </View>
                <View style={styles.messageRow}>
                  <Text style={styles.messageText} numberOfLines={1}>
                    {item.last_message}
                  </Text>
                  {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 15,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    color: '#00BFA6',
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 12,
    color: '#888888',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#888888',
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#00BFA6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  noChatsText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ChatsScreen; 