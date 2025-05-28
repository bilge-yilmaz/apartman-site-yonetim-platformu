'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button } from '@tremor/react'

interface Resident {
  _id: string
  name: string
  email: string
  apartmentNo?: string
  block?: string
  phone?: string
  role: 'ADMIN' | 'RESIDENT'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data: Resident[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
  message?: string
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')

  // Kullanıcıları yükle
  const loadResidents = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (roleFilter) params.append('role', roleFilter)
      
      const response = await fetch(`/api/users?${params}`)
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        setResidents(result.data)
        if (result.pagination) {
          setTotalPages(result.pagination.pages)
        }
      } else {
        setError(result.error || 'Kullanıcılar yüklenemedi')
        setResidents([])
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error)
      setError('Kullanıcılar yüklenirken bir hata oluştu')
      setResidents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResidents()
  }, [currentPage, searchTerm, statusFilter, roleFilter])

  // Yeni kullanıcı ekleme
  const handleAddResident = async (formData: FormData) => {
    try {
      const userData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        apartmentNo: formData.get('apartmentNo') as string,
        block: formData.get('block') as string,
        phone: formData.get('phone') as string,
        role: formData.get('role') as string || 'RESIDENT'
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        setIsAddModalOpen(false)
        loadResidents()
        alert('Kullanıcı başarıyla eklendi')
      } else {
        alert(result.error || 'Kullanıcı eklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Kullanıcı ekleme hatası:', error)
      alert('Kullanıcı eklenirken bir hata oluştu')
    }
  }

  // Kullanıcı güncelleme
  const handleUpdateResident = async (formData: FormData) => {
    if (!selectedResident) return
    
    try {
      const userData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        apartmentNo: formData.get('apartmentNo') as string,
        block: formData.get('block') as string,
        phone: formData.get('phone') as string,
        role: formData.get('role') as string,
        isActive: formData.get('isActive') === 'true'
      }
      
      const response = await fetch(`/api/users/${selectedResident._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        setIsEditModalOpen(false)
        setSelectedResident(null)
        loadResidents()
        alert('Kullanıcı başarıyla güncellendi')
      } else {
        alert(result.error || 'Kullanıcı güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Kullanıcı güncelleme hatası:', error)
      alert('Kullanıcı güncellenirken bir hata oluştu')
    }
  }

  // Kullanıcı silme
  const handleDeleteResident = async (resident: Resident) => {
    if (!window.confirm(`${resident.name} adlı kullanıcıyı silmek istediğinize emin misiniz?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/users/${resident._id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        loadResidents()
        alert('Kullanıcı başarıyla silindi')
      } else {
        alert(result.error || 'Kullanıcı silinirken hata oluştu')
    }
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error)
      alert('Kullanıcı silinirken bir hata oluştu')
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
          <h1 className="text-2xl font-semibold text-gray-900">Site Sakinleri</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tüm site sakinlerini görüntüleyin ve yönetin.
          </p>
        </div>
        <Button color="blue" onClick={() => setIsAddModalOpen(true)}>
          Yeni Sakin Ekle
        </Button>
      </div>

      {/* Filtreler ve Arama */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arama
            </label>
            <input
              type="text"
              placeholder="Ad, email veya daire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
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
              <option value="">Tümü</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="ADMIN">Admin</option>
              <option value="RESIDENT">Sakin</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button 
              color="gray" 
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setRoleFilter('')
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <Text>Toplam Sakin</Text>
          <p className="mt-2 text-2xl font-semibold">{residents.length}</p>
        </Card>
        <Card>
          <Text>Aktif Sakinler</Text>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {residents.filter(r => r.isActive).length}
          </p>
        </Card>
        <Card>
          <Text>Pasif Sakinler</Text>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            {residents.filter(r => !r.isActive).length}
          </p>
        </Card>
      </div>

      {/* Kullanıcılar Tablosu */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ad Soyad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Telefon
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Daire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rol
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
              {residents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                residents.map((resident) => (
                  <tr key={resident._id}>
                  <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {resident.name}
                      </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{resident.email}</div>
                  </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">{resident.phone || '-'}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {resident.apartmentNo ? `${resident.block}-${resident.apartmentNo}` : '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        resident.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {resident.role === 'ADMIN' ? 'Admin' : 'Sakin'}
                      </span>
                    </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        resident.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                        {resident.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => {
                        setSelectedResident(resident);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Düzenle
                    </button>
                    <span className="mx-2 text-gray-300">|</span>
                    <button 
                      className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteResident(resident)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Sayfa {currentPage} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button 
              color="gray" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Önceki
            </Button>
            <Button 
              color="gray" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
      
      {/* Yeni Kullanıcı Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Yeni Sakin Ekle</h3>
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
              handleAddResident(formData);
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Ad Soyad *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Şifre *</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Telefon</label>
                <input 
                  type="tel" 
                  name="phone" 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Rol</label>
                <select 
                  name="role" 
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="RESIDENT">Sakin</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Blok</label>
                <input 
                  type="text" 
                  name="block" 
                  placeholder="A, B, C..."
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire No</label>
                <input 
                  type="text" 
                  name="apartmentNo" 
                  placeholder="101, 102..."
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kullanıcı Düzenleme Modal */}
      {isEditModalOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Sakin Düzenle</h3>
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
              handleUpdateResident(formData);
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Ad Soyad *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  defaultValue={selectedResident.name}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  defaultValue={selectedResident.email}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Telefon</label>
                <input 
                  type="tel" 
                  name="phone" 
                  defaultValue={selectedResident.phone || ''}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Rol</label>
                <select 
                  name="role" 
                  defaultValue={selectedResident.role}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="RESIDENT">Sakin</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Blok</label>
                <input 
                  type="text" 
                  name="block" 
                  defaultValue={selectedResident.block || ''}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire No</label>
                <input 
                  type="text" 
                  name="apartmentNo" 
                  defaultValue={selectedResident.apartmentNo || ''}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Durum</label>
                <select 
                  name="isActive" 
                  defaultValue={selectedResident.isActive.toString()}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Kayıt Tarihi</label>
                <input 
                  type="text" 
                  disabled
                  readOnly
                  value={new Date(selectedResident.createdAt).toLocaleDateString('tr-TR')}
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

