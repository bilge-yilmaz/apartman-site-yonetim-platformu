'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button, BarChart, DonutChart } from '@tremor/react'

interface ReportData {
  financialSummary: {
    income: number
    expenses: number
    balance: number
    monthlyData: {
      month: string
      income: number
      expenses: number
    }[]
  }
  paymentStatus: {
    paid: number
    pending: number
    overdue: number
  }
  maintenanceStatus: {
    pending: number
    inProgress: number
    completed: number
    cancelled: number
  }
  occupancyRate: {
    occupied: number
    vacant: number
    total: number
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<string>('financial')
  const [dateRange, setDateRange] = useState<string>('month')
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [exportFormat, setExportFormat] = useState<string>('pdf')
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    // Örnek veri (gerçek API entegrasyonu yapılabilir)
    const loadDummyData = () => {
      const dummyData: ReportData = {
        financialSummary: {
          income: 85000,
          expenses: 62000,
          balance: 23000,
          monthlyData: [
            { month: 'Ocak', income: 15000, expenses: 12000 },
            { month: 'Şubat', income: 14000, expenses: 10000 },
            { month: 'Mart', income: 16000, expenses: 13000 },
            { month: 'Nisan', income: 18000, expenses: 14000 },
            { month: 'Mayıs', income: 22000, expenses: 13000 }
          ]
        },
        paymentStatus: {
          paid: 65,
          pending: 25,
          overdue: 10
        },
        maintenanceStatus: {
          pending: 8,
          inProgress: 5,
          completed: 22,
          cancelled: 3
        },
        occupancyRate: {
          occupied: 45,
          vacant: 5,
          total: 50
        }
      }
      
      setData(dummyData)
      setLoading(false)
    }

    loadDummyData()
  }, [])

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

  // Ödeme durumu grafiği için veri
  const paymentChartData = [
    { name: 'Ödenen', value: data.paymentStatus.paid },
    { name: 'Bekleyen', value: data.paymentStatus.pending },
    { name: 'Gecikmiş', value: data.paymentStatus.overdue }
  ]

  // Bakım durumu grafiği için veri
  const maintenanceChartData = [
    { name: 'Bekleyen', value: data.maintenanceStatus.pending },
    { name: 'İşlemde', value: data.maintenanceStatus.inProgress },
    { name: 'Tamamlanan', value: data.maintenanceStatus.completed },
    { name: 'İptal Edilen', value: data.maintenanceStatus.cancelled }
  ]

  // Doluluk oranı grafiği için veri
  const occupancyChartData = [
    { name: 'Dolu', value: data.occupancyRate.occupied },
    { name: 'Boş', value: data.occupancyRate.vacant }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Raporlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Site yönetimi ile ilgili çeşitli raporları görüntüleyin ve indirin.
          </p>
        </div>
        <div>
          <Button 
            color="blue" 
            onClick={() => {
              setGeneratingReport(true);
              setTimeout(() => {
                setGeneratingReport(false);
                alert('Rapor başarıyla oluşturuldu!');
              }, 2000);
            }}
            disabled={generatingReport}
          >
            {generatingReport ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
          </Button>
        </div>
      </div>

      {/* Rapor Filtreleri */}
      <Card className="mb-6">
        <div className="p-4">
          <h2 className="mb-4 text-lg font-medium">Rapor Filtreleri</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Rapor Türü</label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="financial">Finansal Rapor</option>
                <option value="maintenance">Bakım Raporu</option>
                <option value="resident">Site Sakinleri Raporu</option>
                <option value="facility">Tesis Kullanım Raporu</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tarih Aralığı</label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  
                  // Tarih aralığını otomatik ayarla
                  const today = new Date();
                  let start = new Date();
                  
                  switch(e.target.value) {
                    case 'today':
                      // Bugün için başlangıç ve bitiş aynı
                      break;
                    case 'week':
                      // Haftanın başlangıcı (Pazartesi)
                      start = new Date(today);
                      start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
                      break;
                    case 'month':
                      // Ayın başlangıcı
                      start = new Date(today.getFullYear(), today.getMonth(), 1);
                      break;
                    case 'quarter':
                      // Çeyreğin başlangıcı
                      const quarter = Math.floor(today.getMonth() / 3);
                      start = new Date(today.getFullYear(), quarter * 3, 1);
                      break;
                    case 'year':
                      // Yılın başlangıcı
                      start = new Date(today.getFullYear(), 0, 1);
                      break;
                  }
                  
                  setStartDate(start.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
              >
                <option value="today">Bugün</option>
                <option value="week">Bu Hafta</option>
                <option value="month">Bu Ay</option>
                <option value="quarter">Bu Çeyrek</option>
                <option value="year">Bu Yıl</option>
                <option value="custom">Özel Aralık</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
              <input 
                type="date" 
                className="w-full rounded-md border border-gray-300 p-2 text-sm" 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (dateRange !== 'custom') {
                    setDateRange('custom');
                  }
                }}
                disabled={dateRange !== 'custom'}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
              <input 
                type="date" 
                className="w-full rounded-md border border-gray-300 p-2 text-sm" 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (dateRange !== 'custom') {
                    setDateRange('custom');
                  }
                }}
                disabled={dateRange !== 'custom'}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Dışa Aktarma Formatı</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="exportFormat" 
                  value="pdf" 
                  checked={exportFormat === 'pdf'}
                  onChange={() => setExportFormat('pdf')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">PDF</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="exportFormat" 
                  value="excel" 
                  checked={exportFormat === 'excel'}
                  onChange={() => setExportFormat('excel')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Excel</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="exportFormat" 
                  value="csv" 
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">CSV</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              color="blue"
              onClick={() => {
                setGeneratingReport(true);
                setTimeout(() => {
                  setGeneratingReport(false);
                  alert(`${getReportTypeName(reportType)} ${getDateRangeName(dateRange)} için ${exportFormat.toUpperCase()} formatında rapor başarıyla oluşturuldu!`);
                }, 2000);
              }}
              disabled={generatingReport}
            >
              {generatingReport ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Finansal Özet */}
      <Card>
        <Title>Finansal Özet</Title>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Text>Toplam Gelir</Text>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              ₺{data.financialSummary.income.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <Text>Toplam Gider</Text>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              ₺{data.financialSummary.expenses.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <Text>Bakiye</Text>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              ₺{data.financialSummary.balance.toLocaleString('tr-TR')}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Text>Aylık Gelir ve Gider</Text>
          <BarChart
            className="mt-4 h-80"
            data={data.financialSummary.monthlyData}
            index="month"
            categories={["income", "expenses"]}
            colors={["emerald", "red"]}
            valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
            yAxisWidth={60}
            showLegend={true}
            showAnimation={true}
          />
        </div>
      </Card>

      {/* Diğer Grafikler */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ödeme Durumu */}
        <Card>
          <Title>Aidat Ödeme Durumu</Title>
          <DonutChart
            className="mt-6 h-60"
            data={paymentChartData}
            category="value"
            index="name"
            colors={["emerald", "amber", "rose"]}
            valueFormatter={(value) => `%${value}`}
            showLabel={true}
            showAnimation={true}
          />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <Text className="text-xs">Ödenen</Text>
              <p className="text-sm font-medium text-green-600">%{data.paymentStatus.paid}</p>
            </div>
            <div>
              <Text className="text-xs">Bekleyen</Text>
              <p className="text-sm font-medium text-yellow-600">%{data.paymentStatus.pending}</p>
            </div>
            <div>
              <Text className="text-xs">Gecikmiş</Text>
              <p className="text-sm font-medium text-red-600">%{data.paymentStatus.overdue}</p>
            </div>
          </div>
        </Card>

        {/* Bakım Durumu */}
        <Card>
          <Title>Bakım Talepleri Durumu</Title>
          <DonutChart
            className="mt-6 h-60"
            data={maintenanceChartData}
            category="value"
            index="name"
            colors={["amber", "blue", "emerald", "gray"]}
            valueFormatter={(value) => `${value}`}
            showLabel={true}
            showAnimation={true}
          />
          <div className="mt-4 grid grid-cols-4 gap-1 text-center">
            <div>
              <Text className="text-xs">Bekleyen</Text>
              <p className="text-sm font-medium text-yellow-600">{data.maintenanceStatus.pending}</p>
            </div>
            <div>
              <Text className="text-xs">İşlemde</Text>
              <p className="text-sm font-medium text-blue-600">{data.maintenanceStatus.inProgress}</p>
            </div>
            <div>
              <Text className="text-xs">Tamamlanan</Text>
              <p className="text-sm font-medium text-green-600">{data.maintenanceStatus.completed}</p>
            </div>
            <div>
              <Text className="text-xs">İptal</Text>
              <p className="text-sm font-medium text-gray-600">{data.maintenanceStatus.cancelled}</p>
            </div>
          </div>
        </Card>

        {/* Doluluk Oranı */}
        <Card>
          <Title>Doluluk Oranı</Title>
          <DonutChart
            className="mt-6 h-60"
            data={occupancyChartData}
            category="value"
            index="name"
            colors={["blue", "gray"]}
            valueFormatter={(value) => `${value}`}
            showLabel={true}
            showAnimation={true}
          />
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <Text className="text-xs">Dolu Daireler</Text>
              <p className="text-sm font-medium text-blue-600">{data.occupancyRate.occupied}</p>
            </div>
            <div>
              <Text className="text-xs">Boş Daireler</Text>
              <p className="text-sm font-medium text-gray-600">{data.occupancyRate.vacant}</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Text className="text-xs">Doluluk Oranı</Text>
            <p className="text-lg font-medium text-blue-600">
              %{Math.round((data.occupancyRate.occupied / data.occupancyRate.total) * 100)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )

  // Yardımcı fonksiyonlar
  function getReportTypeName(type: string): string {
    switch(type) {
      case 'financial': return 'Finansal Rapor';
      case 'maintenance': return 'Bakım Raporu';
      case 'resident': return 'Site Sakinleri Raporu';
      case 'facility': return 'Tesis Kullanım Raporu';
      default: return 'Rapor';
    }
  }

  function getDateRangeName(range: string): string {
    switch(range) {
      case 'today': return 'Bugün';
      case 'week': return 'Bu Hafta';
      case 'month': return 'Bu Ay';
      case 'quarter': return 'Bu Çeyrek';
      case 'year': return 'Bu Yıl';
      case 'custom': return `${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`;
      default: return '';
    }
  }
}
