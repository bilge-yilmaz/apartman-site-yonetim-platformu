import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Firebase Debug Check Starting...')
    
    // Environment check
    const isDevelopment = process.env.NODE_ENV === 'development'
    console.log('- Development Mode:', isDevelopment)
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not Set')
    console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Not Set')
    console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Not Set')
    
    // Try importing firebase-admin
    const { sendNotificationToMultipleDevices } = await import('@/lib/firebase-admin')
    console.log('✅ Firebase admin imported successfully')
    
    // Test mock notification
    const testResult = await sendNotificationToMultipleDevices(
      ['test-token-1', 'test-token-2'],
      'Debug Test',
      'This is a debug test notification',
      { test: 'true' }
    )
    
    console.log('🎭 Mock notification result:', testResult)
    
    return NextResponse.json({
      success: true,
      isDevelopment,
      environment: {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not Set',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Not Set',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Not Set',
      },
      mockTestResult: testResult
    })
    
  } catch (error) {
    console.error('❌ Firebase debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 