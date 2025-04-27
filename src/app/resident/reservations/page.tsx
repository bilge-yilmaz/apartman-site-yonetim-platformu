'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Text,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Badge,
  Button,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  DatePicker,
  DatePickerValue,
} from '@tremor/react'
import { CalendarIcon, PlusIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface Reservation {
  id: string
  facilityId: string
  facilityName: string
  startTime: string
  endTime: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  createdAt: string
  updatedAt: string
}

interface Facility {
  id: string
  name: string
  description: string
  openingHour: number
  closingHour: number
  maxReservationHours: number
  image: string
  isAvailable: boolean
}

export default function ResidentReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewReservationForm, setShowNewReservationForm] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState('')
  const [selectedDate, setSelectedDate] = useState<DatePickerValue>(new Date())
  const [selectedStartTime, setSelectedStartTime] = useState('')
  const [selectedEndTime, setSelectedEndTime] = useState('')

  useEffect(() => {
    // Örnek veri yükleme (gerçek uygulamada API'den çekilecek)
    const loadDummyData = () => {
      const dummyFacilities: Facility[] = [
        {
          id: '1',
          name: 'Toplantı Salonu',
          description: 'Site sakinleri için toplantı ve etkinlik salonu',
          openingHour: 9,
          closingHour: 22,
          maxReservationHours: 3,
          image: '/images/meeting-room.jpg',
          isAvailable: true,
        },
        {
          id: '2',
          name: 'Spor Salonu',
          description: 'Fitness ekipmanları ve spor aletleri',
          openingHour: 7,
          closingHour: 23,
          maxReservationHours: 2,
          image: '/images/gym.jpg',
          isAvailable: true,
        },
        {
          id: '3',
          name: 'Havuz',
          description: 'Açık yüzme havuzu',
          openingHour: 9,
          closingHour: 20,
          maxReservationHours: 2,
          image: '/images/pool.jpg',
          isAvailable: true,
        },
        {
          id: '4',
          name: 'Sauna',
          description: 'Sauna ve buhar odası',
          openingHour: 10,
          closingHour: 21,
          maxReservationHours: 1,
          image: '/images/sauna.jpg',
          isAvailable: true,
        },
      ]
      
      const dummyReservations: Reservation[] = [
        {
          id: '1',
          facilityId: '1',
          facilityName: 'Toplantı Salonu',
          startTime: '2025-05-15T14:00:00',
          endTime: '2025-05-15T16:00:00',
          status: 'approved',
          createdAt: '2025-05-01T10:30:00',
          updatedAt: '2025-05-01T11:15:00',
        },
        {
          id: '2',
          facilityId: '2',
          facilityName: 'Spor Salonu',
          startTime: '2025-05-10T18:00:00',
          endTime: '2025-05-10T20:00:00',
          status: 'pending',
          createdAt: '2025-05-02T09:45:00',
          updatedAt: '2025-05-02T09:45:00',
        },
        {
          id: '3',
          facilityId: '3',
          facilityName: 'Havuz',
          startTime: '2025-04-20T15:00:00',
          endTime: '2025-04-20T17:00:00',
          status: 'cancelled',
          createdAt: '2025-04-15T14:20:00',
          updatedAt: '2025-04-18T11:30:00',
        },
        {
          id: '4',
          facilityId: '4',
          facilityName: 'Sauna',
          startTime: '2025-04-25T17:00:00',
          endTime: '2025-04-25T18:00:00',
          status: 'rejected',
          createdAt: '2025-04-20T16:10:00',
          updatedAt: '2025-04-21T10:45:00',
        },
      ]
      
      setFacilities(dummyFacilities)
      setReservations(dummyReservations)
      setLoading(false)
    }

    // Simüle edilmiş veri yükleme gecikmesi
    setTimeout(() => {
      loadDummyData()
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }
    return new Date(dateString).toLocaleDateString('tr-TR', options)
  }

  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleTimeString('tr-TR', options)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" icon={ClockIcon}>Bekliyor</Badge>
      case 'approved':
        return <Badge color="green" icon={CheckCircleIcon}>Onaylandı</Badge>
      case 'rejected':
        return <Badge color="red" icon={XCircleIcon}>Reddedildi</Badge>
      case 'cancelled':
        return <Badge color="gray" icon={XCircleIcon}>İptal Edildi</Badge>
      default:
        return <Badge color="gray">Bilinmiyor</Badge>
    }
  }

  const generateTimeOptions = (facility: Facility | undefined) => {
    if (!facility) return []
    
    const { openingHour, closingHour } = facility
    const timeOptions = []
    
    for (let hour = openingHour; hour < closingHour; hour++) {
      timeOptions.push(`${hour}:00`)
      timeOptions.push(`${hour}:30`)
    }
    
    return timeOptions
  }

  const handleSubmitReservation = () => {
    // Gerçek uygulamada API'ye gönderilecek
    alert('Rezervasyon talebiniz başarıyla oluşturuldu!')
    setShowNewReservationForm(false)
    setSelectedFacility('')
    setSelectedDate(new Date())
    setSelectedStartTime('')
    setSelectedEndTime('')
  }

  const selectedFacilityObj = facilities.find(f => f.id === selectedFacility)
  const timeOptions = generateTimeOptions(selectedFacilityObj)
  
  const upcomingReservations = reservations.filter(
    res => new Date(res.startTime) > new Date() && 
    (res.status === 'approved' || res.status === 'pending')
  )
  
  const pastReservations = reservations.filter(
    res => new Date(res.startTime) <= new Date() || 
    (res.status === 'rejected' || res.status === 'cancelled')
  )

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rezervasyonlar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Site tesislerini rezerve edin ve rezervasyonlarınızı yönetin.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            icon={PlusIcon} 
            onClick={() => setShowNewReservationForm(!showNewReservationForm)}
          >
            Yeni Rezervasyon
          </Button>
        </div>
      </div>

      {/* Yeni Rezervasyon Formu */}
      {showNewReservationForm && (
        <Card>
          <Title>Yeni Rezervasyon</Title>
          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="facility" className="block text-sm font-medium text-gray-700">
                Tesis
              </label>
              <Select
                id="facility"
                value={selectedFacility}
                onValueChange={setSelectedFacility}
                className="mt-1"
              >
                <SelectItem value="">Tesis Seçin</SelectItem>
                {facilities.map(facility => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            {selectedFacility && (
              <>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Tarih
                  </label>
                  <DatePicker
                    id="date"
                    value={selectedDate}
                    onValueChange={setSelectedDate}
                    className="mt-1"
                    minDate={new Date()}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Başlangıç Saati
                    </label>
                    <Select
                      id="startTime"
                      value={selectedStartTime}
                      onValueChange={setSelectedStartTime}
                      className="mt-1"
                    >
                      <SelectItem value="">Saat Seçin</SelectItem>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                      Bitiş Saati
                    </label>
                    <Select
                      id="endTime"
                      value={selectedEndTime}
                      onValueChange={setSelectedEndTime}
                      className="mt-1"
                      disabled={!selectedStartTime}
                    >
                      <SelectItem value="">Saat Seçin</SelectItem>
                      {timeOptions
                        .filter(time => {
                          if (!selectedStartTime) return false
                          const [startHour, startMinute] = selectedStartTime.split(':').map(Number)
                          const [timeHour, timeMinute] = time.split(':').map(Number)
                          const startTotalMinutes = startHour * 60 + startMinute
                          const timeTotalMinutes = timeHour * 60 + timeMinute
                          return timeTotalMinutes > startTotalMinutes
                        })
                        .map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      }
                    </Select>
                  </div>
                </div>
                
                {selectedFacilityObj && (
                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CalendarIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Tesis Bilgileri</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>{selectedFacilityObj.description}</p>
                          <p className="mt-1">
                            Çalışma Saatleri: {selectedFacilityObj.openingHour}:00 - {selectedFacilityObj.closingHour}:00
                          </p>
                          <p className="mt-1">
                            Maksimum Rezervasyon Süresi: {selectedFacilityObj.maxReservationHours} saat
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowNewReservationForm(false)}
              >
                İptal
              </Button>
              <Button 
                color="blue" 
                onClick={handleSubmitReservation}
                disabled={!selectedFacility || !selectedDate || !selectedStartTime || !selectedEndTime}
              >
                Rezervasyon Yap
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tesisler */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {facilities.map(facility => (
          <Card key={facility.id} className="overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 relative h-40 w-full overflow-hidden rounded-t-lg">
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <CalendarIcon className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <div className="p-4">
              <Title>{facility.name}</Title>
              <Text className="mt-2 line-clamp-2">{facility.description}</Text>
              <div className="mt-4">
                <Button 
                  size="sm" 
                  color="blue"
                  onClick={() => {
                    setSelectedFacility(facility.id)
                    setShowNewReservationForm(true)
                  }}
                >
                  Rezervasyon Yap
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Rezervasyonlar */}
      <TabGroup>
        <TabList>
          <Tab>Yaklaşan Rezervasyonlar</Tab>
          <Tab>Geçmiş Rezervasyonlar</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Card>
              <Title>Yaklaşan Rezervasyonlarım</Title>
              
              {upcomingReservations.length > 0 ? (
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Tesis</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Saat</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>{reservation.facilityName}</TableCell>
                        <TableCell>
                          {new Date(reservation.startTime).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                        </TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell>
                          {reservation.status === 'pending' ? (
                            <Button size="xs" color="red">
                              İptal Et
                            </Button>
                          ) : (
                            <Button size="xs" variant="light">
                              Detaylar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="mt-6 flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Yaklaşan rezervasyonunuz bulunmuyor.</p>
                    <Button 
                      size="sm" 
                      color="blue" 
                      className="mt-2"
                      onClick={() => setShowNewReservationForm(true)}
                    >
                      Rezervasyon Yap
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Geçmiş Rezervasyonlarım</Title>
              
              {pastReservations.length > 0 ? (
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Tesis</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Saat</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pastReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>{reservation.facilityName}</TableCell>
                        <TableCell>
                          {new Date(reservation.startTime).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                        </TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell>
                          <Button size="xs" variant="light">
                            Detaylar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="mt-6 flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Geçmiş rezervasyonunuz bulunmuyor.</p>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
