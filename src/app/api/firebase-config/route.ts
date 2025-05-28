import { NextResponse } from 'next/server'

export async function GET() {
  // Firebase configuration for Service Worker
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  // Generate Service Worker content with injected config
  const serviceWorkerContent = `
// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase configuration injected from environment variables
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)}

// Firebase'i başlat
firebase.initializeApp(firebaseConfig)

// Messaging servisini al
const messaging = firebase.messaging()

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload)
  
  const notificationTitle = payload.notification?.title || 'Yeni Bildirim'
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bir bildiriminiz var',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Aç'
      },
      {
        action: 'close', 
        title: 'Kapat'
      }
    ],
    requireInteraction: payload.data?.priority === 'HIGH' || payload.data?.priority === 'URGENT'
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  // Uygulamayı aç veya odakla
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Eğer uygulama zaten açıksa, odakla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Eğer uygulama açık değilse, yeni pencere aç
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.url || '/'
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

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
`

  return new NextResponse(serviceWorkerContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
} 