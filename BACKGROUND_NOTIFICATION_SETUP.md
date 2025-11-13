# Background Notification Setup

## Option 1: Install react-native-background-fetch (Recommended)

### Step 1: Install the package
```bash
npm install react-native-background-fetch
```

### Step 2: Link (for React Native < 0.60)
```bash
npx react-native link react-native-background-fetch
```

### Step 3: Android Setup
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest>
    <application>
        <!-- Add this -->
        <service android:name="com.transistorsoft.rnbackgroundfetch.HeadlessTask" />
    </application>
</manifest>
```

### Step 4: Test
- Start mining
- Close the app completely
- Wait 15 minutes
- Notification should appear when mining completes

---

## Option 2: Use Notifee Trigger Notifications (Already Implemented)

The scheduled notification using `notifee.createTriggerNotification()` should work, but it requires:

### Android 12+ Requirements:
1. **Exact Alarm Permission** - Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
```

2. **Request Permission at Runtime**:
Already implemented in NotificationService.

### Test Scheduled Notification:
1. Start mining for 1 minute (for quick testing)
2. Close the app
3. Wait 1 minute
4. Notification should appear

---

## Option 3: Backend Push Notifications (Most Reliable)

### Backend Implementation:
1. Install on backend: `npm install node-cron axios`
2. Add cron job to check mining sessions every minute
3. Send push notification when mining completes

### Backend Code (Node.js):
```javascript
const cron = require('node-cron');
const axios = require('axios');

// Check every minute
cron.schedule('* * * * *', async () => {
  const sessions = await MiningSession.find({ status: 'mining' });
  
  for (const session of sessions) {
    const elapsed = (Date.now() - session.miningStartTime) / 1000;
    const planned = session.selectedHour * 3600;
    
    if (elapsed >= planned) {
      // Send notification via FCM or OneSignal
      // Or update session and let app poll
      console.log('Mining complete for session:', session._id);
    }
  }
});
```

---

## Current Implementation Status

✅ **Works when app is open** (HomeScreen or MiningScreen)
✅ **Scheduled notification** (may work on some devices)
❌ **Guaranteed background** (needs Option 1 or 3)

## Recommendation

For production, use **Option 3 (Backend Push)** as it's most reliable across all devices.
For testing, try **Option 2 (Scheduled Notification)** first as it's already implemented.
