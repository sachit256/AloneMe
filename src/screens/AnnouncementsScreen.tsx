import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { RootStackScreenProps, RootStackParamList } from '../types/navigation';
import { typography, spacing } from '../styles/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../lib/supabase';

const themeColors = {
  background: '#1E1E1E',
  surface: '#2A2A2A',
  primary: '#00BFA6',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  danger: '#FF5252',
};

type AnnouncementItem = {
  id: string;
  created_at: string;
  title: string;
  message: string;
  type: 'text' | 'link' | 'image' | 'button';
  image_url?: string | null;
  link_url?: string | null;
  button_text?: string | null;
  button_action_type?: 'url' | 'navigate' | null;
  button_action_target?: string | null;
  publish_at?: string | null;
  expires_at?: string | null;
};

const AnnouncementsScreen = ({
  navigation,
}: RootStackScreenProps<'Announcements'>) => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const { data, error: fetchError } = await supabase
          .from('announcements')
          .select('*')
          .lte('publish_at', now)
          .or(`expires_at.gt.${now},expires_at.is.null`)
          .order('publish_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }
        setAnnouncements(data || []);
      } catch (err: any) {
        console.error("Error fetching announcements:", err);
        setError("Failed to load announcements.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleLinkPress = async (url: string | null | undefined) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn(`Cannot open URL: ${url}`);
    }
  };

  const handleButtonPress = (item: AnnouncementItem) => {
    if (!item.button_action_type || !item.button_action_target) return;

    if (item.button_action_type === 'url') {
      handleLinkPress(item.button_action_target);
    } else if (item.button_action_type === 'navigate') {
      if (/^[A-Z]/.test(item.button_action_target)) {
        try {
          navigation.navigate(item.button_action_target as keyof RootStackParamList);
        } catch (navError) {
          console.error(`Navigation Error: Could not navigate to "${item.button_action_target}". Is it defined?`, navError);
        }
      } else {
        console.warn(`Invalid navigation target: ${item.button_action_target}`);
      }
    }
  };

  const renderAnnouncement = ({ item }: { item: AnnouncementItem }) => (
    <View style={styles.announcementItem}>
      {item.type === 'image' && item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.announcementImage} resizeMode="cover" />
      )}
      <View style={[
          styles.announcementTextContent,
          item.type !== 'image' && styles.textContentPaddingTop
      ]}>
         <Text style={styles.announcementTitle}>{item.title}</Text>
         <Text style={styles.announcementMessage}>{item.message}</Text>
         {item.type === 'link' && item.link_url && (
            <TouchableOpacity onPress={() => handleLinkPress(item.link_url)}>
                <Text style={styles.linkText}>{item.link_url}</Text>
            </TouchableOpacity>
         )}
         <Text style={styles.announcementDate}>{formatDateTime(item.publish_at || item.created_at)}</Text>
      </View>
      {item.type === 'button' && item.button_text && (
           <TouchableOpacity
             style={styles.actionButton}
             onPress={() => handleButtonPress(item)}
            >
             <Text style={styles.actionButtonText}>{item.button_text}</Text>
           </TouchableOpacity>
       )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading && (
         <View style={styles.centered}><ActivityIndicator size="large" color={themeColors.primary} /></View>
      )}
      {!loading && error && (
          <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      )}
      {!loading && !error && (
         <FlatList
            data={announcements}
            renderItem={renderAnnouncement}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContainer, announcements.length === 0 && styles.listContainerEmpty]}
            ListEmptyComponent={() => (
               <View style={styles.centered}><Text style={styles.emptyText}>No announcements yet.</Text></View>
            )}
        />
      )}
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
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
  },
  listContainerEmpty: {
    flexGrow: 1,
  },
  announcementItem: {
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  announcementImage: {
     width: '100%',
     height: 150,
  },
  announcementTextContent: {
     paddingHorizontal: spacing.md,
     paddingBottom: spacing.md,
  },
  textContentPaddingTop: {
     paddingTop: spacing.md,
  },
  announcementTitle: {
    ...typography.bodyStrong,
    color: themeColors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  announcementMessage: {
    ...typography.body,
    color: themeColors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: (typography.body?.fontSize ?? 14) * 1.4,
  },
  linkText: {
     ...typography.body,
     color: themeColors.primary,
     textDecorationLine: 'underline',
     marginBottom: spacing.md,
  },
  announcementDate: {
    ...typography.caption,
    color: themeColors.textSecondary,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  actionButton: {
     backgroundColor: themeColors.primary,
     paddingVertical: spacing.sm + 2,
     paddingHorizontal: spacing.md,
     margin: spacing.md,
     borderRadius: 6,
     alignItems: 'center',
  },
  actionButtonText: {
      ...typography.button,
      color: '#FFFFFF',
      fontWeight: '600',
  },
   centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
   errorText: {
       color: themeColors.danger,
       ...typography.h4,
       textAlign: 'center',
   },
});

export default AnnouncementsScreen; 