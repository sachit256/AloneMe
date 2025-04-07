import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {TabScreenProps} from '../types/navigation';

type Listener = {
  id: string;
  name: string;
  age: number;
  gender: string;
  story: string;
  rating: number;
  experience: string;
  verified: boolean;
  online: boolean;
};

const DUMMY_LISTENERS: Listener[] = [
  {
    id: '1',
    name: 'John Smith',
    age: 28,
    gender: 'Male',
    story: 'Here to help and support others through difficult times...',
    rating: 4.8,
    experience: '2 years',
    verified: true,
    online: true,
  },
  {
    id: '2',
    name: 'Emma Wilson',
    age: 32,
    gender: 'Female',
    story: 'Certified counselor with experience in anxiety and depression...',
    rating: 4.9,
    experience: '4 years',
    verified: true,
    online: false,
  },
];

const OthersScreen = ({navigation}: TabScreenProps<'Others'>) => {
  const [filter, setFilter] = useState<'all' | 'verified' | 'online'>('all');

  const renderListener = ({item}: {item: Listener}) => (
    <View style={styles.listenerCard}>
      <View style={styles.listenerHeader}>
        <View style={styles.avatar} />
        <View style={styles.listenerInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.demographics}>
            {item.age} • {item.gender}
          </Text>
        </View>
        {item.online && <View style={styles.onlineIndicator} />}
      </View>

      <Text style={styles.story} numberOfLines={2}>
        {item.story}
      </Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.experience}</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.chatButton}>
        <Text style={styles.chatButtonText}>Chat Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Listeners</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}>
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'verified' && styles.filterActive,
          ]}
          onPress={() => setFilter('verified')}>
          <Text
            style={[
              styles.filterText,
              filter === 'verified' && styles.filterTextActive,
            ]}>
            Verified
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'online' && styles.filterActive,
          ]}
          onPress={() => setFilter('online')}>
          <Text
            style={[
              styles.filterText,
              filter === 'online' && styles.filterTextActive,
            ]}>
            Online
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={DUMMY_LISTENERS}
        renderItem={renderListener}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: '#00BFA6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
  },
  listenerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listenerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  listenerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  demographics: {
    fontSize: 14,
    color: '#757575',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  story: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 10,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stat: {
    marginRight: 20,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
  },
  verifiedBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#00BFA6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OthersScreen; 