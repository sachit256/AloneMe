import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ChatsScreen from '../screens/ChatsScreen';
import MenuScreen from '../screens/MenuScreen';
import ActivityScreen from '../screens/ActivityScreen';
import SettingsStackNavigator from './SettingsStack';
import {TabParamList} from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Tab = createBottomTabNavigator<TabParamList>();
const {width} = Dimensions.get('window');

const FloatingMenu = ({visible, onClose, onSelect}: any) => {
  const menuItems = [
    {id: 'verified', label: 'Verified Users', icon: 'check-decagram'},
    {id: 'unverified', label: 'Unverified Users', icon: 'account-alert-outline'},
    {id: 'premium', label: 'Premium Users', icon: 'star-outline'},
    {id: 'blocked', label: 'Blocked Users', icon: 'block-helper'},
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.menuContainer}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}>
              <View style={styles.menuIconWrapper}>
                <Icon name={item.icon} size={22} color="#00BFA6" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const TabIcon = ({
  focused,
  label,
  icon,
  isCenter = false,
}: {
  focused: boolean;
  label: string;
  icon: string;
  isCenter?: boolean;
}) => {
  if (isCenter) {
    return (
      <View style={styles.centerTabContainer}>
        <View style={styles.fabButton}>
          <Icon name={icon} size={28} color="#FFFFFF" />
        </View>
      </View>
    );
  }

  // For all other tabs, including Settings, use the default style (no background)
  return (
    <View style={styles.tabIconContainer}>
      <Icon
        name={icon}
        size={24}
        color={focused ? '#00BFA6' : '#888'}
        style={{ marginBottom: 2 }}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

const CustomTabBar = ({state, descriptors, navigation}: any) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuSelect = (itemId: string) => {
    console.log('Selected:', itemId);
    // Navigate based on the selected menu item ID
    switch (itemId) {
      case 'verified':
        // Navigate to the VerifiedUsers screen
        // Need access to the root stack navigator here
        // This usually requires passing the root navigation prop down or using NavigationContainerRef
        // For simplicity, let's assume we can dispatch an action to navigate
        // A more robust solution involves getting the root navigator
         navigation.navigate('VerifiedUsers'); // This might work if MainTabs is directly in the stack
        break;
      case 'unverified':
        // Navigate to the UnverifiedUsers screen
        navigation.navigate('UnverifiedUsers');
        break;
      case 'premium':
        // Handle other options
        break;
      case 'blocked':
        // Handle other options
        break;
      default:
        break;
    }
    setMenuVisible(false); // Close menu after selection
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const {options} = descriptors[route.key];
          const label = options.title ?? route.name;

          const isFocused = state.index === index;
          const isCenter = route.name === 'Menu'; // Only Menu tab is center FAB

          const onPress = () => {
            if (isCenter) {
              setMenuVisible(true);
              return;
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const getIcon = (routeName: string) => {
            switch (routeName) {
              case 'Home': return 'home-outline';
              case 'Chat': return 'chat-outline';
              case 'Menu': return 'plus';
              case 'Activity': return 'chart-bar';
              case 'Settings': return 'cog-outline';
              default: return 'help-circle-outline';
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={[styles.tab, isCenter && styles.centerTab]}>
              <TabIcon
                focused={isFocused}
                label={isCenter ? '' : label}
                icon={getIcon(route.name)}
                isCenter={isCenter}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Floating Menu for the center button action */}
      <FloatingMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelect={handleMenuSelect}
      />
    </View>
  );
};

const MainTabs = () => {
  const gender = useSelector((state: RootState) => state.auth.userProfile.gender);
  const isMale = gender && gender.toLowerCase() === 'male';

  // Define tabs dynamically based on gender
  const tabs = [
    {
      name: 'Home',
      component: HomeScreen,
      options: { title: isMale ? 'Verified Users' : 'Home' },
    },
    {
      name: 'Chat',
      component: ChatsScreen,
    },
    // Only add Menu and Activity for non-male users
    ...(!isMale
      ? [
          { name: 'Menu', component: MenuScreen },
          { name: 'Activity', component: ActivityScreen },
        ]
      : []),
    {
      name: 'Settings',
      component: SettingsStackNavigator,
    },
  ];

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      {tabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name as any}
          component={tab.component as any}
          options={tab.options}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTab: {
    marginTop: -30,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00BFA6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  iconText: {
    fontSize: 24,
    color: '#888',
    marginBottom: 2,
  },
  iconTextActive: {
    color: '#00BFA6',
  },
  tabLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#00BFA6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 15,
    width: width * 0.8,
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  menuLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default MainTabs; 