'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button } from '@tremor/react'

interface Announcement {
  _id: string
  title: string
  content: string
  category: 'GENERAL' | 'MAINTENANCE' | 'PAYMENT' | 'EVENT' | 'EMERGENCY'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success?: boolean
  data?: Announcement[] | Announcement
  error?: string
  message?: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState('')

  // Duyuruları yükle
  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter !== 'all') params.append('isActive', statusFilter)
      
      const response = await fetch(`/api/announcements?${params}`)
      const result = await response.json()
      
      if (Array.isArray(result)) {
        setAnnouncements(result)
      } else if (result.success && result.data) {
        setAnnouncements(Array.isArray(result.data) ? result.data : [])
      } else {
        setError('Duyurular yüklenemedi')
        setAnnouncements([])
      }
    } catch (error) {
      console.error('Duyurular yüklenirken hata:', error)
      setError('Duyurular yüklenirken bir hata oluştu')
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [categoryFilter, statusFilter])

  // Yeni duyuru ekleme
  const handleCreateAnnouncement = async (formData: FormData) => {
    try {
      const announcementData = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        category: formData.get('category') as string,
        priority: formData.get('priority') as string,
        endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string).toISOString() : undefined,
        isActive: true
      }
      
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setIsAddModalOpen(false)
        loadAnnouncements()
        alert('Duyuru başarıyla oluşturuldu')
      } else {
        alert(result.error || 'Duyuru oluşturulurken hata oluştu')
      }
    } catch (error) {
      console.error('Duyuru oluşturma hatası:', error)
      alert('Duyuru oluşturulurken bir hata oluştu')
    }
  }

  // Duyuru güncelleme
  const handleUpdateAnnouncement = async (formData: FormData) => {
    if (!selectedAnnouncement) return
    
    try {
      const announcementData = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        category: formData.get('category') as string,
        priority: formData.get('priority') as string,
        endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string).toISOString() : undefined,
        isActive: formData.get('isActive') === 'true'
      }
      
      const response = await fetch(`/api/announcements/${selectedAnnouncement._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedAnnouncement(null)
        loadAnnouncements()
        alert('Duyuru başarıyla güncellendi')
      } else {
        alert(result.error || 'Duyuru güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Duyuru güncelleme hatası:', error)
      alert('Duyuru güncellenirken bir hata oluştu')
    }
  }

  // Duyuru silme
  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (!window.confirm(`"${announcement.title}" duyurusunu silmek istediğinize emin misiniz?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/announcements/${announcement._id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        loadAnnouncements()
        alert('Duyuru başarıyla silindi')
      } else {
        alert(result.error || 'Duyuru silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Duyuru silme hatası:', error)
      alert('Duyuru silinirken bir hata oluştu')
    }
  }

  // Kategoriyi Türkçe olarak gösterme
  const getCategoryText = (category: string) => {
    switch (category) {
      case 'GENERAL':
        return 'Genel'
      case 'MAINTENANCE':
        return 'Bakım'
      case 'PAYMENT':
        return 'Ödeme'
      case 'EVENT':
        return 'Etkinlik'
      case 'EMERGENCY':
        return 'Acil'
      default:
        return category
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

  // Önceliğe göre renk belirleme
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-red-500 bg-red-50'
      case 'HIGH':
        return 'border-orange-500 bg-orange-50'
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-50'
      case 'LOW':
        return 'border-green-500 bg-green-50'
      default:
        return 'border-gray-300'
    }
  }

  // Öncelik badge rengi
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Duyurular</h1>
          <p className="mt-1 text-sm text-gray-600">
            Site duyurularını görüntüleyin ve yönetin.
          </p>
        </div>
        <Button color="blue" onClick={() => setIsAddModalOpen(true)}>
          Yeni Duyuru Ekle
        </Button>
      </div>

      {/* Filtreler */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <option value="GENERAL">Genel</option>
              <option value="MAINTENANCE">Bakım</option>
              <option value="PAYMENT">Ödeme</option>
              <option value="EVENT">Etkinlik</option>
              <option value="EMERGENCY">Acil</option>
            </select>
          </div>
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
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button 
              color="gray" 
              onClick={() => {
                setCategoryFilter('all')
                setStatusFilter('all')
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

      {/* Duyurular Listesi */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz duyuru bulunmuyor.</p>
            </div>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card 
              key={announcement._id} 
              className={`border-l-4 ${getPriorityColor(announcement.priority)} ${!announcement.isActive ? 'opacity-60' : ''}`}
            >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityBadgeColor(announcement.priority)}`}>
                      {getPriorityText(announcement.priority)}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {getCategoryText(announcement.category)}
                    </span>
                    {!announcement.isActive && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Pasif
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                    {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                    {announcement.endDate && (
                      <span> • Bitiş: {new Date(announcement.endDate).toLocaleDateString('tr-TR')}</span>
                    )}
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    setIsEditModalOpen(true);
                  }}
                >
                  Düzenle
                </button>
                <button 
                  className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                    onClick={() => handleDeleteAnnouncement(announcement)}
                >
                  Sil
                </button>
              </div>
            </div>
              <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
          </Card>
          ))
        )}
      </div>
      
      {/* Yeni Duyuru Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Yeni Duyuru Ekle</h3>
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
              handleCreateAnnouncement(formData);
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Duyuru Başlığı *</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Duyuru İçeriği *</label>
                <textarea 
                  name="content" 
                  required 
                  rows={4}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Kategori</label>
                <select 
                  name="category" 
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="GENERAL">Genel</option>
                  <option value="MAINTENANCE">Bakım</option>
                  <option value="PAYMENT">Ödeme</option>
                  <option value="EVENT">Etkinlik</option>
                  <option value="EMERGENCY">Acil</option>
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Bitiş Tarihi (İsteğe bağlı)</label>
                <input 
                  type="date" 
                  name="endDate" 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Yayınla</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duyuru Düzenleme Modal */}
      {isEditModalOpen && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Duyuru Düzenle</h3>
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
              handleUpdateAnnouncement(formData);
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Duyuru Başlığı *</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  defaultValue={selectedAnnouncement.title}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Duyuru İçeriği *</label>
                <textarea 
                  name="content" 
                  required 
                  rows={4}
                  defaultValue={selectedAnnouncement.content}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Kategori</label>
                <select 
                  name="category" 
                  defaultValue={selectedAnnouncement.category}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="GENERAL">Genel</option>
                  <option value="MAINTENANCE">Bakım</option>
                  <option value="PAYMENT">Ödeme</option>
                  <option value="EVENT">Etkinlik</option>
                  <option value="EMERGENCY">Acil</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Öncelik</label>
                <select 
                  name="priority" 
                  defaultValue={selectedAnnouncement.priority}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Bitiş Tarihi (İsteğe bağlı)</label>
                <input 
                  type="date" 
                  name="endDate" 
                  defaultValue={selectedAnnouncement.endDate ? new Date(selectedAnnouncement.endDate).toISOString().split('T')[0] : ''}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Durum</label>
                <select 
                  name="isActive" 
                  defaultValue={selectedAnnouncement.isActive.toString()}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Oluşturulma Tarihi</label>
                <input 
                  type="text" 
                  disabled
                  readOnly
                  value={new Date(selectedAnnouncement.createdAt).toLocaleDateString('tr-TR')}
                  className="w-full rounded-md border border-gray-300 bg-gray-100 p-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Güncelle</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

