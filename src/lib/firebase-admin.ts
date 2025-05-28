import admin from 'firebase-admin'
import path from 'path'
import fs from 'fs'

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development'

// Firebase Admin SDK configuration
let firebaseAdminConfig: any

// Try to load from environment variables first
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  firebaseAdminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }
  console.log('🔧 Using Firebase config from environment variables')
} else {
  // Try to load from service account file
  try {
    const serviceAccountPath = path.join(process.cwd(), 'apartman-site-firebase-adminsdk-fbsvc-e5e7b2f2ef.json')
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      firebaseAdminConfig = {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }
      console.log('🔧 Using Firebase config from service account file')
    } else {
      throw new Error('Service account file not found')
    }
  } catch (error) {
    console.log('⚠️ No Firebase credentials found, using fallback config')
    firebaseAdminConfig = {
      projectId: 'apartman-site-sakin',
      clientEmail: 'firebase-adminsdk-abc123@apartman-site-sakin.iam.gserviceaccount.com',
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
xQOKF6EpDuMenSyuiRyZ2ROtc6vdBeurxqvun4F5JPs2ZnNzs2bt4IiE627loveH
DQoeh6N6iBcTkNAMCOyqIdXAZhaMoVDFPwDl7I2PD4QO46+rTa9ab8HSXs8uQX87
q+j4ytnidN3qQWLPEuT+K8psAmjPw4jcwmcCAwEAAQKCAQAYWnpyIcFKYU+a7MgV
Zo8Yu1TUKWFuwiC9BsYExVfQjHplGWN+zLlH2Ws=
-----END PRIVATE KEY-----`,
    }
  }
}

// Log configuration status
console.log('🔧 Firebase Admin Config Status:')
console.log('- Development Mode:', isDevelopment ? '✅ Yes' : '❌ No')
console.log('- Project ID:', firebaseAdminConfig.projectId ? '✅ Set' : '❌ Missing')
console.log('- Client Email:', firebaseAdminConfig.clientEmail ? '✅ Set' : '❌ Missing')
console.log('- Private Key:', firebaseAdminConfig.privateKey ? '✅ Set' : '❌ Missing')

// Initialize Firebase Admin SDK
let firebaseInitialized = false
if (!admin.apps.length) {
  try {
    // Try to initialize with real credentials
    if (firebaseAdminConfig.projectId !== 'apartman-site-sakin') {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig),
        projectId: firebaseAdminConfig.projectId,
      })
      firebaseInitialized = true
      console.log('✅ Firebase Admin SDK initialized successfully with real credentials')
    } else {
      console.log('⚠️ Using fallback config: Mock Firebase mode')
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error)
    console.log('⚠️ Falling back to mock Firebase')
  }
}

// Get messaging instance with error handling
let messaging: admin.messaging.Messaging | null = null
if (firebaseInitialized) {
  try {
    messaging = admin.messaging()
    console.log('✅ Firebase Messaging instance created')
  } catch (error) {
    console.error('❌ Firebase Messaging instance creation failed:', error)
  }
}

// Mock notification function for development
function mockSendNotification(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  console.log('🎭 MOCK NOTIFICATION SENT:')
  console.log('📱 Tokens:', tokens.length)
  console.log('📝 Title:', title)
  console.log('📄 Body:', body)
  console.log('📊 Data:', data)
  
  // Simulate some success and failure
  const successCount = Math.min(tokens.length, Math.floor(tokens.length * 0.8) + 1)
  const failureCount = tokens.length - successCount
  
  return {
    success: successCount > 0,
    successCount,
    failureCount,
    responses: tokens.map((token, index) => ({
      success: index < successCount,
      messageId: index < successCount ? `mock-message-${Date.now()}-${index}` : undefined,
      error: index >= successCount ? { 
        code: 'mock-error', 
        message: 'Mock failure',
        toJSON: () => ({ code: 'mock-error', message: 'Mock failure' })
      } as any : undefined
    })) as any
  }
}

// Send notification to a single device
export async function sendNotificationToDevice(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Use mock in development or when Firebase is not available
    if (isDevelopment || !messaging) {
      console.log('🎭 Using mock notification for single device')
      const mockResult = mockSendNotification([token], title, body, data)
      return {
        success: mockResult.success,
        messageId: mockResult.responses[0]?.messageId || 'mock-message-id',
        error: mockResult.responses[0]?.error?.message
      }
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    }

    const response = await messaging.send(message)
    console.log('Notification sent successfully:', response)
    
    return {
      success: true,
      messageId: response,
    }
  } catch (error) {
    console.error('Error sending notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Send notification to multiple devices
export async function sendNotificationToMultipleDevices(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ 
  success: boolean
  successCount: number
  failureCount: number
  responses?: admin.messaging.SendResponse[]
  error?: string 
}> {
  try {
    if (tokens.length === 0) {
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        error: 'No tokens provided'
      }
    }

    // Use mock when Firebase is not available
    if (!messaging || !firebaseInitialized) {
      console.log('🎭 Using mock notification for multiple devices')
      return mockSendNotification(tokens, title, body, data)
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
    }

    const response = await messaging.sendEachForMulticast({
      ...message,
      tokens,
    })

    console.log('Multicast notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    })

    // Log failed tokens for debugging
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${idx}:`, resp.error)
        }
      })
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    }
  } catch (error) {
    console.error('Error sending multicast notification:', error)
    return {
      success: false,
      successCount: 0,
      failureCount: tokens.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Send notification to a topic
export async function sendNotificationToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Use mock in development
    if (isDevelopment || !messaging) {
      console.log('🎭 Mock topic notification sent to:', topic)
      return {
        success: true,
        messageId: `mock-topic-message-${Date.now()}`,
      }
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic,
    }

    const response = await messaging.send(message)
    console.log('Topic notification sent successfully:', response)
    
    return {
      success: true,
      messageId: response,
    }
  } catch (error) {
    console.error('Error sending topic notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Subscribe tokens to a topic
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<{ success: boolean; successCount: number; failureCount: number; error?: string }> {
  try {
    // Use mock in development
    if (isDevelopment || !messaging) {
      console.log('🎭 Mock subscription to topic:', topic, 'for', tokens.length, 'tokens')
      return {
        success: true,
        successCount: tokens.length,
        failureCount: 0,
      }
    }

    const response = await messaging.subscribeToTopic(tokens, topic)
    
    console.log('Successfully subscribed to topic:', {
      topic,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  } catch (error) {
    console.error('Error subscribing to topic:', error)
    return {
      success: false,
      successCount: 0,
      failureCount: tokens.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Unsubscribe tokens from a topic
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<{ success: boolean; successCount: number; failureCount: number; error?: string }> {
  try {
    // Use mock in development
    if (isDevelopment || !messaging) {
      console.log('🎭 Mock unsubscription from topic:', topic, 'for', tokens.length, 'tokens')
      return {
        success: true,
        successCount: tokens.length,
        failureCount: 0,
      }
    }

    const response = await messaging.unsubscribeFromTopic(tokens, topic)
    
    console.log('Successfully unsubscribed from topic:', {
      topic,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  } catch (error) {
    console.error('Error unsubscribing from topic:', error)
    return {
      success: false,
      successCount: 0,
      failureCount: tokens.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export { admin, messaging } 