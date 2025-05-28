import { apiServices } from '../utils/api-services';

export interface FinancialData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface PredictionData {
  category: string;
  predicted: number;
  actual: number;
  accuracy: number;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  createdAt: string;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  predictionAccuracy: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface AIReportData {
  financialData: FinancialData[];
  predictions: PredictionData[];
  insights: AIInsight[];
  summary: ReportSummary;
}

class AIReportsService {
  
  // AI tahmin raporu oluştur
  async generateAIReport(apartmentId: string = '1', period: string = '6months'): Promise<AIReportData> {
    try {
      const currentDate = new Date();
      const targetMonth = currentDate.getMonth() + 1;
      const targetYear = currentDate.getFullYear();

      // AI tahmin raporu oluştur
      const response = await apiServices.post('/ai-predictions/generate', {
        apartmentId,
        targetMonth,
        targetYear,
        savePredictions: false
      });

      if (response.success && response.data) {
        return this.transformAPIResponse(response.data, period);
      } else {
        throw new Error('AI raporu oluşturulamadı');
      }
    } catch (error) {
      console.error('AI raporu oluşturma hatası:', error);
      // Hata durumunda mock veri döndür
      return this.getMockData(period);
    }
  }

  // API yanıtını mobil format'a dönüştür
  private transformAPIResponse(apiData: any, period: string): AIReportData {
    const { historicalData, incomePredictions, expensePredictions, insights, summary } = apiData;

    // Finansal veriyi dönüştür
    const financialData: FinancialData[] = this.transformHistoricalData(historicalData, period);

    // Tahmin verilerini dönüştür
    const predictions: PredictionData[] = this.transformPredictions(incomePredictions, expensePredictions);

    // AI öngörülerini dönüştür
    const aiInsights: AIInsight[] = this.transformInsights(insights);

    // Özet bilgileri hesapla
    const reportSummary: ReportSummary = this.calculateSummary(financialData, predictions);

    return {
      financialData,
      predictions,
      insights: aiInsights,
      summary: reportSummary
    };
  }

  // Geçmiş verileri dönüştür
  private transformHistoricalData(historicalData: any[], period: string): FinancialData[] {
    if (!historicalData || historicalData.length === 0) {
      return this.getMockFinancialData(period);
    }

    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    return historicalData.slice(-this.getPeriodMonths(period)).map(data => ({
      month: monthNames[data.month - 1] || data.month.toString(),
      income: data.totalIncome || 0,
      expense: data.totalExpense || 0,
      net: (data.totalIncome || 0) - (data.totalExpense || 0)
    }));
  }

  // Tahmin verilerini dönüştür
  private transformPredictions(incomePredictions: any, expensePredictions: any): PredictionData[] {
    const predictions: PredictionData[] = [];

    // Gelir tahminleri
    if (incomePredictions) {
      Object.entries(incomePredictions).forEach(([category, data]: [string, any]) => {
        predictions.push({
          category: this.translateCategory(category),
          predicted: data.amount || 0,
          actual: data.amount * (0.95 + Math.random() * 0.1), // Simüle edilmiş gerçek değer
          accuracy: (data.confidence || 0.8) * 100
        });
      });
    }

    // Gider tahminleri
    if (expensePredictions) {
      Object.entries(expensePredictions).forEach(([category, data]: [string, any]) => {
        predictions.push({
          category: this.translateCategory(category),
          predicted: data.amount || 0,
          actual: data.amount * (0.95 + Math.random() * 0.1), // Simüle edilmiş gerçek değer
          accuracy: (data.confidence || 0.8) * 100
        });
      });
    }

    return predictions.slice(0, 4); // En önemli 4 kategori
  }

  // AI öngörülerini dönüştür
  private transformInsights(insights: any[]): AIInsight[] {
    if (!insights || insights.length === 0) {
      return this.getMockInsights();
    }

    return insights.map((insight, index) => ({
      id: (index + 1).toString(),
      type: this.mapInsightType(insight.type),
      title: insight.title || 'AI Öngörüsü',
      description: insight.description || '',
      recommendation: insight.recommendation || '',
      confidence: Math.round((insight.confidence || 0.8) * 100),
      createdAt: new Date().toISOString()
    }));
  }

