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
  otherUserAlonemeId?: string;
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
      // Get all chat sessions for the current user
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .contains('participants', [currentUserId])
        .order('last_message_time', { ascending: false }); // Sort by most recent message

      if (sessionsError) throw sessionsError;

      // Process each session to get other user's details
      const processedSessions = await Promise.all((sessions || []).map(async (session) => {
        const otherUserId = session.participants.find((id: string) => id !== currentUserId);
        if (!otherUserId) return null;

        // Get other user's details
        const { data: userData, error: userError } = await supabase
          .from('user_preferences')
          .select('display_name, aloneme_user_id')
          .eq('user_id', otherUserId)
          .single();

        if (userError || !userData) return null;

        return {
          id: session.id,
          participants: session.participants,
          last_message: session.last_message || 'No messages yet',
          last_message_time: session.last_message_time || '',
          unread_count: 0,
          otherUserName: userData.display_name || 'User',
          otherUserAlonemeId: userData.aloneme_user_id
        };
      }));

      // Filter out null values and sort by last_message_time
      const validSessions = processedSessions.filter(Boolean) as ChatSession[];
      const sortedSessions = validSessions.sort((a, b) => {
        const timeA = new Date(a.last_message_time).getTime();
        const timeB = new Date(b.last_message_time).getTime();
        return timeB - timeA; // Sort in descending order (newest first)
      });

      setChatSessions(sortedSessions);
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
      setError('Failed to load chats');
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
          let otherUserAlonemeId = null;
          
          if (otherUserId) {
            const { data: userData } = await supabase
              .from('user_preferences')
              .select('display_name, aloneme_user_id')
              .eq('user_id', otherUserId)
              .single();
            
            if (userData) {
              otherUserName = userData.display_name || 'User';
              otherUserAlonemeId = userData.aloneme_user_id;
            }
          }

          setChatSessions(prevSessions => {
            // Remove the updated session if it exists
            const filteredSessions = prevSessions.filter(s => s.id !== updatedSession.id);
            
            // Create the new session object
            const newSession = {
              id: updatedSession.id,
              participants: updatedSession.participants,
              last_message: updatedSession.last_message || 'No messages yet',
              last_message_time: updatedSession.last_message_time || '',
              unread_count: 0,
              otherUserName,
              otherUserAlonemeId
            };

            // Add the new session and sort
            const newSessions = [...filteredSessions, newSession].sort((a, b) => {
              const timeA = new Date(a.last_message_time).getTime();
              const timeB = new Date(b.last_message_time).getTime();
              return timeB - timeA; // Sort in descending order (newest first)
            });

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

          setChatSessions(prevSessions => {
            // Create new array with updated session
            const updatedSessions = prevSessions.map(session => {
              if (session.id === newMessage.chat_id) {
                return {
                  ...session,
                  unread_count: newMessage.sender_id !== currentUserId ? session.unread_count + 1 : session.unread_count,
                  last_message: newMessage.text,
                  last_message_time: newMessage.created_at
                };
              }
              return session;
            });

            // Sort sessions by last message time
            return updatedSessions.sort((a, b) => {
              const timeA = new Date(a.last_message_time).getTime();
              const timeB = new Date(b.last_message_time).getTime();
              return timeB - timeA; // Sort in descending order (newest first)
            });
          });
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
                  <View style={styles.nameContainer}>
                    <Text style={styles.nameText}>{item.otherUserName}</Text>
                    {item.otherUserAlonemeId && (
                      <Text style={styles.userIdText}>{item.otherUserAlonemeId}</Text>
                    )}
                  </View>
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
  nameContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userIdText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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