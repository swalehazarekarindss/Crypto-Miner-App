import notifee, {
  AndroidImportance,
  EventType,
  Notification,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';
import {Platform} from 'react-native';

interface RewardData {
  title: string;
  amount: string;
  rewardId: string;
  description?: string;
}

class NotificationService {
  private navigation: any = null;
  private channelId = 'reward-channel';
  private isInitialized = false;

  // Initialize notification service
  async initialize(navigation: any) {
    if (this.isInitialized) return;

    this.navigation = navigation;
    await this.createChannel();
    await this.setupNotificationHandlers();
    await this.requestPermissions();
    this.isInitialized = true;

    console.log('✅ Notification Service Initialized');
  }

  // Update navigation reference (important for navigation to work)
  updateNavigation(navigation: any) {
    this.navigation = navigation;
    console.log('📱 Navigation reference updated');
  }

  // Create Android notification channel
  async createChannel() {
    await notifee.createChannel({
      id: this.channelId,
      name: 'Reward Notifications',
      description: 'Notifications for reward claims',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true, // Enable vibration
      vibrationPattern: [300, 500], // [delay, vibrate] - must be even number
      badge: true,
    });
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();

      const isAuthorized =
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

      console.log('📱 Notification Permission:', isAuthorized ? 'Granted' : 'Denied');
      return isAuthorized;
    } catch (error) {
      console.error('❌ Permission error:', error);
      return false;
    }
  }

  // Setup notification event handlers
  async setupNotificationHandlers() {
    // Handle notification press when app is in FOREGROUND or BACKGROUND
    notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS && detail.notification) {
        console.log('🔔 Notification pressed (foreground)');
        this.handleNotificationPress(detail.notification);
      }
    });

    // Handle notification press when app is CLOSED/KILLED
    notifee.onBackgroundEvent(async ({type, detail}) => {
      if (type === EventType.PRESS && detail.notification) {
        console.log('🔔 Notification pressed (background/closed)');
        // Notification will be handled by getInitialNotification when app opens
      }
    });
  }

  // Check if app was opened from notification (IMPORTANT for closed app)
  async getInitialNotification() {
    const initialNotification = await notifee.getInitialNotification();

    if (initialNotification) {
      console.log('🚀 App opened from notification');
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        this.handleNotificationPress(initialNotification.notification);
      }, 1000);
    }
  }

  // Handle notification press and navigate
  private handleNotificationPress(notification: Notification | undefined) {
    if (!notification?.data) {
      console.log('⚠️ No notification data found');
      return;
    }

    const {type, screen, sessionId, ...params} = notification.data as any;

    console.log('📍 Notification type:', type);
    console.log('📍 Navigating to:', screen, 'with data:', {sessionId, ...params});

    if (this.navigation && screen) {
      try {
        // Navigate based on notification type
        if (type === 'mining_complete') {
          // Navigate to Mining screen so user can claim
          this.navigation.navigate(screen, {
            sessionId,
            fromNotification: true,
          });
        } else if (type === 'reward_claimed') {
          // Navigate to Home screen after claim
          this.navigation.navigate(screen, {
            refresh: params.refresh === 'true',
            ...params,
          });
        } else {
          // Generic navigation
          this.navigation.navigate(screen, {
            sessionId,
            ...params,
          });
        }
      } catch (error) {
        console.error('❌ Navigation error:', error);
      }
    } else {
      console.warn('⚠️ Navigation not available');
    }
  }

  // 🎉 MAIN METHOD: Show reward claimed notification
  async showRewardClaimedNotification(rewardData: RewardData): Promise<string | null> {
    try {
      const notificationId = await notifee.displayNotification({
        title: '🎉 Reward Claimed Successfully!',
        body: `You've earned ${rewardData.amount}! Tap to view details.`,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          smallIcon: 'ic_notification',
          color: '#4CAF50',
          sound: 'default',
          vibrationPattern: [300, 500, 300],
          showTimestamp: true,
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
        data: {
          type: 'reward_claimed',
          screen: 'RewardDetails',
          rewardId: rewardData.rewardId,
          amount: rewardData.amount,
          title: rewardData.title,
        },
      });

      console.log('✅ Notification shown with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return null;
    }
  }

  // Show custom notification with flexible data
  async showCustomNotification(
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<string | null> {
    try {
      const notificationId = await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          smallIcon: 'ic_launcher',
          color: '#10b981',
          sound: 'default',
          vibrationPattern: [300, 500], // [delay, vibrate] - must be even number of elements
          showTimestamp: true,
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
        data,
      });

      console.log('✅ Custom notification shown with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Error showing custom notification:', error);
      return null;
    }
  }

  // Cancel specific notification
  async cancelNotification(notificationId: string) {
    await notifee.cancelNotification(notificationId);
    console.log('🗑️ Notification cancelled:', notificationId);
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    await notifee.cancelAllNotifications();
    console.log('🗑️ All notifications cancelled');
  }

  // Get displayed notifications
  async getDisplayedNotifications() {
    const notifications = await notifee.getDisplayedNotifications();
    console.log('📋 Currently displayed notifications:', notifications.length);
    return notifications;
  }

  // Schedule notification for when mining completes
  async scheduleMiningCompleteNotification(
    miningStartTime: Date,
    durationHours: number,
    earnedAmount: number,
    sessionId: string
  ): Promise<string | null> {
    try {
      // Calculate when the mining will complete
      const completionTime = new Date(miningStartTime.getTime() + durationHours * 3600 * 1000);
      const now = new Date();
      
      const secondsUntilCompletion = Math.floor((completionTime.getTime() - now.getTime()) / 1000);
      
      console.log('   - Will complete at:', completionTime.toLocaleString());
      console.log('   - Time until completion:', Math.floor((completionTime.getTime() - now.getTime()) / 1000), 'seconds');
      
      // Create trigger for the exact completion time
      const trigger: any = {
        type: TriggerType.TIMESTAMP,
        timestamp: completionTime.getTime(),
      };
      
      // Schedule the notification
      const notificationId = await notifee.createTriggerNotification(
        {
          id: `mining-complete-${sessionId}`,
          title: '⏰ Mining Complete!',
          body: `Your rewards are ready! You earned ${earnedAmount.toFixed(2)} CMT. Tap to claim now!`,
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            smallIcon: 'ic_launcher',
            color: '#10b981',
            sound: 'default',
            vibrationPattern: [300, 500],
            showTimestamp: true,
          },
          ios: {
            sound: 'default',
            foregroundPresentationOptions: {
              alert: true,
              badge: true,
              sound: true,
            },
          },
          data: {
            type: 'mining_complete',
            screen: 'Mining',
            sessionId: String(sessionId),
          },
        },
        trigger
      );
      
      console.log('✅ Scheduled notification ID:', notificationId);
      
      // Verify the notification was scheduled
      const triggers = await notifee.getTriggerNotifications();
      console.log('📋 Total scheduled notifications:', triggers.length);
      const ourNotif = triggers.find(t => t.notification.id === `mining-complete-${sessionId}`);
      if (ourNotif) {
        console.log('✅ Verified: Notification is scheduled');
        console.log('   - Trigger type:', ourNotif.trigger.type);
      } else {
        console.log('⚠️ Warning: Notification not found in scheduled list');
      }
      
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel scheduled mining notification
  async cancelScheduledMiningNotification(sessionId: string) {
    try {
      await notifee.cancelNotification(`mining-complete-${sessionId}`);
      console.log('🗑️ Cancelled scheduled notification for session:', sessionId);
    } catch (error) {
      console.error('❌ Error cancelling scheduled notification:', error);
    }
  }
}

export default new NotificationService();