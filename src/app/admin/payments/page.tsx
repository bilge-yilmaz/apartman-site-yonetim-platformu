'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button } from '@tremor/react'

interface Payment {
  _id: string
  apartmentNo: string
  amount: number
  dueDate: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  paymentDate?: string
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD'
  description?: string
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  name: string
  email: string
  apartmentNo?: string
  block?: string
}

interface ApiResponse {
  success?: boolean
  data?: Payment[] | Payment
  error?: string
  message?: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [apartmentFilter, setApartmentFilter] = useState('')
  const [error, setError] = useState('')

  // Ödemeleri yükle
  const loadPayments = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (apartmentFilter) params.append('apartmentNo', apartmentFilter)
      
      const response = await fetch(`/api/payments?${params}`)
      const result = await response.json()
      
      if (Array.isArray(result)) {
        setPayments(result)
      } else if (result.success && result.data) {
        setPayments(Array.isArray(result.data) ? result.data : [])
      } else {
        setError('Ödemeler yüklenemedi')
        setPayments([])
      }
    } catch (error) {
      console.error('Ödemeler yüklenirken hata:', error)
      setError('Ödemeler yüklenirken bir hata oluştu')
      setPayments([])
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
    loadPayments()
    loadUsers()
  }, [statusFilter, apartmentFilter])

  // Yeni ödeme ekleme
  const handleAddPayment = async (formData: FormData) => {
    try {
      const paymentData = {
        apartmentNo: formData.get('apartmentNo') as string,
        amount: parseFloat(formData.get('amount') as string),
        dueDate: formData.get('dueDate') as string,
        description: formData.get('description') as string,
        status: 'PENDING'
      }
      
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setIsAddModalOpen(false)
        loadPayments()
        alert('Ödeme başarıyla eklendi')
      } else {
        alert(result.error || 'Ödeme eklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Ödeme ekleme hatası:', error)
      alert('Ödeme eklenirken bir hata oluştu')
    }
  }

  // Ödeme güncelleme
  const handleUpdatePayment = async (formData: FormData) => {
    if (!selectedPayment) return
    
    try {
      const paymentData = {
        apartmentNo: formData.get('apartmentNo') as string,
        amount: parseFloat(formData.get('amount') as string),
        dueDate: formData.get('dueDate') as string,
        description: formData.get('description') as string,
        status: formData.get('status') as string,
        paymentMethod: formData.get('paymentMethod') as string || undefined,
        paymentDate: formData.get('status') === 'PAID' ? (formData.get('paymentDate') as string || new Date().toISOString()) : undefined
      }
      
      const response = await fetch(`/api/payments/${selectedPayment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedPayment(null)
        loadPayments()
        alert('Ödeme başarıyla güncellendi')
      } else {
        alert(result.error || 'Ödeme güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Ödeme güncelleme hatası:', error)
      alert('Ödeme güncellenirken bir hata oluştu')
    }
  }

  // Ödeme durumu güncelleme
  const handleUpdatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const updateData: any = { status }
      
      if (status === 'PAID') {
        updateData.paymentDate = new Date().toISOString()
        updateData.paymentMethod = 'BANK_TRANSFER'
      }
      
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        loadPayments()
        alert('Ödeme durumu güncellendi')
      } else {
        alert(result.error || 'Ödeme güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Ödeme güncelleme hatası:', error)
      alert('Ödeme güncellenirken bir hata oluştu')
    }
  }

  // Ödeme silme
  const handleDeletePayment = async (payment: Payment) => {
    if (!window.confirm(`${payment.apartmentNo} numaralı daire için ${payment.amount} TL tutarındaki ödemeyi silmek istediğinize emin misiniz?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/payments/${payment._id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        loadPayments()
        alert('Ödeme başarıyla silindi')
      } else {
        alert(result.error || 'Ödeme silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Ödeme silme hatası:', error)
      alert('Ödeme silinirken bir hata oluştu')
    }
  }

  // Toplu aidat oluşturma
  const handleBulkCreateDues = async (formData: FormData) => {
    try {
      const amount = parseFloat(formData.get('amount') as string)
      const dueDate = formData.get('dueDate') as string
      const description = formData.get('description') as string
      const selectedBlocks = formData.getAll('blocks') as string[]
      
      // Seçili bloklardaki tüm kullanıcılar için ödeme oluştur
      const filteredUsers = users.filter(user => 
        user.apartmentNo && 
        (selectedBlocks.length === 0 || selectedBlocks.includes(user.block || ''))
      )
      
      const promises = filteredUsers.map(user => 
        fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apartmentNo: user.apartmentNo,
            amount,
            dueDate,
            description,
            status: 'PENDING'
          })
        })
      )
      
      await Promise.all(promises)
      
      setIsBulkModalOpen(false)
      loadPayments()
      alert(`${filteredUsers.length} adet aidat kaydı oluşturuldu`)
      
    } catch (error) {
      console.error('Toplu aidat oluşturma hatası:', error)
      alert('Toplu aidat oluşturulurken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  // Toplam istatistikler
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const paidAmount = payments
    .filter(payment => payment.status === 'PAID')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const pendingAmount = payments
    .filter(payment => payment.status === 'PENDING')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const overdueAmount = payments
    .filter(payment => payment.status === 'OVERDUE')
    .reduce((sum, payment) => sum + payment.amount, 0)

  // Kullanıcı adını bul
  const getUserName = (apartmentNo: string) => {
    const user = users.find(u => u.apartmentNo === apartmentNo)
    return user?.name || `Daire ${apartmentNo}`
  }

  // Benzersiz blokları al
  const uniqueBlocks = Array.from(new Set(users.map(u => u.block).filter(Boolean)))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Aidat Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tüm aidat ödemelerini görüntüleyin ve yönetin.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button color="blue" onClick={() => setIsAddModalOpen(true)}>Yeni Ödeme Ekle</Button>
          <Button color="gray" onClick={() => setIsBulkModalOpen(true)}>Toplu Aidat Oluştur</Button>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <option value="PENDING">Bekleyen</option>
              <option value="PAID">Ödenen</option>
              <option value="OVERDUE">Gecikmiş</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daire
            </label>
            <input
              type="text"
              placeholder="Daire numarası..."
              value={apartmentFilter}
              onChange={(e) => setApartmentFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button 
              color="gray" 
              onClick={() => {
                setStatusFilter('')
                setApartmentFilter('')
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
          <Text>Toplam Tutar</Text>
          <p className="mt-2 text-2xl font-semibold">
            ₺{totalAmount.toLocaleString('tr-TR')}
          </p>
        </Card>
        <Card>
          <Text>Ödenen</Text>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            ₺{paidAmount.toLocaleString('tr-TR')}
          </p>
        </Card>
        <Card>
          <Text>Bekleyen</Text>
          <p className="mt-2 text-2xl font-semibold text-yellow-600">
            ₺{pendingAmount.toLocaleString('tr-TR')}
          </p>
        </Card>
        <Card>
          <Text>Gecikmiş</Text>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            ₺{overdueAmount.toLocaleString('tr-TR')}
          </p>
        </Card>
      </div>

      {/* Ödemeler Tablosu */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Daire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Site Sakini
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Açıklama
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tutar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Son Ödeme Tarihi
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
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Ödeme kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.apartmentNo}
                      </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {getUserName(payment.apartmentNo)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{payment.description || 'Aidat'}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">₺{payment.amount.toLocaleString('tr-TR')}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {new Date(payment.dueDate).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        payment.status === 'PAID' 
                        ? 'bg-green-100 text-green-800' 
                          : payment.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                        {payment.status === 'PAID' ? 'Ödendi' : 
                         payment.status === 'PENDING' ? 'Bekliyor' : 'Gecikmiş'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsEditModalOpen(true);
                        }}
                    >
                      Düzenle
                    </button>
                      {payment.status === 'PENDING' && (
                      <>
                        <span className="mx-2 text-gray-300">|</span>
                        <button 
                          className="text-green-600 hover:text-green-900"
                            onClick={() => handleUpdatePaymentStatus(payment._id, 'PAID')}
                          >
                            Ödendi
                        </button>
                      </>
                    )}
                      <span className="mx-2 text-gray-300">|</span>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeletePayment(payment)}
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
      
      {/* Yeni Ödeme Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Yeni Ödeme Ekle</h3>
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
              handleAddPayment(formData);
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Açıklama</label>
                <input 
                  type="text" 
                  name="description" 
                  placeholder="Ödeme açıklaması..."
                  defaultValue="Aylık Aidat"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tutar (₺) *</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Son Ödeme Tarihi *</label>
                <input 
                  type="date" 
                  name="dueDate" 
                  required 
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

      {/* Ödeme Düzenleme Modal */}
      {isEditModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Ödeme Düzenle</h3>
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
              handleUpdatePayment(formData);
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire No *</label>
                <input 
                  type="text" 
                  name="apartmentNo" 
                  required
                  defaultValue={selectedPayment.apartmentNo}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Açıklama</label>
                <input 
                  type="text" 
                  name="description" 
                  defaultValue={selectedPayment.description || ''}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tutar (₺) *</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="0"
                  step="0.01"
                  defaultValue={selectedPayment.amount}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Son Ödeme Tarihi *</label>
                <input 
                  type="date" 
                  name="dueDate" 
                  required 
                  defaultValue={new Date(selectedPayment.dueDate).toISOString().split('T')[0]}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Durum</label>
                <select 
                  name="status" 
                  defaultValue={selectedPayment.status}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="PENDING">Bekleyen</option>
                  <option value="PAID">Ödenen</option>
                  <option value="OVERDUE">Gecikmiş</option>
                </select>
              </div>
              {selectedPayment.status === 'PAID' && (
                <>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
                    <select 
                      name="paymentMethod" 
                      defaultValue={selectedPayment.paymentMethod || 'BANK_TRANSFER'}
                      className="w-full rounded-md border border-gray-300 p-2"
                    >
                      <option value="CASH">Nakit</option>
                      <option value="BANK_TRANSFER">Banka Havalesi</option>
                      <option value="CREDIT_CARD">Kredi Kartı</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Ödeme Tarihi</label>
                    <input 
                      type="date" 
                      name="paymentDate" 
                      defaultValue={selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toISOString().split('T')[0] : ''}
                      className="w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Güncelle</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toplu Aidat Oluşturma Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Toplu Aidat Oluştur</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsBulkModalOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleBulkCreateDues(formData);
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Açıklama</label>
                <input 
                  type="text" 
                  name="description" 
                  required 
                  defaultValue="Aylık Aidat"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tutar (₺) *</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="0"
                  step="0.01"
                  defaultValue="1200"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Son Ödeme Tarihi *</label>
                <input 
                  type="date" 
                  name="dueDate" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Bloklar (Boş bırakılırsa tümü)</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uniqueBlocks.map(block => (
                    <label key={block} className="flex items-center">
                  <input 
                        type="checkbox" 
                        name="blocks" 
                        value={block}
                        className="mr-2"
                      />
                      Blok {block}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsBulkModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Oluştur</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

