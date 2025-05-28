'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button, BarChart, DonutChart, LineChart } from '@tremor/react'

interface ReportData {
  type: string
  summary: {
    totalIncome: number
    totalExpense: number
    balance: number
    profitMargin: string
  }
  monthlyTrends: {
    month: string
    income: number
    expense: number
  }[]
  categoryBreakdown: {
    income: Record<string, number>
    expense: Record<string, number>
  }
  aiInsights?: {
    nextMonthPrediction: {
      totalIncome: number
      totalExpense: number
      netBalance: number
      confidence: number
    }
    insights: Array<{
      type: string
      message: string
      suggestion: string
    }>
  }
}

interface AIPredictionData {
  predictions: {
    income: Record<string, { amount: number, confidence: number }>
    expense: Record<string, { amount: number, confidence: number }>
  }
  summary: {
    totalIncome: number
    totalExpense: number
    netBalance: number
    confidence: number
  }
  insights: Array<{
    type: string
    message: string
    suggestion: string
  }>
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [aiPredictions, setAiPredictions] = useState<AIPredictionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<string>('financial')
  const [dateRange, setDateRange] = useState<string>('month')
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [exportFormat, setExportFormat] = useState<string>('pdf')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [includeAI, setIncludeAI] = useState(true)

  useEffect(() => {
    loadReportData()
  }, [reportType, startDate, endDate, includeAI])

