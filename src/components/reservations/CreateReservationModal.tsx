'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { addHours, format, isBefore, startOfHour } from 'date-fns'

interface CreateReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateReservationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateReservationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    apartmentNo: '',
    facility: 'POOL',
    startTime: format(startOfHour(addHours(new Date(), 1)), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(startOfHour(addHours(new Date(), 2)), "yyyy-MM-dd'T'HH:mm"),
    description: '',
    numberOfPeople: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasyonlar
    const startDate = new Date(formData.startTime)
    const endDate = new Date(formData.endTime)
    const now = new Date()

    if (isBefore(startDate, now)) {
      alert('Başlangıç zamanı geçmiş bir tarih olamaz')
      return
    }

    if (isBefore(endDate, startDate)) {
      alert('Bitiş zamanı başlangıç zamanından önce olamaz')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create reservation')
      }

      onSuccess()
      setFormData({
        apartmentNo: '',
        facility: 'POOL',
        startTime: format(startOfHour(addHours(new Date(), 1)), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(startOfHour(addHours(new Date(), 2)), "yyyy-MM-dd'T'HH:mm"),
        description: '',
        numberOfPeople: 1,
      })
    } catch (error: any) {
      console.error('Error creating reservation:', error)
      alert(error.message || 'Rezervasyon oluşturulurken bir hata oluştu')
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
                      Yeni Rezervasyon Oluştur
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label
                            htmlFor="apartmentNo"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Daire No
                          </label>
                          <input
                            type="text"
                            id="apartmentNo"
                            required
                            value={formData.apartmentNo}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                apartmentNo: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="facility"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Tesis
                          </label>
                          <select
                            id="facility"
                            required
                            value={formData.facility}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                facility: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="POOL">Havuz</option>
                            <option value="GYM">Spor Salonu</option>
                            <option value="MEETING_ROOM">Toplantı Salonu</option>
                            <option value="PARTY_ROOM">Parti Salonu</option>
                            <option value="PARKING">Misafir Otoparkı</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="startTime"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Başlangıç Zamanı
                            </label>
                            <input
                              type="datetime-local"
                              id="startTime"
                              required
                              value={formData.startTime}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  startTime: e.target.value,
                                }))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="endTime"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Bitiş Zamanı
                            </label>
                            <input
                              type="datetime-local"
                              id="endTime"
                              required
                              value={formData.endTime}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  endTime: e.target.value,
                                }))
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="numberOfPeople"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Kişi Sayısı
                          </label>
                          <input
                            type="number"
                            id="numberOfPeople"
                            min="1"
                            required
                            value={formData.numberOfPeople}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                numberOfPeople: parseInt(e.target.value),
                              }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Açıklama
                          </label>
                          <textarea
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Varsa eklemek istediğiniz notlar..."
                          />
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
