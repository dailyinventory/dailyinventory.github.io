/* eslint-disable no-restricted-globals, no-undef */
// Service Worker for Daily Inventory PWA
const CACHE_NAME = 'daily-inventory-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/images/icons/favicon.ico',
];

// Firebase configuration (you'll need to add your Firebase config)
const firebaseConfig = {
  // Add your Firebase config here
  // apiKey: "your-api-key",
  // authDomain: "your-project.firebaseapp.com",
  // projectId: "your-project-id",
  // storageBucket: "your-project.appspot.com",
  // messagingSenderId: "your-sender-id",
  // appId: "your-app-id"
};

// Detect Firefox
const isFirefox = navigator.userAgent.includes('Firefox');

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push notification event (for Android and web push)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Daily Inventory Reminder',
    body: 'Time to complete your daily inventory!',
    icon: '/assets/images/icons/favicon-192x192.png',
    badge: '/assets/images/icons/favicon-32x32.png',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/', // URL to open when notification is clicked
    },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.log('Push data is not JSON, using default notification');
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Add features that Firefox may not support
  if (!isFirefox) {
    notificationData.vibrate = [200, 100, 200];
    notificationData.actions = [
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

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync tasks
  return Promise.resolve();
}
