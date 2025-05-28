import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'

export async function POST(req: NextRequest) {
  try {
    const { targetRoles } = await req.json()
    
    await dbConnect()
    
    console.log('🎯 Rol bazlı hedefleme debug başlıyor...')
    console.log('Hedef roller:', targetRoles)
    
    // 1. Tüm kullanıcıları al
    const allUsers = await mongoose.connection.collection('users')
      .find({})
      .toArray()
    
    console.log('👥 Tüm kullanıcılar:', allUsers.map(u => ({ email: u.email, role: u.role })))
    
    // 2. Hedef rollerdeki kullanıcıları filtrele
    const targetUsers = allUsers.filter(user => targetRoles.includes(user.role))
    console.log('🎯 Hedef kullanıcılar:', targetUsers.map(u => ({ email: u.email, role: u.role })))
    
    // 3. Hedef kullanıcıların email'lerini al
    const userEmails = targetUsers.map(u => u.email)
    console.log('📧 Hedef email\'ler:', userEmails)
    
    // 4. Token sorgusu oluştur
    const tokenQuery = { 
      isActive: true,
      userId: { $in: userEmails }
    }
    console.log('🔍 Token sorgusu:', JSON.stringify(tokenQuery, null, 2))
    
    // 5. Token'ları bul
    const tokens = await mongoose.connection.collection('fcmtokens')
      .find(tokenQuery)
      .toArray()
    
    console.log('📱 Bulunan token\'lar:', tokens.map(t => ({ 
      userId: t.userId, 
      isActive: t.isActive,
      deviceType: t.deviceType,
      tokenPreview: t.token ? t.token.substring(0, 20) + '...' : 'null'
    })))
    
    // 6. Tüm token'ları da kontrol et (karşılaştırma için)
    const allTokens = await mongoose.connection.collection('fcmtokens')
      .find({})
      .toArray()
    
    console.log('📱 Tüm token\'lar:', allTokens.map(t => ({ 
      userId: t.userId, 
      isActive: t.isActive,
      deviceType: t.deviceType
    })))
    
    return NextResponse.json({
      success: true,
      targetRoles,
      allUsers: allUsers.map(u => ({ email: u.email, role: u.role })),
      targetUsers: targetUsers.map(u => ({ email: u.email, role: u.role })),
      userEmails,
      tokenQuery,
      foundTokens: tokens.map(t => ({ 
        userId: t.userId, 
        isActive: t.isActive,
        deviceType: t.deviceType,
        tokenPreview: t.token ? t.token.substring(0, 20) + '...' : 'null'
      })),
      allTokens: allTokens.map(t => ({ 
        userId: t.userId, 
        isActive: t.isActive,
        deviceType: t.deviceType
      })),
      tokenCount: tokens.length
    })
    
  } catch (error) {
    console.error('Rol hedefleme debug hatası:', error)
    return NextResponse.json(
      { error: 'Debug hatası', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 