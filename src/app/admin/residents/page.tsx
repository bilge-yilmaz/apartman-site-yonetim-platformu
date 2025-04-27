'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button } from '@tremor/react'

interface Resident {
  id: string
  name: string
  apartment: string
  phone: string
  email: string
  status: 'active' | 'inactive'
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)

  useEffect(() => {
    // Örnek veri (gerçek API entegrasyonu yapılabilir)
    const loadDummyData = () => {
      const dummyResidents: Resident[] = [
        {
          id: '1',
          name: 'Ahmet Yılmaz',
          apartment: 'A-101',
          phone: '0532 123 4567',
          email: 'ahmet@example.com',
          status: 'active'
        },
        {
          id: '2',
          name: 'Ayşe Demir',
          apartment: 'A-102',
          phone: '0533 234 5678',
          email: 'ayse@example.com',
          status: 'active'
        },
        {
          id: '3',
          name: 'Mehmet Kaya',
          apartment: 'B-201',
          phone: '0534 345 6789',
          email: 'mehmet@example.com',
          status: 'active'
        },
        {
          id: '4',
          name: 'Fatma Şahin',
          apartment: 'B-202',
          phone: '0535 456 7890',
          email: 'fatma@example.com',
          status: 'inactive'
        },
        {
          id: '5',
          name: 'Ali Öztürk',
          apartment: 'C-301',
          phone: '0536 567 8901',
          email: 'ali@example.com',
          status: 'active'
        }
      ]
      
      setResidents(dummyResidents)
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Site Sakinleri</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tüm site sakinlerini görüntüleyin ve yönetin.
          </p>
        </div>
        <Button color="blue" onClick={() => setIsAddModalOpen(true)}>Yeni Site Sakini Ekle</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ad Soyad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Daire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Telefon
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  E-posta
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
              {residents.map((resident) => (
                <tr key={resident.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{resident.apartment}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{resident.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{resident.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      resident.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {resident.status === 'active' ? 'Aktif' : 'Pasif'}
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
                      onClick={() => {
                        if (window.confirm(`${resident.name} adlı site sakinini silmek istediğinize emin misiniz?`)) {
                          // Silme işlemi burada gerçekleştirilecek
                          const updatedResidents = residents.filter(r => r.id !== resident.id);
                          setResidents(updatedResidents);
                          alert('Site sakini başarıyla silindi.');
                        }
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Yeni Site Sakini Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Yeni Site Sakini Ekle</h3>
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
              const newResident: Resident = {
                id: (residents.length + 1).toString(),
                name: formData.get('name') as string,
                apartment: formData.get('apartment') as string,
                phone: formData.get('phone') as string,
                email: formData.get('email') as string,
                status: 'active'
              };
              
              setResidents([...residents, newResident]);
              setIsAddModalOpen(false);
              alert('Yeni site sakini başarıyla eklendi.');
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Ad Soyad</label>
                <input 
                  type="text" 
                  name="name" 
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Telefon</label>
                <input 
                  type="text" 
                  name="phone" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">E-posta</label>
                <input 
                  type="email" 
                  name="email" 
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

      {/* Site Sakini Düzenleme Modal */}
      {isEditModalOpen && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Site Sakini Düzenle</h3>
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
              const updatedResident: Resident = {
                ...selectedResident,
                name: formData.get('name') as string,
                apartment: formData.get('apartment') as string,
                phone: formData.get('phone') as string,
                email: formData.get('email') as string,
                status: formData.get('status') as 'active' | 'inactive'
              };
              
              const updatedResidents = residents.map(r => 
                r.id === selectedResident.id ? updatedResident : r
              );
              
              setResidents(updatedResidents);
              setIsEditModalOpen(false);
              setSelectedResident(null);
              alert('Site sakini başarıyla güncellendi.');
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Ad Soyad</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  defaultValue={selectedResident.name}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire</label>
                <input 
                  type="text" 
                  name="apartment" 
                  required 
                  defaultValue={selectedResident.apartment}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Telefon</label>
                <input 
                  type="text" 
                  name="phone" 
                  required 
                  defaultValue={selectedResident.phone}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">E-posta</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  defaultValue={selectedResident.email}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Durum</label>
                <select 
                  name="status" 
                  defaultValue={selectedResident.status}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
