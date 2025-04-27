'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button } from '@tremor/react'

interface Reservation {
  id: string
  facility: string
  resident: string
  apartment: string
  startTime: string
  endTime: string
  status: 'approved' | 'pending' | 'cancelled'
  notes?: string
  createdAt: string
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    // Örnek veri (gerçek API entegrasyonu yapılabilir)
    const loadDummyData = () => {
      const dummyReservations: Reservation[] = [
        {
          id: '1',
          facility: 'Havuz',
          resident: 'Ahmet Yılmaz',
          apartment: 'A-101',
          startTime: '2025-04-25T14:00',
          endTime: '2025-04-25T16:00',
          status: 'approved',
          createdAt: '2025-04-20T10:30:00'
        },
        {
          id: '2',
          facility: 'Spor Salonu',
          resident: 'Ayşe Demir',
          apartment: 'A-102',
          startTime: '2025-04-26T09:00',
          endTime: '2025-04-26T10:30',
          status: 'pending',
          createdAt: '2025-04-21T15:45:00'
        },
        {
          id: '3',
          facility: 'Toplantı Salonu',
          resident: 'Mehmet Kaya',
          apartment: 'B-201',
          startTime: '2025-04-27T18:00',
          endTime: '2025-04-27T20:00',
          status: 'approved',
          notes: 'Aile toplantısı için',
          createdAt: '2025-04-22T09:15:00'
        },
        {
          id: '4',
          facility: 'Sauna',
          resident: 'Fatma Şahin',
          apartment: 'B-202',
          startTime: '2025-04-28T16:00',
          endTime: '2025-04-28T17:00',
          status: 'cancelled',
          createdAt: '2025-04-23T14:20:00'
        },
        {
          id: '5',
          facility: 'Tenis Kortu',
          resident: 'Ali Öztürk',
          apartment: 'C-301',
          startTime: '2025-04-29T10:00',
          endTime: '2025-04-29T12:00',
          status: 'approved',
          createdAt: '2025-04-24T11:05:00'
        }
      ]
      
      setReservations(dummyReservations)
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

  // Duruma göre renk belirleme
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Durumu Türkçe olarak gösterme
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı'
      case 'pending':
        return 'Onay Bekliyor'
      case 'cancelled':
        return 'İptal Edildi'
      default:
        return status
    }
  }

  // Rezervasyon durumu belirleme
  const getReservationStatus = (reservation: Reservation) => {
    const now = new Date()
    const startDate = new Date(reservation.startTime)
    const endDate = new Date(reservation.endTime)

    if (reservation.status === 'cancelled') {
      return 'cancelled'
    } else if (now > endDate) {
      return 'completed'
    } else if (now >= startDate && now <= endDate) {
      return 'ongoing'
    } else {
      return 'upcoming'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rezervasyonlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tüm ortak alan rezervasyonlarını görüntüleyin ve yönetin.
          </p>
        </div>
        <Button color="blue" onClick={() => setIsAddModalOpen(true)}>Yeni Rezervasyon Ekle</Button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <Text>Toplam Rezervasyon</Text>
          <p className="mt-2 text-2xl font-semibold">{reservations.length}</p>
        </Card>
        <Card>
          <Text>Onay Bekleyen</Text>
          <p className="mt-2 text-2xl font-semibold text-yellow-600">
            {reservations.filter(r => r.status === 'pending').length}
          </p>
        </Card>
        <Card>
          <Text>Onaylanan</Text>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {reservations.filter(r => r.status === 'approved').length}
          </p>
        </Card>
      </div>

      {/* Rezervasyonlar Tablosu */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tesis
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Site Sakini
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Daire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tarih
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Saat
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {reservations
                .filter(reservation => filterStatus === 'all' || getReservationStatus(reservation) === filterStatus)
                .map((reservation) => (
                <tr key={reservation.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{reservation.facility}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{reservation.resident}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{reservation.apartment}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {new Date(reservation.startTime).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {new Date(reservation.startTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} - 
                      {new Date(reservation.endTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button 
                      className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Detaylar
                    </button>
                    <button 
                      className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      onClick={() => {
                        if (window.confirm(`"${reservation.facility}" için ${reservation.resident} adına yapılan rezervasyonu iptal etmek istediğinize emin misiniz?`)) {
                          const updatedReservations = reservations.map(r => 
                            r.id === reservation.id ? { ...r, status: 'cancelled' as const } : r
                          );
                          setReservations(updatedReservations);
                          alert('Rezervasyon başarıyla iptal edildi.');
                        }
                      }}
                    >
                      İptal Et
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Yeni Rezervasyon Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Yeni Rezervasyon Ekle</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsAddModalOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newReservation: Reservation = {
                id: (reservations.length + 1).toString(),
                resident: formData.get('resident') as string,
                apartment: formData.get('apartment') as string,
                facility: formData.get('facility') as string,
                startTime: formData.get('startDate') as string + 'T' + formData.get('startTime') as string,
                endTime: formData.get('endDate') as string + 'T' + formData.get('endTime') as string,
                status: 'pending',
                createdAt: new Date().toISOString()
              };
              
              setReservations([...reservations, newReservation]);
              setIsAddModalOpen(false);
              alert('Yeni rezervasyon başarıyla eklendi.');
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Site Sakini</label>
                <input 
                  type="text" 
                  name="resident" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire</label>
                <input 
                  type="text" 
                  name="apartment" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tesis</label>
                <select 
                  name="facility" 
                  required
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="Havuz">Havuz</option>
                  <option value="Spor Salonu">Spor Salonu</option>
                  <option value="Toplantı Salonu">Toplantı Salonu</option>
                  <option value="Sauna">Sauna</option>
                  <option value="Tenis Kortu">Tenis Kortu</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    required 
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Başlangıç Saati</label>
                  <input 
                    type="time" 
                    name="startTime" 
                    required 
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    required 
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Bitiş Saati</label>
                  <input 
                    type="time" 
                    name="endTime" 
                    required 
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rezervasyon Düzenleme Modal */}
      {isEditModalOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Rezervasyon Detayları</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsEditModalOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              // Tarih ve saat bilgilerini ayırma
              const startDate = formData.get('startDate') as string;
              const startTime = formData.get('startTime') as string;
              const endDate = formData.get('endDate') as string;
              const endTime = formData.get('endTime') as string;
              
              const updatedReservation: Reservation = {
                ...selectedReservation,
                resident: formData.get('resident') as string,
                apartment: formData.get('apartment') as string,
                facility: formData.get('facility') as string,
                startTime: startDate + 'T' + startTime,
                endTime: endDate + 'T' + endTime,
                status: formData.get('status') as 'approved' | 'pending' | 'cancelled'
              };
              
              const updatedReservations = reservations.map(r => 
                r.id === selectedReservation.id ? updatedReservation : r
              );
              
              setReservations(updatedReservations);
              setIsEditModalOpen(false);
              setSelectedReservation(null);
              alert('Rezervasyon başarıyla güncellendi.');
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Site Sakini</label>
                <input 
                  type="text" 
                  name="resident" 
                  required 
                  defaultValue={selectedReservation.resident}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire</label>
                <input 
                  type="text" 
                  name="apartment" 
                  required 
                  defaultValue={selectedReservation.apartment}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tesis</label>
                <select 
                  name="facility" 
                  required
                  defaultValue={selectedReservation.facility}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="Havuz">Havuz</option>
                  <option value="Spor Salonu">Spor Salonu</option>
                  <option value="Toplantı Salonu">Toplantı Salonu</option>
                  <option value="Sauna">Sauna</option>
                  <option value="Tenis Kortu">Tenis Kortu</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    required 
                    defaultValue={selectedReservation.startTime.split('T')[0]}
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Başlangıç Saati</label>
                  <input 
                    type="time" 
                    name="startTime" 
                    required 
                    defaultValue={selectedReservation.startTime.split('T')[1]}
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    required 
                    defaultValue={selectedReservation.endTime.split('T')[0]}
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Bitiş Saati</label>
                  <input 
                    type="time" 
                    name="endTime" 
                    required 
                    defaultValue={selectedReservation.endTime.split('T')[1]}
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Durum</label>
                <select 
                  name="status" 
                  required
                  defaultValue={selectedReservation.status}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="approved">Onaylandı</option>
                  <option value="pending">Onay Bekliyor</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Oluşturulma Tarihi</label>
                <input 
                  type="text" 
                  readOnly
                  disabled
                  defaultValue={new Date(selectedReservation.createdAt).toLocaleString('tr-TR')}
                  className="w-full rounded-md border border-gray-300 bg-gray-100 p-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Güncelle</Button>
                {selectedReservation.status !== 'cancelled' && (
                  <Button 
                    color="red" 
                    onClick={() => {
                      if (window.confirm(`"${selectedReservation.facility}" için ${selectedReservation.resident} adına yapılan rezervasyonu iptal etmek istediğinize emin misiniz?`)) {
                        const updatedReservations = reservations.map(r => 
                          r.id === selectedReservation.id ? { ...r, status: 'cancelled' as const } : r
                        );
                        setReservations(updatedReservations);
                        setIsEditModalOpen(false);
                        setSelectedReservation(null);
                        alert('Rezervasyon başarıyla iptal edildi.');
                      }
                    }}
                  >
                    İptal Et
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
