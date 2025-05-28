// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAl9jYny75PpXi_BDKjo60maZSVUoEMMGw",
  authDomain: "apartman-site.firebaseapp.com",
  projectId: "apartman-site",
  storageBucket: "apartman-site.firebasestorage.app",
  messagingSenderId: "313156031231",
  appId: "1:313156031231:web:ea9a70c648bb8a5860f2ca",
  measurementId: "G-FL5P16DVFB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('🔥 [firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Apartman Site Bildirimi';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bir bildiriminiz var',
    tag: payload.data?.type || 'general',
    data: payload.data,
    requireInteraction: payload.data?.priority === 'URGENT' || payload.data?.priority === 'HIGH',
    silent: false,
    timestamp: Date.now(),
    actions: [
      {
        action: 'view',
        title: 'Görüntüle'
      },
      {
        action: 'dismiss',
        title: 'Kapat'
      }
    ]
  };

  console.log('📱 Showing notification:', notificationTitle, notificationOptions);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click - open the app
  const urlToOpen = event.notification.data?.url || '/admin/dashboard';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is already open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Service Worker install event
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing')
  self.skipWaiting()
})

// Service Worker activate event  
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating')
  event.waitUntil(self.clients.claim())
}) 