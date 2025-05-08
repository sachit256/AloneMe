import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography, spacing } from '../styles/common';

const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textOnPrimary: '#FFFFFF',
};

export type VerifiedUserCardProps = {
  user: {
    id: string;
    user_id: string;
    display_name: string | null;
    age: number | null;
    emotional_story: string | null;
    is_online?: boolean;
    rating?: number | null;
    spentHours?: number | null;
  };
  onTalkNow: (user: any) => void;
  onViewProfile: (user: any) => void;
};

const VerifiedUserCard = ({ user, onTalkNow, onViewProfile }: VerifiedUserCardProps) => {
  const name = user.display_name || 'Anonymous';
  const avatarText = name.charAt(0).toUpperCase();
  const rating = user.rating || 4.5; // Placeholder
  const spentHours = user.spentHours || 0; // Placeholder

  return (
    <View style={styles.userCard}>
      <View style={styles.cardTopSection}>
        <TouchableOpacity onPress={() => onViewProfile(user)}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarText}</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: user.is_online ? '#00C853' : '#888' },
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName} numberOfLines={1}>{name}</Text>
          <View style={styles.detailsRow}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#FFC107" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.userDetails}>
              {user.age ? ` • ${user.age} yrs` : ''}
              {` • ${spentHours} hrs spent`}
            </Text>
          </View>
        </View>
      </View>
      {user.emotional_story ? (
        <Text style={styles.userStatus} numberOfLines={3}>{user.emotional_story}</Text>
      ) : (
        <Text style={[styles.userStatus, styles.userStatusPlaceholder]} numberOfLines={1}>
          No story shared yet.
        </Text>
      )}
      <View style={styles.cardBottomSection}>
        <TouchableOpacity
          style={styles.talkButton}
          onPress={() => onTalkNow(user)}
        >
          <Text style={styles.talkButtonText}>Talk Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  cardTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: themeColors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    ...typography.bodyStrong,
    color: themeColors.textPrimary,
    marginBottom: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  ratingText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    marginLeft: 3,
    fontWeight: '500',
  },
  userDetails: {
    ...typography.caption,
    color: themeColors.textSecondary,
    flexShrink: 1,
  },
  userStatus: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontStyle: 'normal',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  userStatusPlaceholder: {
    fontStyle: 'italic',
    color: '#666',
  },
  cardBottomSection: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  talkButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
  },
  talkButtonText: {
    ...typography.buttonSmall,
    color: themeColors.textOnPrimary,
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
});

export default VerifiedUserCard; 