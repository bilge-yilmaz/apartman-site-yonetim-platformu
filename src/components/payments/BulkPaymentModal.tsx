'use client'

import { Fragment, useState, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'

interface BulkPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PaymentRow {
  apartmentNo: string
  amount: number
  dueDate: string
  description?: string
}

export function BulkPaymentModal({ isOpen, onClose, onSuccess }: BulkPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const template = [
      ['Daire No', 'Tutar', 'Son Ödeme Tarihi', 'Açıklama'],
      ['A-1', '1000', '2025-04-15', 'Nisan 2025 Aidatı'],
      ['A-2', '1000', '2025-04-15', 'Nisan 2025 Aidatı'],
    ]

    const ws = XLSX.utils.aoa_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ödemeler')
    XLSX.writeFile(wb, 'toplu-odeme-sablonu.xlsx')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsSubmitting(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 })

      // İlk satır başlıkları içerdiği için atlıyoruz
      const payments: PaymentRow[] = rows.slice(1).map(row => ({
        apartmentNo: row[0],
        amount: parseFloat(row[1]),
        dueDate: row[2],
        description: row[3],
      }))

      // Her bir ödemeyi API'ye gönder
      const results = await Promise.all(
        payments.map(payment =>
          fetch('/api/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...payment,
              status: 'PENDING',
            }),
          })
        )
      )

      // Hata kontrolü
      const errors = results.filter(r => !r.ok)
      if (errors.length > 0) {
        throw new Error(`${errors.length} ödeme eklenirken hata oluştu`)
      }

      onSuccess()
      onClose()
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error adding bulk payments:', error)
      alert('Toplu ödeme eklenirken bir hata oluştu')
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
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Toplu Ödeme Ekle
                    </Dialog.Title>
                    <div className="mt-4">
                      <div className="rounded-md bg-blue-50 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <ArrowDownTrayIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Excel Şablonu</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>
                                Toplu ödeme eklemek için önce Excel şablonunu indirin ve doldurun.
                              </p>
                            </div>
                            <div className="mt-4">
                              <div className="-mx-2 -my-1.5 flex">
                                <button
                                  type="button"
                                  className="rounded-md bg-blue-50 px-2 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
                                  onClick={downloadTemplate}
                                >
                                  Şablonu İndir
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                            Excel Dosyası
                          </label>
                          <input
                            type="file"
                            name="file"
                            id="file"
                            ref={fileInputRef}
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting || !file}
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Yükleniyor...' : 'Yükle'}
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
