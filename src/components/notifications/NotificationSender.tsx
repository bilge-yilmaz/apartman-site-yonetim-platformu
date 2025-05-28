'use client'

import { useState } from 'react'
import { PaperAirplaneIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface NotificationSenderProps {
  userRole: string
  className?: string
}

const notificationTypes = [
  { value: 'GENERAL', label: 'Genel Bildirim', color: 'bg-gray-100 text-gray-800' },
  { value: 'PAYMENT_DUE', label: 'Aidat Vadesi', color: 'bg-red-100 text-red-800' },
  { value: 'MAINTENANCE_REQUEST', label: 'Bakım Talebi', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ANNOUNCEMENT', label: 'Duyuru', color: 'bg-blue-100 text-blue-800' },
  { value: 'RESERVATION_CONFIRMED', label: 'Rezervasyon', color: 'bg-green-100 text-green-800' },
]

const priorityLevels = [
  { value: 'LOW', label: 'Düşük', color: 'text-gray-600' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-600' },
  { value: 'HIGH', label: 'Yüksek', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Acil', color: 'text-red-600' },
]

export default function NotificationSender({ userRole, className = '' }: NotificationSenderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'GENERAL',
    priority: 'NORMAL',
    targetType: 'global', // global, roles, users, blocks, apartments
    targetValues: [] as string[],
    scheduledAt: '',
  })

  // Sadece Admin/Manager görebilir
  if (!['ADMIN', 'MANAGER'].includes(userRole)) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const payload: any = {
        title: formData.title,
        body: formData.body,
        type: formData.type,
        priority: formData.priority,
      }

      // Hedef belirleme
      switch (formData.targetType) {
        case 'global':
          payload.isGlobal = true
          break
        case 'roles':
          payload.targetRoles = formData.targetValues
          break
        case 'users':
          payload.targetUsers = formData.targetValues
          break
        case 'blocks':
          payload.targetBlocks = formData.targetValues
          break
        case 'apartments':
          payload.targetApartments = formData.targetValues
          break
      }

      // Zamanlama
      if (formData.scheduledAt) {
        payload.scheduledAt = new Date(formData.scheduledAt).toISOString()
      }

      const response = await fetch('/api/notifications/send-socket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Bildirim başarıyla gönderildi!' })
        setFormData({
          title: '',
          body: '',
          type: 'GENERAL',
          priority: 'NORMAL',
          targetType: 'global',
          targetValues: [],
          scheduledAt: '',
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Bildirim gönderme hatası' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bağlantı hatası' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={className}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
        Bildirim Gönder
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Yeni Bildirim Gönder
                      </h3>

                      {/* Message */}
                      {message && (
                        <div className={`mb-4 p-3 rounded-md ${
                          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                          <div className="flex">
                            {message.type === 'success' ? (
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                            ) : (
                              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                            )}
                            <span className="text-sm">{message.text}</span>
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Başlık
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Bildirim başlığı"
                          required
                        />
                      </div>

                      {/* Body */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          İçerik
                        </label>
                        <textarea
                          value={formData.body}
                          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Bildirim içeriği"
                          required
                        />
                      </div>

                      {/* Type & Priority */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tip
                          </label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {notificationTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Öncelik
                          </label>
                          <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {priorityLevels.map((priority) => (
                              <option key={priority.value} value={priority.value}>
                                {priority.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Target Type */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hedef
                        </label>
                        <select
                          value={formData.targetType}
                          onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetValues: [] })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="global">Tüm Kullanıcılar</option>
                          <option value="roles">Rol Bazlı</option>
                          <option value="blocks">Blok Bazlı</option>
                          <option value="apartments">Daire Bazlı</option>
                        </select>
                      </div>

                      {/* Target Values */}
                      {formData.targetType === 'roles' && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Roller
                          </label>
                          <div className="space-y-2">
                            {['ADMIN', 'MANAGER', 'RESIDENT'].map((role) => (
                              <label key={role} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.targetValues.includes(role)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        targetValues: [...formData.targetValues, role]
                                      })
                                    } else {
                                      setFormData({
                                        ...formData,
                                        targetValues: formData.targetValues.filter(v => v !== role)
                                      })
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scheduled At */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Zamanlama (İsteğe bağlı)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Boş bırakılırsa hemen gönderilir
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 