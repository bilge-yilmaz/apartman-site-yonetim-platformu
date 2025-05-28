'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Metric, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react'

interface MaintenanceRequest {
  _id: string
  apartmentNo: string
  title: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'ELEVATOR' | 'OTHER'
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  startDate?: string
  completionDate?: string
  images?: string[]
  notes?: Array<{
    text: string
    createdAt: string
    createdBy: string
  }>
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  name: string
  apartmentNo?: string
  block?: string
}

interface ApiResponse {
  success?: boolean
  data?: MaintenanceRequest[] | MaintenanceRequest
  error?: string
  message?: string
}

export default function MaintenancePage() {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [error, setError] = useState('')

  // Bakım taleplerini yükle
  const loadMaintenanceRequests = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      
      const response = await fetch(`/api/maintenance?${params}`)
      const result = await response.json()
      
      if (Array.isArray(result)) {
        setMaintenanceRequests(result)
      } else if (result.success && result.data) {
        setMaintenanceRequests(Array.isArray(result.data) ? result.data : [])
      } else {
        setError('Bakım talepleri yüklenemedi')
        setMaintenanceRequests([])
      }
    } catch (error) {
      console.error('Bakım talepleri yüklenirken hata:', error)
      setError('Bakım talepleri yüklenirken bir hata oluştu')
      setMaintenanceRequests([])
    } finally {
      setLoading(false)
    }
  }

  // Kullanıcıları yükle
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users?role=RESIDENT&limit=100')
      const result = await response.json()
      
      if (result.success && result.data) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error)
    }
  }

  useEffect(() => {
    loadMaintenanceRequests()
    loadUsers()
  }, [statusFilter, priorityFilter, categoryFilter])

  // Yeni bakım talebi oluşturma
  const handleCreateRequest = async (formData: FormData) => {
    try {
      const requestData = {
        apartmentNo: formData.get('apartmentNo') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        priority: formData.get('priority') as string,
        assignedTo: formData.get('assignedTo') as string || undefined,
        estimatedCost: formData.get('estimatedCost') ? parseFloat(formData.get('estimatedCost') as string) : undefined
      }
      
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setIsCreateModalOpen(false)
        loadMaintenanceRequests()
        alert('Bakım talebi başarıyla oluşturuldu')
      } else {
        alert(result.error || 'Bakım talebi oluşturulurken hata oluştu')
      }
    } catch (error) {
      console.error('Bakım talebi oluşturma hatası:', error)
      alert('Bakım talebi oluşturulurken bir hata oluştu')
    }
  }

  // Bakım talebi durumu güncelleme
  const handleUpdateStatus = async (requestId: string, newStatus: string, additionalData?: any) => {
    try {
      const updateData: any = { status: newStatus }
      
      if (additionalData) {
        Object.assign(updateData, additionalData)
      }
      
      if (newStatus === 'IN_PROGRESS' && !updateData.startDate) {
        updateData.startDate = new Date().toISOString()
      }
      
      if (newStatus === 'COMPLETED' && !updateData.completionDate) {
        updateData.completionDate = new Date().toISOString()
      }
      
      const response = await fetch(`/api/maintenance/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        loadMaintenanceRequests()
        if (selectedRequest && selectedRequest._id === requestId) {
          setSelectedRequest(result)
        }
        alert('Bakım talebi başarıyla güncellendi')
      } else {
        alert(result.error || 'Bakım talebi güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Bakım talebi güncelleme hatası:', error)
      alert('Bakım talebi güncellenirken bir hata oluştu')
    }
  }

  // Not ekleme
  const handleAddNote = async (requestId: string, noteText: string) => {
    try {
      const currentRequest = maintenanceRequests.find(r => r._id === requestId)
      if (!currentRequest) return
      
      const newNote = {
        text: noteText,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin' // Gerçek uygulamada kullanıcı bilgisi alınmalı
      }
      
      const updatedNotes = [...(currentRequest.notes || []), newNote]
      
      await handleUpdateStatus(requestId, currentRequest.status, { notes: updatedNotes })
    } catch (error) {
      console.error('Not ekleme hatası:', error)
      alert('Not eklenirken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  // İstatistikler
  const totalRequests = maintenanceRequests.length
  const pendingRequests = maintenanceRequests.filter(req => req.status === 'PENDING').length
  const inProgressRequests = maintenanceRequests.filter(req => req.status === 'IN_PROGRESS').length
  const completedRequests = maintenanceRequests.filter(req => req.status === 'COMPLETED').length

  // Önceliğe göre renk belirleme
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'red'
      case 'HIGH':
        return 'orange'
      case 'MEDIUM':
        return 'yellow'
      case 'LOW':
        return 'green'
      default:
        return 'gray'
    }
  }

  // Duruma göre renk belirleme
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow'
      case 'IN_PROGRESS':
        return 'blue'
      case 'COMPLETED':
        return 'green'
      case 'CANCELLED':
        return 'gray'
      default:
        return 'gray'
    }
  }

  // Durumu Türkçe olarak gösterme
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Bekliyor'
      case 'IN_PROGRESS':
        return 'İşlemde'
      case 'COMPLETED':
        return 'Tamamlandı'
      case 'CANCELLED':
        return 'İptal Edildi'
      default:
        return status
    }
  }

  // Önceliği Türkçe olarak gösterme
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'Acil'
      case 'HIGH':
        return 'Yüksek'
      case 'MEDIUM':
        return 'Orta'
      case 'LOW':
        return 'Düşük'
      default:
        return priority
    }
  }

  // Kategoriyi Türkçe olarak gösterme
  const getCategoryText = (category: string) => {
    switch (category) {
      case 'PLUMBING':
        return 'Tesisatçı'
      case 'ELECTRICAL':
        return 'Elektrikçi'
      case 'HVAC':
        return 'Klima/Isıtma'
      case 'STRUCTURAL':
        return 'Yapısal'
      case 'ELEVATOR':
        return 'Asansör'
      case 'OTHER':
        return 'Diğer'
      default:
        return category
    }
  }

  // Kullanıcı adını bul
  const getUserName = (apartmentNo: string) => {
    const user = users.find(u => u.apartmentNo === apartmentNo)
    return user?.name || `Daire ${apartmentNo}`
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
        <Button color="blue" onClick={() => setIsCreateModalOpen(true)}>
          Yeni Talep Oluştur
        </Button>
      </div>

      {/* Filtreler */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durum
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Tümü</option>
              <option value="PENDING">Bekleyen</option>
              <option value="IN_PROGRESS">İşlemde</option>
              <option value="COMPLETED">Tamamlanan</option>
              <option value="CANCELLED">İptal Edilen</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Öncelik
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Tümü</option>
              <option value="URGENT">Acil</option>
              <option value="HIGH">Yüksek</option>
              <option value="MEDIUM">Orta</option>
              <option value="LOW">Düşük</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Tümü</option>
              <option value="PLUMBING">Tesisatçı</option>
              <option value="ELECTRICAL">Elektrikçi</option>
              <option value="HVAC">Klima/Isıtma</option>
              <option value="STRUCTURAL">Yapısal</option>
              <option value="ELEVATOR">Asansör</option>
              <option value="OTHER">Diğer</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button 
              color="gray" 
              onClick={() => {
                setStatusFilter('all')
                setPriorityFilter('all')
                setCategoryFilter('all')
              }}
            >
              Temizle
            </Button>
          </div>
        </div>
      </Card>

      {/* Hata mesajı */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

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
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Daire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Konu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Kategori
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Öncelik
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Talep Tarihi
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {maintenanceRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Bakım talebi bulunamadı.
                  </td>
                </tr>
              ) : (
                maintenanceRequests.map((request) => (
                  <tr key={request._id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {request.apartmentNo}
        </div>
                      <div className="text-sm text-gray-500">
                        {getUserName(request.apartmentNo)}
                  </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{request.description}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">{getCategoryText(request.category)}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge color={getPriorityColor(request.priority)}>
                        {getPriorityText(request.priority)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                    <Badge color={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        Detaylar
                      </button>
                      {request.status === 'PENDING' && (
                        <>
                          <span className="mx-2 text-gray-300">|</span>
                          <button 
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleUpdateStatus(request._id, 'IN_PROGRESS')}
                          >
                            Başlat
                          </button>
                        </>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <>
                          <span className="mx-2 text-gray-300">|</span>
                      <button 
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleUpdateStatus(request._id, 'COMPLETED')}
                          >
                            Tamamla
                      </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Yeni Bakım Talebi Oluşturma Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Yeni Bakım Talebi Oluştur</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateRequest(formData);
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire No *</label>
                <input 
                  type="text" 
                  name="apartmentNo" 
                  required 
                  placeholder="101, 102..."
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Konu *</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  placeholder="Bakım konusu..."
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Açıklama *</label>
                <textarea 
                  name="description" 
                  required 
                  rows={3}
                  placeholder="Detaylı açıklama..."
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Kategori *</label>
                <select 
                  name="category" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="">Seçiniz...</option>
                  <option value="PLUMBING">Tesisatçı</option>
                  <option value="ELECTRICAL">Elektrikçi</option>
                  <option value="HVAC">Klima/Isıtma</option>
                  <option value="STRUCTURAL">Yapısal</option>
                  <option value="ELEVATOR">Asansör</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Öncelik</label>
                <select 
                  name="priority" 
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM" selected>Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Atanan Kişi</label>
                <input 
                  type="text" 
                  name="assignedTo" 
                  placeholder="Teknisyen adı..."
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tahmini Maliyet (₺)</label>
                <input 
                  type="number" 
                  name="estimatedCost" 
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsCreateModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Oluştur</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Bakım Talebi Detay Modalı */}
      {isDetailsModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Daire</p>
                <p className="text-lg">{selectedRequest.apartmentNo}</p>
                <p className="text-sm text-gray-500">{getUserName(selectedRequest.apartmentNo)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Durum</p>
                <Badge color={getStatusColor(selectedRequest.status)}>
                  {getStatusText(selectedRequest.status)}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Öncelik</p>
                <Badge color={getPriorityColor(selectedRequest.priority)}>
                  {getPriorityText(selectedRequest.priority)}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Kategori</p>
                <p>{getCategoryText(selectedRequest.category)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Talep Tarihi</p>
                <p>{new Date(selectedRequest.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
              
              {selectedRequest.assignedTo && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Atanan Kişi</p>
                  <p>{selectedRequest.assignedTo}</p>
                </div>
              )}
              
              {selectedRequest.estimatedCost && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tahmini Maliyet</p>
                  <p>₺{selectedRequest.estimatedCost.toLocaleString('tr-TR')}</p>
                </div>
              )}
              
              {selectedRequest.actualCost && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Gerçek Maliyet</p>
                  <p>₺{selectedRequest.actualCost.toLocaleString('tr-TR')}</p>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Konu</p>
              <p className="text-lg font-medium">{selectedRequest.title}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Açıklama</p>
              <p className="whitespace-pre-wrap">{selectedRequest.description}</p>
            </div>
            
            {selectedRequest.notes && selectedRequest.notes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Notlar</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedRequest.notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm">{note.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {note.createdBy} - {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 justify-end">
              <Button color="gray" onClick={() => setIsDetailsModalOpen(false)}>
                Kapat
              </Button>
              
              {selectedRequest.status === 'PENDING' && (
                <>
                  <Button 
                    color="blue" 
                    onClick={() => {
                      const assignedTo = prompt('Atanacak kişi:', selectedRequest.assignedTo || '');
                      if (assignedTo !== null) {
                        handleUpdateStatus(selectedRequest._id, 'IN_PROGRESS', { assignedTo });
                      }
                    }}
                  >
                    Başlat & Ata
                  </Button>
                  <Button 
                    color="red" 
                    onClick={() => {
                      if (window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) {
                        handleUpdateStatus(selectedRequest._id, 'CANCELLED');
                      }
                    }}
                  >
                    İptal Et
                  </Button>
                </>
              )}
              
              {selectedRequest.status === 'IN_PROGRESS' && (
                <>
                  <Button 
                    color="green" 
                    onClick={() => {
                      const actualCost = prompt('Gerçek maliyet (₺):', selectedRequest.actualCost?.toString() || '');
                      const additionalData: any = {};
                      if (actualCost && !isNaN(parseFloat(actualCost))) {
                        additionalData.actualCost = parseFloat(actualCost);
                      }
                      handleUpdateStatus(selectedRequest._id, 'COMPLETED', additionalData);
                    }}
                  >
                    Tamamla
                  </Button>
                  <Button 
                    color="red" 
                    onClick={() => {
                      if (window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) {
                        handleUpdateStatus(selectedRequest._id, 'CANCELLED');
                      }
                    }}
                  >
                    İptal Et
                  </Button>
                </>
              )}
              
              {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'IN_PROGRESS') && (
                <Button 
                  color="purple" 
                  onClick={() => {
                    const noteText = prompt('Not ekleyin:');
                    if (noteText && noteText.trim()) {
                      handleAddNote(selectedRequest._id, noteText.trim());
                    }
                  }}
                >
                  Not Ekle
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

