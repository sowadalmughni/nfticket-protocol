/**
 * NFTicket Mobile App
 * Main entry point with navigation configuration
 * @author Sowad Al-Mughni
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import screens
import TicketsScreen from './src/screens/TicketsScreen';
import WalletScreen from './src/screens/WalletScreen';
import POAPScreen from './src/screens/POAPScreen';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab icons (emoji-based for simplicity, can be replaced with icons library)
const getTabBarIcon = (routeName: string, focused: boolean) => {
  let icon = '';
  switch (routeName) {
    case 'Tickets':
      icon = '🎫';
      break;
    case 'POAPs':
      icon = '🏆';
      break;
    case 'Wallet':
      icon = '💳';
      break;
    default:
      icon = '📱';
  }
  return icon;
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icon = getTabBarIcon(route.name, focused);
          return (
            <StatusBar barStyle="dark-content">
              {/* Text component would go here in production */}
            </StatusBar>
          );
        },
        tabBarLabel: route.name,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Tickets" 
        component={TicketsScreen}
        options={{
          tabBarLabel: '🎫 Tickets',
        }}
      />
      <Tab.Screen 
        name="POAPs" 
        component={POAPScreen}
        options={{
          tabBarLabel: '🏆 POAPs',
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          tabBarLabel: '💳 Wallet',
        }}
      />
    </Tab.Navigator>
  );
}

// Root Stack Navigator (for modals and detail screens)
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
            {/* Add more stack screens for detail views here */}
            {/* <Stack.Screen name="TicketDetail" component={TicketDetailScreen} /> */}
            {/* <Stack.Screen name="POAPDetail" component={POAPDetailScreen} /> */}
            {/* <Stack.Screen name="Scanner" component={ScannerScreen} /> */}
            {/* <Stack.Screen name="ClaimPOAP" component={ClaimPOAPScreen} /> */}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
