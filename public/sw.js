/* eslint-disable no-restricted-globals, no-undef */
// Service Worker for Daily Inventory PWA
const CACHE_NAME = 'daily-inventory-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/images/icons/favicon.ico',
];

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

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time to complete your daily inventory!',
    icon: '/assets/images/icons/favicon-192x192.png',
    badge: '/assets/images/icons/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
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
  };

  event.waitUntil(self.registration.showNotification('Daily Inventory Reminder', options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(clients.openWindow('/'));
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
