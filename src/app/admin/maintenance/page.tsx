'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Metric, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react'

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  apartment: string
  resident: string
  createdAt: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assignedTo?: string
  completedAt?: string
  notes?: string
}

export default function MaintenancePage() {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    // Örnek veri (gerçek API entegrasyonu yapılabilir)
    const loadDummyData = () => {
      const dummyRequests: MaintenanceRequest[] = [
        {
          id: '1',
          title: 'Su Borusu Tamiri',
          description: 'Mutfak lavabosunun altındaki su borusu sızıntı yapıyor.',
          apartment: 'A-101',
          resident: 'Ahmet Yılmaz',
          createdAt: '2025-04-15',
          priority: 'high',
          status: 'pending'
        },
        {
          id: '2',
          title: 'Elektrik Kesintisi',
          description: 'Dairemizde elektrik kesintisi yaşanıyor.',
          apartment: 'A-102',
          resident: 'Ayşe Demir',
          createdAt: '2025-04-19',
          status: 'in_progress',
          priority: 'high',
          assignedTo: 'Teknisyen Mehmet'
        },
        {
          id: '3',
          title: 'İnternet Bağlantı Sorunu',
          description: 'İnternet bağlantımız sürekli kesiliyor.',
          apartment: 'B-201',
          resident: 'Mehmet Kaya',
          createdAt: '2025-04-18',
          status: 'completed',
          priority: 'medium',
          assignedTo: 'Teknisyen Ali',
          completedAt: '2025-04-21'
        },
        {
          id: '4',
          title: 'Kapı Kilidi Arızası',
          description: 'Daire kapısının kilidi sıkışıyor.',
          apartment: 'B-202',
          resident: 'Fatma Şahin',
          createdAt: '2025-04-17',
          status: 'pending',
          priority: 'medium'
        },
        {
          id: '5',
          title: 'Banyo Musluğu Tamiri',
          description: 'Banyo musluğu damlatıyor.',
          apartment: 'C-301',
          resident: 'Ali Öztürk',
          createdAt: '2025-04-16',
          status: 'cancelled',
          priority: 'low'
        }
      ]
      
      setMaintenanceRequests(dummyRequests)
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

  // İstatistikler
  const totalRequests = maintenanceRequests.length
  const pendingRequests = maintenanceRequests.filter(req => req.status === 'pending').length
  const inProgressRequests = maintenanceRequests.filter(req => req.status === 'in_progress').length
  const completedRequests = maintenanceRequests.filter(req => req.status === 'completed').length

  // Önceliğe göre renk belirleme
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Duruma göre renk belirleme
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Durumu Türkçe olarak gösterme
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor'
      case 'in_progress':
        return 'İşlemde'
      case 'completed':
        return 'Tamamlandı'
      case 'cancelled':
        return 'İptal Edildi'
      default:
        return status
    }
  }

  // Önceliği Türkçe olarak gösterme
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek'
      case 'medium':
        return 'Orta'
      case 'low':
        return 'Düşük'
      default:
        return priority
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bakım Talepleri</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tüm bakım ve arıza taleplerini görüntüleyin ve yönetin.
          </p>
        </div>
        <Button color="blue">Yeni Talep Oluştur</Button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Text>Toplam Talepler</Text>
          <p className="mt-2 text-2xl font-semibold">{totalRequests}</p>
        </Card>
        <Card>
          <Text>Bekleyen</Text>
          <p className="mt-2 text-2xl font-semibold text-yellow-600">{pendingRequests}</p>
        </Card>
        <Card>
          <Text>İşlemde</Text>
          <p className="mt-2 text-2xl font-semibold text-blue-600">{inProgressRequests}</p>
        </Card>
        <Card>
          <Text>Tamamlanan</Text>
          <p className="mt-2 text-2xl font-semibold text-green-600">{completedRequests}</p>
        </Card>
      </div>

      {/* Bakım Talepleri Tablosu */}
      <Card className="mt-6">
        <div className="flex space-x-2 mb-4">
          <select 
            className="rounded-md border-gray-300 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tüm Talepler</option>
            <option value="pending">Bekleyen</option>
            <option value="in_progress">İşlemde</option>
            <option value="completed">Tamamlanan</option>
            <option value="cancelled">İptal Edilen</option>
          </select>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Daire</TableHeaderCell>
              <TableHeaderCell>Konu</TableHeaderCell>
              <TableHeaderCell>Talep Tarihi</TableHeaderCell>
              <TableHeaderCell>Durum</TableHeaderCell>
              <TableHeaderCell>İşlemler</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : maintenanceRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Bakım talebi bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              maintenanceRequests
                .filter(request => statusFilter === 'all' || request.status === statusFilter)
                .map((request) => (
                <TableRow key={request.id}>
                  <TableCell>#{request.id}</TableCell>
                  <TableCell>{request.apartment}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>
                    <Badge color={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button 
                        className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        Detaylar
                      </button>
                      <button 
                        className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                        onClick={() => {
                          // Durum güncelleme için basit bir yaklaşım
                          const newStatus = prompt(
                            'Yeni durumu seçin: pending, in_progress, completed, cancelled',
                            request.status
                          );
                          
                          if (newStatus && ['pending', 'in_progress', 'completed', 'cancelled'].includes(newStatus as any)) {
                            const updatedRequests = maintenanceRequests.map(r => 
                              r.id === request.id ? { ...r, status: newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled' } : r
                            );
                            setMaintenanceRequests(updatedRequests);
                            alert('Bakım talebi durumu güncellendi.');
                          } else if (newStatus) {
                            alert('Geçersiz durum değeri. Lütfen geçerli bir durum seçin.');
                          }
                        }}
                      >
                        Durumu Güncelle
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      {/* Bakım Talebi Detay Modalı */}
      {isDetailsModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Bakım Talebi Detayları</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Talep ID</p>
                <p>#{selectedRequest.id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Daire</p>
                <p>{selectedRequest.apartment}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Sakin</p>
                <p>{selectedRequest.resident}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Konu</p>
                <p>{selectedRequest.title}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Açıklama</p>
                <p className="whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Talep Tarihi</p>
                <p>{new Date(selectedRequest.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Durum</p>
                <Badge color={getStatusColor(selectedRequest.status)}>
                  {getStatusText(selectedRequest.status)}
                </Badge>
              </div>
              
              {selectedRequest.assignedTo && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Atanan Kişi</p>
                  <p>{selectedRequest.assignedTo}</p>
                </div>
              )}
              
              {selectedRequest.completedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tamamlanma Tarihi</p>
                  <p>{selectedRequest.completedAt}</p>
                  <p className="text-sm font-medium text-gray-500">Notlar</p>
                  <p className="whitespace-pre-wrap">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button color="gray" onClick={() => setIsDetailsModalOpen(false)}>Kapat</Button>
              <Button 
                color="green" 
                onClick={() => {
                  // Durum güncelleme için basit bir yaklaşım
                  const newStatus = prompt(
                    'Yeni durumu seçin: pending, in_progress, completed, cancelled',
                    selectedRequest.status
                  );
                  
                  if (newStatus && ['pending', 'in_progress', 'completed', 'cancelled'].includes(newStatus as any)) {
                    const updatedRequests = maintenanceRequests.map(r => 
                      r.id === selectedRequest.id ? { ...r, status: newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled' } : r
                    );
                    setMaintenanceRequests(updatedRequests);
                    setSelectedRequest({...selectedRequest, status: newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled'});
                    alert('Bakım talebi durumu güncellendi.');
                  } else if (newStatus) {
                    alert('Geçersiz durum değeri. Lütfen geçerli bir durum seçin.');
                  }
                }}
              >
                Durumu Güncelle
              </Button>
              
              {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                <Button 
                  color="blue" 
                  onClick={() => {
                    const notes = prompt('Talep hakkında not ekleyin:', selectedRequest.notes || '');
                    if (notes !== null) {
                      const updatedRequests = maintenanceRequests.map(r => 
                        r.id === selectedRequest.id ? { ...r, notes: notes } : r
                      );
                      setMaintenanceRequests(updatedRequests);
                      setSelectedRequest({...selectedRequest, notes});
                      alert('Not başarıyla eklendi.');
                    }
                  }}
                >
                  Not Ekle
                </Button>
              )}
              
              {selectedRequest.status === 'pending' && (
                <Button 
                  color="purple" 
                  onClick={() => {
                    const assignedTo = prompt('Atanacak kişi:', selectedRequest.assignedTo || '');
                    if (assignedTo !== null) {
                      const updatedRequests = maintenanceRequests.map(r => 
                        r.id === selectedRequest.id ? { ...r, assignedTo, status: 'in_progress' as const } : r
                      );
                      setMaintenanceRequests(updatedRequests);
                      setSelectedRequest({...selectedRequest, assignedTo, status: 'in_progress'});
                      alert('Bakım talebi atandı ve durumu güncellendi.');
                    }
                  }}
                >
                  Ata
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
