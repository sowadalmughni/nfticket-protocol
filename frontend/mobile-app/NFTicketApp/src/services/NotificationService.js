/**
 * NotificationService
 * Manages push notifications via Firebase Cloud Messaging
 * @author Sowad Al-Mughni
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
// Note: Install @react-native-firebase/messaging and @react-native-firebase/app
// npm install @react-native-firebase/app @react-native-firebase/messaging
// Follow Firebase setup: https://rnfirebase.io/

let messaging = null;
try {
  // Firebase messaging - will be available after proper setup
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {
  console.warn('Firebase messaging not configured - push notifications disabled');
}

// API Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, authToken }) => {
  const [deviceToken, setDeviceToken] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);

  /**
   * Request notification permissions from the user
   */
  const requestPermission = useCallback(async () => {
    if (!messaging) {
      console.warn('Firebase messaging not available');
      return false;
    }

    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        // Android 13+ requires explicit permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setNotificationPermission('denied');
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      setNotificationPermission(enabled ? 'granted' : 'denied');
      return enabled;
    } catch (error) {
      console.error('Permission request error:', error);
      setNotificationPermission('error');
      return false;
    }
  }, []);

  /**
   * Get the FCM device token
   */
  const getDeviceToken = useCallback(async () => {
    if (!messaging) {
      console.warn('Firebase messaging not available');
      return null;
    }

    try {
      const token = await messaging().getToken();
      setDeviceToken(token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }, []);

  /**
   * Register device token with our backend
   */
  const registerWithBackend = useCallback(async () => {
    if (!authToken || !deviceToken) {
      console.warn('Cannot register: missing authToken or deviceToken');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deviceToken,
          platform: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      setIsRegistered(true);
      console.log('Device registered for push notifications');
      return true;
    } catch (error) {
      console.error('Backend registration error:', error);
      return false;
    }
  }, [authToken, deviceToken]);

  /**
   * Unregister device from push notifications
   */
  const unregister = useCallback(async () => {
    if (!authToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unregister`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        setIsRegistered(false);
        console.log('Device unregistered from push notifications');
      }
      return response.ok;
    } catch (error) {
      console.error('Unregister error:', error);
      return false;
    }
  }, [authToken]);

  /**
   * Initialize notifications - call this when app starts
   */
  const initialize = useCallback(async () => {
    if (!messaging) {
      console.warn('Push notifications not available - Firebase not configured');
      return false;
    }

    // 1. Request permission
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return false;
    }

    // 2. Get device token
    const token = await getDeviceToken();
    if (!token) {
      console.log('Failed to get device token');
      return false;
    }

    // 3. Register with backend if authenticated
    if (authToken) {
      await registerWithBackend();
    }

    return true;
  }, [requestPermission, getDeviceToken, registerWithBackend, authToken]);

  /**
   * Handle foreground notifications
   */
  useEffect(() => {
    if (!messaging) return;

    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification:', remoteMessage);
      setLastNotification(remoteMessage);

      // Show alert for foreground notifications
      Alert.alert(
        remoteMessage.notification?.title || 'NFTicket',
        remoteMessage.notification?.body || '',
        [{ text: 'OK' }]
      );
    });

    // Handle background -> foreground tap
    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      setLastNotification(remoteMessage);
      handleNotificationAction(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from quit state by notification:', remoteMessage);
          setLastNotification(remoteMessage);
          handleNotificationAction(remoteMessage);
        }
      });

    // Handle token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM token refreshed');
      setDeviceToken(newToken);
      if (authToken) {
        await registerWithBackend();
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
    };
  }, [authToken, registerWithBackend]);

  /**
   * Handle notification action based on type
   */
  const handleNotificationAction = (remoteMessage) => {
    const type = remoteMessage.data?.type;
    
    switch (type) {
      case 'ticket_purchased':
      case 'ticket_transferred':
        // Navigate to tickets screen
        // navigation.navigate('Tickets');
        break;
      case 'poap_claimed':
        // Navigate to POAPs screen
        // navigation.navigate('POAPs');
        break;
      case 'event_reminder':
        // Navigate to specific event/ticket
        break;
      default:
        console.log('Unknown notification type:', type);
    }
  };

  /**
   * Get registration status from backend
   */
  const checkRegistrationStatus = useCallback(async () => {
    if (!authToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const status = await response.json();
        setIsRegistered(status.registered);
        return status;
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
    return null;
  }, [authToken]);

  const value = {
    deviceToken,
    isRegistered,
    notificationPermission,
    lastNotification,
    initialize,
    requestPermission,
    registerWithBackend,
    unregister,
    checkRegistrationStatus,
    isAvailable: !!messaging,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
