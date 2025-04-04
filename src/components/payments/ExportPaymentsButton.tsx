'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Payment {
  apartmentNo: string
  amount: number
  dueDate: string
  status: string
  description?: string
  paymentDate?: string
}

interface ExportPaymentsButtonProps {
  payments: Payment[]
}

export function ExportPaymentsButton({ payments }: ExportPaymentsButtonProps) {
  const handleExport = () => {
    // Excel için veriyi hazırla
    const data = payments.map(payment => ({
      'Daire No': payment.apartmentNo,
      'Tutar (₺)': payment.amount,
      'Son Ödeme Tarihi': format(new Date(payment.dueDate), 'd MMMM yyyy', { locale: tr }),
      'Durum': payment.status === 'PAID' ? 'Ödendi' : 
               payment.status === 'PENDING' ? 'Bekliyor' : 
               'Gecikmiş',
      'Ödeme Tarihi': payment.paymentDate ? 
                      format(new Date(payment.paymentDate), 'd MMMM yyyy', { locale: tr }) : 
                      '-',
      'Açıklama': payment.description || '-'
    }))

    // Excel dosyasını oluştur
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ödemeler')

    // Dosyayı indir
    XLSX.writeFile(wb, `odemeler-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
    >
      <ArrowDownTrayIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
      Excel'e Aktar
    </button>
  )
}
