import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Payment from '@/models/Payment'
import Maintenance from '@/models/Maintenance'
import Reservation from '@/models/Reservation'
import { startOfMonth, endOfMonth, subMonths, format, addMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Model } from 'mongoose'

interface ReportData {
  date: string
  totalIncome: number
  totalExpense: number
  netProfit: number
  expenseCategories: {
    name: string
    amount: number
  }[]
  blockAnalysis: {
    block: string
    amount: number
  }[]
  maintenanceStats: {
    total: number
    pending: number
    inProgress: number
    completed: number
  }
  reservationStats: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  maintenanceCategories: {
    category: string
    count: number
  }[]
}

export async function GET(request: Request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'monthly'
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : startOfMonth(new Date())
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : endOfMonth(new Date())
    const block = searchParams.get('block')
    const category = searchParams.get('category')

    // Son 12 ayın verilerini al (trend analizi için)
    const monthlyData: ReportData[] = []
    for (let i = 0; i < 12; i++) {
      const currentMonth = subMonths(new Date(), i)
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      // Aidat ödemeleri
      const paymentMatch: any = {
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd,
        },
      }
      if (block) paymentMatch.block = block

      const payments = await (Payment as Model<any>).aggregate([
        {
          $match: paymentMatch,
        },
        {
          $group: {
            _id: '$block',
            totalAmount: { $sum: '$amount' },
          },
        },
      ])

      // Blok bazlı analiz
      const blockAnalysis = payments.map((p: any) => ({
        block: p._id,
        amount: p.totalAmount,
      }))

      // Bakım talepleri istatistikleri
      const maintenanceMatch: any = {
        createdAt: { $gte: monthStart, $lte: monthEnd },
      }
      if (category) maintenanceMatch.category = category

      const maintenanceStats = {
        total: await (Maintenance as Model<any>).countDocuments(maintenanceMatch),
        pending: await (Maintenance as Model<any>).countDocuments({
          ...maintenanceMatch,
          status: 'PENDING',
        }),
        inProgress: await (Maintenance as Model<any>).countDocuments({
          ...maintenanceMatch,
          status: 'IN_PROGRESS',
        }),
        completed: await (Maintenance as Model<any>).countDocuments({
          ...maintenanceMatch,
          status: 'COMPLETED',
        }),
      }

      // Bakım kategorileri analizi
      const maintenanceCategories = await (Maintenance as Model<any>).aggregate([
        {
          $match: maintenanceMatch,
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ])

      // Rezervasyon istatistikleri
      const reservationMatch: any = {
        createdAt: { $gte: monthStart, $lte: monthEnd },
      }

      const reservationStats = {
        total: await (Reservation as Model<any>).countDocuments(reservationMatch),
        pending: await (Reservation as Model<any>).countDocuments({
          ...reservationMatch,
          status: 'PENDING',
        }),
        approved: await (Reservation as Model<any>).countDocuments({
          ...reservationMatch,
          status: 'APPROVED',
        }),
        rejected: await (Reservation as Model<any>).countDocuments({
          ...reservationMatch,
          status: 'REJECTED',
        }),
      }

      // Gider kategorileri (örnek veriler - gerçek veriler için yeni bir model oluşturulabilir)
      const expenseCategories = [
        { name: 'Personel', amount: 15000 },
        { name: 'Elektrik', amount: 8500 },
        { name: 'Su', amount: 6500 },
        { name: 'Doğalgaz', amount: 5500 },
        { name: 'Temizlik', amount: 3500 },
        { name: 'Bakım', amount: 2000 },
      ]

      const totalIncome = payments.reduce((sum: number, p: any) => sum + p.totalAmount, 0)
      const totalExpense = expenseCategories.reduce((sum, e) => sum + e.amount, 0)

      monthlyData.push({
        date: format(currentMonth, 'MMM yy', { locale: tr }),
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        expenseCategories,
        blockAnalysis,
        maintenanceStats,
        maintenanceCategories: maintenanceCategories.map((c: any) => ({
          category: c._id,
          count: c.count,
        })),
        reservationStats,
      })
    }

    // Trend analizi ve tahminleme
    const trendAnalysis = {
      income: calculateTrend(monthlyData.map(m => m.totalIncome)),
      expense: calculateTrend(monthlyData.map(m => m.totalExpense)),
      profit: calculateTrend(monthlyData.map(m => m.netProfit)),
    }

    // Gelecek 3 ay için tahminler
    const predictions = {
      income: predictNextMonths(monthlyData.map(m => m.totalIncome), 3),
      expense: predictNextMonths(monthlyData.map(m => m.totalExpense), 3),
      profit: predictNextMonths(monthlyData.map(m => m.netProfit), 3),
    }

    // Toplam istatistikler
    const totalStats = {
      income: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.totalIncome, 0),
      expense: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.totalExpense, 0),
      profit: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.netProfit, 0),
      maintenance: {
        total: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.maintenanceStats.total, 0),
        completed: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.maintenanceStats.completed, 0),
      },
      reservations: {
        total: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.reservationStats.total, 0),
        approved: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.reservationStats.approved, 0),
      },
    }

    // Önceki aya göre değişim yüzdeleri
    const changes = {
      income:
        ((monthlyData[0].totalIncome - monthlyData[1].totalIncome) /
          monthlyData[1].totalIncome) *
        100,
      expense:
        ((monthlyData[0].totalExpense - monthlyData[1].totalExpense) /
          monthlyData[1].totalExpense) *
        100,
      profit:
        ((monthlyData[0].netProfit - monthlyData[1].netProfit) /
          monthlyData[1].netProfit) *
        100,
    }

    // Karşılaştırmalı analizler
    const comparativeAnalysis = {
      yearOverYear: calculateYearOverYearComparison(monthlyData),
      quarterOverQuarter: calculateQuarterOverQuarterComparison(monthlyData),
    }

    return NextResponse.json({
      monthlyData: monthlyData.reverse(), // En eski aydan en yeniye doğru sırala
      totalStats,
      changes,
      trendAnalysis,
      predictions,
      comparativeAnalysis,
    })
  } catch (error) {
    console.error('Error in GET /api/reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Trend analizi için yardımcı fonksiyon
function calculateTrend(data: number[]): { slope: number; direction: 'up' | 'down' | 'stable' } {
  const n = data.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += data[i]
    sumXY += i * data[i]
    sumXX += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  
  return {
    slope,
    direction: slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable',
  }
}

// Tahminleme için yardımcı fonksiyon (Basit hareketli ortalama)
function predictNextMonths(data: number[], months: number): number[] {
  const predictions = []
  const windowSize = 3 // Son 3 ayın ortalamasını al
  
  const lastValues = data.slice(0, windowSize)
  const average = lastValues.reduce((a, b) => a + b) / windowSize
  
  for (let i = 0; i < months; i++) {
    predictions.push(average * (1 + (i * 0.02))) // Her ay için %2'lik artış varsay
  }
  
  return predictions
}

// Yıllık karşılaştırma için yardımcı fonksiyon
function calculateYearOverYearComparison(data: ReportData[]) {
  const currentMonth = data[0]
  const lastYear = data[11]
  
  return {
    income: ((currentMonth.totalIncome - lastYear.totalIncome) / lastYear.totalIncome) * 100,
    expense: ((currentMonth.totalExpense - lastYear.totalExpense) / lastYear.totalExpense) * 100,
    profit: ((currentMonth.netProfit - lastYear.netProfit) / lastYear.netProfit) * 100,
  }
}

// Çeyreklik karşılaştırma için yardımcı fonksiyon
function calculateQuarterOverQuarterComparison(data: ReportData[]) {
  const currentQuarter = data.slice(0, 3)
  const lastQuarter = data.slice(3, 6)
  
  const currentSum = {
    income: currentQuarter.reduce((sum: number, m: ReportData) => sum + m.totalIncome, 0),
    expense: currentQuarter.reduce((sum: number, m: ReportData) => sum + m.totalExpense, 0),
    profit: currentQuarter.reduce((sum: number, m: ReportData) => sum + m.netProfit, 0),
  }
  
  const lastSum = {
    income: lastQuarter.reduce((sum: number, m: ReportData) => sum + m.totalIncome, 0),
    expense: lastQuarter.reduce((sum: number, m: ReportData) => sum + m.totalExpense, 0),
    profit: lastQuarter.reduce((sum: number, m: ReportData) => sum + m.netProfit, 0),
  }
  
  return {
    income: ((currentSum.income - lastSum.income) / lastSum.income) * 100,
    expense: ((currentSum.expense - lastSum.expense) / lastSum.expense) * 100,
    profit: ((currentSum.profit - lastSum.profit) / lastSum.profit) * 100,
  }
}
