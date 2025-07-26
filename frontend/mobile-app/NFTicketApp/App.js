/**
 * NFTicket Mobile App
 * Main application component with navigation and providers
 * @author Sowad Al-Mughni
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Providers
import { WalletProvider } from './src/services/WalletService';
import { TicketProvider } from './src/services/TicketService';
import { POAPProvider } from './src/services/POAPService';

// Screens
import TicketsScreen from './src/screens/TicketsScreen';
import POAPScreen from './src/screens/POAPScreen';
import WalletScreen from './src/screens/WalletScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import TicketDetailScreen from './src/screens/TicketDetailScreen';
import POAPDetailScreen from './src/screens/POAPDetailScreen';
import ClaimPOAPScreen from './src/screens/ClaimPOAPScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator for main screens
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🎫</Text>
          ),
        }}
      />
      <Tab.Screen
        name="POAPs"
        component={POAPScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏆</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📱</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👛</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator for the entire app
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="TicketDetail" 
          component={TicketDetailScreen}
          options={{
            headerShown: true,
            title: 'Ticket Details',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#111827',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="POAPDetail" 
          component={POAPDetailScreen}
          options={{
            headerShown: true,
            title: 'POAP Details',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#111827',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="ClaimPOAP" 
          component={ClaimPOAPScreen}
          options={{
            headerShown: true,
            title: 'Claim POAP',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#111827',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <WalletProvider>
      <TicketProvider>
        <POAPProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar
              barStyle="dark-content"
              backgroundColor="#FFFFFF"
            />
            <AppNavigator />
          </SafeAreaView>
        </POAPProvider>
      </TicketProvider>
    </WalletProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default App;

