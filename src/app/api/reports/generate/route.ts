import { NextRequest, NextResponse } from 'next/server'
import { AIPredictionService } from '@/services/ai-prediction-service'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
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
    const { reportType, startDate, endDate, includeAIPredictions = true } = body

    await connectDB()
    const db = mongoose.connection.db
    const collection = db.collection('financialrecords')

    // Tarih aralığını ayarla
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Günün sonuna kadar

    // Geçmiş finansal verileri al
    const historicalRecords = await collection.find({
      apartmentId: 'apt_001',
      date: { $gte: start, $lte: end },
      isPredicted: false
    }).sort({ date: 1 }).toArray()

    // Verileri işle
    const processedData = processFinancialData(historicalRecords)

    // AI tahminleri ekle (eğer isteniyorsa)
    let aiPredictions = null
    if (includeAIPredictions) {
      const aiService = new AIPredictionService()
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      aiPredictions = await aiService.generatePredictionReport(
        'apt_001',
        nextMonth.getMonth() + 1,
        nextMonth.getFullYear()
      )
    }

    // Rapor türüne göre veri hazırla
    let reportData
    switch (reportType) {
      case 'financial':
        reportData = generateFinancialReport(processedData, aiPredictions)
        break
      case 'ai-predictions':
        reportData = generateAIPredictionReport(aiPredictions)
        break
      case 'comprehensive':
        reportData = generateComprehensiveReport(processedData, aiPredictions)
        break
      default:
        reportData = generateFinancialReport(processedData, aiPredictions)
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        reportType,
        dateRange: { start: startDate, end: endDate },
        generatedAt: new Date().toISOString(),
        recordCount: historicalRecords.length,
        includesAI: includeAIPredictions
      }
    })

  } catch (error) {
    console.error('Report Generation Error:', error)
    return NextResponse.json({ 
      error: 'Rapor oluşturulurken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Finansal verileri işle
function processFinancialData(records: any[]) {
  const monthlyData = new Map()
  let totalIncome = 0
  let totalExpense = 0
  const incomeByCategory = new Map()
  const expenseByCategory = new Map()

  records.forEach(record => {
    const date = new Date(record.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const amount = Number(record.amount)

    // Aylık veri
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        month: date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
        income: 0,
        expense: 0
      })
    }

    const monthData = monthlyData.get(monthKey)

    if (record.type === 'INCOME') {
      totalIncome += amount
      monthData.income += amount
      incomeByCategory.set(record.category, (incomeByCategory.get(record.category) || 0) + amount)
    } else {
      totalExpense += amount
      monthData.expense += amount
      expenseByCategory.set(record.category, (expenseByCategory.get(record.category) || 0) + amount)
    }
  })

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    monthlyData: Array.from(monthlyData.values()),
    incomeByCategory: Object.fromEntries(incomeByCategory),
    expenseByCategory: Object.fromEntries(expenseByCategory)
  }
}

// Finansal rapor oluştur
function generateFinancialReport(data: any, aiPredictions: any) {
  return {
    type: 'financial',
    summary: {
      totalIncome: data.totalIncome,
      totalExpense: data.totalExpense,
      balance: data.balance,
      profitMargin: data.totalIncome > 0 ? ((data.balance / data.totalIncome) * 100).toFixed(2) : 0
    },
    monthlyTrends: data.monthlyData,
    categoryBreakdown: {
      income: data.incomeByCategory,
      expense: data.expenseByCategory
    },
    aiInsights: aiPredictions ? {
      nextMonthPrediction: aiPredictions.summary,
      confidence: aiPredictions.summary.confidence,
      insights: aiPredictions.insights
    } : null
  }
}

// AI tahmin raporu oluştur
function generateAIPredictionReport(aiPredictions: any) {
  if (!aiPredictions) {
    return { type: 'ai-predictions', error: 'AI tahminleri mevcut değil' }
  }

  return {
    type: 'ai-predictions',
    predictions: aiPredictions.predictions,
    summary: aiPredictions.summary,
    insights: aiPredictions.insights,
    confidence: aiPredictions.summary.confidence,
    targetPeriod: {
      month: aiPredictions.month,
      year: aiPredictions.year
    }
  }
}

// Kapsamlı rapor oluştur
function generateComprehensiveReport(data: any, aiPredictions: any) {
  return {
    type: 'comprehensive',
    historical: generateFinancialReport(data, null),
    predictions: aiPredictions ? generateAIPredictionReport(aiPredictions) : null,
    comparison: aiPredictions ? {
      currentBalance: data.balance,
      predictedBalance: aiPredictions.summary.netBalance,
      expectedChange: aiPredictions.summary.netBalance - (data.balance / data.monthlyData.length),
      riskLevel: aiPredictions.summary.netBalance < 0 ? 'HIGH' : 
                 aiPredictions.summary.netBalance < 5000 ? 'MEDIUM' : 'LOW'
    } : null
  }
} 