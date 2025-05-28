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
    
    // Tüm FCM token'ları al (RAW data)
    const tokens = await mongoose.connection.collection('fcmtokens')
      .find({})
      .toArray()
    
    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        _id: u._id,
        email: u.email,
        role: u.role
      })),
      tokens: tokens.map(t => ({
        _id: t._id,
        userId: t.userId,
        deviceType: t.deviceType,
        isActive: t.isActive,
        lastUsed: t.lastUsed,
        createdAt: t.createdAt,
        tokenPreview: t.token ? t.token.substring(0, 30) + '...' : 'null'
      }))
    })
    
  } catch (error) {
    console.error('Debug token hatası:', error)
    return NextResponse.json(
      { error: 'Debug token hatası' },
      { status: 500 }
    )
  }
} 