class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.registration = null;
  }

  // Initialize the service
  async init() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.isSupported && this.permission === 'granted';
  }

  // Schedule a daily notification
  async scheduleDailyNotification(hour, minute) {
    if (!this.isEnabled()) {
      throw new Error('Notifications not enabled');
    }

    // Store notification time in localStorage
    const notificationTime = { hour, minute };
    localStorage.setItem('dailyNotificationTime', JSON.stringify(notificationTime));

    // Schedule the notification
    await this.scheduleNotification(hour, minute);
  }

  // Schedule notification for specific time
  async scheduleNotification(hour, minute) {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    // Schedule the notification
    setTimeout(() => {
      this.showNotification();
      // Schedule next day's notification
      this.scheduleNotification(hour, minute);
    }, delay);
  }

  // Show immediate notification
  async showNotification(
    title = 'Daily Inventory Reminder',
    body = 'Time to complete your daily inventory!'
  ) {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.registration.showNotification(title, {
        body,
        icon: '/assets/images/icons/favicon-192x192.png',
        badge: '/assets/images/icons/favicon-32x32.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        actions: [
          {
            action: 'open',
            title: 'Open App',
            icon: '/assets/images/icons/favicon-32x32.png',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/assets/images/icons/favicon-32x32.png',
          },
        ],
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Get current notification time
  getNotificationTime() {
    const stored = localStorage.getItem('dailyNotificationTime');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  // Cancel all notifications
  async cancelNotifications() {
    localStorage.removeItem('dailyNotificationTime');

    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      notifications.forEach((notification) => notification.close());
    }
  }

  // Test notification
  async testNotification() {
    if (!this.isEnabled()) {
      throw new Error('Notifications not enabled');
    }

    await this.showNotification(
      'Test Notification',
      'This is a test notification from Daily Inventory!'
    );
  }
}

export default NotificationService;
