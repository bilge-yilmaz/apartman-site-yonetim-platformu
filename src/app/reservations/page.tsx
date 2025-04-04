'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Text,
  Badge,
  Grid,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  DateRangePicker,
} from '@tremor/react'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CreateReservationModal } from '@/components/reservations/CreateReservationModal'

interface Reservation {
  _id: string
  apartmentNo: string
  facility: 'POOL' | 'GYM' | 'MEETING_ROOM' | 'PARTY_ROOM' | 'PARKING'
  startTime: string
  endTime: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  description?: string
  numberOfPeople?: number
  createdAt: string
  updatedAt: string
}

const facilities = [
  {
    id: 'POOL',
    name: 'Havuz',
    description: 'Açık yüzme havuzu',
    image: '/pool.jpg',
  },
  {
    id: 'GYM',
    name: 'Spor Salonu',
    description: 'Fitness ekipmanları ve yoga alanı',
    image: '/gym.jpg',
  },
  {
    id: 'MEETING_ROOM',
    name: 'Toplantı Salonu',
    description: '20 kişilik toplantı salonu',
    image: '/meeting-room.jpg',
  },
  {
    id: 'PARTY_ROOM',
    name: 'Parti Salonu',
    description: 'Özel etkinlikler için kullanılabilir alan',
    image: '/party-room.jpg',
  },
  {
    id: 'PARKING',
    name: 'Misafir Otoparkı',
    description: 'Misafir araçları için otopark alanı',
    image: '/parking.jpg',
  },
]

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchReservations()
  }, [activeTab, dateRange])

  const fetchReservations = async () => {
    try {
      setIsLoading(true)
      const status = activeTab === 1 ? 'APPROVED' : activeTab === 2 ? 'PENDING' : undefined
      
      let url = '/api/reservations'
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (dateRange[0]) params.append('startDate', dateRange[0].toISOString())
      if (dateRange[1]) params.append('endDate', dateRange[1].toISOString())
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()
      setReservations(data)
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: Reservation['status']) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      fetchReservations()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Durum güncellenirken bir hata oluştu')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rezervasyonu silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete reservation')
      }

      fetchReservations()
    } catch (error) {
      console.error('Error deleting reservation:', error)
      alert('Rezervasyon silinirken bir hata oluştu')
    }
  }

  const getFacilityName = (facilityId: string) => {
    const facility = facilities.find((f) => f.id === facilityId)
    return facility ? facility.name : facilityId
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge color="amber">Bekliyor</Badge>
      case 'APPROVED':
        return <Badge color="emerald">Onaylandı</Badge>
      case 'REJECTED':
        return <Badge color="rose">Reddedildi</Badge>
      case 'CANCELLED':
        return <Badge color="gray">İptal Edildi</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Rezervasyonlar</h1>
        <p className="mt-2 text-sm text-gray-700">
          Ortak alanların rezervasyonlarını yönetin
        </p>
      </div>

      <div className="flex items-center justify-between">
        <DateRangePicker
          className="max-w-md"
          value={dateRange as any}
          onValueChange={setDateRange as any}
          locale={tr}
          placeholder="Tarih aralığı seçin"
        />
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Yeni Rezervasyon
        </button>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        {facilities.map((facility) => {
          const activeReservation = reservations.find(
            (r) =>
              r.facility === facility.id &&
              r.status === 'APPROVED' &&
              new Date(r.startTime) <= new Date() &&
              new Date(r.endTime) >= new Date()
          )

          return (
            <Card
              key={facility.id}
              decoration="top"
              decorationColor={activeReservation ? 'amber' : 'emerald'}
            >
              <div className="relative h-48 w-full overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gray-200" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <Text>{facility.name}</Text>
                  <Badge color={activeReservation ? 'amber' : 'emerald'}>
                    {activeReservation ? 'Rezerve' : 'Müsait'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-gray-500">{facility.description}</p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Rezervasyon Yap
                </button>
              </div>
            </Card>
          )
        })}
      </Grid>

      <Card>
        <TabGroup onIndexChange={setActiveTab}>
          <TabList variant="solid">
            <Tab>Tüm Rezervasyonlar</Tab>
            <Tab>Onaylananlar</Tab>
            <Tab>Bekleyenler</Tab>
          </TabList>

          <TabPanels>
            {[0, 1, 2].map((tabIndex) => (
              <TabPanel key={tabIndex}>
                <div className="mt-6">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Daire</TableHeaderCell>
                        <TableHeaderCell>Tesis</TableHeaderCell>
                        <TableHeaderCell>Başlangıç</TableHeaderCell>
                        <TableHeaderCell>Bitiş</TableHeaderCell>
                        <TableHeaderCell>Kişi Sayısı</TableHeaderCell>
                        <TableHeaderCell>Durum</TableHeaderCell>
                        <TableHeaderCell>İşlemler</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="flex justify-center py-4">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : reservations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="text-center py-4 text-gray-500">
                              {tabIndex === 1
                                ? 'Onaylanan rezervasyon bulunamadı'
                                : tabIndex === 2
                                ? 'Bekleyen rezervasyon bulunamadı'
                                : 'Rezervasyon bulunamadı'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        reservations.map((reservation) => (
                          <TableRow key={reservation._id}>
                            <TableCell>{reservation.apartmentNo}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CalendarIcon
                                  className="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                                <span>{getFacilityName(reservation.facility)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(reservation.startTime), 'dd MMM yyyy HH:mm', {
                                locale: tr,
                              })}
                            </TableCell>
                            <TableCell>
                              {format(new Date(reservation.endTime), 'dd MMM yyyy HH:mm', {
                                locale: tr,
                              })}
                            </TableCell>
                            <TableCell>{reservation.numberOfPeople || '-'}</TableCell>
                            <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {reservation.status === 'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStatusChange(reservation._id, 'APPROVED')
                                      }
                                      className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                                    >
                                      Onayla
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStatusChange(reservation._id, 'REJECTED')
                                      }
                                      className="text-sm font-medium text-rose-600 hover:text-rose-500"
                                    >
                                      Reddet
                                    </button>
                                  </>
                                )}
                                {reservation.status !== 'CANCELLED' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(reservation._id)}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-500"
                                  >
                                    Sil
                                  </button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </Card>

      <CreateReservationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchReservations()
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
