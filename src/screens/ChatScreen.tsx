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
} from 'react-native';
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
};

type ChatScreenProps = RootStackScreenProps<'Chat'>;

const ChatScreen = ({ navigation, route }: ChatScreenProps) => {
  const [message, setMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isChatActive, setIsChatActive] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    startTimer();
    setupChat();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  const setupChat = async () => {
    try {
      const chatId = `chat_${route.params?.userId}_${route.params?.otherUserId}`;
      console.log('Setting up chat with ID:', chatId);
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`chat:${chatId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`,
          },
          (payload: any) => {
            console.log('Received realtime message:', payload);
            const newMsg = payload.new;
            if (newMsg && payload.eventType === 'INSERT') {
              const message: Message = {
                id: newMsg.id,
                text: newMsg.text,
                sender: newMsg.sender_id === route.params?.userId ? 'me' : 'other',
                timestamp: new Date(newMsg.created_at),
              };
              setMessages(prev => [...prev, message]);
            }
          }
        )
        .subscribe((status: any) => {
          console.log('Subscription status:', status);
        });

      channelRef.current = channel;

      // Fetch existing messages
      console.log('Fetching existing messages...');
      const { data: existingMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error.message);
        console.error('Error details:', error);
        return;
      }

      console.log('Fetched messages:', existingMessages);

      if (existingMessages) {
        const formattedMessages: Message[] = existingMessages.map(msg => ({
          id: msg.id || '',
          text: msg.text || '',
          sender: msg.sender_id === route.params?.userId ? 'me' : 'other',
          timestamp: new Date(msg.created_at),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Setup chat error:', error);
    }
  };

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

  const handleEndChat = () => {
    stopTimer();
    // Save chat duration to backend
    saveChatDuration();
    navigation.goBack();
  };

  const saveChatDuration = async () => {
    try {
      await supabase
        .from('chat_sessions')
        .insert({
          user_id: route.params?.userId,
          other_user_id: route.params?.otherUserId,
          duration_seconds: elapsedTime,
          ended_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error saving chat duration:', error);
    }
  };

  const handleVideoCall = async () => {
    // Get the recipient's user ID (otherUserId from route params)
    const recipientId = route.params?.otherUserId;
    if (!recipientId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Recipient not found.',
      });
      return;
    }

    // Check video call availability
    const { data, error } = await supabase
      .from('user_service_availability')
      .select('is_available')
      .eq('user_id', recipientId)
      .eq('service_type', 'VideoCall')
      .single();

    if (error && error.code !== 'PGRST116') {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not check user availability.',
      });
      return;
    }

    if (!data?.is_available) {
      Toast.show({
        type: 'info',
        text1: 'Not Available',
        text2: 'User is not available for video call.',
      });
      return;
    }

    // If available, proceed with your video call logic
    console.log('Video call initiated');
  };

  const handleVoiceCall = () => {
    // Implement voice call functionality
    console.log('Voice call initiated');
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const chatId = `chat_${route.params?.userId}_${route.params?.otherUserId}`;
      console.log('Sending message to chat:', chatId);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Please try logging out and logging in again',
        });
        return;
      }

      const messageData = {
        chat_id: chatId,
        text: message.trim(),
        sender_id: route.params?.userId,
        receiver_id: route.params?.otherUserId,
      };
      console.log('Message data:', messageData);

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error.message);
        console.error('Error details:', error);
        Toast.show({
          type: 'error',
          text1: 'Error sending message',
          text2: error.message,
        });
        return;
      }

      console.log('Message sent successfully:', data);

      if (data) {
        const newMessage: Message = {
          id: data.id,
          text: data.text,
          sender: 'me',
          timestamp: new Date(data.created_at),
        };
        setMessages(prev => [...prev, newMessage]);
        setMessage('');
      }
    } catch (error) {
      console.error('Send message error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send message. Please try again.',
      });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'me' ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEndChat} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chat with {route.params?.otherUserName}</Text>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.callButtons}>
          <TouchableOpacity onPress={handleVideoCall} style={styles.callButton}>
            <Icon name="video" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVoiceCall} style={styles.callButton}>
            <Icon name="phone" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={themeColors.textSecondary}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendMessage}
            disabled={!message.trim()}
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
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: themeColors.textPrimary,
  },
  timerText: {
    ...typography.caption,
    color: themeColors.textSecondary,
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
  },
  chatContainer: {
    padding: spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: themeColors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: themeColors.surface,
  },
  messageText: {
    color: themeColors.textPrimary,
    ...typography.body,
  },
  messageTime: {
    color: themeColors.textSecondary,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: themeColors.surface,
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
  },
  sendButton: {
    backgroundColor: themeColors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: themeColors.surface,
  },
});

export default ChatScreen; 