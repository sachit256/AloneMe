import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export type CommunicationType = 'chat' | 'call' | 'video';

const NotifyModal = ({
  visible,
  onClose,
  onSend,
  message,
  setMessage,
  selectedUser,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: () => void;
  message: string;
  setMessage: (text: string) => void;
  selectedUser: any;
}) => {
  const [selectedOption, setSelectedOption] = useState<CommunicationType>('chat');

  useEffect(() => {
    const listenerName = selectedUser?.display_name || '';
    const messages: Record<CommunicationType, string> = {
      chat: `Hi ${listenerName}! I noticed you're offline. Would love to chat when you're back online! 💭`,
      call: `Hi ${listenerName}! I'd like to have a voice call with you when you're available. Looking forward to connecting! 📞`,
      video: `Hi ${listenerName}! I'd love to have a video call with you when you're back online. Can't wait to meet you! 📹`
    };
    setMessage(messages[selectedOption]);
  }, [selectedOption, setMessage, selectedUser]);

  if (!visible) return null;

  const CommunicationOption = ({ 
    type, 
    icon, 
    label 
  }: { 
    type: CommunicationType, 
    icon: string, 
    label: string 
  }) => (
    <TouchableOpacity 
      style={[
        styles.communicationOption,
        selectedOption === type && styles.communicationOptionSelected
      ]}
      onPress={() => setSelectedOption(type)}
    >
      <View style={[
        styles.radioOuter,
        selectedOption === type && styles.radioOuterSelected
      ]}>
        {selectedOption === type && <View style={styles.radioInner} />}
      </View>
      <View style={styles.optionContent}>
        <Icon name={icon} size={24} color={selectedOption === type ? "#00BFA6" : "#888"} />
        <Text style={[
          styles.optionText,
          selectedOption === type && styles.optionTextSelected
        ]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[styles.modalContainer, styles.notifyModalContainer]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Listener is Offline</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>Send message instead?</Text>
          
          <View style={styles.communicationOptions}>
            <CommunicationOption 
              type="chat" 
              icon="chat-outline" 
              label="Chat" 
            />
            <CommunicationOption 
              type="call" 
              icon="phone" 
              label="Voice Call" 
            />
            <CommunicationOption 
              type="video" 
              icon="video" 
              label="Video Call" 
            />
          </View>

          <Text style={styles.messageLabel}>Your message:</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            placeholderTextColor="#888"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity 
            style={[styles.sendMessageButton, !message.trim() && styles.sendMessageButtonDisabled]} 
            onPress={onSend}
            disabled={!message.trim()}
          >
            <Icon name="send" size={20} color="#FFFFFF" style={styles.sendIcon} />
            <Text style={styles.sendMessageButtonText}>Send Notification</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
  },
  notifyModalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  messageLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  communicationOptions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  communicationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#252525',
  },
  communicationOptionSelected: {
    backgroundColor: 'rgba(0, 191, 166, 0.1)',
    borderWidth: 1,
    borderColor: '#00BFA6',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  optionText: {
    color: '#888',
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#00BFA6',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#00BFA6',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00BFA6',
  },
  messageInput: {
    backgroundColor: '#252525',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendMessageButton: {
    backgroundColor: '#00BFA6',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendMessageButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  sendIcon: {
    marginRight: 8,
  },
  sendMessageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotifyModal; 