# Simple Fix: Make Scheduled Notifications Work When App is Closed

## The scheduled notification is already implemented, but needs these Android permissions:

### Step 1: Update AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml` and add these permissions:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- ADD THESE PERMISSIONS -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <application>
        <!-- Your existing code -->
    </application>
</manifest>
```

### Step 2: Request Exact Alarm Permission (Android 12+)

The app needs to request permission to schedule exact alarms. Add this code to request permission:

Create a function in `services/NotifcationService.tsx`:

```typescript
import { Platform, Linking } from 'react-native';

async requestExactAlarmPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    try {
      // Check if permission is needed
      const canScheduleExactAlarms = await notifee.canScheduleExactAlarms();
      
      if (!canScheduleExactAlarms) {
        console.log('⚠️ Exact alarm permission not granted');
        
        // Open settings to allow exact alarms
        await Linking.openSettings();
        
        return false;
      }
      
      console.log('✅ Exact alarm permission granted');
      return true;
    } catch (error) {
      console.error('❌ Error checking alarm permission:', error);
      return false;
    }
  }
  return true;
}
```

### Step 3: Rebuild the App

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Step 4: Test

1. Start mining for **1 minute** (for quick testing)
2. **Close the app** (swipe away from recent apps)
3. Wait 1 minute
4. Notification should appear! 🎉

### Step 5: If Still Not Working

Some Android devices (Xiaomi, Huawei, Oppo) aggressively kill apps. User needs to:

1. Go to Settings → Apps → Your App
2. Enable "Autostart" or "Background activity"
3. Disable "Battery optimization" for your app

---

## Why This Should Work:

The `notifee.createTriggerNotification()` uses Android's AlarmManager which:
- ✅ Works when app is closed
- ✅ Works when device is locked
- ✅ Survives device reboot
- ✅ No external service needed

The notification is scheduled in the **Android system**, not in your app, so it will trigger even if the app is closed.

---

## If It Still Doesn't Work:

Then you have 2 options:

### Option A: Use Expo (Easiest)
If you're using Expo, their push notifications work out of the box:
```bash
npx expo install expo-notifications
```

### Option B: Accept that push services are needed
All major apps use push services for a reason - it's the only 100% reliable way.

---

## Current Status:

✅ Scheduled notification is implemented
✅ Backend checks every minute
✅ Frontend checks when app is open
⏳ Needs Android permissions to work when closed

Add the permissions above and rebuild - it should work! 🎉
