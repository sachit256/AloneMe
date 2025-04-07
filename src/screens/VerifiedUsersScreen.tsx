import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import {RootStackScreenProps} from '../types/navigation';
import {commonStyles, typography, spacing, colors} from '../styles/common'; // Assuming colors are defined here
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define theme colors or import from common styles
const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textOnPrimary: '#FFFFFF',
};

// Dummy data with online status
const DUMMY_USERS = [
  { id: '1', name: 'Alice Johnson', age: 28, avatarText: 'A', location: 'New York, NY', status: 'Looking for connection', rating: 4.8, spentHours: 120, isOnline: true },
  { id: '2', name: 'Bob Williams - A Very Long Name Indeed To Test Wrapping', age: 32, avatarText: 'B', location: 'Los Angeles, CA', status: 'Exploring new friendships', rating: 4.5, spentHours: 85, isOnline: false },
  { id: '3', name: 'Charlie Brown', age: 25, avatarText: 'C', location: 'Chicago, IL', status: 'Here to chat and listen', rating: 4.9, spentHours: 210, isOnline: true },
  { id: '4', name: 'Diana Davis', age: 30, avatarText: 'D', location: 'Houston, TX', status: 'Seeking meaningful conversations', rating: 4.6, spentHours: 55, isOnline: false },
];

type User = typeof DUMMY_USERS[0];

const VerifiedUsersScreen = ({
  navigation,
}: RootStackScreenProps<'VerifiedUsers'>) => {

  const handleTalkNow = (user: User) => {
    console.log('Initiate chat with:', user.name);
    // Navigate to chat screen here
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userRow}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.avatarText}</Text>
        </View>
        {/* Conditionally styled online/offline indicator */}
        <View style={[styles.onlineIndicator, item.isOnline ? styles.online : styles.offline]} />
      </View>

      {/* User Info Section */} 
      <View style={styles.userInfoContainer}>
        {/* Name */}
        <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
        {/* Rating below name */}
        <View style={styles.ratingContainer}>
          <Icon name="star" size={14} color="#FFC107" /> 
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
        {/* Details (Age, Location, Hours) */}
        <Text style={styles.userDetails} numberOfLines={1}>
          {`${item.age} • ${item.location} • ${item.spentHours} hrs spent`}
        </Text>
        {/* Status */}
        <Text style={styles.userStatus} numberOfLines={1}>{item.status}</Text>
      </View>

      {/* Talk Now Button */}
      <TouchableOpacity style={styles.talkButton} onPress={() => handleTalkNow(item)}>
        <Text style={styles.talkButtonText}>Talk</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verified Users</Text>
        {/* Placeholder for potential right-side header action */}
        <View style={{width: 40}} /> 
      </View>
      <FlatList
        data={DUMMY_USERS}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
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
    paddingHorizontal: spacing.md, // Consistent padding
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surface,
  },
  backButton: {
    padding: spacing.xs, // Smaller hit area is fine if icon is clear
  },
  headerTitle: {
    ...typography.h3,
    color: themeColors.textPrimary,
  },
  // Add a placeholder view to balance the header if needed
  headerPlaceholder: {
    width: 32, // Match approx back button size
  },
  listContainer: {
    paddingVertical: spacing.sm, 
    paddingHorizontal: spacing.md, 
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the top 
    paddingVertical: spacing.md, 
    marginBottom: spacing.lg, // Increase margin slightly for better separation
    borderBottomWidth: 1, // Add a subtle separator line
    borderBottomColor: themeColors.surface, 
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: themeColors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    width: 14, // Slightly larger indicator
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    bottom: -1, // Adjust position slightly
    right: -1,
    borderWidth: 2,
    borderColor: themeColors.background, 
  },
  online: {
    backgroundColor: '#4CAF50', // Green for online
  },
  offline: {
    backgroundColor: themeColors.textSecondary, // Gray for offline
  },
  userInfoContainer: {
    flex: 1, 
    marginRight: spacing.sm, 
  },
  userName: {
    ...typography.bodyStrong, 
    color: themeColors.textPrimary,
    marginBottom: 3, // Space below name
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Remove background pill for cleaner look
    // backgroundColor: themeColors.surface, 
    // paddingHorizontal: spacing.xs,
    // paddingVertical: 2,
    // borderRadius: 8,
    alignSelf: 'flex-start', // Align to the start
    marginBottom: 4, // Space below rating
  },
  ratingText: {
    ...typography.caption, // Make rating text same size as details
    color: themeColors.textSecondary, // Use secondary color
    marginLeft: 3, // Adjust spacing to star
    fontWeight: '500',
  },
  userDetails: {
    ...typography.caption, 
    color: themeColors.textSecondary,
    marginBottom: 4, // Space below details
  },
  userStatus: {
    ...typography.caption, 
    color: themeColors.textSecondary, 
    fontStyle: 'normal', 
  },
  talkButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 15, 
    alignSelf: 'center', // Vertically center button relative to row content
    marginLeft: 'auto', // Push button to the right
  },
  talkButtonText: {
    ...typography.buttonSmall, 
    color: themeColors.textOnPrimary,
    fontWeight: '600',
  },
});

export default VerifiedUsersScreen; 