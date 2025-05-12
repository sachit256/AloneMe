import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { typography, spacing, colors } from '../styles/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

type User = {
  id: string;
  display_name: string;
  age: number;
  gender: string;
  aloneme_user_id?: string;
  verification_status?: string;
};

type FilterState = {
  gender: 'all' | 'male' | 'female';
  ageRange: [number, number];
};

// Helper to get initials from display_name
const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    gender: 'all',
    ageRange: [18, 60],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user ID on mount
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    fetchUserId();
  }, []);

  // Only fetch users when explicitly requested
  const handleSearch = async () => {
    if (!currentUserId) return; // Don't search until user ID is loaded
    setLoading(true);
    try {
      let query = supabase
        .from('user_preferences')
        .select('user_id, display_name, age, gender, aloneme_user_id, verification_status');

      // Exclude current user
      query = query.neq('user_id', currentUserId);

      // Apply gender filter
      if (filters.gender !== 'all') {
        query = query.eq('gender', filters.gender);
      }

      // Apply age range filter
      query = query
        .gte('age', filters.ageRange[0])
        .lte('age', filters.ageRange[1]);

      // Apply search query if exists
      if (searchQuery) {
        query = query.or(`display_name.ilike.%${searchQuery}%,aloneme_user_id.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Transform the data to match the User type
      const transformedData = (data || []).map(user => ({
        id: user.user_id,
        display_name: user.display_name,
        age: user.age,
        gender: user.gender,
        aloneme_user_id: user.aloneme_user_id,
        verification_status: user.verification_status,
      }));
      setUsers(transformedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard}>
      <View style={styles.userAvatarInitials}>
        <Text style={styles.avatarInitialsText}>{getInitials(item.display_name)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.display_name}
          {item.verification_status === 'verified' && (
            <Icon name="check-decagram" size={16} color="#00BFA6" style={{ marginLeft: 4 }} />
          )}
        </Text>
        {item.aloneme_user_id && item.gender?.toLowerCase() === 'female' && (
          <Text style={styles.userId}>{item.aloneme_user_id}</Text>
        )}
        <Text style={styles.userDetails}>
          {item.age} years • {item.gender}
        </Text>
      </View>
      <TouchableOpacity style={styles.chatButton}>
        <Icon name="chat-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Gender</Text>
        <View style={styles.genderButtons}>
          {['all', 'male', 'female'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderButton,
                filters.gender === gender && styles.genderButtonActive,
              ]}
              onPress={() => setFilters({ ...filters, gender: gender as FilterState['gender'] })}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  filters.gender === gender && styles.genderButtonTextActive,
                ]}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Age Range</Text>
        <View style={styles.ageRangeContainer}>
          <Text style={styles.ageRangeText}>
            {filters.ageRange[0]} - {filters.ageRange[1]} years
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={18}
            maximumValue={60}
            step={1}
            value={filters.ageRange[1]}
            onValueChange={(value: number) =>
              setFilters({
                ...filters,
                ageRange: [filters.ageRange[0], value],
              })
            }
            minimumTrackTintColor="#00BFA6"
            maximumTrackTintColor={colors.surface}
            thumbTintColor="#00BFA6"
          />
        </View>
      </View>
      {/* Search Button below filters */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={26} color="#00BFA6" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or AloneMe ID"
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon
            name={showFilters ? 'filter-variant' : 'filter-outline'}
            size={24}
            color="#00BFA6"
          />
        </TouchableOpacity>
      </View>

      {showFilters && renderFilters()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={users.length === 0 ? { flex: 1 } : styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="account-search" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
  },
  filterButton: {
    padding: spacing.sm,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text.secondary,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#00BFA6',
    borderColor: '#00BFA6',
  },
  genderButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  genderButtonTextActive: {
    color: colors.text.primary,
  },
  ageRangeContainer: {
    paddingHorizontal: spacing.sm,
  },
  ageRangeText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  listContainer: {
    padding: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  userAvatarInitials: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    ...typography.h6,
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.subtitle1,
    color: colors.text.primary,
  },
  userDetails: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  chatButton: {
    padding: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  searchButton: {
    marginTop: spacing.md,
    backgroundColor: '#00BFA6',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  searchButtonText: {
    ...typography.button,
    color: '#fff'
  },
  userId: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
});

export default SearchScreen; 