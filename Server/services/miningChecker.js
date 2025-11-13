const cron = require('node-cron');
const MiningSession = require('../model/MiningSession.model');
const User = require('../model/User.model');

// Store which sessions we've already notified
const notifiedSessions = new Set();

// Check mining sessions every minute
function startMiningChecker() {
  console.log('✅ Mining checker started - checking every minute');
  
  // Run every minute: '* * * * *'
  cron.schedule('* * * * *', async () => {
    try {
      console.log('🔍 Checking for completed mining sessions...');
      
      // Find all active mining sessions
      const sessions = await MiningSession.find({ status: 'mining' });
      
      for (const session of sessions) {
        // Skip if we already notified this session
        if (notifiedSessions.has(session._id.toString())) {
          continue;
        }
        
        // Calculate if mining is complete
        const start = new Date(session.miningStartTime || session.createdDate).getTime();
        const now = Date.now();
        const planned = (session.selectedHour || 1) * 3600 * 1000; // milliseconds
        const elapsed = now - start;
        
        // If mining is complete
        if (elapsed >= planned) {
          const earnedAmount = (session.selectedHour * 3600 * 0.01 * (session.multiplier || 1)).toFixed(2);
          
          console.log(`⏰ Mining complete for session ${session._id}`);
          console.log(`   - User: ${session.walletId}`);
          console.log(`   - Earned: ${earnedAmount} CMT`);
          console.log(`   - Duration: ${session.selectedHour} hour(s)`);
          
          // Mark as notified
          notifiedSessions.add(session._id.toString());
          
          // TODO: Send push notification here
          // Options:
          // 1. Install OneSignal and configure ONESIGNAL_APP_ID in .env
          // 2. Use Firebase Cloud Messaging (FCM)
          // 3. Use Expo Push Notifications
          // 4. Install react-native-background-fetch for local notifications
          
          console.log('💡 To send actual push notifications when app is closed:');
          console.log('   - Option 1: Set up OneSignal (free, easiest)');
          console.log('   - Option 2: Install react-native-background-fetch');
          console.log('   - Option 3: Use Firebase/Expo push notifications');
          
          // Optional: You could also update the session status here
          // session.status = 'ready_to_claim';
          // await session.save();
        }
      }
    } catch (error) {
      console.error('❌ Error in mining checker:', error);
    }
  });
}

// Clean up old notified sessions every hour
function cleanupNotifiedSessions() {
  cron.schedule('0 * * * *', () => {
    console.log('🧹 Cleaning up notified sessions cache');
    notifiedSessions.clear();
  });
}

module.exports = {
  startMiningChecker,
  cleanupNotifiedSessions,
};
