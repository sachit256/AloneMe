import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { RootStackScreenProps } from '../types/navigation';
import { typography, spacing } from '../styles/common'; // Adjust path if needed
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define theme colors (or import from common styles)
const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
};

// Placeholder data - replace with fetched data later
const placeholderNotifications = [
  { id: '1', title: 'New Feature Update!', message: 'Check out the latest improvements to call quality.', date: '2024-07-27' },
  { id: '2', title: 'Scheduled Maintenance', message: 'App will be briefly unavailable on Sunday.', date: '2024-07-25' },
  { id: '3', title: 'Welcome Bonus', message: 'Your welcome bonus has been applied.', date: '2024-07-24' },
];

type NotificationItem = typeof placeholderNotifications[0];

const NotificationsScreen = ({
  navigation,
}: RootStackScreenProps<'Notifications'>) => {
  // TODO: Add state and useEffect to fetch actual notifications from DB/API

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <View style={styles.notificationItem}>
      <Icon name="bell-outline" size={24} color={themeColors.primary} style={styles.notificationIcon} />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationDate}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />{/* Placeholder */}
      </View>
      <FlatList
        data={placeholderNotifications} // Use fetched data later
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
           <View style={styles.centered}>
              <Text style={styles.emptyText}>No notifications yet.</Text>
           </View>
        )}
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
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: themeColors.textPrimary,
    textAlign: 'center',
  },
  listContainer: {
    padding: spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.bodyStrong,
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    ...typography.body,
    color: themeColors.textSecondary,
    marginBottom: spacing.xs,
  },
  notificationDate: {
    ...typography.caption,
    color: themeColors.textSecondary,
    alignSelf: 'flex-end',
  },
   centered: {
    flex: 1,
    marginTop: 100, // Adjust as needed
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
});

export default NotificationsScreen; 