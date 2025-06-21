class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.registration = null;
    this.isFirefox = navigator.userAgent.includes('Firefox');
    this.isSecure =
      window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    this.pushSubscription = null;
    this.firebaseMessaging = null;
  }

  // Initialize the service
  async init() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    // Firefox requires HTTPS for notifications
    if (this.isFirefox && !this.isSecure) {
      console.warn('Firefox requires HTTPS for notifications');
      return false;
    }

    try {
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');

      if (existingRegistration) {
        this.registration = existingRegistration;
        console.log('Service Worker already registered:', this.registration);
      } else {
        // Register service worker
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', this.registration);
      }

      // Wait for the service worker to be ready
      if (this.registration.installing) {
        console.log('Service worker installing...');
        await new Promise((resolve) => {
          this.registration.installing.addEventListener('statechange', () => {
            if (
              this.registration.installing &&
              this.registration.installing.state === 'installed'
            ) {
              resolve();
            }
          });
        });
      }

      // Wait for the service worker to be activated
      if (this.registration.waiting) {
        console.log('Service worker waiting...');
        await new Promise((resolve) => {
          this.registration.waiting.addEventListener('statechange', () => {
            if (this.registration.waiting && this.registration.waiting.state === 'activated') {
              resolve();
            }
          });
        });
      }

      // Ensure we have an active service worker
      if (!this.registration.active) {
        console.log('Waiting for service worker to activate...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Service worker activation timeout'));
          }, 10000); // 10 second timeout

          const checkActive = () => {
            if (this.registration.active) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(checkActive, 100);
            }
          };
          checkActive();
        });
      }

      console.log('Service worker ready:', this.registration.active);
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

  // Check if the current environment supports notifications
  isEnvironmentSupported() {
    if (!this.isSupported) {
      return false;
    }

    // Firefox requires HTTPS for notifications
    if (this.isFirefox && !this.isSecure) {
      return false;
    }

    return true;
  }

  // Get browser-specific notification status
  getNotificationStatus() {
    if (!this.isSupported) {
      return 'not-supported';
    }

    if (this.isFirefox && !this.isSecure) {
      return 'firefox-https-required';
    }

    if (this.permission === 'denied') {
      return 'permission-denied';
    }

    if (this.permission === 'default') {
      return 'permission-not-requested';
    }

    return 'enabled';
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

    // Firefox requires HTTPS for notifications
    if (this.isFirefox && !this.isSecure) {
      console.warn('Firefox requires HTTPS for notifications');
      return;
    }

    try {
      // Ensure service worker is ready
      if (!this.registration || !this.registration.active) {
        console.log('Service worker not ready, attempting to register...');
        await this.init();
      }

      // Double-check if registration is available
      if (!this.registration || !this.registration.active) {
        throw new Error('Service worker not available');
      }

      // Create notification options based on browser support
      const notificationOptions = {
        body,
        icon: '/assets/images/icons/favicon-192x192.png',
        badge: '/assets/images/icons/favicon-32x32.png',
        requireInteraction: false,
      };

      // Add features that Firefox may not support
      if (!this.isFirefox) {
        notificationOptions.vibrate = [200, 100, 200];
        notificationOptions.actions = [
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
        ];
      }

      await this.registration.showNotification(title, notificationOptions);
    } catch (error) {
      console.error('Error showing notification:', error);

      // Fallback to browser notification if service worker fails
      if (Notification.permission === 'granted') {
        try {
          const fallbackOptions = {
            body,
            icon: '/assets/images/icons/favicon-192x192.png',
          };

          new Notification(title, fallbackOptions);
        } catch (fallbackError) {
          console.error('Fallback notification also failed:', fallbackError);
        }
      }
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

  // Check if service worker is ready
  isServiceWorkerReady() {
    return this.registration && this.registration.active;
  }

  // Test notification
  async testNotification() {
    console.log('=== Notification Debug Info ===');
    console.log('isSupported:', this.isSupported);
    console.log('permission:', this.permission);
    console.log('isFirefox:', this.isFirefox);
    console.log('isSecure:', this.isSecure);
    console.log('isEnvironmentSupported:', this.isEnvironmentSupported());
    console.log('isEnabled:', this.isEnabled());
    console.log('registration:', this.registration);
    console.log('service worker ready:', this.isServiceWorkerReady());
    console.log('==============================');

    if (!this.isEnabled()) {
      console.error('Notifications not enabled. Permission:', this.permission);
      throw new Error('Notifications not enabled');
    }

    if (!this.isEnvironmentSupported()) {
      const status = this.getNotificationStatus();
      console.error('Environment not supported. Status:', status);
      throw new Error(`Environment not supported: ${status}`);
    }

    // Ensure service worker is ready before testing
    if (!this.isServiceWorkerReady()) {
      console.log('Service worker not ready, initializing...');
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize service worker');
      }
    }

    console.log('Attempting to show notification...');
    await this.showNotification(
      'Test Notification',
      'This is a test notification from Daily Inventory!'
    );
    console.log('Notification request completed');
  }

  // Simple browser notification (no service worker required)
  async showSimpleNotification(
    title = 'Daily Inventory Reminder',
    body = 'Time to complete your daily inventory!'
  ) {
    console.log('=== Simple Notification Debug ===');
    console.log('Notification permission:', Notification.permission);
    console.log('Notification supported:', 'Notification' in window);
    console.log('===============================');

    if (!('Notification' in window)) {
      throw new Error('Notifications not supported in this browser');
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission denied');
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }
    }

    // Firefox requires HTTPS for notifications
    if (this.isFirefox && !this.isSecure) {
      throw new Error('Firefox requires HTTPS for notifications');
    }

    console.log('Showing simple browser notification...');
    const notification = new Notification(title, {
      body,
      icon: '/assets/images/icons/favicon-192x192.png',
    });

    console.log('Simple notification created:', notification);
    return notification;
  }

  // Initialize Firebase (call this before other Firebase methods)
  async initializeFirebase(firebaseConfig) {
    try {
      // Load Firebase SDK dynamically
      if (!window.firebase) {
        await this.loadFirebaseSDK();
      }

      // Initialize Firebase
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }

      // Initialize Firebase Messaging
      this.firebaseMessaging = window.firebase.messaging();

      console.log('Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return false;
    }
  }

  // Load Firebase SDK dynamically
  async loadFirebaseSDK() {
    return new Promise((resolve, reject) => {
      // Load Firebase App
      const appScript = document.createElement('script');
      appScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
      appScript.onload = () => {
        // Load Firebase Messaging
        const messagingScript = document.createElement('script');
        messagingScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js';
        messagingScript.onload = resolve;
        messagingScript.onerror = reject;
        document.head.appendChild(messagingScript);
      };
      appScript.onerror = reject;
      document.head.appendChild(appScript);
    });
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications() {
    if (!this.isEnvironmentSupported()) {
      throw new Error('Environment not supported for push notifications');
    }

    try {
      // Ensure service worker is ready
      if (!this.isServiceWorkerReady()) {
        await this.init();
      }

      // Request notification permission if not granted
      if (this.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Notification permission not granted');
        }
      }

      // Subscribe to push notifications
      this.pushSubscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey()),
      });

      console.log('Push subscription created:', this.pushSubscription);

      // Store subscription for later use
      localStorage.setItem('pushSubscription', JSON.stringify(this.pushSubscription));

      return this.pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications() {
    try {
      if (this.pushSubscription) {
        await this.pushSubscription.unsubscribe();
        this.pushSubscription = null;
        localStorage.removeItem('pushSubscription');
        console.log('Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  // Get VAPID public key (you'll need to replace this with your actual key)
  getVapidPublicKey() {
    // Replace with your actual VAPID public key
    return 'YOUR_VAPID_PUBLIC_KEY_HERE';
  }

  // Convert VAPID public key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send push notification to server (for testing)
  async sendPushNotification(subscription, payload) {
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }
}

export default NotificationService;
