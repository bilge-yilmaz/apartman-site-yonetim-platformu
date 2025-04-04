'use client'

import { useState, useEffect } from 'react'
import { Card, Text, Badge, Grid } from '@tremor/react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { ChatBubbleLeftIcon, CurrencyDollarIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline'

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
  createdAt: string
  updatedAt: string
  notes: Array<{
    text: string
    createdAt: string
    createdBy: string
  }>
}

export default function MaintenanceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [request, setRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchRequest()
  }, [params.id])

  const fetchRequest = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/maintenance/${params.id}`)
      if (!response.ok) {
        throw new Error('Maintenance request not found')
      }
      const data = await response.json()
      setRequest(data)
    } catch (error) {
      console.error('Error fetching maintenance request:', error)
      router.push('/maintenance')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: MaintenanceRequest['status']) => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/maintenance/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === 'IN_PROGRESS' ? { startDate: new Date().toISOString() } : {}),
          ...(newStatus === 'COMPLETED' ? { completionDate: new Date().toISOString() } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      fetchRequest()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Durum güncellenirken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/maintenance/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: [
            ...(request?.notes || []),
            {
              text: newNote,
              createdAt: new Date().toISOString(),
              createdBy: 'Yönetici',
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      setNewNote('')
      fetchRequest()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Not eklenirken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge color="amber">Bekliyor</Badge>
      case 'IN_PROGRESS':
        return <Badge color="blue">Devam Ediyor</Badge>
      case 'COMPLETED':
        return <Badge color="emerald">Tamamlandı</Badge>
      case 'CANCELLED':
        return <Badge color="rose">İptal Edildi</Badge>
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge color="gray">Düşük</Badge>
      case 'MEDIUM':
        return <Badge color="blue">Orta</Badge>
      case 'HIGH':
        return <Badge color="amber">Yüksek</Badge>
      case 'URGENT':
        return <Badge color="rose">Acil</Badge>
      default:
        return null
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PLUMBING':
        return 'Su/Tesisat'
      case 'ELECTRICAL':
        return 'Elektrik'
      case 'HVAC':
        return 'Isıtma/Soğutma'
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!request) {
    return null
  }

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bakım Talebi Detayı</h1>
          <p className="mt-2 text-sm text-gray-700">
            {request.apartmentNo} numaralı daire - {request.title}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => router.push('/maintenance')}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Geri Dön
          </button>
        </div>
      </div>

      <Grid numItemsMd={2} className="gap-6">
        <Card>
          <div className="space-y-4">
            <div>
              <Text>Durum</Text>
              <div className="mt-1 flex items-center gap-2">
                {getStatusBadge(request.status)}
                {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                  <div className="flex gap-2">
                    {request.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleStatusChange('IN_PROGRESS')}
                        className="rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                      >
                        Başlat
                      </button>
                    )}
                    {request.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleStatusChange('COMPLETED')}
                        className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Tamamla
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleStatusChange('CANCELLED')}
                      className="rounded-md bg-rose-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
                    >
                      İptal Et
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Text>Öncelik</Text>
              <div className="mt-1">{getPriorityBadge(request.priority)}</div>
            </div>

            <div>
              <Text>Kategori</Text>
              <p className="mt-1 text-sm text-gray-900">{getCategoryLabel(request.category)}</p>
            </div>

            <div>
              <Text>Açıklama</Text>
              <p className="mt-1 text-sm text-gray-900">{request.description}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <Text>Oluşturulma</Text>
                </div>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(request.createdAt), 'd MMMM yyyy', { locale: tr })}
                </p>
              </div>

              {request.startDate && (
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <Text>Başlangıç</Text>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(request.startDate), 'd MMMM yyyy', { locale: tr })}
                  </p>
                </div>
              )}

              {request.completionDate && (
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <Text>Tamamlanma</Text>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(request.completionDate), 'd MMMM yyyy', { locale: tr })}
                  </p>
                </div>
              )}
            </div>

            {request.assignedTo && (
              <div>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <Text>Atanan Kişi</Text>
                </div>
                <p className="mt-1 text-sm text-gray-900">{request.assignedTo}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {request.estimatedCost && (
                <div>
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    <Text>Tahmini Maliyet</Text>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">₺{request.estimatedCost.toLocaleString('tr-TR')}</p>
                </div>
              )}

              {request.actualCost && (
                <div>
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    <Text>Gerçek Maliyet</Text>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">₺{request.actualCost.toLocaleString('tr-TR')}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Grid>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
            <Text>Notlar</Text>
          </div>

          <div className="space-y-4">
            {request.notes?.map((note, index) => (
              <div key={index} className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{note.createdBy}</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(note.createdAt), 'd MMMM yyyy HH:mm', { locale: tr })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{note.text}</p>
              </div>
            ))}

            <form onSubmit={handleAddNote} className="mt-4">
              <div>
                <label htmlFor="note" className="sr-only">
                  Not ekle
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Not ekle..."
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newNote.trim()}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                  Not Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  )
}
