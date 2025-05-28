import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    
    // Veritabanına bağlan
    await dbConnect()
    
    // Cookie'den kullanıcı bilgisini al
    const authToken = req.cookies.get('token')?.value
    let userRole = 'RESIDENT'
    let userId = null
    
    if (authToken) {
      try {
        const tokenPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString())
        userRole = tokenPayload.role || 'RESIDENT'
        userId = tokenPayload.id || tokenPayload.userId
      } catch (error) {
        console.log('Token decode hatası:', error)
      }
    }
    
    // Sadece Admin ve Manager notification gönderebilir
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      )
    }

    // Global io instance'ını kullan
    const io = (global as any).io

    if (!io) {
      return NextResponse.json(
        { success: false, message: 'Socket.IO server bulunamadı' },
        { status: 500 }
      )
    }

    // Bildirim verilerini hazırla
    const notificationData = {
      id: Date.now(),
      title: payload.title || 'Yeni Bildirim',
      message: payload.body || payload.message || 'Bildirim içeriği',
      type: getNotificationType(payload.type),
      priority: payload.priority || 'NORMAL',
      timestamp: new Date(),
      sender: {
        id: userId,
        role: userRole
      },
      data: payload
    }

    // Hedefleme mantığı
    let targetCount = 0

    if (payload.isGlobal || payload.targetType === 'global') {
      // Tüm kullanıcılara gönder
      io.emit('announcement-notification', notificationData)
      targetCount = io.engine.clientsCount
      console.log('Global bildirim gönderildi, hedef sayısı:', targetCount)
    } else if (payload.targetRoles && payload.targetRoles.length > 0) {
      // Belirli rollere gönder
      console.log('🎯 Rol bazlı bildirim gönderiliyor:', payload.targetRoles)
      for (const role of payload.targetRoles) {
        if (role === 'ADMIN' || role === 'MANAGER') {
          const adminRoomSize = io.sockets.adapter.rooms.get('admin-room')?.size || 0
          console.log(`📤 Admin odasına gönderiliyor, oda boyutu: ${adminRoomSize}`)
          io.to('admin-room').emit('announcement-notification', notificationData)
          targetCount += adminRoomSize
        } else if (role === 'RESIDENT') {
          // Resident odasına gönder
          const residentRoomSize = io.sockets.adapter.rooms.get('resident-room')?.size || 0
          console.log(`📤 Resident odasına gönderiliyor, oda boyutu: ${residentRoomSize}`)
          console.log('📋 Mevcut odalar:', Array.from(io.sockets.adapter.rooms.keys()))
          io.to('resident-room').emit('announcement-notification', notificationData)
          targetCount += residentRoomSize
        }
      }
      console.log(`✅ Rol bazlı bildirim gönderildi (${payload.targetRoles.join(', ')}), toplam hedef sayısı:`, targetCount)
    } else if (payload.targetBlocks && payload.targetBlocks.length > 0) {
      // Belirli bloklara gönder
      for (const block of payload.targetBlocks) {
        io.to(`block-${block}`).emit('announcement-notification', notificationData)
        targetCount += io.sockets.adapter.rooms.get(`block-${block}`)?.size || 0
      }
      console.log(`Blok bazlı bildirim gönderildi (${payload.targetBlocks.join(', ')}), hedef sayısı:`, targetCount)
    } else if (payload.targetApartments && payload.targetApartments.length > 0) {
      // Belirli apartmanlara gönder
      for (const apartment of payload.targetApartments) {
        io.to(`apartment-${apartment}`).emit('announcement-notification', notificationData)
        targetCount += io.sockets.adapter.rooms.get(`apartment-${apartment}`)?.size || 0
      }
      console.log(`Apartman bazlı bildirim gönderildi (${payload.targetApartments.join(', ')}), hedef sayısı:`, targetCount)
    } else {
      // Varsayılan: tüm kullanıcılara gönder
      io.emit('announcement-notification', notificationData)
      targetCount = io.engine.clientsCount
      console.log('Varsayılan global bildirim gönderildi, hedef sayısı:', targetCount)
    }

    // Bildirimi veritabanına kaydet
    try {
      await mongoose.connection.collection('notifications').insertOne({
        ...notificationData,
        targetType: payload.targetType || 'global',
        targetRoles: payload.targetRoles || [],
        targetBlocks: payload.targetBlocks || [],
        targetApartments: payload.targetApartments || [],
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (dbError) {
      console.error('Veritabanına kaydetme hatası:', dbError)
      // Veritabanı hatası olsa bile Socket.IO bildirimi gönderildi
    }

    return NextResponse.json({
      success: true,
      message: `Bildirim başarıyla gönderildi`,
      targetCount,
      notificationId: notificationData.id,
      timestamp: notificationData.timestamp
    })

  } catch (error) {
    console.error('Socket bildirim hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    )
  }
}

// Bildirim tipini Socket.IO formatına çevir
function getNotificationType(type: string): string {
  switch (type) {
    case 'ANNOUNCEMENT':
    case 'GENERAL':
      return 'announcement'
    case 'MAINTENANCE_REQUEST':
      return 'maintenance'
    case 'PAYMENT_DUE':
      return 'payment'
    case 'RESERVATION_CONFIRMED':
      return 'reservation'
    default:
      return 'announcement'
  }
} 