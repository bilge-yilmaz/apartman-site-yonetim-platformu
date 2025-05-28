import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    console.log('MongoDB test başlıyor...')
    
    // Veritabanına bağlan
    await dbConnect()
    console.log('MongoDB bağlantısı başarılı')
    
    // FCM token'ları kontrol et
    const tokens = await mongoose.connection.collection('fcmtokens')
      .find({})
      .toArray()
    
    console.log('Toplam token sayısı:', tokens.length)
    console.log('Token detayları:', tokens.map(t => ({
      _id: t._id,
      userId: t.userId,
      deviceType: t.deviceType,
      isActive: t.isActive,
      tokenLength: t.token ? t.token.length : 0,
      tokenStart: t.token ? t.token.substring(0, 20) + '...' : 'null'
    })))
    
    // Aktif token'ları kontrol et
    const activeTokens = tokens.filter(t => t.isActive && t.token && t.token.length > 50)
    console.log('Aktif ve geçerli token sayısı:', activeTokens.length)
    
    return NextResponse.json({
      success: true,
      totalTokens: tokens.length,
      activeTokens: activeTokens.length,
      tokens: tokens.map(t => ({
        userId: t.userId,
        deviceType: t.deviceType,
        isActive: t.isActive,
        hasValidToken: !!(t.token && t.token.length > 50)
      }))
    })
    
  } catch (error) {
    console.error('MongoDB test hatası:', error)
    return NextResponse.json(
      { 
        error: 'Database test hatası',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 