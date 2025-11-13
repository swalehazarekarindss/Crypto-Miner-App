# Install OneSignal for Background Notifications

## Step 1: Create OneSignal Account

1. Go to https://onesignal.com/
2. Sign up for free
3. Create a new app
4. Select "Google Android (FCM)" platform
5. You'll get an **App ID** - save this!

## Step 2: Install OneSignal Package

```bash
npm install react-native-onesignal
```

## Step 3: Android Setup

### 3.1 Update `android/build.gradle`:
```gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 21
        compileSdkVersion = 33
        targetSdkVersion = 33
        
        // Add this
        googlePlayServicesVersion = "17.0.0"
    }
}
```

### 3.2 Update `android/app/build.gradle`:
```gradle
dependencies {
    // Add this
    implementation 'com.onesignal:OneSignal:[5.0.0, 5.99.99]'
}
```

### 3.3 Update `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest>
    <application>
        <!-- Add this -->
        <meta-data
            android:name="onesignal_app_id"
            android:value="YOUR_ONESIGNAL_APP_ID" />
    </application>
</manifest>
```

## Step 4: Initialize OneSignal in App

Create `services/OneSignalService.ts`:
```typescript
import OneSignal from 'react-native-onesignal';

const ONESIGNAL_APP_ID = 'YOUR_ONESIGNAL_APP_ID';

export const initOneSignal = () => {
  OneSignal.setAppId(ONESIGNAL_APP_ID);
  
  // Prompt for push notification permissions
  OneSignal.promptForPushNotificationsWithUserResponse();
  
  // Handle notification opened
  OneSignal.setNotificationOpenedHandler((notification) => {
    console.log('OneSignal: notification opened:', notification);
  });
};

export const setUserTag = (walletId: string) => {
  OneSignal.sendTag('walletId', walletId);
};

export const getPlayerId = async (): Promise<string | null> => {
  const deviceState = await OneSignal.getDeviceState();
  return deviceState?.userId || null;
};
```

## Step 5: Update Backend to Send Notifications

Install OneSignal SDK on backend:
```bash
cd Server
npm install onesignal-node
```

Update `Server/services/miningChecker.js`:
```javascript
const OneSignal = require('onesignal-node');

const client = new OneSignal.Client({
  userAuthKey: 'YOUR_USER_AUTH_KEY',
  app: {
    appAuthKey: 'YOUR_REST_API_KEY',
    appId: 'YOUR_ONESIGNAL_APP_ID'
  }
});

// In the mining checker
if (elapsed >= planned) {
  // Send push notification via OneSignal
  const notification = {
    contents: {
      en: `Your rewards are ready! You earned ${earnedAmount} CMT. Tap to claim now!`
    },
    headings: {
      en: '⏰ Mining Complete!'
    },
    filters: [
      { field: 'tag', key: 'walletId', relation: '=', value: session.walletId }
    ]
  };
  
  await client.createNotification(notification);
  console.log('✅ Push notification sent!');
}
```

## Step 6: Test

1. Start the app
2. OneSignal will ask for notification permission - Allow it
3. Start mining for 1 minute
4. Close the app completely
5. Wait 1 minute
6. You should receive a push notification! 🎉

## Alternative: Use Expo Notifications (If using Expo)

If you're using Expo, it's even easier:
```bash
npx expo install expo-notifications
```

Then follow Expo's push notification guide.
