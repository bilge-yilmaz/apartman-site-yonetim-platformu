import { NextRequest, NextResponse } from 'next/server'
import { AIPredictionService } from '@/services/ai-prediction-service'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'apartman-site-super-secret-jwt-key-2024-production-ready-secure'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { apartmentId, targetMonth, targetYear, savePredictions = false } = body

    // Validasyon
    if (!apartmentId || !targetMonth || !targetYear) {
      return NextResponse.json({ 
        error: 'apartmentId, targetMonth ve targetYear gerekli' 
      }, { status: 400 })
    }

    if (targetMonth < 1 || targetMonth > 12) {
      return NextResponse.json({ 
        error: 'targetMonth 1-12 arasında olmalı' 
      }, { status: 400 })
    }

    if (targetYear < 2020 || targetYear > 2030) {
      return NextResponse.json({ 
        error: 'targetYear 2020-2030 arasında olmalı' 
      }, { status: 400 })
    }

    // AI tahmin servisi
    const aiService = new AIPredictionService()
    
    // Tahmin raporu oluştur
    const predictionReport = await aiService.generatePredictionReport(
      apartmentId, 
      targetMonth, 
      targetYear
    )

    // İsteğe bağlı olarak tahminleri kaydet
    if (savePredictions) {
      await aiService.savePredictions(apartmentId, predictionReport)
    }

    return NextResponse.json({
      success: true,
      data: predictionReport,
      message: savePredictions 
        ? 'Tahminler oluşturuldu ve kaydedildi' 
        : 'Tahminler oluşturuldu'
    })

  } catch (error) {
    console.error('AI Prediction Error:', error)
    return NextResponse.json({ 
      error: 'Tahmin oluşturulurken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 