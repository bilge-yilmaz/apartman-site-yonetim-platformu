'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Metric, Badge, AreaChart, BarChart, DonutChart, ProgressBar } from '@tremor/react'
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  WrenchScrewdriverIcon, 
  SpeakerWaveIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface AdminDashboardData {
  users: {
    total: number
    active: number
    inactive: number
    byRole: {
      ADMIN: number
      MANAGER: number
      RESIDENT: number
    }
  }
  payments: {
    totalCollected: number
    totalPending: number
    totalOverdue: number
    monthlyTrend: Array<{
      month: string
      collected: number
      pending: number
    }>
  }
  maintenance: {
    total: number
    pending: number
    inProgress: number
    completed: number
    urgentCount: number
  }
  announcements: {
    total: number
    recent: Array<{
      id: string
      title: string
      createdAt: string
      priority: 'high' | 'medium' | 'low'
      views: number
    }>
  }
  overview: {
    totalApartments: number
    occupancyRate: number
    monthlyRevenue: number
    revenueChange: number
    maintenanceCost: number
    costChange: number
  }
}

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null)
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Saat güncelleme
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Kullanıcı bilgilerini cookie'den al
    const fetchUserInfo = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        if (token) {
          const base64Payload = token.split('.')[1]
          const payload = JSON.parse(atob(base64Payload))
          setSession({
            user: {
              name: payload.name,
              email: payload.email,
              role: payload.role
            }
          })
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    // Gelişmiş örnek veri
    const loadDummyData = () => {
      const dummyData: AdminDashboardData = {
        users: {
          total: 125,
          active: 118,
          inactive: 7,
          byRole: {
            ADMIN: 3,
            MANAGER: 8,
            RESIDENT: 114
          }
        },
        payments: {
          totalCollected: 285000,
          totalPending: 45000,
          totalOverdue: 18000,
          monthlyTrend: [
            { month: 'Oca', collected: 250000, pending: 35000 },
            { month: 'Şub', collected: 265000, pending: 28000 },
            { month: 'Mar', collected: 275000, pending: 32000 },
            { month: 'Nis', collected: 280000, pending: 25000 },
            { month: 'May', collected: 285000, pending: 45000 },
          ]
        },
        maintenance: {
          total: 47,
          pending: 12,
          inProgress: 8,
          completed: 27,
          urgentCount: 3
        },
        announcements: {
          total: 24,
          recent: [
            {
              id: '1',
              title: 'Yıllık Genel Kurul Toplantısı',
              createdAt: new Date().toISOString(),
              priority: 'high',
              views: 89
            },
            {
              id: '2',
              title: 'Havuz Sezon Açılışı',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              priority: 'medium',
              views: 156
            },
            {
              id: '3',
              title: 'Asansör Periyodik Bakımı',
              createdAt: new Date(Date.now() - 172800000).toISOString(),
              priority: 'low',
              views: 67
            }
          ]
        },
        overview: {
          totalApartments: 48,
          occupancyRate: 94.5,
          monthlyRevenue: 285000,
          revenueChange: 8.5,
          maintenanceCost: 45000,
          costChange: -12.3
        }
      }
      
      setData(dummyData)
      setLoading(false)
    }

    fetchUserInfo()
    loadDummyData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Dashboard yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Veri yüklenirken bir hata oluştu.</p>
        </div>
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek'
      case 'medium': return 'Orta'
      case 'low': return 'Düşük'
      default: return 'Normal'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <BuildingOfficeIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Hoş Geldiniz, {session?.user?.name || 'Yönetici'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Site yönetim kontrol paneli - Tüm operasyonlarınızı buradan yönetin
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-500">Bugün</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentTime.toLocaleDateString('tr-TR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {currentTime.toLocaleTimeString('tr-TR')}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Ana Metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Toplam Apartman */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Toplam Apartman</p>
                <p className="text-3xl font-bold mt-2">{data.overview.totalApartments}</p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-blue-100 text-sm">%{data.overview.occupancyRate} doluluk</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BuildingOfficeIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Aylık Gelir */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Aylık Gelir</p>
                <p className="text-3xl font-bold mt-2">₺{(data.overview.monthlyRevenue / 1000).toFixed(0)}K</p>
                <div className="flex items-center mt-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-200 mr-1" />
                  <span className="text-emerald-100 text-sm">+%{data.overview.revenueChange}</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Bakım Maliyeti */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Bakım Maliyeti</p>
                <p className="text-3xl font-bold mt-2">₺{(data.overview.maintenanceCost / 1000).toFixed(0)}K</p>
                <div className="flex items-center mt-2">
                  <ArrowTrendingDownIcon className="h-4 w-4 text-orange-200 mr-1" />
                  <span className="text-orange-100 text-sm">{data.overview.costChange}%</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Aktif Kullanıcılar */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Aktif Kullanıcılar</p>
                <p className="text-3xl font-bold mt-2">{data.users.active}</p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-purple-100 text-sm">{data.users.total} toplam</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Grafik ve İstatistikler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Aylık Gelir Trendi */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-6 w-6 text-white" />
                <Title className="text-white font-semibold">Aylık Gelir Trendi</Title>
              </div>
            </div>
            <div className="p-6">
              <AreaChart
                className="mt-4"
                data={data.payments.monthlyTrend}
                index="month"
                categories={["collected", "pending"]}
                colors={["emerald", "orange"]}
                valueFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`}
                yAxisWidth={60}
              />
            </div>
          </div>

          {/* Kullanıcı Dağılımı */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
                <Title className="text-white font-semibold">Kullanıcı Dağılımı</Title>
              </div>
            </div>
            <div className="p-6">
              <DonutChart
                className="mt-4"
                data={[
                  { name: 'Sakinler', value: data.users.byRole.RESIDENT, color: 'blue' },
                  { name: 'Personel', value: data.users.byRole.MANAGER, color: 'emerald' },
                  { name: 'Yöneticiler', value: data.users.byRole.ADMIN, color: 'purple' }
                ]}
                category="value"
                index="name"
                colors={["blue", "emerald", "purple"]}
              />
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Sakinler</span>
                  </div>
                  <span className="font-semibold">{data.users.byRole.RESIDENT}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Personel</span>
                  </div>
                  <span className="font-semibold">{data.users.byRole.MANAGER}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Yöneticiler</span>
                  </div>
                  <span className="font-semibold">{data.users.byRole.ADMIN}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detaylı İstatistikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Aidat Durumu */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
                <Title className="text-white font-semibold">Aidat Durumu</Title>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">
                    ₺{(data.payments.totalCollected / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-emerald-700 mt-1">Toplanan</div>
                  <div className="w-full bg-emerald-200 rounded-full h-2 mt-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600">
                    ₺{(data.payments.totalPending / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">Bekleyen</div>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">
                    ₺{(data.payments.totalOverdue / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-red-700 mt-1">Gecikmiş</div>
                  <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Toplama Oranı</span>
                    <span className="font-semibold">86.3%</span>
                  </div>
                  <ProgressBar value={86.3} color="emerald" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ödeme Performansı</span>
                    <span className="font-semibold">92.1%</span>
                  </div>
                  <ProgressBar value={92.1} color="blue" />
                </div>
              </div>
            </div>
          </div>

          {/* Bakım Talepleri */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
                  <Title className="text-white font-semibold">Bakım Talepleri</Title>
                </div>
                {data.maintenance.urgentCount > 0 && (
                  <Badge color="red" size="sm">
                    {data.maintenance.urgentCount} Acil
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-bold text-gray-700">{data.maintenance.total}</div>
                  <div className="text-sm text-gray-600 mt-1">Toplam Talep</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">{data.maintenance.completed}</div>
                  <div className="text-sm text-green-700 mt-1">Tamamlanan</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Bekleyen</span>
                  </div>
                  <Badge color="yellow">{data.maintenance.pending}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">İşlemde</span>
                  </div>
                  <Badge color="blue">{data.maintenance.inProgress}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Tamamlanan</span>
                  </div>
                  <Badge color="green">{data.maintenance.completed}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Son Duyurular */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SpeakerWaveIcon className="h-6 w-6 text-white" />
                <Title className="text-white font-semibold">Son Duyurular</Title>
              </div>
              <Badge color="indigo" size="sm">
                {data.announcements.total} Toplam
              </Badge>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.announcements.recent.map((announcement, index) => (
                <div key={announcement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <BellIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>{new Date(announcement.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <EyeIcon className="h-4 w-4" />
                          <span>{announcement.views} görüntüleme</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge color={getPriorityColor(announcement.priority)} size="sm">
                      {getPriorityText(announcement.priority)}
                    </Badge>
                    <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                      Detay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
