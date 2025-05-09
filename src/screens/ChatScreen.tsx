import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { RootStackScreenProps } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { commonStyles, typography, spacing, colors } from '../styles/common';
import { supabase, Message as SupabaseMessage, createChatChannel } from '../lib/supabase';
import Toast from 'react-native-toast-message';

const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textOnPrimary: '#FFFFFF',
};

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: Date;
  read_by: string[];
};

type ChatScreenProps = RootStackScreenProps<'Chat'>;

const ChatScreen = ({ navigation, route }: ChatScreenProps) => {
  const [message, setMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isChatActive, setIsChatActive] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const chatChannelRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isSending, setIsSending] = useState(false);
  const isFocused = useIsFocused();
  const currentUserId = route.params?.userId;

  // Helper function to mark messages as read by the current user
  const markMessagesAsRead = async (messageIdsToMark: string[]) => {
    if (!currentUserId || !route.params?.chatId || messageIdsToMark.length === 0) {
      return;
    }

    try {
      const { data: messagesToUpdate, error: fetchError } = await supabase
        .from('messages')
        .select('id, read_by')
        .in('id', messageIdsToMark)
        .eq('chat_id', route.params.chatId);

      if (fetchError) {
        console.error('Error fetching messages to mark as read:', fetchError.message);
        return;
      }

      if (!messagesToUpdate || messagesToUpdate.length === 0) {
        return;
      }

      const updatesToPerform: { id: string; read_by: string[] }[] = [];
      for (const msg of messagesToUpdate) {
        const currentReadBy = Array.isArray(msg.read_by) ? msg.read_by : [];
        if (!currentReadBy.includes(currentUserId)) {
          updatesToPerform.push({
            id: msg.id,
            read_by: [...currentReadBy, currentUserId],
          });
        }
      }

      if (updatesToPerform.length > 0) {
        for (const update of updatesToPerform) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ read_by: update.read_by })
            .eq('id', update.id)
            .eq('chat_id', route.params.chatId);

          if (updateError) {
            console.error(`Error updating read_by for message ${update.id}:`, updateError.message);
          }
        }
        // Manually update local state to reflect read status immediately
        setMessages(prevMessages =>
          prevMessages.map(m => {
            const updatedMessage = updatesToPerform.find(u => u.id === m.id);
            if (updatedMessage) {
              return { ...m, read_by: updatedMessage.read_by };
            }
            return m;
          })
        );
      }
    } catch (error: any) {
      console.error('Unexpected error in markMessagesAsRead:', error.message);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not update message read status.' });
    }
  };

  // Fetch message history and subscribe to new messages and typing events
  useEffect(() => {
    const chatId = route.params?.chatId;
    if (!chatId) return;

    // Fetch message history
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (data) {
        const formatted = data.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          sender: (msg.sender_id === route.params?.userId ? 'me' : 'other') as 'me' | 'other',
          timestamp: new Date(msg.created_at),
          read_by: msg.read_by || [],
        }));
        setMessages(formatted);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      }
    };
    fetchMessages();

    // Chat message channel (postgres_changes)
    const chatChannel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload: any) => {
          const newMsg = payload.new;
          if (newMsg) {
            setMessages((prev) => {
              let updatedMessages = prev;
              // For the sender, try to remove the optimistic message that matches the incoming real message
              if (newMsg.sender_id === route.params?.userId) {
                updatedMessages = prev.filter(msg => {
                  // Keep if not an optimistic message OR if it doesn't match the incoming one
                  if (msg.sender !== 'me' || !msg.id.startsWith('temp-')) {
                    return true; // Not an optimistic message from self, or already a real message
                  }
                  // Check if the optimistic message matches the text and is very recent
                  const isMatch = msg.text === newMsg.text && 
                                  Math.abs(new Date(msg.timestamp).getTime() - new Date(newMsg.created_at).getTime()) < 5000; // 5 seconds window
                  return !isMatch; // Remove if it matches
                });
              }

              // Add the new message from Supabase if it's not already present by its actual ID
              if (!updatedMessages.some((msg) => msg.id === newMsg.id)) {
                const messageToAdd = {
                  id: newMsg.id,
                  text: newMsg.text,
                  sender: (newMsg.sender_id === route.params?.userId ? 'me' : 'other') as 'me' | 'other',
                  timestamp: new Date(newMsg.created_at),
                  read_by: newMsg.read_by || [],
                };

                // If the message is from other and screen is focused, mark it as read
                if (messageToAdd.sender === 'other' && isFocused && route.params?.userId) {
                  markMessagesAsRead([messageToAdd.id]);
                }

                return [...updatedMessages, messageToAdd];
              }
              return updatedMessages;
            });
          }
        }
      )
      .subscribe();
    chatChannelRef.current = chatChannel;

    // Typing channel (broadcast only)
    const typingChannel = supabase
      .channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== route.params?.userId) {
          setIsOtherTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setIsOtherTyping(false), 1500);
        }
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      if (chatChannelRef.current) supabase.removeChannel(chatChannelRef.current);
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
    };
  }, [route.params?.chatId, route.params?.userId]);

  // Effect to mark messages as read when the screen is focused
  useEffect(() => {
    if (isFocused && currentUserId && messages.length > 0) {
      const unreadMessageIdsFromOther = messages
        .filter(msg => {
          const isFromOther = msg.sender === 'other';
          // Ensure msg.read_by is treated as an array, even if null/undefined from optimistic updates
          const readByArray = Array.isArray(msg.read_by) ? msg.read_by : [];
          const isUnreadByCurrentUser = !readByArray.includes(currentUserId);
          return isFromOther && isUnreadByCurrentUser;
        })
        .map(msg => msg.id)
        // Filter out temporary IDs, as they won't exist in the DB to be marked
        .filter(id => !id.startsWith('temp-'));

      if (unreadMessageIdsFromOther.length > 0) {
        markMessagesAsRead(unreadMessageIdsFromOther);
      }
    }
  }, [isFocused, messages, currentUserId, markMessagesAsRead]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsChatActive(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackPress = () => {
    setShowLeaveModal(true);
  };

  const handleConfirmExit = () => {
    setShowLeaveModal(false);
    stopTimer();
    navigation.goBack();
  };

  const handleCancelExit = () => {
    setShowLeaveModal(false);
  };

  const TYPING_THROTTLE = 1000;
  const lastTypingSent = useRef<number>(0);
  const sendTypingEvent = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < TYPING_THROTTLE) return;
    lastTypingSent.current = now;
    if (!route.params?.chatId || !route.params?.userId) return;
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: route.params.userId },
      });
    }
  };
  const handleTyping = (text: string) => {
    setMessage(text);
    sendTypingEvent();
  };

  const handleSendMessage = async () => {
    if (isSending) return;
    if (!message.trim()) return;
    setIsSending(true);
    const chatId = route.params?.chatId;
    if (!chatId) {
      setIsSending(false);
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      text: message.trim(),
      sender: 'me',
      timestamp: new Date(),
      read_by: [route.params?.userId], // Initialize with only the sender's ID
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      // Insert the new message
      const { data: messageData, error: messageError } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: route.params?.userId,
        text: newMessage.text,
        read_by: [route.params?.userId], // Initialize with only the sender's ID in the database
      });

      if (messageError) throw messageError;

      // Update the chat session with the last message
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({
          last_message: newMessage.text,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) {
        console.error('Error updating chat session:', updateError);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send message. Please try again.',
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // Helper for avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';
    let status = '';
    if (isMe) {
      if (item.read_by && route.params?.otherUserId && item.read_by.includes(route.params.otherUserId)) {
        status = 'Seen';
      } else {
        status = 'Delivered';
      }
    }
    return (
      <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowOther]}>
        {!isMe && (
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarText}>
              {getInitials(route.params?.otherUserName || 'U')}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>{item.text}</Text>
          <Text style={styles.messageTime}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && (
            <Text style={{ fontSize: 10, color: '#00BFA6', marginTop: 2 }}>{status}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{route.params?.otherUserName}</Text>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.callButtons}>
          <TouchableOpacity onPress={() => {}} style={styles.callButton}>
            <Icon name="video" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.callButton}>
            <Icon name="phone" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Leave Session Confirmation Modal */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Leave Chat Session?</Text>
            <Text style={styles.modalMessage}>Are you sure you want to leave this chat session?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancelExit}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.exitButton]} onPress={handleConfirmExit}>
                <Text style={styles.modalButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />

        {isOtherTyping && (
          <Text style={{ color: '#00BFA6', marginLeft: 16, marginBottom: 4 }}>
            {route.params?.otherUserName} is typing...
          </Text>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor={themeColors.textSecondary}
            multiline
            returnKeyType="send"
          />
          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendMessage}
            disabled={!message.trim() || isSending}
          >
            <Icon name="send" size={24} color={themeColors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surface,
    backgroundColor: themeColors.background,
    elevation: 2,
    zIndex: 2,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: themeColors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  timerText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  backButton: {
    padding: spacing.xs,
  },
  callButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callButton: {
    padding: spacing.xs,
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  chatContainer: {
    padding: spacing.md,
    paddingBottom: 10,
    minHeight: 400,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatarBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: themeColors.primary,
  },
  avatarText: {
    color: themeColors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: themeColors.primary,
    borderBottomRightRadius: 6,
    marginLeft: 40,
  },
  bubbleOther: {
    backgroundColor: themeColors.surface,
    borderBottomLeftRadius: 6,
    marginRight: 8,
  },
  messageText: {
    fontSize: 15,
    color: themeColors.textPrimary,
  },
  textMe: {
    color: themeColors.textOnPrimary,
  },
  textOther: {
    color: themeColors.textPrimary,
  },
  messageTime: {
    color: themeColors.textSecondary,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: themeColors.surface,
    backgroundColor: themeColors.background,
  },
  input: {
    flex: 1,
    backgroundColor: themeColors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: themeColors.textPrimary,
    marginRight: spacing.sm,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: themeColors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  sendButtonDisabled: {
    backgroundColor: themeColors.surface,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: themeColors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.primary,
  },
  exitButton: {
    backgroundColor: themeColors.primary,
  },
  modalButtonText: {
    color: themeColors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ChatScreen; 