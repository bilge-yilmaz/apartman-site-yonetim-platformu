import { FinancialRecord, FinancialSummary, IncomeCategory, ExpenseCategory } from '@/models/FinancialRecord'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

// Gelişmiş tahmin algoritmaları
class AdvancedPredictionModel {
  
  // Moving Average ile tahmin
  static movingAverage(data: number[], window: number = 3): number {
    if (data.length === 0) return 0
    if (data.length < window) window = data.length
    
    const recentData = data.slice(-window)
    return recentData.reduce((sum, val) => sum + val, 0) / recentData.length
  }
  
  // Exponential Smoothing
  static exponentialSmoothing(data: number[], alpha: number = 0.3): number {
    if (data.length === 0) return 0
    if (data.length === 1) return data[0]
    
    let smoothed = data[0]
    for (let i = 1; i < data.length; i++) {
      smoothed = alpha * data[i] + (1 - alpha) * smoothed
    }
    
    return smoothed
  }
  
  // Trend analizi ile tahmin
  static trendPrediction(data: number[]): { prediction: number, confidence: number } {
    if (data.length < 3) {
      return { 
        prediction: data.length > 0 ? data[data.length - 1] : 0, 
        confidence: 0.5 
      }
    }
    
    // Son 6 ayın trendini analiz et
    const recentData = data.slice(-6)
    const x = recentData.map((_, i) => i)
    const y = recentData
    
    // Lineer regresyon
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    const prediction = slope * n + intercept
    
    // R-squared hesaplama
    const yMean = sumY / n
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const predictions = x.map(xi => slope * xi + intercept)
    const residualSumSquares = predictions.reduce((sum, pred, i) => sum + Math.pow(y[i] - pred, 2), 0)
    
    let rSquared = 1 - (residualSumSquares / totalSumSquares)
    rSquared = Math.max(0, rSquared)
    
    // Veri tutarlılığı bonusu
    const consistency = this.calculateDataConsistency(y)
    const confidence = Math.max(0.4, Math.min(0.95, rSquared * 0.7 + consistency * 0.3))
    
    return { prediction: Math.max(0, prediction), confidence }
  }
  
  // Veri tutarlılığını hesapla
  static calculateDataConsistency(data: number[]): number {
    if (data.length < 2) return 0.5
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    const stdDev = Math.sqrt(variance)
    
    // Coefficient of Variation (düşük olması daha iyi)
    const cv = mean > 0 ? stdDev / mean : 1
    
    // CV'yi güvenilirlik skoruna çevir
    return Math.max(0.2, Math.min(0.9, 1 - Math.min(cv, 1)))
  }
  
  // Hibrit tahmin (birden fazla metodu birleştir)
  static hybridPrediction(data: number[]): { prediction: number, confidence: number } {
    if (data.length === 0) return { prediction: 0, confidence: 0.3 }
    
    const ma = this.movingAverage(data, 3)
    const es = this.exponentialSmoothing(data, 0.3)
    const trend = this.trendPrediction(data)
    
    // Ağırlıklı ortalama
    let prediction: number
    let confidence: number
    
    if (data.length < 3) {
      prediction = data[data.length - 1]
      confidence = 0.5
    } else if (data.length < 6) {
      prediction = (ma * 0.4 + es * 0.6)
      confidence = 0.65
    } else {
      prediction = (ma * 0.3 + es * 0.3 + trend.prediction * 0.4)
      confidence = Math.max(0.6, trend.confidence)
    }
    
    return { prediction: Math.max(0, prediction), confidence }
  }
}

// Basit lineer regresyon sınıfı (eski)
class SimpleLinearRegression {
  private slope: number = 0
  private intercept: number = 0
  private trained: boolean = false

