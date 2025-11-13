
import {StatusBar} from 'react-native';
import SplashScreen from './Component/SplashScreen';
import AuthNavigator from './Component/AuthNavigator';
import NotificationService from './services/NotifcationService';
import React, {useState, useEffect, useRef} from 'react';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const navigationRef = useRef<any>(null);


  useEffect(() => {
    // Initialize notifications after splash screen is done
    if (!showSplash && navigationRef.current) {
      initializeNotifications();
    }
  }, [showSplash]);

  const initializeNotifications = async () => {
    try {
      // Small delay to ensure navigation is fully ready
      setTimeout(async () => {
        await NotificationService.initialize(navigationRef.current);
        
        // ⭐ IMPORTANT: Check if app was opened from notification
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
