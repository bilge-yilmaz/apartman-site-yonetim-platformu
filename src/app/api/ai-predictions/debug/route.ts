import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'apartman-site-super-secret-jwt-key-2024-production-ready-secure'

export async function GET(request: NextRequest) {
  try {
    // JWT token kontrolü
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 401 })
    }

    let payload: any
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    // Sadece ADMIN ve MANAGER erişebilir
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    await connectDB()
    
    const db = mongoose.connection.db
    const collection = db.collection('financialrecords')
    
    // Toplam kayıt sayısı
    const totalRecords = await collection.countDocuments()
    
    // apt_001 için kayıtlar
    const apt001Records = await collection.countDocuments({ apartmentId: 'apt_001' })
    
    // Kategori dağılımı
    const categoryStats = await collection.aggregate([
      { $match: { apartmentId: 'apt_001' } },
      { $group: { 
        _id: { type: '$type', category: '$category' }, 
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }},
      { $sort: { '_id.type': 1, '_id.category': 1 } }
    ]).toArray()
    
    // Tarih aralığı
    const dateRange = await collection.aggregate([
      { $match: { apartmentId: 'apt_001' } },
      { $group: {
        _id: null,
        minDate: { $min: '$date' },
        maxDate: { $max: '$date' }
      }}
    ]).toArray()
    
    // Son 5 kayıt
    const recentRecords = await collection.find({ apartmentId: 'apt_001' })
      .sort({ date: -1 })
      .limit(5)
      .toArray()
    
    return NextResponse.json({
      success: true,
      data: {
        totalRecords,
        apt001Records,
        categoryStats,
        dateRange: dateRange[0] || null,
        recentRecords: recentRecords.map(record => ({
          date: record.date,
          type: record.type,
          category: record.category,
          amount: record.amount,
          description: record.description
        }))
      }
    })

  } catch (error) {
    console.error('Debug Error:', error)
    return NextResponse.json({ 
      error: 'Debug sırasında hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 