  train(x: number[], y: number[]) {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Invalid training data')
    }

    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    this.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    this.intercept = (sumY - this.slope * sumX) / n
    this.trained = true
  }

  predict(x: number): number {
    if (!this.trained) {
      throw new Error('Model not trained')
    }
    return this.slope * x + this.intercept
  }

  getConfidence(x: number[], y: number[], prediction: number): number {
    if (x.length === 0) return 0.5
    if (x.length < 3) return 0.6 // Az veri için orta güvenilirlik
    
    const predictions = x.map(xi => this.predict(xi))
    const mse = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - y[i], 2), 0) / x.length
    const variance = y.reduce((sum, yi) => sum + Math.pow(yi - (y.reduce((a, b) => a + b, 0) / y.length), 2), 0) / y.length
    
    // R-squared hesaplama (daha iyi güvenilirlik metriği)
    const yMean = y.reduce((a, b) => a + b, 0) / y.length
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const residualSumSquares = predictions.reduce((sum, pred, i) => sum + Math.pow(y[i] - pred, 2), 0)
    
    let rSquared = 1 - (residualSumSquares / totalSumSquares)
    rSquared = Math.max(0, rSquared) // Negatif değerleri sıfırla
    
    // Veri miktarına göre bonus
    const dataBonus = Math.min(0.2, x.length * 0.02) // Her veri noktası için %2 bonus, max %20
    
    // Trend tutarlılığı kontrolü
    const trendConsistency = this.calculateTrendConsistency(y)
    
    // Final güvenilirlik skoru
    let finalConfidence = (rSquared * 0.6) + (trendConsistency * 0.3) + dataBonus
    
    return Math.max(0.3, Math.min(0.95, finalConfidence))
  }
  
  // Trend tutarlılığını hesapla
  private calculateTrendConsistency(y: number[]): number {
    if (y.length < 3) return 0.5
    
    let consistentTrends = 0
    let totalTrends = 0
    
    for (let i = 1; i < y.length - 1; i++) {
      const prevTrend = y[i] - y[i-1]
      const nextTrend = y[i+1] - y[i]
      
      // Aynı yönde trend varsa tutarlı
      if ((prevTrend > 0 && nextTrend > 0) || (prevTrend < 0 && nextTrend < 0) || (Math.abs(prevTrend) < 0.1 && Math.abs(nextTrend) < 0.1)) {
        consistentTrends++
      }
      totalTrends++
    }
    
    return totalTrends > 0 ? consistentTrends / totalTrends : 0.5
  }
}

// Mevsimsel faktörler
const SEASONAL_FACTORS: Record<number, number> = {
  // Kış ayları - yüksek enerji tüketimi
  12: 1.3, 1: 1.4, 2: 1.3,
  // İlkbahar
  3: 1.0, 4: 0.9, 5: 0.8,
  // Yaz - düşük enerji (sadece klima)
  6: 1.1, 7: 1.2, 8: 1.2,
  // Sonbahar
  9: 0.9, 10: 1.0, 11: 1.1
}

interface PredictionResult {
  amount: number
  confidence: number
  seasonalFactor: number
}

interface MonthlyData {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
  recordCount: number
}

export class AIPredictionService {
  
  // Geçmiş verileri analiz et
  async analyzeHistoricalData(apartmentId: string, months: number = 24): Promise<MonthlyData[]> {
    await connectDB()
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    // MongoDB native driver kullanarak sorgu yap
    const db = mongoose.connection.db
    const collection = db.collection('financialrecords')
    
    const records = await collection.find({
      apartmentId: apartmentId,
      date: { $gte: startDate, $lte: endDate },
      isPredicted: false
    }).sort({ date: 1 }).toArray()
    
    console.log(`Found ${records.length} financial records for analysis`)
    
    return this.processHistoricalData(records)
  }
  
  // Verileri işle ve özetleri oluştur
  private processHistoricalData(records: any[]): MonthlyData[] {
    const monthlyData = new Map<string, MonthlyData>()
    
    records.forEach(record => {
      const date = new Date(record.date)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          totalIncome: 0,
          totalExpense: 0,
          incomeByCategory: {},
          expenseByCategory: {},
          recordCount: 0
        })
      }
      
      const monthData = monthlyData.get(key)!
      monthData.recordCount++
      
