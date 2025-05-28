import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    // JWT token kontrolü
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = jwt.verify(token, 'apartman-site-super-secret-jwt-key-2024-production-ready-secure') as any
    
    // Sadece ADMIN ve MANAGER rol bazlı bildirim gönderebilir
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { targetRoles, title, body, data } = await req.json()
    
    if (!targetRoles || !Array.isArray(targetRoles) || targetRoles.length === 0) {
      return NextResponse.json({ error: 'targetRoles gerekli' }, { status: 400 })
    }

    if (!title || !body) {
      return NextResponse.json({ error: 'title ve body gerekli' }, { status: 400 })
    }

    await dbConnect()
    
    console.log('🎯 Rol bazlı bildirim V2 gönderiliyor...')
    console.log('Hedef roller:', targetRoles)
    console.log('Gönderen:', payload.email, payload.role)
    
    // Firebase admin'i dinamik olarak import et
    const { sendNotificationToMultipleDevices, admin } = await import('@/lib/firebase-admin')
    console.log('🔧 Firebase apps count:', admin.apps.length)
    if (admin.apps.length > 0) {
      console.log('🔧 Firebase app project ID:', admin.apps[0].options.projectId)
    }
    
    // 1. Hedef rollerdeki kullanıcıları bul
    const targetUsers = await mongoose.connection.collection('users')
      .find({ role: { $in: targetRoles } })
      .toArray()
    
    console.log('👥 Hedef kullanıcılar:', targetUsers.map(u => ({ email: u.email, role: u.role })))
    
    if (targetUsers.length === 0) {
      return NextResponse.json({ 
        error: 'Hedef rollerde kullanıcı bulunamadı',
        targetRoles 
      }, { status: 404 })
    }
    
    // 2. Bu kullanıcıların aktif token'larını bul
    const userEmails = targetUsers.map(u => u.email)
    const tokens = await mongoose.connection.collection('fcmtokens')
      .find({ 
        isActive: true,
        userId: { $in: userEmails }
      })
      .toArray()
    
    console.log('📱 Bulunan aktif token\'lar:', tokens.map(t => ({ 
      userId: t.userId, 
      deviceType: t.deviceType,
      tokenPreview: t.token ? t.token.substring(0, 20) + '...' : 'null'
    })))
    
    if (tokens.length === 0) {
      return NextResponse.json({ 
        error: 'Hedef kullanıcılar için aktif token bulunamadı',
        targetUsers: targetUsers.map(u => ({ email: u.email, role: u.role })),
        userEmails
      }, { status: 404 })
    }
    
    // 3. Firebase notification gönder
    const fcmTokens = tokens.map(t => t.token).filter(Boolean)
    
    const notificationData = {
      title,
      body,
      data: {
        type: 'ROLE_NOTIFICATION',
        targetRoles: targetRoles.join(','),
        sender: payload.email,
        timestamp: new Date().toISOString(),
        ...data
      }
    }
    
    console.log('🚀 Firebase\'e gönderiliyor:', {
      tokenCount: fcmTokens.length,
      notification: notificationData
    })
    
    const result = await sendNotificationToMultipleDevices(
      fcmTokens, 
      notificationData.title, 
      notificationData.body, 
      notificationData.data
    )
    
    console.log('📊 Firebase sonucu:', result)
    
    // 4. Notification kaydını MongoDB'ye kaydet
    const notificationRecord = {
      title,
      body,
      data: notificationData.data,
      type: 'ROLE_NOTIFICATION',
      targetType: 'roles',
      targetRoles,
      targetUsers: userEmails,
      sentTokens: fcmTokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      sender: payload.email,
      senderRole: payload.role,
      createdAt: new Date(),
      status: 'SENT'
    }
    
    await mongoose.connection.collection('notifications').insertOne(notificationRecord)
    
    console.log('✅ Rol bazlı bildirim V2 başarıyla gönderildi')
    
    return NextResponse.json({
      success: true,
      messageId: result.responses?.[0]?.messageId || 'multicast',
      targetRoles,
      targetUserCount: targetUsers.length,
      sentTokenCount: fcmTokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      targetUsers: targetUsers.map(u => ({ email: u.email, role: u.role })),
      sentTo: tokens.map(t => ({ userId: t.userId, deviceType: t.deviceType })),
      firebaseProjectId: admin.apps[0]?.options.projectId || 'unknown'
    })
    
  } catch (error) {
    console.error('Rol bazlı bildirim V2 hatası:', error)
    return NextResponse.json(
      { 
        error: 'Rol bazlı bildirim gönderme hatası', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 