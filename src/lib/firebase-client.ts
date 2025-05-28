import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAl9jYny75PpXi_BDKjo60maZSVUoEMMGw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "apartman-site.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "apartman-site",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "apartman-site.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "313156031231",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:313156031231:web:ea9a70c648bb8a5860f2ca",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-FL5P16DVFB"
}

// Only initialize Firebase on client side
let app: any = null
if (typeof window !== 'undefined') {
  // Validate required environment variables only on client side
  const requiredEnvVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': firebaseConfig.apiKey,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': firebaseConfig.authDomain,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': firebaseConfig.projectId,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': firebaseConfig.messagingSenderId,
    'NEXT_PUBLIC_FIREBASE_APP_ID': firebaseConfig.appId
  }

  for (const [envVar, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      console.error(`Missing required environment variable: ${envVar}`)
      console.error('Current firebaseConfig:', firebaseConfig)
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }

  // Initialize Firebase
  app = initializeApp(firebaseConfig)
}

// Initialize Firebase Cloud Messaging
let messaging: any = null
if (typeof window !== 'undefined' && app) {
  messaging = getMessaging(app)
}

// VAPID key from environment variables
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BGcb3r_BGcHlURCKUrqB-RGJhIuSuevmncn8zGOSAmGB29Y84n2siVoe3NOMp-bb4A9JSBmHCyjcq7rp1hQV6Ic"

if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
  console.info('Using fallback VAPID key for push notifications.')
}

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging || !vapidKey) {
    console.error('Messaging not initialized or VAPID key missing')
    return null
  }

  try {
    const token = await getToken(messaging, { vapidKey })
    console.log('FCM Token:', token)
    return token
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages
export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) {
    console.error('Messaging not initialized')
    return () => {}
  }

  console.log('Setting up onMessage listener...')
  console.log('Messaging object:', messaging)
  
  try {
    // onMessage returns an unsubscribe function
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('🔥 Firebase foreground message received:', payload)
      callback(payload)
    })
    
    console.log('✅ onMessage listener successfully set up')
    return unsubscribe
  } catch (error) {
    console.error('❌ Error setting up onMessage listener:', error)
    return () => {}
  }
}

export { app, messaging } 