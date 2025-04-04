'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateAnnouncementModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAnnouncementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create announcement')
      }

      onSuccess()
      setFormData({
        title: '',
        content: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      })
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert('Duyuru oluşturulurken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Kapat</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Yeni Duyuru Oluştur
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Başlık
                          </label>
                          <input
                            type="text"
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="content"
                            className="block text-sm font-medium text-gray-700"
                          >
                            İçerik
                          </label>
                          <textarea
                            id="content"
                            required
                            rows={4}
                            value={formData.content}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                content: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="category"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Kategori
                            </label>
                            <select
                              id="category"
                              required
                              value={formData.category}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  category: e.target.value,
                                }))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="GENERAL">Genel</option>
                              <option value="MAINTENANCE">Bakım</option>
                              <option value="PAYMENT">Ödeme</option>
                              <option value="EVENT">Etkinlik</option>
                              <option value="EMERGENCY">Acil</option>
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="priority"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Öncelik
                            </label>
                            <select
                              id="priority"
                              required
                              value={formData.priority}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  priority: e.target.value,
                                }))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="LOW">Düşük</option>
                              <option value="MEDIUM">Orta</option>
                              <option value="HIGH">Yüksek</option>
                              <option value="URGENT">Acil</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="startDate"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Başlangıç Tarihi
                            </label>
                            <input
                              type="date"
                              id="startDate"
                              required
                              value={formData.startDate}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  startDate: e.target.value,
                                }))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="endDate"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Bitiş Tarihi
                            </label>
                            <input
                              type="date"
                              id="endDate"
                              value={formData.endDate}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  endDate: e.target.value,
                                }))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                          >
                            {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                            onClick={onClose}
                          >
                            İptal
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
