import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {TabScreenProps} from '../types/navigation';

const MenuScreen = ({navigation}: TabScreenProps<'Menu'>) => {
  const renderMenuItem = (title: string, icon: string, onPress: () => void) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.menuGrid}>
          {renderMenuItem('Verified Users', '✓', () => {})}
          {renderMenuItem('Unverified Users', '!', () => {})}
          {renderMenuItem('Premium Users', '⭐', () => {})}
          {renderMenuItem('Blocked Users', '🚫', () => {})}
          {renderMenuItem('Favorites', '❤️', () => {})}
          {renderMenuItem('Reports', '📊', () => {})}
        </View>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  menuGrid: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  menuItem: {
    width: '47%',
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default MenuScreen; 