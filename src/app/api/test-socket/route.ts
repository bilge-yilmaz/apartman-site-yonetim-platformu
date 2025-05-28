import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Global io instance'ını kullan
    const io = (global as any).io

    if (!io) {
      return NextResponse.json(
        { success: false, message: 'Socket.IO server bulunamadı' },
        { status: 500 }
      )
    }

    switch (type) {
      case 'announcement':
        // Tüm kullanıcılara duyuru gönder (hem admin hem resident)
        const announcementData = {
          title: data.title || 'Test Duyuru',
          message: data.content || 'Bu bir test duyurusudur',
          targetType: 'all',
          timestamp: new Date()
        }
        io.to('admin-room').emit('announcement-notification', announcementData)
        io.to('resident-room').emit('announcement-notification', announcementData)
        break

      case 'maintenance':
        // Admin'lere bakım bildirimi gönder
        io.to('admin-room').emit('maintenance-notification', {
          type: 'new-request',
          data: {
            title: data.title || 'Test Arıza',
            description: data.description || 'Bu bir test arıza bildirimidir',
            priority: data.priority || 'medium',
            timestamp: new Date()
          }
        })
        break

      case 'payment':
        // Admin'lere ödeme bildirimi gönder
        io.to('admin-room').emit('payment-notification', {
          type: 'payment-received',
          data: {
            message: data.message || 'Test ödeme alındı',
            amount: data.amount || 1000,
            timestamp: new Date()
          }
        })
        break

      case 'reservation':
        // Admin'lere rezervasyon bildirimi gönder
        io.to('admin-room').emit('reservation-notification', {
          type: 'new-reservation',
          data: {
            facilityName: data.facilityName || 'Test Tesis',
            date: data.date || new Date(),
            timestamp: new Date()
          }
        })
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Geçersiz bildirim türü' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `${type} bildirimi gönderildi`,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Socket test hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
} 