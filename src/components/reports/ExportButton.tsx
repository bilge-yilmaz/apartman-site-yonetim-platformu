'use client'

import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { tr } from 'date-fns/locale'
import { format } from 'date-fns'

interface ExportButtonProps {
  data: any
  type: 'excel' | 'pdf'
}

export function ExportButton({ data, type }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      if (type === 'excel') {
        exportToExcel()
      } else {
        exportToPDF()
      }
    } catch (error) {
      console.error(`Error exporting to ${type}:`, error)
      alert(`${type.toUpperCase()} dışa aktarılırken bir hata oluştu`)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    // Excel için veri hazırlama
    const monthlyData = data.monthlyData.map((item: any) => ({
      Tarih: item.date,
      'Toplam Gelir': item.totalIncome,
      'Toplam Gider': item.totalExpense,
      'Net Kar': item.netProfit,
    }))

    const blockData = data.monthlyData[0].blockAnalysis.map((item: any) => ({
      Blok: item.block,
      'Toplam Aidat': item.amount,
    }))

    const maintenanceData = data.monthlyData[0].maintenanceCategories.map(
      (item: any) => ({
        Kategori: item.category,
        'Talep Sayısı': item.count,
      })
    )

    const wb = XLSX.utils.book_new()

    // Aylık veriler
    const ws1 = XLSX.utils.json_to_sheet(monthlyData)
    XLSX.utils.book_append_sheet(wb, ws1, 'Aylık Veriler')

    // Blok analizi
    const ws2 = XLSX.utils.json_to_sheet(blockData)
    XLSX.utils.book_append_sheet(wb, ws2, 'Blok Analizi')

    // Bakım talepleri
    const ws3 = XLSX.utils.json_to_sheet(maintenanceData)
    XLSX.utils.book_append_sheet(wb, ws3, 'Bakım Talepleri')

    // Excel dosyasını indir
    XLSX.writeFile(wb, `Rapor_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    // Başlık
    doc.setFontSize(16)
    doc.text('Apartman Yönetim Raporu', 20, 20)
    doc.setFontSize(12)
    doc.text(`Oluşturulma Tarihi: ${format(new Date(), 'dd MMMM yyyy', { locale: tr })}`, 20, 30)

    // Aylık veriler tablosu
    doc.autoTable({
      startY: 40,
      head: [['Tarih', 'Toplam Gelir', 'Toplam Gider', 'Net Kar']],
      body: data.monthlyData.map((item: any) => [
        item.date,
        `₺${item.totalIncome.toLocaleString('tr-TR')}`,
        `₺${item.totalExpense.toLocaleString('tr-TR')}`,
        `₺${item.netProfit.toLocaleString('tr-TR')}`,
      ]),
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Blok analizi tablosu
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Blok', 'Toplam Aidat']],
      body: data.monthlyData[0].blockAnalysis.map((item: any) => [
        item.block,
        `₺${item.amount.toLocaleString('tr-TR')}`,
      ]),
      headStyles: { fillColor: [59, 130, 246] },
    })

    // Bakım talepleri tablosu
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Kategori', 'Talep Sayısı']],
      body: data.monthlyData[0].maintenanceCategories.map((item: any) => [
        item.category,
        item.count,
      ]),
      headStyles: { fillColor: [59, 130, 246] },
    })

    // PDF dosyasını indir
    doc.save(`Rapor_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      {type === 'excel' ? 'Excel' : 'PDF'} İndir
      {isExporting && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
    </button>
  )
}