      if (record.type === 'INCOME') {
        monthData.totalIncome += Number(record.amount)
        monthData.incomeByCategory[record.category] = 
          (monthData.incomeByCategory[record.category] || 0) + Number(record.amount)
      } else {
        monthData.totalExpense += Number(record.amount)
        monthData.expenseByCategory[record.category] = 
          (monthData.expenseByCategory[record.category] || 0) + Number(record.amount)
      }
    })
    
    return Array.from(monthlyData.values()).sort((a, b) => 
      a.year === b.year ? a.month - b.month : a.year - b.year
    )
  }
  
  // Gelir tahmini
  async predictIncome(apartmentId: string, targetMonth: number, targetYear: number): Promise<Record<string, PredictionResult>> {
    const historicalData = await this.analyzeHistoricalData(apartmentId)
    
    if (historicalData.length < 3) {
      return this.generateBasicIncomePrediction(apartmentId, targetMonth, targetYear)
    }
    
    const predictions: Record<string, PredictionResult> = {}
    
    // Her kategori için ayrı tahmin
    for (const category of Object.values(IncomeCategory)) {
      const categoryData = historicalData.map((data, index) => ({
        x: index,
        y: data.incomeByCategory[category] || 0
      })).filter(point => point.y > 0)
      
      if (categoryData.length >= 1) {
        const amounts = categoryData.map(d => d.y)
        
        // Gelişmiş hibrit tahmin kullan
        const result = AdvancedPredictionModel.hybridPrediction(amounts)
        
        // Mevsimsel düzeltme
        const seasonalFactor = SEASONAL_FACTORS[targetMonth] || 1
        const adjustedPrediction = result.prediction * seasonalFactor
        
        // Kategori özel güvenilirlik artırımı
        let adjustedConfidence = result.confidence
        
        // Düzenli kategoriler için güvenilirlik artır
        if (['AIDAT', 'ELEKTRIK', 'SU', 'DOGALGAZ'].includes(category)) {
          adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.15)
        }
        
        // Veri miktarına göre güvenilirlik artır
        if (amounts.length >= 6) {
          adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.1)
        }
        
        predictions[category] = {
          amount: Math.max(0, adjustedPrediction),
          confidence: adjustedConfidence,
          seasonalFactor
        }
      }
    }
    
    return predictions
  }
  
  // Gider tahmini
  async predictExpenses(apartmentId: string, targetMonth: number, targetYear: number): Promise<Record<string, PredictionResult>> {
    const historicalData = await this.analyzeHistoricalData(apartmentId)
    
    if (historicalData.length < 3) {
      return this.generateBasicExpensePrediction(apartmentId, targetMonth, targetYear)
    }
    
    const predictions: Record<string, PredictionResult> = {}
    
    // Her kategori için ayrı tahmin
    for (const category of Object.values(ExpenseCategory)) {
      const categoryData = historicalData.map((data, index) => ({
        x: index,
        y: data.expenseByCategory[category] || 0
      })).filter(point => point.y > 0)
      
      if (categoryData.length >= 1) {
        const amounts = categoryData.map(d => d.y)
        
        // Gelişmiş hibrit tahmin kullan
        const result = AdvancedPredictionModel.hybridPrediction(amounts)
        
        // Kategori özel düzeltmeler
        let adjustedPrediction = this.applyCategorySpecificAdjustments(category, result.prediction, targetMonth)
        
        // Kategori özel güvenilirlik artırımı
        let adjustedConfidence = result.confidence
        
        // Düzenli gider kategorileri için güvenilirlik artır
        if (['ELEKTRIK', 'SU', 'DOGALGAZ', 'PERSONEL'].includes(category)) {
          adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.15)
        }
        
        // Veri miktarına göre güvenilirlik artır
        if (amounts.length >= 6) {
          adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.1)
        }
        
        // Mevsimsel kategoriler için ek güvenilirlik
        if (['ELEKTRIK', 'DOGALGAZ', 'BAKIM_ONARIM'].includes(category)) {
          adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.05)
        }
        
        predictions[category] = {
          amount: Math.max(0, adjustedPrediction),
          confidence: adjustedConfidence,
          seasonalFactor: SEASONAL_FACTORS[targetMonth] || 1
        }
      }
    }
    
    return predictions
  }
  
  // Kategori özel düzeltmeler
  private applyCategorySpecificAdjustments(category: string, prediction: number, month: number): number {
    const seasonalFactor = SEASONAL_FACTORS[month] || 1
    
    switch (category) {
      case ExpenseCategory.ELEKTRIK:
      case ExpenseCategory.DOGALGAZ:
        // Enerji giderleri mevsimsel
        return prediction * seasonalFactor
      
      case ExpenseCategory.SU:
        // Su giderleri daha stabil
        return prediction * (0.8 + 0.2 * seasonalFactor)
      
      case ExpenseCategory.BAKIM_ONARIM:
        // Bakım giderleri ilkbahar/yaz artışı
        const maintenanceFactor = [6, 7, 8, 9].includes(month) ? 1.3 : 0.9
        return prediction * maintenanceFactor
      
      default:
        return prediction
    }
  }
  
  // Temel tahmin (az veri olduğunda)
  private async generateBasicIncomePrediction(apartmentId: string, targetMonth: number, targetYear: number): Promise<Record<string, PredictionResult>> {
    // Apartman bilgilerini al (daire sayısı vs.)
    const baseAidat = 800 // Güncel aidat tahmini
    const seasonalFactor = SEASONAL_FACTORS[targetMonth] || 1
    
    return {
      [IncomeCategory.AIDAT]: {
        amount: baseAidat * seasonalFactor,
        confidence: 0.75, // Aidat düzenli olduğu için yüksek güvenilirlik
        seasonalFactor
      },
      [IncomeCategory.ORTAK_ALAN_KIRA]: {
        amount: 200 * seasonalFactor,
        confidence: 0.65,
        seasonalFactor
      }
    }
  }
  
  private async generateBasicExpensePrediction(apartmentId: string, targetMonth: number, targetYear: number): Promise<Record<string, PredictionResult>> {
    const seasonalFactor = SEASONAL_FACTORS[targetMonth] || 1
    
    return {
      [ExpenseCategory.ELEKTRIK]: {
        amount: 1200 * seasonalFactor,
        confidence: 0.75, // Elektrik düzenli ve mevsimsel
        seasonalFactor
      },
      [ExpenseCategory.SU]: {
        amount: 600 * (0.8 + 0.2 * seasonalFactor),
        confidence: 0.80, // Su çok stabil
        seasonalFactor
      },
      [ExpenseCategory.DOGALGAZ]: {
        amount: 800 * seasonalFactor,
        confidence: 0.75, // Doğalgaz mevsimsel
        seasonalFactor
      },
      [ExpenseCategory.PERSONEL]: {
        amount: 2000, // Sabit maaş
        confidence: 0.90, // En yüksek güvenilirlik
        seasonalFactor: 1
      },
      [ExpenseCategory.TEMIZLIK]: {
        amount: 300 * seasonalFactor,
        confidence: 0.70,
        seasonalFactor
      }
    }
  }
  
  // Kapsamlı tahmin raporu
  async generatePredictionReport(apartmentId: string, targetMonth: number, targetYear: number) {
    const [incomePredictions, expensePredictions] = await Promise.all([
      this.predictIncome(apartmentId, targetMonth, targetYear),
      this.predictExpenses(apartmentId, targetMonth, targetYear)
    ])
    
    const totalPredictedIncome = Object.values(incomePredictions)
      .reduce((sum, pred) => sum + pred.amount, 0)
    
    const totalPredictedExpense = Object.values(expensePredictions)
      .reduce((sum, pred) => sum + pred.amount, 0)
    
    const netPrediction = totalPredictedIncome - totalPredictedExpense
    
    // Genel güvenilirlik skoru
    const allPredictions = [...Object.values(incomePredictions), ...Object.values(expensePredictions)]
    const averageConfidence = allPredictions.length > 0 
      ? allPredictions.reduce((sum, pred) => sum + pred.confidence, 0) / allPredictions.length
      : 0.5
    
    return {
      month: targetMonth,
      year: targetYear,
      predictions: {
        income: incomePredictions,
        expense: expensePredictions
      },
      summary: {
        totalIncome: totalPredictedIncome,
        totalExpense: totalPredictedExpense,
        netBalance: netPrediction,
        confidence: averageConfidence
      },
      insights: this.generateInsights(incomePredictions, expensePredictions, netPrediction)
    }
  }
  
  // Öngörü ve öneriler
  private generateInsights(incomePredictions: Record<string, PredictionResult>, expensePredictions: Record<string, PredictionResult>, netBalance: number) {
    const insights = []
    
    if (netBalance < 0) {
      insights.push({
        type: 'warning',
        message: `Tahmini ${Math.abs(netBalance).toFixed(0)} TL açık bekleniyor`,
        suggestion: 'Gider kontrolü yapılması önerilir'
      })
    } else {
      insights.push({
        type: 'success',
        message: `Tahmini ${netBalance.toFixed(0)} TL fazla bekleniyor`,
        suggestion: 'Rezerv fon oluşturma fırsatı'
      })
    }
    
    // Yüksek gider kategorileri
    const highExpenses = Object.entries(expensePredictions)
      .filter(([_, pred]) => pred.amount > 1000)
      .map(([category, _]) => category)
    
    if (highExpenses.length > 0) {
      insights.push({
        type: 'info',
        message: `Yüksek gider kategorileri: ${highExpenses.join(', ')}`,
        suggestion: 'Bu kategorilerde tasarruf imkanları araştırılabilir'
      })
    }
    
    return insights
  }
  
  // Tahminleri veritabanına kaydet
  async savePredictions(apartmentId: string, predictions: any) {
    await connectDB()
    
    const { month, year, predictions: predData } = predictions
    
    // Gelir kayıtları
    for (const [category, pred] of Object.entries(predData.income)) {
      const predResult = pred as PredictionResult
      const record = new FinancialRecord({
        date: new Date(year, month - 1, 1),
        type: 'INCOME',
        category,
        amount: predResult.amount,
        description: `AI Tahmini - ${category}`,
        apartmentId,
        isPredicted: true,
        confidence: predResult.confidence,
        seasonalFactor: predResult.seasonalFactor,
        createdBy: 'AI_SYSTEM'
      })
      
      await record.save()
    }
    
    // Gider kayıtları
    for (const [category, pred] of Object.entries(predData.expense)) {
      const predResult = pred as PredictionResult
      const record = new FinancialRecord({
        date: new Date(year, month - 1, 1),
        type: 'EXPENSE',
        category,
        amount: predResult.amount,
        description: `AI Tahmini - ${category}`,
        apartmentId,
        isPredicted: true,
        confidence: predResult.confidence,
        seasonalFactor: predResult.seasonalFactor,
        createdBy: 'AI_SYSTEM'
      })
      
      await record.save()
    }
  }
} 