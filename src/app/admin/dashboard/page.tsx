'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text } from '@tremor/react'

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
  }
  maintenance: {
    total: number
    pending: number
    inProgress: number
    completed: number
  }
  announcements: {
    total: number
    recent: Array<{
      id: string
      title: string
      createdAt: string
    }>
  }
}

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null)
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kullanıcı bilgilerini cookie'den al
    const fetchUserInfo = async () => {
      try {
        // Cookie'den token'ı al
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        if (token) {
          // Token'ı decode et
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

    // Örnek veri (gerçek API entegrasyonu yapılabilir)
    const loadDummyData = () => {
      const dummyData: AdminDashboardData = {
        users: {
          total: 25,
          active: 22,
          inactive: 3,
          byRole: {
            ADMIN: 2,
            MANAGER: 3,
            RESIDENT: 20
          }
        },
        payments: {
          totalCollected: 45000,
          totalPending: 12000,
          totalOverdue: 5000
        },
        maintenance: {
          total: 18,
          pending: 5,
          inProgress: 3,
          completed: 10
        },
        announcements: {
          total: 12,
          recent: [
            {
              id: '1',
              title: 'Yıllık Aidat Artışı',
              createdAt: new Date().toISOString()
            },
            {
              id: '2',
              title: 'Havuz Bakımı',
              createdAt: new Date().toISOString()
            },
            {
              id: '3',
              title: 'Asansör Bakımı',
              createdAt: new Date().toISOString()
            }
          ]
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

  return (
    <div className="space-y-6 p-6">
      {/* Hoş Geldin Mesajı */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Hoş Geldiniz, {session?.user?.name || 'Yönetici'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Site yönetim paneline hoş geldiniz.
        </p>
      </div>

      {/* Kullanıcı İstatistikleri */}
      <Card>
        <Title>Kullanıcı İstatistikleri</Title>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Text>Toplam Kullanıcı</Text>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              {data.users.total}
            </p>
          </div>
          <div>
            <Text>Aktif Kullanıcı</Text>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {data.users.active}
            </p>
          </div>
          <div>
            <Text>Pasif Kullanıcı</Text>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              {data.users.inactive}
            </p>
          </div>
          <div>
            <Text>Kullanıcı Dağılımı</Text>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm font-medium">Yönetici: {data.users.byRole.ADMIN}</span>
              <span className="text-sm font-medium">Personel: {data.users.byRole.MANAGER}</span>
              <span className="text-sm font-medium">Sakin: {data.users.byRole.RESIDENT}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Aidat İstatistikleri */}
      <Card>
        <Title>Aidat İstatistikleri</Title>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Text>Toplanan Aidat</Text>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              ₺{data.payments.totalCollected.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <Text>Bekleyen Aidat</Text>
            <p className="mt-2 text-2xl font-semibold text-yellow-600">
              ₺{data.payments.totalPending.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <Text>Gecikmiş Aidat</Text>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              ₺{data.payments.totalOverdue.toLocaleString('tr-TR')}
            </p>
          </div>
        </div>
      </Card>

      {/* Bakım Talepleri */}
      <Card>
        <Title>Bakım Talepleri</Title>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <Text>Toplam</Text>
            <p className="mt-2 text-xl font-semibold">{data.maintenance.total}</p>
          </div>
          <div>
            <Text>Bekleyen</Text>
            <p className="mt-2 text-xl font-semibold text-yellow-600">
              {data.maintenance.pending}
            </p>
          </div>
          <div>
            <Text>İşlemde</Text>
            <p className="mt-2 text-xl font-semibold text-blue-600">
              {data.maintenance.inProgress}
            </p>
          </div>
          <div>
            <Text>Tamamlanan</Text>
            <p className="mt-2 text-xl font-semibold text-green-600">
              {data.maintenance.completed}
            </p>
          </div>
        </div>
      </Card>

      {/* Son Duyurular */}
      <Card>
        <Title>Son Duyurular</Title>
        <div className="mt-4 divide-y divide-gray-200">
          {data.announcements.recent.map((announcement) => (
            <div key={announcement.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <button className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                  Detaylar
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
