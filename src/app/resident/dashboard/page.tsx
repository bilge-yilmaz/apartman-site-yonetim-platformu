'use client'

import { useSession } from 'next-auth/react'
import { Card, Title, Text } from '@tremor/react'
import { useState, useEffect } from 'react'

interface ResidentDashboardData {
  payments: {
    totalDue: number
    paid: number
    pending: number
    nextPayment: {
      amount: number
      dueDate: string
    }
  }
  maintenance: {
    total: number
    pending: number
    inProgress: number
    completed: number
    recent: Array<{
      id: string
      title: string
      status: string
      createdAt: string
    }>
  }
  reservations: {
    upcoming: Array<{
      id: string
      facility: string
      startTime: string
      endTime: string
      status: string
    }>
  }
  announcements: Array<{
    id: string
    title: string
    content: string
    createdAt: string
  }>
}

export default function ResidentDashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<ResidentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/resident/dashboard')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
          Hoş Geldiniz, {session?.user?.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Blok: {session?.user?.block} - Daire: {session?.user?.apartmentNo}
        </p>
      </div>

      {/* Aidat Durumu */}
      <Card>
        <Title>Aidat Durumu</Title>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Text>Toplam Borç</Text>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              ₺{data.payments.totalDue.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <Text>Ödenen</Text>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              ₺{data.payments.paid.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <Text>Bekleyen</Text>
            <p className="mt-2 text-2xl font-semibold text-yellow-600">
              ₺{data.payments.pending.toLocaleString('tr-TR')}
            </p>
          </div>
          <div>
            <Text>Sonraki Ödeme</Text>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              ₺{data.payments.nextPayment.amount.toLocaleString('tr-TR')}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Son Ödeme: {new Date(data.payments.nextPayment.dueDate).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
      </Card>

      {/* Bakım Talepleri */}
      <Card>
        <Title>Bakım Talepleri</Title>
        <div className="mt-4">
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

          <div className="mt-4">
            <Text>Son Talepler</Text>
            <div className="mt-2 divide-y divide-gray-200">
              {data.maintenance.recent.map((item) => (
                <div key={item.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.status === 'COMPLETED'
                        ? 'Tamamlandı'
                        : item.status === 'IN_PROGRESS'
                        ? 'İşlemde'
                        : 'Bekliyor'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Rezervasyonlar */}
      <Card>
        <Title>Yaklaşan Rezervasyonlarım</Title>
        <div className="mt-4 divide-y divide-gray-200">
          {data.reservations.upcoming.map((reservation) => (
            <div key={reservation.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{reservation.facility}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(reservation.startTime).toLocaleString('tr-TR')} -{' '}
                    {new Date(reservation.endTime).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    reservation.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : reservation.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {reservation.status === 'APPROVED'
                    ? 'Onaylandı'
                    : reservation.status === 'PENDING'
                    ? 'Bekliyor'
                    : 'Reddedildi'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Duyurular */}
      <Card>
        <Title>Duyurular</Title>
        <div className="mt-4 divide-y divide-gray-200">
          {data.announcements.map((announcement) => (
            <div key={announcement.id} className="py-4">
              <h3 className="font-medium">{announcement.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{announcement.content}</p>
              <p className="mt-2 text-xs text-gray-500">
                {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
