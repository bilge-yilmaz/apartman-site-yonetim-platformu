'use client'

import { useState, useEffect } from 'react'
import { Card, Text, Badge, Grid } from '@tremor/react'
import { MegaphoneIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CreateAnnouncementModal } from '@/components/announcements/CreateAnnouncementModal'

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

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/announcements')
      const data = await response.json()
      setAnnouncements(data)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete announcement')
      }

      fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Duyuru silinirken bir hata oluştu')
    }
  }

  const getCategoryLabel = (category: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'gray'
      case 'MEDIUM':
        return 'blue'
      case 'HIGH':
        return 'amber'
      case 'URGENT':
        return 'rose'
      default:
        return 'gray'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Düşük'
      case 'MEDIUM':
        return 'Orta'
      case 'HIGH':
        return 'Yüksek'
      case 'URGENT':
        return 'Acil'
      default:
        return priority
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Duyurular</h1>
        <p className="mt-2 text-sm text-gray-700">
          Site sakinlerine yönelik duyuruları takip edin
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Yeni Duyuru
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Duyuru Yok</h3>
            <p className="mt-1 text-sm text-gray-500">Henüz hiç duyuru oluşturulmamış.</p>
          </div>
        </Card>
      ) : (
        <Grid numItemsLg={2} className="gap-6">
          {announcements.map((announcement) => (
            <Card
              key={announcement._id}
              decoration="top"
              decorationColor={getPriorityColor(announcement.priority)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <MegaphoneIcon
                      className="h-6 w-6 text-blue-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <Text>{announcement.title}</Text>
                    <p className="mt-1 text-sm text-gray-500">
                      {announcement.content}
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <Badge color={getPriorityColor(announcement.priority)}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                      <Badge>{getCategoryLabel(announcement.category)}</Badge>
                      <Text className="text-gray-500">
                        {format(new Date(announcement.startDate), 'd MMMM yyyy', {
                          locale: tr,
                        })}
                        {announcement.endDate &&
                          ` - ${format(new Date(announcement.endDate), 'd MMMM yyyy', {
                            locale: tr,
                          })}`}
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => handleDelete(announcement._id)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </Grid>
      )}

      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchAnnouncements()
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