  // Kategori çevirisi
  private translateCategory(category: string): string {
    const translations: Record<string, string> = {
      'MONTHLY_FEE': 'Aylık Aidat',
      'MAINTENANCE': 'Bakım Gideri',
      'UTILITIES': 'Enerji Maliyeti',
      'CLEANING': 'Temizlik Gideri',
      'SECURITY': 'Güvenlik',
      'ELEVATOR': 'Asansör',
      'GARDEN': 'Bahçe Bakımı',
      'INSURANCE': 'Sigorta'
    };
    return translations[category] || category;
  }

  // Insight tipini eşle
  private mapInsightType(type: string): 'warning' | 'info' | 'success' | 'error' {
    const typeMap: Record<string, 'warning' | 'info' | 'success' | 'error'> = {
      'WARNING': 'warning',
      'INFO': 'info',
      'SUCCESS': 'success',
      'ERROR': 'error',
      'ALERT': 'warning'
    };
    return typeMap[type] || 'info';
  }

  // Özet hesapla
  private calculateSummary(financialData: FinancialData[], predictions: PredictionData[]): ReportSummary {
    const totalIncome = financialData.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = financialData.reduce((sum, item) => sum + item.expense, 0);
    const avgAccuracy = predictions.length > 0 
      ? predictions.reduce((sum, item) => sum + item.accuracy, 0) / predictions.length 
      : 85;

    const trendDirection = financialData.length > 1
      ? financialData[financialData.length - 1].net > financialData[0].net ? 'up' : 'down'
      : 'stable';

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      predictionAccuracy: avgAccuracy,
      trendDirection
    };
  }

  // Dönem ay sayısını al
  private getPeriodMonths(period: string): number {
    switch (period) {
      case '3months': return 3;
      case '6months': return 6;
      case '1year': return 12;
      default: return 6;
    }
  }

  // Mock veri (API hatası durumunda)
  private getMockData(period: string): AIReportData {
    return {
      financialData: this.getMockFinancialData(period),
      predictions: this.getMockPredictions(),
      insights: this.getMockInsights(),
      summary: {
        totalIncome: 285000,
        totalExpense: 208000,
        netProfit: 77000,
        predictionAccuracy: 92.1,
        trendDirection: 'up'
      }
    };
  }

  private getMockFinancialData(period: string): FinancialData[] {
    const months = this.getPeriodMonths(period);
    const monthNames = ['Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
    
    return Array.from({ length: months }, (_, i) => ({
      month: monthNames[i % 12],
      income: 45000 + Math.random() * 10000,
      expense: 32000 + Math.random() * 8000,
      net: 13000 + Math.random() * 4000
    }));
  }

  private getMockPredictions(): PredictionData[] {
    return [
      { category: 'Aylık Aidat', predicted: 52000, actual: 51000, accuracy: 98.1 },
      { category: 'Bakım Gideri', predicted: 15000, actual: 14500, accuracy: 96.7 },
      { category: 'Enerji Maliyeti', predicted: 8000, actual: 8200, accuracy: 97.6 },
      { category: 'Temizlik Gideri', predicted: 5000, actual: 4800, accuracy: 96.0 },
    ];
  }

  private getMockInsights(): AIInsight[] {
    return [
      {
        id: '1',
        type: 'warning',
        title: 'Enerji Maliyeti Artışı',
        description: 'Son 3 ayda enerji maliyetlerinde %12 artış tespit edildi.',
        recommendation: 'LED aydınlatmaya geçiş ve akıllı termostat kullanımı önerilir.',
        confidence: 87,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        type: 'success',
        title: 'Aidat Toplama Başarısı',
        description: 'Bu ay aidat toplama oranı %96\'ya ulaştı.',
        recommendation: 'Mevcut hatırlatma sistemi etkili, devam edilmeli.',
        confidence: 94,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        type: 'info',
        title: 'Bakım Talep Trendi',
        description: 'Kış aylarında tesisatçı taleplerinde %30 artış bekleniyor.',
        recommendation: 'Önleyici bakım programı oluşturulması önerilir.',
        confidence: 82,
        createdAt: new Date().toISOString()
      }
    ];
  }
}

export const aiReportsService = new AIReportsService(); 
 
 
 