import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    
    // Tüm kullanıcıları al
    const users = await mongoose.connection.collection('users')
      .find({})
      .toArray()
    
    // Tüm FCM token'ları al
    const tokens = await mongoose.connection.collection('fcmtokens')
      .find({})
      .toArray()
    
    // Kullanıcı-token eşleştirmesi
    const userTokenMap = users.map(user => {
      const userTokens = tokens.filter(token => token.userId === user.email)
      return {
        email: user.email,
        role: user.role,
        tokenCount: userTokens.length,
        activeTokens: userTokens.filter(t => t.isActive).length,
        tokens: userTokens.map(t => ({
          deviceType: t.deviceType,
          isActive: t.isActive,
          lastUsed: t.lastUsed,
          tokenPreview: t.token ? t.token.substring(0, 20) + '...' : 'null'
        }))
      }
    })
    
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      totalTokens: tokens.length,
      activeTokens: tokens.filter(t => t.isActive).length,
      userTokenMap
    })
    
  } catch (error) {
    console.error('Token kontrol hatası:', error)
    return NextResponse.json(
      { error: 'Token kontrol hatası' },
      { status: 500 }
    )
  }
} 