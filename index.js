/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';

// Register background handler for notifications (CRITICAL for background/closed app)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('🔔 Background notification event:', type);
  
  if (type === EventType.DELIVERED) {
    console.log('✅ Notification delivered in background');
  }
  
  // You can handle other events here if needed
  // EventType.PRESS will be handled when app opens
});

AppRegistry.registerComponent(appName, () => App);
