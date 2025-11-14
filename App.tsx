/*
import {StatusBar} from 'react-native';
import SplashScreen from './Component/SplashScreen';
import AuthNavigator from './Component/AuthNavigator';
import NotificationService from './services/NotifcationService';
import React, {useState, useEffect, useRef} from 'react';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const navigationRef = useRef<any>(null);


  useEffect(() => {
    
    if (!showSplash && navigationRef.current) {
      initializeNotifications();
    }
  }, [showSplash]);

  const initializeNotifications = async () => {
    try
      setTimeout(async () => {
        await NotificationService.initialize(navigationRef.current);
        
        
        await NotificationService.getInitialNotification();
      }, 500);
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  };




  if (showSplash) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
       <AuthNavigator navigationRef={navigationRef} />
    </>
  );
}

export default App;
*/
import React, {useState, useEffect, useRef} from 'react';
import {StatusBar, AppState, AppStateStatus} from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import SplashScreen from './Component/SplashScreen';
import AuthNavigator from './Component/AuthNavigator';
import NotificationService from './services/NotifcationService';
import mobileAds from 'react-native-google-mobile-ads';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const navigationRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
   mobileAds()
    .initialize()
    .then(adapterStatuses => {
      console.log("🔥 AdMob Initialized:", adapterStatuses);
    })
    .catch(err => {
      console.log("❌ AdMob Init Error:", err);
    });

  // ✅ Initialize notification service early
  initializeNotifications();

    initializeNotifications();

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);


useEffect(() => {
    // Setup foreground notification listeners after navigation is ready
    if (!showSplash && navigationRef.current) {
      setupForegroundListeners();
    }
  }, [showSplash]);

  const initializeNotifications = async () => {
    try {
      // Initialize notification service
      const initialized = await NotificationService.initialize();
      
      if (initialized) {
        console.log('✅ Notification service initialized');
      } else {
        console.warn('⚠️ Notification permissions denied');
      }
    } catch (error) {
      console.error('❌ Notification initialization error:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('📱 App has come to the foreground');
      // Check if there are any pending notification actions
      checkPendingNotifications();
    }

    appState.current = nextAppState;
  };

  const checkPendingNotifications = async () => {
    try {
      // Check initial notification when app comes to foreground
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        handleNotificationPress(initialNotification.notification.data);
      }
    } catch (error) {
      console.error('Error checking pending notifications:', error);
    }
  };

  const setupForegroundListeners = () => {
    // Handle notification press when app is in FOREGROUND
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      console.log('🔔 Foreground notification event:', type);

      if (type === EventType.PRESS) {
        const data = detail.notification?.data;
        console.log('📱 Notification pressed (foreground):', data);
        handleNotificationPress(data);
      }
    });

    // Handle notification press when app is in BACKGROUND or QUIT
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('🔔 Background notification event:', type);

      if (type === EventType.PRESS) {
        const data = detail.notification?.data;
        console.log('📱 Notification pressed (background):', data);
        // Background handler runs before app is fully ready
        // Store the data to be handled when app opens
        // You might need AsyncStorage for this
      }
    });

    return unsubscribeForeground;
  };

  const handleNotificationPress = (data: any) => {
    if (!navigationRef.current || !data) {
      console.log('⚠️ Navigation not ready or no data');
      return;
    }

    console.log('🎯 Handling notification:', data);

    try {
      switch (data.type) {
        case 'mining_complete':
          // Navigate to mining screen
          navigationRef.current.navigate('Mining', {
            sessionId: data.sessionId,
          });
          break;

        case 'reward_claimed':
          // Navigate to home screen
          navigationRef.current.navigate('Home', {
            refresh: true,
          });
          break;

        default:
          console.log('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  if (showSplash) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <AuthNavigator ref={navigationRef} />
    </>
  );
}

export default App;