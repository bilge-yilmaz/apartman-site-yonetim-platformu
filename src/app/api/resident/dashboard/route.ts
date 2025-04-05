import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import dbConnect from '@/lib/db'
import Payment from '@/models/Payment'
import Maintenance from '@/models/Maintenance'
import Reservation from '@/models/Reservation'
import { Model } from 'mongoose'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Kullanıcının aidat ödemeleri
    const payments = await (Payment as Model<any>).aggregate([
      {
        $match: {
          apartmentNo: session.user.apartmentNo,
          block: session.user.block,
        },
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
        },
      },
    ])

    const paymentStats = {
      totalDue: 0,
      paid: 0,
      pending: 0,
    }

    payments.forEach((p: any) => {
      if (p._id === 'COMPLETED') {
        paymentStats.paid = p.total
      } else if (p._id === 'PENDING') {
        paymentStats.pending = p.total
        paymentStats.totalDue += p.total
      }
    })

    // Kullanıcının bakım talepleri
    const maintenanceStats = {
      total: await (Maintenance as Model<any>).countDocuments({
        apartmentNo: session.user.apartmentNo,
        block: session.user.block,
      }),
      pending: await (Maintenance as Model<any>).countDocuments({
        apartmentNo: session.user.apartmentNo,
        block: session.user.block,
        status: 'PENDING',
      }),
      inProgress: await (Maintenance as Model<any>).countDocuments({
        apartmentNo: session.user.apartmentNo,
        block: session.user.block,
        status: 'IN_PROGRESS',
      }),
      completed: await (Maintenance as Model<any>).countDocuments({
        apartmentNo: session.user.apartmentNo,
        block: session.user.block,
        status: 'COMPLETED',
      }),
    }

    // Son bakım talepleri
    const recentMaintenance = await (Maintenance as Model<any>)
      .find({
        apartmentNo: session.user.apartmentNo,
        block: session.user.block,
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt')

    // Yaklaşan rezervasyonlar
    const upcomingReservations = await (Reservation as Model<any>)
      .find({
        apartmentNo: session.user.apartmentNo,
        block: session.user.block,
        startTime: { $gte: new Date() },
      })
      .sort({ startTime: 1 })
      .limit(5)
      .select('facility startTime endTime status')

    // Örnek duyurular (gerçek duyuru modeli oluşturulmalı)
    const announcements = [
      {
        id: '1',
        title: 'Yıllık Aidat Artışı',
        content:
          'Değerli site sakinlerimiz, 2025 yılı aidat artışı yönetim kurulu tarafından %10 olarak belirlenmiştir.',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Havuz Bakımı',
        content:
          'Site havuzumuzun yıllık bakımı 15-20 Nisan tarihleri arasında yapılacaktır.',
        createdAt: new Date().toISOString(),
      },
    ]

    // Sonraki ödeme (örnek - gerçek hesaplama eklenebilir)
    const nextPayment = {
      amount: 1000,
      dueDate: new Date(2025, 4, 15).toISOString(), // 15 Mayıs 2025
    }

    return NextResponse.json({
      payments: {
        ...paymentStats,
        nextPayment,
      },
      maintenance: {
        ...maintenanceStats,
        recent: recentMaintenance,
      },
      reservations: {
        upcoming: upcomingReservations,
      },
      announcements,
    })
  } catch (error) {
    console.error('Error in GET /api/resident/dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
