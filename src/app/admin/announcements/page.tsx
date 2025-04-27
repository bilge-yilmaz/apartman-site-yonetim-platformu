'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button } from '@tremor/react'

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  author: string
  isImportant: boolean
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    // Örnek veri (gerçek API entegrasyonu yapılabilir)
    const loadDummyData = () => {
      const dummyAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'Yıllık Aidat Artışı',
          content: 'Değerli site sakinlerimiz, yönetim kurulu kararıyla 2025 yılı aidat miktarları %10 oranında artırılmıştır. Yeni aidat miktarları Mayıs ayından itibaren geçerli olacaktır.',
          createdAt: '2025-04-20',
          author: 'Site Yönetimi',
          isImportant: true
        },
        {
          id: '2',
          title: 'Havuz Bakımı',
          content: 'Sitemizin havuzu yaz sezonu için hazırlanacaktır. 5-10 Mayıs tarihleri arasında havuz kullanıma kapalı olacaktır.',
          createdAt: '2025-04-18',
          author: 'Site Yönetimi',
          isImportant: false
        },
        {
          id: '3',
          title: 'Asansör Bakımı',
          content: 'A Blok asansörü 2 Mayıs Cuma günü 09:00-12:00 saatleri arasında bakım nedeniyle kullanılamayacaktır.',
          createdAt: '2025-04-15',
          author: 'Site Yönetimi',
          isImportant: true
        },
        {
          id: '4',
          title: 'Otopark Düzenlemesi',
          content: 'Otopark alanında yeni düzenleme yapılacaktır. Lütfen araçlarınızı 3 Mayıs saat 08:00\'e kadar belirtilen alanlara çekiniz.',
          createdAt: '2025-04-12',
          author: 'Site Yönetimi',
          isImportant: false
        },
        {
          id: '5',
          title: 'Çocuk Parkı Yenileniyor',
          content: 'Sitemizin çocuk parkı yenilenecektir. Çalışmalar 10-15 Mayıs tarihleri arasında gerçekleştirilecektir.',
          createdAt: '2025-04-10',
          author: 'Site Yönetimi',
          isImportant: false
        }
      ]
      
      setAnnouncements(dummyAnnouncements)
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
          <h1 className="text-2xl font-semibold text-gray-900">Duyurular</h1>
          <p className="mt-1 text-sm text-gray-600">
            Site duyurularını görüntüleyin ve yönetin.
          </p>
        </div>
        <Button color="blue" onClick={() => setIsAddModalOpen(true)}>Yeni Duyuru Ekle</Button>
      </div>

      {/* Duyurular Listesi */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className={announcement.isImportant ? 'border-l-4 border-red-500' : ''}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                  {announcement.isImportant && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      Önemli
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(announcement.createdAt).toLocaleDateString('tr-TR')} • {announcement.author}
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
                  onClick={() => {
                    if (window.confirm(`"${announcement.title}" duyurusunu silmek istediğinize emin misiniz?`)) {
                      const updatedAnnouncements = announcements.filter(a => a.id !== announcement.id);
                      setAnnouncements(updatedAnnouncements);
                      alert('Duyuru başarıyla silindi.');
                    }
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">{announcement.content}</p>
          </Card>
        ))}
      </div>
      
      {/* Yeni Duyuru Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
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
              const newAnnouncement: Announcement = {
                id: (announcements.length + 1).toString(),
                title: formData.get('title') as string,
                content: formData.get('content') as string,
                createdAt: new Date().toISOString().split('T')[0],
                author: 'Site Yönetimi',
                isImportant: formData.get('isImportant') === 'on'
              };
              
              setAnnouncements([...announcements, newAnnouncement]);
              setIsAddModalOpen(false);
              alert('Yeni duyuru başarıyla eklendi.');
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Duyuru Başlığı</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Duyuru İçeriği</label>
                <textarea 
                  name="content" 
                  required 
                  rows={4}
                  className="w-full rounded-md border border-gray-300 p-2"
                ></textarea>
              </div>
              <div className="mb-4 flex items-center">
                <input 
                  type="checkbox" 
                  id="isImportant" 
                  name="isImportant" 
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isImportant" className="ml-2 block text-sm font-medium text-gray-700">
                  Önemli Duyuru
                </label>
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
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
              const updatedAnnouncement: Announcement = {
                ...selectedAnnouncement,
                title: formData.get('title') as string,
                content: formData.get('content') as string,
                isImportant: formData.get('isImportant') === 'on'
              };
              
              const updatedAnnouncements = announcements.map(a => 
                a.id === selectedAnnouncement.id ? updatedAnnouncement : a
              );
              
              setAnnouncements(updatedAnnouncements);
              setIsEditModalOpen(false);
              setSelectedAnnouncement(null);
              alert('Duyuru başarıyla güncellendi.');
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Duyuru Başlığı</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  defaultValue={selectedAnnouncement.title}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Duyuru İçeriği</label>
                <textarea 
                  name="content" 
                  required 
                  rows={4}
                  defaultValue={selectedAnnouncement.content}
                  className="w-full rounded-md border border-gray-300 p-2"
                ></textarea>
              </div>
              <div className="mb-4 flex items-center">
                <input 
                  type="checkbox" 
                  id="isImportant" 
                  name="isImportant" 
                  defaultChecked={selectedAnnouncement.isImportant}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isImportant" className="ml-2 block text-sm font-medium text-gray-700">
                  Önemli Duyuru
                </label>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Oluşturulma Tarihi</label>
                <input 
                  type="date" 
                  name="createdAt" 
                  disabled
                  readOnly
                  defaultValue={selectedAnnouncement.createdAt}
                  className="w-full rounded-md border border-gray-300 bg-gray-100 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Yazar</label>
                <input 
                  type="text" 
                  name="author" 
                  disabled
                  readOnly
                  defaultValue={selectedAnnouncement.author}
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