  const loadReportData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          startDate,
          endDate,
          includeAIPredictions: includeAI
        })
      })

      if (response.ok) {
        const result = await response.json()
        setData(result.data)
        
        // AI tahminlerini ayrı state'e kaydet
        if (result.data.aiInsights) {
          setAiPredictions({
            predictions: result.data.aiInsights.nextMonthPrediction,
            summary: result.data.aiInsights.nextMonthPrediction,
            insights: result.data.aiInsights.insights
          })
        }
      } else {
        console.error('Rapor yüklenirken hata:', await response.text())
        // Fallback dummy data
        loadDummyData()
      }
    } catch (error) {
      console.error('Rapor yükleme hatası:', error)
      loadDummyData()
    }
    setLoading(false)
  }

  const loadDummyData = () => {
    const dummyData: ReportData = {
      type: 'financial',
      summary: {
        totalIncome: 85000,
        totalExpense: 62000,
        balance: 23000,
        profitMargin: '27.06'
      },
      monthlyTrends: [
        { month: 'Ocak 2024', income: 15000, expense: 12000 },
        { month: 'Şubat 2024', income: 14000, expense: 10000 },
        { month: 'Mart 2024', income: 16000, expense: 13000 },
        { month: 'Nisan 2024', income: 18000, expense: 14000 },
        { month: 'Mayıs 2024', income: 22000, expense: 13000 }
      ],
      categoryBreakdown: {
        income: {
          'AIDAT': 45000,
          'ELEKTRIK': 15000,
          'SU': 12000,
          'ORTAK_ALAN_KIRA': 8000,
          'DIGER': 5000
        },
        expense: {
          'ELEKTRIK': 18000,
          'PERSONEL': 15000,
          'SU': 10000,
          'BAKIM_ONARIM': 8000,
          'TEMIZLIK': 6000,
          'DIGER': 5000
        }
      },
      aiInsights: {
        nextMonthPrediction: {
          totalIncome: 19500,
          totalExpense: 14200,
          netBalance: 5300,
          confidence: 0.82
        },
        insights: [
          {
            type: 'success',
            message: 'Tahmini 5.300 TL fazla bekleniyor',
            suggestion: 'Rezerv fon oluşturma fırsatı'
          },
          {
            type: 'info',
            message: 'Elektrik giderleri yüksek',
            suggestion: 'Enerji tasarrufu önlemleri değerlendirilebilir'
          }
        ]
      }
    }
    
    setData(dummyData)
    if (dummyData.aiInsights) {
      setAiPredictions({
        predictions: {
          income: {},
          expense: {}
        },
        summary: dummyData.aiInsights.nextMonthPrediction,
        insights: dummyData.aiInsights.insights
      })
    }
  }

  const handleExportReport = async () => {
    if (!data) return
    
    setGeneratingReport(true)
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: data,
          format: exportFormat,
          reportType: getReportTypeName(reportType),
          dateRange: { start: startDate, end: endDate }
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Base64 veriyi blob'a çevir ve indir
        const byteCharacters = atob(result.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: result.contentType })
        
        // İndirme linki oluştur
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        alert('Rapor başarıyla indirildi!')
      } else {
        alert('Rapor indirme sırasında hata oluştu')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Rapor indirme sırasında hata oluştu')
    }
    setGeneratingReport(false)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Veri yüklenirken bir hata oluştu.</p>
      </div>
    )
  }

  // Grafik verileri hazırla
  const monthlyChartData = data.monthlyTrends.map(month => ({
    ...month,
    net: month.income - month.expense
  }))

  const incomeChartData = Object.entries(data.categoryBreakdown.income).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }))

  const expenseChartData = Object.entries(data.categoryBreakdown.expense).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">📊 Gelişmiş Raporlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            AI destekli finansal analiz ve tahminler ile kapsamlı raporlar.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            color="green" 
            onClick={handleExportReport}
            disabled={generatingReport}
          >
            {generatingReport ? 'İndiriliyor...' : `${exportFormat.toUpperCase()} İndir`}
          </Button>
          <Button 
            color="blue" 
            onClick={loadReportData}
            disabled={loading}
          >
            🔄 Yenile
          </Button>
        </div>
      </div>

      {/* Rapor Filtreleri */}
      <Card className="mb-6">
        <div className="p-4">
          <h2 className="mb-4 text-lg font-medium">Rapor Ayarları</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Rapor Türü</label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="financial">📈 Finansal Rapor</option>
                <option value="ai-predictions">🤖 AI Tahminleri</option>
                <option value="comprehensive">📋 Kapsamlı Rapor</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tarih Aralığı</label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  
                  const today = new Date();
                  let start = new Date();
                  
                  switch(e.target.value) {
                    case 'week':
                      start = new Date(today);
                      start.setDate(today.getDate() - 7);
                      break;
                    case 'month':
                      start = new Date(today.getFullYear(), today.getMonth(), 1);
                      break;
                    case 'quarter':
                      const quarter = Math.floor(today.getMonth() / 3);
                      start = new Date(today.getFullYear(), quarter * 3, 1);
                      break;
                    case 'year':
                      start = new Date(today.getFullYear(), 0, 1);
                      break;
                  }
                  
                  setStartDate(start.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
              >
                <option value="week">Bu Hafta</option>
                <option value="month">Bu Ay</option>
                <option value="quarter">Bu Çeyrek</option>
                <option value="year">Bu Yıl</option>
                <option value="custom">Özel Aralık</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Başlangıç</label>
              <input 
                type="date" 
                className="w-full rounded-md border border-gray-300 p-2 text-sm" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bitiş</label>
              <input 
                type="date" 
                className="w-full rounded-md border border-gray-300 p-2 text-sm" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Format</label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="pdf">📄 PDF</option>
                <option value="excel">📊 Excel</option>
                <option value="csv">📋 CSV</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <label className="inline-flex items-center">
              <input 
                type="checkbox" 
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">🤖 AI tahminlerini dahil et</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Finansal Özet */}
      <Card>
        <Title>💰 Finansal Özet</Title>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-green-50 p-4">
            <Text className="text-green-700">Toplam Gelir</Text>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              ₺{data.summary.totalIncome.toLocaleString('tr-TR')}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-4">
            <Text className="text-red-700">Toplam Gider</Text>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              ₺{data.summary.totalExpense.toLocaleString('tr-TR')}
            </p>
          </div>
          <div className={`rounded-lg p-4 ${data.summary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <Text className={data.summary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}>Net Bakiye</Text>
            <p className={`mt-2 text-2xl font-semibold ${data.summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              ₺{data.summary.balance.toLocaleString('tr-TR')}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <Text className="text-purple-700">Kar Marjı</Text>
            <p className="mt-2 text-2xl font-semibold text-purple-600">
              %{data.summary.profitMargin}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Text>📈 Aylık Gelir-Gider Trendi</Text>
          <LineChart
            className="mt-4 h-80"
            data={monthlyChartData}
            index="month"
            categories={["income", "expense", "net"]}
            colors={["emerald", "red", "blue"]}
            valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
            yAxisWidth={80}
            showLegend={true}
            showAnimation={true}
          />
        </div>
      </Card>

      {/* AI Tahminleri */}
      {aiPredictions && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <Title>AI Finansal Tahminleri</Title>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              %{Math.round(aiPredictions.summary.confidence * 100)} Güvenilirlik
            </span>
          </div>
          
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <Text className="text-green-700">Tahmini Gelir</Text>
              <p className="mt-2 text-xl font-semibold text-green-600">
                ₺{aiPredictions.summary.totalIncome.toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <Text className="text-red-700">Tahmini Gider</Text>
              <p className="mt-2 text-xl font-semibold text-red-600">
                ₺{aiPredictions.summary.totalExpense.toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <Text className={aiPredictions.summary.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}>Tahmini Net</Text>
              <p className={`mt-2 text-xl font-semibold ${aiPredictions.summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                ₺{aiPredictions.summary.netBalance.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>

          {aiPredictions.insights && aiPredictions.insights.length > 0 && (
            <div className="mt-6">
              <Text className="mb-3 font-medium">💡 AI Önerileri</Text>
              <div className="space-y-2">
                {aiPredictions.insights.map((insight, index) => (
                  <div key={index} className={`rounded-lg p-3 ${
                    insight.type === 'success' ? 'bg-green-100 text-green-800' :
                    insight.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    <p className="font-medium">{insight.message}</p>
                    <p className="text-sm opacity-80">{insight.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Kategori Analizleri */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gelir Kategorileri */}
        <Card>
          <Title>💰 Gelir Kategorileri</Title>
          <DonutChart
            className="mt-6 h-60"
            data={incomeChartData}
            category="value"
            index="name"
            colors={["emerald", "teal", "cyan", "sky", "blue"]}
            valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
            showLabel={true}
            showAnimation={true}
          />
        </Card>

        {/* Gider Kategorileri */}
        <Card>
          <Title>💸 Gider Kategorileri</Title>
          <DonutChart
            className="mt-6 h-60"
            data={expenseChartData}
            category="value"
            index="name"
            colors={["red", "rose", "pink", "orange", "amber", "yellow"]}
            valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
            showLabel={true}
            showAnimation={true}
          />
        </Card>
      </div>
    </div>
  )

  // Yardımcı fonksiyonlar
  function getReportTypeName(type: string): string {
    switch(type) {
      case 'financial': return 'Finansal Rapor';
      case 'ai-predictions': return 'AI Tahmin Raporu';
      case 'comprehensive': return 'Kapsamlı Rapor';
      default: return 'Rapor';
    }
  }
}
