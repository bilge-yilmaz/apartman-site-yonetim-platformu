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
  TextInput,
  Textarea,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import { WrenchIcon, PlusIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  category: string
  location: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  completedAt?: string
  assignedTo?: string
  comments?: {
    id: string
    text: string
    createdAt: string
    createdBy: string
    isStaff: boolean
  }[]
}

export default function ResidentMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'medium',
  })

  useEffect(() => {
    // Örnek veri yükleme (gerçek uygulamada API'den çekilecek)
    const loadDummyData = () => {
      const dummyRequests: MaintenanceRequest[] = [
        {
          id: '1',
          title: 'Mutfak musluğu arızası',
          description: 'Mutfak musluğundan su sızıntısı var. Acil olarak tamir edilmesi gerekiyor.',
          category: 'Su Tesisatı',
          location: 'Mutfak',
          priority: 'high',
          status: 'in_progress',
          createdAt: '2025-04-20T10:30:00',
          updatedAt: '2025-04-21T09:15:00',
          assignedTo: 'Mehmet Usta',
          comments: [
            {
              id: '1',
              text: 'Arıza kaydınız alınmıştır. En kısa sürede ilgilenilecektir.',
              createdAt: '2025-04-20T11:00:00',
              createdBy: 'Site Yönetimi',
              isStaff: true,
            },
            {
              id: '2',
              text: 'Mehmet Usta görevlendirilmiştir. Yarın saat 10:00\'da daireye gelecektir.',
              createdAt: '2025-04-20T15:30:00',
              createdBy: 'Site Yönetimi',
              isStaff: true,
            },
          ],
        },
        {
          id: '2',
          title: 'Balkon kapısı tamir talebi',
          description: 'Balkon kapısı düzgün kapanmıyor ve kilitlenmiyor.',
          category: 'Kapı/Pencere',
          location: 'Balkon',
          priority: 'medium',
          status: 'pending',
          createdAt: '2025-04-18T14:45:00',
          updatedAt: '2025-04-18T14:45:00',
          comments: [
            {
              id: '1',
              text: 'Talebiniz alınmıştır. İş planına eklenmiştir.',
              createdAt: '2025-04-18T15:20:00',
              createdBy: 'Site Yönetimi',
              isStaff: true,
            },
          ],
        },
        {
          id: '3',
          title: 'Elektrik prizi değişimi',
          description: 'Yatak odasındaki elektrik prizi kırık ve tehlike arz ediyor.',
          category: 'Elektrik',
          location: 'Yatak Odası',
          priority: 'high',
          status: 'completed',
          createdAt: '2025-04-10T09:00:00',
          updatedAt: '2025-04-12T16:30:00',
          completedAt: '2025-04-12T16:30:00',
          assignedTo: 'Ali Usta',
          comments: [
            {
              id: '1',
              text: 'Arıza kaydınız alınmıştır. Elektrikçimiz görevlendirilecektir.',
              createdAt: '2025-04-10T09:30:00',
              createdBy: 'Site Yönetimi',
              isStaff: true,
            },
            {
              id: '2',
              text: 'Ali Usta 12 Nisan saat 15:00\'da daireye gelecektir.',
              createdAt: '2025-04-11T10:15:00',
              createdBy: 'Site Yönetimi',
              isStaff: true,
            },
            {
              id: '3',
              text: 'Priz değişimi tamamlanmıştır. Sorun çözülmüştür.',
              createdAt: '2025-04-12T16:30:00',
              createdBy: 'Ali Usta',
              isStaff: true,
            },
          ],
        },
        {
          id: '4',
          title: 'Banyo duvar fayansı kırık',
          description: 'Banyo duvarındaki fayanslardan biri kırık ve değiştirilmesi gerekiyor.',
          category: 'Fayans/Seramik',
          location: 'Banyo',
          priority: 'low',
          status: 'cancelled',
          createdAt: '2025-04-05T11:20:00',
          updatedAt: '2025-04-07T14:00:00',
          comments: [
            {
              id: '1',
              text: 'Talebiniz alınmıştır. İncelenecektir.',
              createdAt: '2025-04-05T12:00:00',
              createdBy: 'Site Yönetimi',
              isStaff: true,
            },
            {
              id: '2',
              text: 'Fayans değişimi için malzeme temin edilmesi gerekmektedir. Sizinle iletişime geçilecektir.',
              createdAt: '2025-04-06T10:30:00',
              createdBy: 'Site Yönetimi',
              isStaff: true,
            },
            {
              id: '3',
              text: 'Kendim hallettim, talebi iptal edebilirsiniz.',
              createdAt: '2025-04-07T13:45:00',
              createdBy: 'Ahmet Yılmaz',
              isStaff: false,
            },
          ],
        },
      ]
      
      setRequests(dummyRequests)
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

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString('tr-TR', options)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" icon={ClockIcon}>Bekliyor</Badge>
      case 'in_progress':
        return <Badge color="blue" icon={ClockIcon}>İşlemde</Badge>
      case 'completed':
        return <Badge color="green" icon={CheckCircleIcon}>Tamamlandı</Badge>
      case 'cancelled':
        return <Badge color="red" icon={ExclamationCircleIcon}>İptal Edildi</Badge>
      default:
        return <Badge color="gray">Bilinmiyor</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge color="gray">Düşük</Badge>
      case 'medium':
        return <Badge color="yellow">Orta</Badge>
      case 'high':
        return <Badge color="red">Yüksek</Badge>
      default:
        return <Badge color="gray">Bilinmiyor</Badge>
    }
  }

  const handleSubmitNewRequest = () => {
    // Gerçek uygulamada API'ye gönderilecek
    alert('Bakım talebi başarıyla oluşturuldu!')
    setShowNewRequestForm(false)
    setNewRequest({
      title: '',
      description: '',
      category: '',
      location: '',
      priority: 'medium',
    })
  }

  const activeRequests = requests.filter(req => req.status === 'pending' || req.status === 'in_progress')
  const completedRequests = requests.filter(req => req.status === 'completed')
  const cancelledRequests = requests.filter(req => req.status === 'cancelled')

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bakım & Arıza Talepleri</h1>
          <p className="mt-1 text-sm text-gray-600">
            Dairenizdeki arıza ve bakım taleplerini yönetin.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            icon={PlusIcon} 
            onClick={() => setShowNewRequestForm(!showNewRequestForm)}
          >
            Yeni Talep Oluştur
          </Button>
        </div>
      </div>

      {/* Yeni Talep Formu */}
      {showNewRequestForm && (
        <Card>
          <Title>Yeni Bakım/Arıza Talebi</Title>
          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Başlık
              </label>
              <TextInput
                id="title"
                placeholder="Arıza/bakım başlığı"
                value={newRequest.title}
                onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Açıklama
              </label>
              <Textarea
                id="description"
                placeholder="Arıza/bakım detayları"
                value={newRequest.description}
                onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Kategori
                </label>
                <Select
                  id="category"
                  value={newRequest.category}
                  onValueChange={(value) => setNewRequest({...newRequest, category: value})}
                  className="mt-1"
                >
                  <SelectItem value="">Kategori Seçin</SelectItem>
                  <SelectItem value="Su Tesisatı">Su Tesisatı</SelectItem>
                  <SelectItem value="Elektrik">Elektrik</SelectItem>
                  <SelectItem value="Kapı/Pencere">Kapı/Pencere</SelectItem>
                  <SelectItem value="Fayans/Seramik">Fayans/Seramik</SelectItem>
                  <SelectItem value="Isıtma/Soğutma">Isıtma/Soğutma</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </Select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Konum
                </label>
                <Select
                  id="location"
                  value={newRequest.location}
                  onValueChange={(value) => setNewRequest({...newRequest, location: value})}
                  className="mt-1"
                >
                  <SelectItem value="">Konum Seçin</SelectItem>
                  <SelectItem value="Salon">Salon</SelectItem>
                  <SelectItem value="Mutfak">Mutfak</SelectItem>
                  <SelectItem value="Banyo">Banyo</SelectItem>
                  <SelectItem value="Yatak Odası">Yatak Odası</SelectItem>
                  <SelectItem value="Balkon">Balkon</SelectItem>
                  <SelectItem value="Koridor">Koridor</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Öncelik
              </label>
              <Select
                id="priority"
                value={newRequest.priority}
                onValueChange={(value: any) => setNewRequest({...newRequest, priority: value})}
                className="mt-1"
              >
                <SelectItem value="low">Düşük</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowNewRequestForm(false)}
              >
                İptal
              </Button>
              <Button 
                color="blue" 
                onClick={handleSubmitNewRequest}
              >
                Talebi Gönder
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Talepler */}
      <TabGroup>
        <TabList>
          <Tab>Tüm Talepler</Tab>
          <Tab>Aktif Talepler</Tab>
          <Tab>Tamamlanan</Tab>
          <Tab>İptal Edilen</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Card>
              <Title>Tüm Bakım/Arıza Taleplerim</Title>
              
              <Table className="mt-6">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Başlık</TableHeaderCell>
                    <TableHeaderCell>Kategori</TableHeaderCell>
                    <TableHeaderCell>Konum</TableHeaderCell>
                    <TableHeaderCell>Öncelik</TableHeaderCell>
                    <TableHeaderCell>Durum</TableHeaderCell>
                    <TableHeaderCell>Tarih</TableHeaderCell>
                    <TableHeaderCell>İşlem</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.title}</TableCell>
                      <TableCell>{request.category}</TableCell>
                      <TableCell>{request.location}</TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>
                        <Button size="xs" variant="light">
                          Detaylar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Aktif Talepler</Title>
              
              {activeRequests.length > 0 ? (
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Başlık</TableHeaderCell>
                      <TableHeaderCell>Kategori</TableHeaderCell>
                      <TableHeaderCell>Konum</TableHeaderCell>
                      <TableHeaderCell>Öncelik</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.title}</TableCell>
                        <TableCell>{request.category}</TableCell>
                        <TableCell>{request.location}</TableCell>
                        <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
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
                    <p className="text-sm text-gray-500">Aktif bakım/arıza talebiniz bulunmuyor.</p>
                    <Button 
                      size="sm" 
                      color="blue" 
                      className="mt-2"
                      onClick={() => setShowNewRequestForm(true)}
                    >
                      Yeni Talep Oluştur
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Tamamlanan Talepler</Title>
              
              {completedRequests.length > 0 ? (
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Başlık</TableHeaderCell>
                      <TableHeaderCell>Kategori</TableHeaderCell>
                      <TableHeaderCell>Konum</TableHeaderCell>
                      <TableHeaderCell>Tamamlanma Tarihi</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {completedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.title}</TableCell>
                        <TableCell>{request.category}</TableCell>
                        <TableCell>{request.location}</TableCell>
                        <TableCell>{formatDate(request.completedAt || request.updatedAt)}</TableCell>
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
                    <p className="text-sm text-gray-500">Tamamlanan bakım/arıza talebiniz bulunmuyor.</p>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>İptal Edilen Talepler</Title>
              
              {cancelledRequests.length > 0 ? (
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Başlık</TableHeaderCell>
                      <TableHeaderCell>Kategori</TableHeaderCell>
                      <TableHeaderCell>Konum</TableHeaderCell>
                      <TableHeaderCell>İptal Tarihi</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cancelledRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.title}</TableCell>
                        <TableCell>{request.category}</TableCell>
                        <TableCell>{request.location}</TableCell>
                        <TableCell>{formatDate(request.updatedAt)}</TableCell>
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
                    <p className="text-sm text-gray-500">İptal edilen bakım/arıza talebiniz bulunmuyor.</p>
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
