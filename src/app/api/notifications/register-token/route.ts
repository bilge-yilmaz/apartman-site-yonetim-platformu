import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

// FCM Token şeması
const FCMTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  deviceType: { type: String, enum: ['web', 'android', 'ios'], required: true },
  deviceInfo: {
    userAgent: String,
    platform: String,
    appVersion: String
  },
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Model oluştur (eğer yoksa)
const FCMToken = mongoose.models.FCMToken || mongoose.model('FCMToken', FCMTokenSchema)

export async function POST(req: NextRequest) {
  try {
    console.log('🔥 Token kaydetme isteği alındı')
    const { token, deviceType, deviceInfo } = await req.json()
    console.log('🔥 Request data:', { tokenPreview: token?.substring(0, 20) + '...', deviceType })
    
    if (!token || !deviceType) {
      console.log('❌ Token veya deviceType eksik')
      return NextResponse.json(
        { error: 'Token ve deviceType gereklidir' },
        { status: 400 }
      )
    }
    
    // Veritabanına bağlan
    console.log('🔥 MongoDB bağlantısı kuruluyor...')
    await dbConnect()
    console.log('✅ MongoDB bağlantısı kuruldu')
    
    // Cookie'den kullanıcı bilgisini al
    const authToken = req.cookies.get('token')?.value
    let userId = 'anonymous'
    
    if (authToken) {
      try {
        const jwtSecret = 'apartman-site-super-secret-jwt-key-2024-production-ready-secure'
        const payload = jwt.verify(authToken, jwtSecret) as any
        // Email'i öncelikli olarak kullan (tutarlılık için)
        userId = payload.email || payload.id || 'anonymous'
        console.log('Token kayıt - userId belirlendi:', userId)
        console.log('Token kayıt - kullanıcı bilgileri:', { email: payload.email, role: payload.role })
      } catch (error) {
        console.log('JWT verify hatası:', error)
        userId = 'anonymous'
      }
    }
    
    // Mevcut token'ı kontrol et
    console.log('🔥 Mevcut token kontrol ediliyor...')
    const existingToken = await mongoose.connection.collection('fcmtokens').findOne({ token })
    console.log('🔥 Mevcut token sonucu:', existingToken ? 'Bulundu' : 'Bulunamadı')
    
    if (existingToken) {
      // Mevcut token'ı güncelle
      console.log('🔥 Mevcut token güncelleniyor...')
      const updateResult = await mongoose.connection.collection('fcmtokens').updateOne(
        { token },
        {
          $set: {
            userId,
            deviceInfo,
            lastUsed: new Date(),
            updatedAt: new Date(),
            isActive: true
          }
        }
      )
      console.log('✅ Token güncellendi:', updateResult.modifiedCount)
      
      return NextResponse.json({
        success: true,
        message: 'Token güncellendi',
        tokenId: existingToken._id,
        userId: userId
      })
    } else {
      // Yeni token kaydet
      console.log('🔥 Yeni token kaydediliyor...')
      const result = await mongoose.connection.collection('fcmtokens').insertOne({
        userId,
        token,
        deviceType,
        deviceInfo,
        isActive: true,
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('✅ Yeni token kaydedildi:', result.insertedId)
      
      return NextResponse.json({
        success: true,
        message: 'Token başarıyla kaydedildi',
        tokenId: result.insertedId,
        userId: userId
      })
    }
    
  } catch (error) {
    console.error('Token kaydetme hatası:', error)
    return NextResponse.json(
      { error: 'Token kaydetme sırasında hata oluştu' },
      { status: 500 }
    )
  }
} 