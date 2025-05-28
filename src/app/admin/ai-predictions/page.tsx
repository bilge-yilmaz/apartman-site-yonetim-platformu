'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Metric, Badge, Button, Select, SelectItem, Grid, Col, AreaChart, BarChart, DonutChart, Callout } from '@tremor/react'
import { CpuChipIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

interface PredictionResult {
  amount: number
  confidence: number
  seasonalFactor: number
}

interface PredictionReport {
  month: number
  year: number
  predictions: {
    income: Record<string, PredictionResult>
    expense: Record<string, PredictionResult>
  }
  summary: {
    totalIncome: number
    totalExpense: number
    netBalance: number
    confidence: number
  }
  insights: Array<{
    type: 'warning' | 'success' | 'info'
    message: string
    suggestion: string
  }>
}

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

const categoryNames = {
  // Gelir kategorileri
  AIDAT: 'Aidat',
  ORTAK_ALAN_KIRA: 'Ortak Alan Kira',
  CEZA: 'Ceza',
  DIGER_GELIR: 'Diğer Gelir',
  
  // Gider kategorileri
  PERSONEL: 'Personel',
  ELEKTRIK: 'Elektrik',
  SU: 'Su',
  DOGALGAZ: 'Doğalgaz',
  TEMIZLIK: 'Temizlik',
  GUVENLIK: 'Güvenlik',
  BAKIM_ONARIM: 'Bakım & Onarım',
  ASANSOR: 'Asansör',
  SIGORTA: 'Sigorta',
  DIGER_GIDER: 'Diğer Gider'
}

export default function AIPredictionsPage() {
  const [predictionReport, setPredictionReport] = useState<PredictionReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Tahmin oluştur
  const generatePrediction = async (savePredictions = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai-predictions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apartmentId: 'apt_001',
          targetMonth: selectedMonth,
          targetYear: selectedYear,
          savePredictions
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Tahmin oluşturulurken hata oluştu')
      }

      setPredictionReport(data.data)
    } catch (error) {
      console.error('Prediction error:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  // Debug verileri al
  const fetchDebugInfo = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai-predictions/debug')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Debug verileri alınırken hata oluştu')
      }

      setDebugInfo(data.data)
    } catch (error) {
      console.error('Debug error:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  // Finansal verileri import et
  const importFinancialData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/financial-records/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clearExisting: true // Mevcut verileri temizle
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Veri import edilirken hata oluştu')
      }

      alert(`✅ ${data.data.importedCount} finansal kayıt başarıyla import edildi!`)
      
      // Import sonrası debug verilerini yenile
      await fetchDebugInfo()
    } catch (error) {
      console.error('Import error:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }

  // Excel raporu indir
  const downloadExcelReport = async () => {
    if (!predictionReport) return

    try {
      const workbook = XLSX.utils.book_new()
      
      // Özet sayfası
      const summaryData = [
        ['AI Finansal Tahmin Raporu'],
        [''],
        ['Dönem', `${monthNames[selectedMonth - 1]} ${selectedYear}`],
        ['Oluşturulma Tarihi', new Date().toLocaleString('tr-TR')],
        ['Apartman ID', 'apt_001'],
        [''],
        ['ÖZET BİLGİLER'],
        ['Tahmini Gelir', `${predictionReport.summary.totalIncome.toLocaleString('tr-TR')} ₺`],
        ['Tahmini Gider', `${predictionReport.summary.totalExpense.toLocaleString('tr-TR')} ₺`],
        ['Net Durum', `${predictionReport.summary.netBalance.toLocaleString('tr-TR')} ₺`],
        ['Güvenilirlik', `${Math.round(predictionReport.summary.confidence * 100)}%`]
      ]
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet')

      // Gelir tahminleri sayfası
      const incomeData = [
        ['Gelir Kategorisi', 'Tahmini Tutar (₺)', 'Güvenilirlik (%)', 'Mevsimsel Faktör']
      ]
      
      Object.entries(predictionReport.predictions.income).forEach(([category, pred]) => {
        incomeData.push([
          categoryNames[category as keyof typeof categoryNames] || category,
          Math.round(pred.amount).toString(),
          Math.round(pred.confidence * 100).toString(),
          pred.seasonalFactor.toString()
        ])
      })
      
      const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData)
      XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Gelir Tahminleri')

      // Gider tahminleri sayfası
      const expenseData = [
        ['Gider Kategorisi', 'Tahmini Tutar (₺)', 'Güvenilirlik (%)', 'Mevsimsel Faktör']
      ]
      
      Object.entries(predictionReport.predictions.expense).forEach(([category, pred]) => {
        expenseData.push([
          categoryNames[category as keyof typeof categoryNames] || category,
          Math.round(pred.amount).toString(),
          Math.round(pred.confidence * 100).toString(),
          pred.seasonalFactor.toString()
        ])
      })
      
      const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData)
      XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Gider Tahminleri')

      // AI öngörüleri sayfası
      const insightsData = [
        ['Tip', 'Mesaj', 'Öneri']
      ]
      
      predictionReport.insights.forEach((insight) => {
        insightsData.push([
          insight.type === 'success' ? 'Başarı' : 
          insight.type === 'warning' ? 'Uyarı' : 'Bilgi',
          insight.message,
          insight.suggestion
        ])
      })
      
      const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData)
      XLSX.utils.book_append_sheet(workbook, insightsSheet, 'AI Öngörüleri')

      // Excel dosyasını indir
      XLSX.writeFile(workbook, `ai-tahmin-raporu-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.xlsx`)

    } catch (error) {
      console.error('Excel rapor indirme hatası:', error)
      setError('Excel raporu indirilirken hata oluştu')
    }
  }

  // PDF raporu indir
  const downloadPDFReport = async () => {
    if (!predictionReport) return

    try {
      console.log('PDF oluşturma başlıyor...')
      
      const doc = new jsPDF()
      
      // Başlık
      doc.setFontSize(18)
      doc.setTextColor(40, 40, 40)
      doc.text('AI Finansal Tahmin Raporu', 20, 30)
      
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text(`Donem: ${monthNames[selectedMonth - 1]} ${selectedYear}`, 20, 45)
      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 55)
      doc.text('Apartman: apt_001', 20, 65)

      // Özet bilgiler
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('OZET BILGILER', 20, 85)
      
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      let y = 100
      doc.text(`Tahmini Gelir: ${predictionReport.summary.totalIncome.toLocaleString('tr-TR')} TL`, 25, y)
      y += 12
      doc.text(`Tahmini Gider: ${predictionReport.summary.totalExpense.toLocaleString('tr-TR')} TL`, 25, y)
      y += 12
      doc.text(`Net Durum: ${predictionReport.summary.netBalance.toLocaleString('tr-TR')} TL`, 25, y)
      y += 12
      doc.text(`Guvenilirlik: ${Math.round(predictionReport.summary.confidence * 100)}%`, 25, y)

      // Gelir tahminleri
      y += 25
      if (y > 250) {
        doc.addPage()
        y = 30
      }
      
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('GELIR TAHMINLERI', 20, y)
      y += 15
      
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      Object.entries(predictionReport.predictions.income).forEach(([category, pred]) => {
        const categoryName = categoryNames[category as keyof typeof categoryNames] || category
        const amount = Math.round(pred.amount).toLocaleString('tr-TR')
        const confidence = Math.round(pred.confidence * 100)
        
        doc.text(`${categoryName}:`, 25, y)
        doc.text(`${amount} TL (${confidence}%)`, 100, y)
        y += 10
        
        if (y > 270) {
          doc.addPage()
          y = 30
        }
      })

      // Gider tahminleri
      y += 15
      if (y > 250) {
        doc.addPage()
        y = 30
      }
      
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('GIDER TAHMINLERI', 20, y)
      y += 15
      
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      Object.entries(predictionReport.predictions.expense).forEach(([category, pred]) => {
        const categoryName = categoryNames[category as keyof typeof categoryNames] || category
        const amount = Math.round(pred.amount).toLocaleString('tr-TR')
        const confidence = Math.round(pred.confidence * 100)
        
        doc.text(`${categoryName}:`, 25, y)
        doc.text(`${amount} TL (${confidence}%)`, 100, y)
        y += 10
        
        if (y > 270) {
          doc.addPage()
          y = 30
        }
      })

      // AI öngörüleri
      y += 15
      if (y > 250) {
        doc.addPage()
        y = 30
      }
      
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('AI ONGORULERI', 20, y)
      y += 15
      
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      predictionReport.insights.forEach((insight, index) => {
        const tipText = insight.type === 'success' ? 'BASARI' : 
                       insight.type === 'warning' ? 'UYARI' : 'BILGI'
        
        doc.text(`${index + 1}. ${tipText}:`, 25, y)
        y += 8
        
        // Mesajı yaz
        const message = insight.message
        if (message.length > 70) {
          const words = message.split(' ')
          let line = ''
          for (const word of words) {
            if ((line + word).length > 70) {
              doc.text(line, 30, y)
              y += 6
              line = word + ' '
            } else {
              line += word + ' '
            }
          }
          if (line.trim()) {
            doc.text(line, 30, y)
            y += 6
          }
        } else {
          doc.text(message, 30, y)
          y += 6
        }
        
        // Öneriyi yaz
        doc.text('Oneri:', 30, y)
        y += 6
        const suggestion = insight.suggestion
        if (suggestion.length > 65) {
          const words = suggestion.split(' ')
          let line = ''
          for (const word of words) {
            if ((line + word).length > 65) {
              doc.text(line, 35, y)
              y += 6
              line = word + ' '
            } else {
              line += word + ' '
            }
          }
          if (line.trim()) {
            doc.text(line, 35, y)
            y += 6
          }
        } else {
          doc.text(suggestion, 35, y)
          y += 6
        }
        
        y += 8 // Boşluk
        
        if (y > 260) {
          doc.addPage()
          y = 30
        }
      })

      console.log('PDF oluşturuldu, indiriliyor...')
      
      // PDF'i indir
      doc.save(`ai-tahmin-raporu-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.pdf`)
      
      console.log('PDF başarıyla indirildi!')

    } catch (error) {
      console.error('PDF rapor indirme hatası:', error)
      setError(`PDF hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  // JSON raporu indir (eski fonksiyon)
  const downloadJSONReport = async () => {
    if (!predictionReport) return

    try {
      const reportData = {
        title: `AI Finansal Tahmin Raporu - ${monthNames[selectedMonth - 1]} ${selectedYear}`,
        generatedAt: new Date().toLocaleString('tr-TR'),
        period: `${monthNames[selectedMonth - 1]} ${selectedYear}`,
        summary: predictionReport.summary,
        predictions: predictionReport.predictions,
        insights: predictionReport.insights,
        metadata: {
          confidence: predictionReport.summary.confidence,
          apartmentId: 'apt_001'
        }
      }

      // JSON olarak indir
      const dataStr = JSON.stringify(reportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `ai-tahmin-raporu-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('JSON rapor indirme hatası:', error)
      setError('JSON raporu indirilirken hata oluştu')
    }
  }

  // Sayfa yüklendiğinde mevcut ay için tahmin oluştur
  useEffect(() => {
    generatePrediction()
  }, [])

  // Grafik verileri hazırla
  const prepareChartData = () => {
    if (!predictionReport) return { incomeData: [], expenseData: [], comparisonData: [] }

    const incomeData = Object.entries(predictionReport.predictions.income).map(([category, pred]) => ({
      category: categoryNames[category as keyof typeof categoryNames] || category,
      amount: Math.round(pred.amount),
      confidence: Math.round(pred.confidence * 100)
    }))

    const expenseData = Object.entries(predictionReport.predictions.expense).map(([category, pred]) => ({
      category: categoryNames[category as keyof typeof categoryNames] || category,
      amount: Math.round(pred.amount),
      confidence: Math.round(pred.confidence * 100)
    }))

    const comparisonData = [
      {
        name: 'Gelir',
        amount: Math.round(predictionReport.summary.totalIncome),
        color: 'emerald'
      },
      {
        name: 'Gider',
        amount: Math.round(predictionReport.summary.totalExpense),
        color: 'red'
      }
    ]

    return { incomeData, expenseData, comparisonData }
  }

  const { incomeData, expenseData, comparisonData } = prepareChartData()

  // Güvenilirlik rengi
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'emerald'
    if (confidence >= 0.6) return 'yellow'
    return 'red'
  }

  // Insight rengi
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'emerald'
      case 'warning': return 'yellow'
      case 'info': return 'blue'
      default: return 'gray'
    }
  }

  // Insight ikonu
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircleIcon
      case 'warning': return ExclamationTriangleIcon
      case 'info': return InformationCircleIcon
      default: return InformationCircleIcon
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CpuChipIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Finansal Raporlar & AI Tahminler
            </h1>
                <p className="text-blue-100 mt-1">
                  Gelişmiş analitik ve makine öğrenmesi ile finansal öngörüler
            </p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-blue-100">Son Güncelleme</div>
              <div className="text-lg font-semibold">
                {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kontroller */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <Title className="text-gray-800 font-semibold">Analiz Kontrol Paneli</Title>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Parametreler */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <Text className="font-medium text-blue-900 mb-3">📅 Analiz Dönemi</Text>
                <div className="grid grid-cols-2 gap-3">
          <div>
                    <Text className="text-sm text-gray-600 mb-1">Ay</Text>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              {monthNames.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
                    <Text className="text-sm text-gray-600 mb-1">Yıl</Text>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </Select>
          </div>
                </div>
              </div>
            </div>

            {/* Hızlı Aksiyonlar */}
            <div className="lg:col-span-8">
              <Text className="font-medium text-gray-800 mb-3">🚀 Hızlı Aksiyonlar</Text>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => generatePrediction(false)}
              loading={loading}
              variant="secondary"
                  className="flex flex-col items-center p-4 h-auto"
            >
                  <span className="text-lg mb-1">🎯</span>
                  <span className="text-xs">Tahmin Oluştur</span>
            </Button>
            <Button 
              onClick={() => generatePrediction(true)}
              loading={loading}
              disabled={!predictionReport}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <span className="text-lg mb-1">💾</span>
                  <span className="text-xs">Kaydet</span>
                </Button>
                <Button 
                  onClick={importFinancialData}
                  loading={loading}
                  color="emerald"
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <span className="text-lg mb-1">📊</span>
                  <span className="text-xs">Veri Import</span>
                </Button>
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={downloadExcelReport}
                    loading={loading}
                    disabled={!predictionReport}
                    color="emerald"
                    className="flex flex-col items-center p-3 h-auto text-xs"
                  >
                    <span className="text-sm mb-1">📊</span>
                    <span>Excel</span>
            </Button>
                  <Button 
                    onClick={downloadPDFReport}
                    loading={loading}
                    disabled={!predictionReport}
                    color="red"
                    className="flex flex-col items-center p-3 h-auto text-xs"
                  >
                    <span className="text-sm mb-1">📄</span>
                    <span>PDF</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Debug Butonu */}
        <div className="mt-4 flex justify-end">
            <Button 
              onClick={fetchDebugInfo}
              loading={loading}
              variant="secondary"
            size="sm"
            className="text-xs"
            >
            🔍 Veri Analizi
            </Button>
          </div>
        </div>

      {/* Hata Mesajı */}
      {error && (
        <Callout title="Hata" icon={ExclamationTriangleIcon} color="red">
          {error}
        </Callout>
      )}

      {/* Debug Bilgileri */}
      {debugInfo && (
        <Card>
          <Title>MongoDB Veri Analizi</Title>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text>Toplam Kayıt</Text>
                <Metric>{debugInfo.totalRecords}</Metric>
              </div>
              <div>
                <Text>apt_001 Kayıtları</Text>
                <Metric>{debugInfo.apt001Records}</Metric>
              </div>
            </div>
            
            {debugInfo.dateRange && (
              <div>
                <Text>Tarih Aralığı</Text>
                <Text className="text-sm">
                  {new Date(debugInfo.dateRange.minDate).toLocaleDateString('tr-TR')} - {' '}
                  {new Date(debugInfo.dateRange.maxDate).toLocaleDateString('tr-TR')}
                </Text>
              </div>
            )}
            
            <div>
              <Text>Kategori Dağılımı</Text>
              <div className="mt-2 space-y-2">
                {debugInfo.categoryStats.map((stat: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {stat._id.type} - {stat._id.category}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{stat.count} kayıt</div>
                      <div className="text-xs text-gray-500">
                        {stat.totalAmount.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Text>Son Kayıtlar</Text>
              <div className="mt-2 space-y-2">
                {debugInfo.recentRecords.map((record: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium">{record.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(record.date).toLocaleDateString('tr-TR')} - {record.type} - {record.category}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {record.amount.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Ana Metrikler */}
      {predictionReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tahmini Gelir */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <span className="text-white text-xl">💰</span>
                </div>
                <Badge color="emerald" size="sm">Gelir</Badge>
              </div>
              <div>
                <Text className="text-emerald-700 font-medium">Tahmini Gelir</Text>
                <Metric className="text-emerald-600 text-2xl font-bold">
                {predictionReport.summary.totalIncome.toLocaleString('tr-TR')} ₺
              </Metric>
              </div>
            </div>

            {/* Tahmini Gider */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-500 rounded-lg">
                  <span className="text-white text-xl">💸</span>
                </div>
                <Badge color="red" size="sm">Gider</Badge>
              </div>
              <div>
                <Text className="text-red-700 font-medium">Tahmini Gider</Text>
                <Metric className="text-red-600 text-2xl font-bold">
                {predictionReport.summary.totalExpense.toLocaleString('tr-TR')} ₺
              </Metric>
              </div>
            </div>

            {/* Net Durum */}
            <div className={`bg-gradient-to-br ${predictionReport.summary.netBalance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} rounded-xl p-6 border`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 ${predictionReport.summary.netBalance >= 0 ? 'bg-blue-500' : 'bg-orange-500'} rounded-lg`}>
                  <span className="text-white text-xl">{predictionReport.summary.netBalance >= 0 ? '📈' : '📉'}</span>
                </div>
                <Badge color={predictionReport.summary.netBalance >= 0 ? 'blue' : 'orange'} size="sm">
                  {predictionReport.summary.netBalance >= 0 ? 'Pozitif' : 'Negatif'}
                </Badge>
              </div>
              <div>
                <Text className={`${predictionReport.summary.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'} font-medium`}>Net Durum</Text>
                <Metric className={`${predictionReport.summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'} text-2xl font-bold`}>
                {predictionReport.summary.netBalance.toLocaleString('tr-TR')} ₺
              </Metric>
              </div>
            </div>

            {/* Güvenilirlik */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <Badge color={getConfidenceColor(predictionReport.summary.confidence)} size="sm">
                  {predictionReport.summary.confidence >= 0.8 ? 'Yüksek' : 
                   predictionReport.summary.confidence >= 0.6 ? 'Orta' : 'Düşük'}
                </Badge>
              </div>
              <div>
                <Text className="text-purple-700 font-medium">Güvenilirlik</Text>
                <Metric className="text-purple-600 text-2xl font-bold">
                  {Math.round(predictionReport.summary.confidence * 100)}%
                </Metric>
              </div>
            </div>
          </div>

          {/* Grafik Analizi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-xl">📊</span>
                  <Title className="text-white font-semibold">Gelir Tahminleri</Title>
                </div>
              </div>
              <div className="p-6">
              <BarChart
                  className="mt-2"
                data={incomeData}
                index="category"
                categories={["amount"]}
                colors={["emerald"]}
                valueFormatter={(value) => `${value.toLocaleString('tr-TR')} ₺`}
                yAxisWidth={80}
              />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-xl">📉</span>
                  <Title className="text-white font-semibold">Gider Tahminleri</Title>
                </div>
              </div>
              <div className="p-6">
              <BarChart
                  className="mt-2"
                data={expenseData}
                index="category"
                categories={["amount"]}
                colors={["red"]}
                valueFormatter={(value) => `${value.toLocaleString('tr-TR')} ₺`}
                yAxisWidth={80}
              />
              </div>
            </div>
          </div>

          {/* Gelir vs Gider Karşılaştırması */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
              <div className="flex items-center space-x-2">
                <span className="text-white text-xl">⚖️</span>
                <Title className="text-white font-semibold">Gelir vs Gider Karşılaştırması</Title>
              </div>
            </div>
            <div className="p-6">
            <DonutChart
                className="mt-2"
              data={comparisonData}
              category="amount"
              index="name"
              valueFormatter={(value) => `${value.toLocaleString('tr-TR')} ₺`}
              colors={["emerald", "red"]}
            />
            </div>
          </div>

          {/* AI Öngörüleri */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <div className="flex items-center space-x-2">
                <span className="text-white text-xl">🤖</span>
                <Title className="text-white font-semibold">AI Öngörüleri ve Öneriler</Title>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
              {predictionReport.insights.map((insight, index) => {
                const IconComponent = getInsightIcon(insight.type)
                return (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          insight.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                          insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{insight.message}</h4>
                          <p className="text-gray-600 text-sm">{insight.suggestion}</p>
                        </div>
                      </div>
                    </div>
                )
              })}
              </div>
            </div>
          </div>

          {/* Detaylı Tahmin Tablosu */}
          <Grid numItems={1} numItemsLg={2} className="gap-6">
            <Card>
              <Title>Gelir Detayları</Title>
              <div className="mt-4 space-y-3">
                {Object.entries(predictionReport.predictions.income).map(([category, pred]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Text className="font-medium">
                        {categoryNames[category as keyof typeof categoryNames] || category}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Güvenilirlik: {Math.round(pred.confidence * 100)}%
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text className="font-bold text-emerald-600">
                        {Math.round(pred.amount).toLocaleString('tr-TR')} ₺
                      </Text>
                      <Badge color={getConfidenceColor(pred.confidence)} size="xs">
                        {pred.confidence >= 0.8 ? 'Yüksek' : 
                         pred.confidence >= 0.6 ? 'Orta' : 'Düşük'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <Title>Gider Detayları</Title>
              <div className="mt-4 space-y-3">
                {Object.entries(predictionReport.predictions.expense).map(([category, pred]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Text className="font-medium">
                        {categoryNames[category as keyof typeof categoryNames] || category}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Güvenilirlik: {Math.round(pred.confidence * 100)}%
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text className="font-bold text-red-600">
                        {Math.round(pred.amount).toLocaleString('tr-TR')} ₺
                      </Text>
                      <Badge color={getConfidenceColor(pred.confidence)} size="xs">
                        {pred.confidence >= 0.8 ? 'Yüksek' : 
                         pred.confidence >= 0.6 ? 'Orta' : 'Düşük'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Grid>
        </>
      )}
    </div>
  )
} 