'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { XMarkIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'

interface CreateMaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const priorities = [
  { id: 'LOW', name: 'Düşük' },
  { id: 'MEDIUM', name: 'Orta' },
  { id: 'HIGH', name: 'Yüksek' },
  { id: 'URGENT', name: 'Acil' },
]

const categories = [
  { id: 'PLUMBING', name: 'Su/Tesisat' },
  { id: 'ELECTRICAL', name: 'Elektrik' },
  { id: 'HVAC', name: 'Isıtma/Soğutma' },
  { id: 'STRUCTURAL', name: 'Yapısal' },
  { id: 'ELEVATOR', name: 'Asansör' },
  { id: 'OTHER', name: 'Diğer' },
]

export function CreateMaintenanceModal({ isOpen, onClose, onSuccess }: CreateMaintenanceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    apartmentNo: '',
    title: '',
    description: '',
    priority: priorities[1], // Orta
    category: categories[0], // Su/Tesisat
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          priority: formData.priority.id,
          category: formData.category.id,
          status: 'PENDING',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create maintenance request')
      }

      onSuccess()
      onClose()
      setFormData({
        apartmentNo: '',
        title: '',
        description: '',
        priority: priorities[1],
        category: categories[0],
      })
    } catch (error) {
      console.error('Error creating maintenance request:', error)
      alert('Bakım talebi oluşturulurken bir hata oluştu')
    } finally {
      setIsLoading(false)
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
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Yeni Bakım Talebi
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="apartmentNo" className="block text-sm font-medium text-gray-700">
                            Daire No
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="apartmentNo"
                              id="apartmentNo"
                              required
                              value={formData.apartmentNo}
                              onChange={(e) => setFormData({ ...formData, apartmentNo: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Başlık
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="title"
                              id="title"
                              required
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Açıklama
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="description"
                              name="description"
                              rows={3}
                              required
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <Listbox value={formData.priority} onChange={(value) => setFormData({ ...formData, priority: value })}>
                            {({ open }) => (
                              <>
                                <Listbox.Label className="block text-sm font-medium text-gray-700">Öncelik</Listbox.Label>
                                <div className="relative mt-1">
                                  <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                                    <span className="block truncate">{formData.priority.name}</span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </span>
                                  </Listbox.Button>

                                  <Transition
                                    show={open}
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                  >
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      {priorities.map((priority) => (
                                        <Listbox.Option
                                          key={priority.id}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                          }
                                          value={priority}
                                        >
                                          {({ selected, active }) => (
                                            <>
                                              <span
                                                className={`block truncate ${
                                                  selected ? 'font-semibold' : 'font-normal'
                                                }`}
                                              >
                                                {priority.name}
                                              </span>

                                              {selected ? (
                                                <span
                                                  className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                    active ? 'text-white' : 'text-blue-600'
                                                  }`}
                                                >
                                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                              ) : null}
                                            </>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </Transition>
                                </div>
                              </>
                            )}
                          </Listbox>
                        </div>

                        <div>
                          <Listbox value={formData.category} onChange={(value) => setFormData({ ...formData, category: value })}>
                            {({ open }) => (
                              <>
                                <Listbox.Label className="block text-sm font-medium text-gray-700">Kategori</Listbox.Label>
                                <div className="relative mt-1">
                                  <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                                    <span className="block truncate">{formData.category.name}</span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </span>
                                  </Listbox.Button>

                                  <Transition
                                    show={open}
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                  >
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      {categories.map((category) => (
                                        <Listbox.Option
                                          key={category.id}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                              active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                          }
                                          value={category}
                                        >
                                          {({ selected, active }) => (
                                            <>
                                              <span
                                                className={`block truncate ${
                                                  selected ? 'font-semibold' : 'font-normal'
                                                }`}
                                              >
                                                {category.name}
                                              </span>

                                              {selected ? (
                                                <span
                                                  className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                    active ? 'text-white' : 'text-blue-600'
                                                  }`}
                                                >
                                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                              ) : null}
                                            </>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </Transition>
                                </div>
                              </>
                            )}
                          </Listbox>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
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
