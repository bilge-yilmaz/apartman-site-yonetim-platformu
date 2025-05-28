import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'apartman-site-super-secret-jwt-key-2024-production-ready-secure'

export async function POST(request: NextRequest) {
  try {
    // JWT token kontrolü
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 401 })
    }

    let payload: any
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    // Sadece ADMIN ve MANAGER erişebilir
    if (!['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const body = await request.json()
    const { reportData, format, reportType, dateRange } = body

    let exportedData: string | Buffer
    let contentType: string
    let filename: string

    const timestamp = new Date().toISOString().split('T')[0]
    const baseFilename = `${reportType}-raporu-${timestamp}`

    switch (format.toLowerCase()) {
      case 'csv':
        exportedData = generateCSV(reportData)
        contentType = 'text/csv'
        filename = `${baseFilename}.csv`
        break
      
      case 'excel':
        exportedData = generateExcel(reportData)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `${baseFilename}.xlsx`
        break
      
      case 'pdf':
        exportedData = generatePDF(reportData, reportType, dateRange)
        contentType = 'application/pdf'
        filename = `${baseFilename}.pdf`
        break
      
      default:
        return NextResponse.json({ error: 'Desteklenmeyen format' }, { status: 400 })
    }

    // Base64 encode for client download
    const base64Data = Buffer.from(exportedData).toString('base64')

    return NextResponse.json({
      success: true,
      data: base64Data,
      filename,
      contentType,
      size: exportedData.length
    })

  } catch (error) {
    console.error('Export Error:', error)
    return NextResponse.json({ 
      error: 'Rapor dışa aktarılırken hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// CSV formatında rapor oluştur
function generateCSV(reportData: any): string {
  let csv = ''
  
  if (reportData.type === 'financial' || reportData.type === 'comprehensive') {
    const data = reportData.type === 'comprehensive' ? reportData.historical : reportData
    
    // Başlık
    csv += 'Finansal Rapor\n\n'
    
    // Özet bilgiler
    csv += 'Özet Bilgiler\n'
    csv += 'Toplam Gelir,' + data.summary.totalIncome + '\n'
    csv += 'Toplam Gider,' + data.summary.totalExpense + '\n'
    csv += 'Bakiye,' + data.summary.balance + '\n'
    csv += 'Kar Marjı (%),' + data.summary.profitMargin + '\n\n'
    
    // Aylık veriler
    csv += 'Aylık Veriler\n'
    csv += 'Ay,Gelir,Gider\n'
    data.monthlyTrends.forEach((month: any) => {
      csv += `${month.month},${month.income},${month.expense}\n`
    })
    
    // Kategori bazında gelirler
    csv += '\nGelir Kategorileri\n'
    csv += 'Kategori,Tutar\n'
    Object.entries(data.categoryBreakdown.income).forEach(([category, amount]) => {
      csv += `${category},${amount}\n`
    })
    
    // Kategori bazında giderler
    csv += '\nGider Kategorileri\n'
    csv += 'Kategori,Tutar\n'
    Object.entries(data.categoryBreakdown.expense).forEach(([category, amount]) => {
      csv += `${category},${amount}\n`
    })
  }
  
  // AI tahminleri ekle
  if (reportData.aiInsights || reportData.predictions) {
    const predictions = reportData.predictions || reportData.aiInsights
    csv += '\nAI Tahminleri\n'
    csv += 'Kategori,Tip,Tutar,Güvenilirlik (%)\n'
    
    if (predictions.income) {
      Object.entries(predictions.income).forEach(([category, pred]: [string, any]) => {
        csv += `${category},Gelir,${pred.amount},${Math.round(pred.confidence * 100)}\n`
      })
    }
    
    if (predictions.expense) {
      Object.entries(predictions.expense).forEach(([category, pred]: [string, any]) => {
        csv += `${category},Gider,${pred.amount},${Math.round(pred.confidence * 100)}\n`
      })
    }
  }
  
  return csv
}

// Excel formatında rapor oluştur (basit XML formatı)
function generateExcel(reportData: any): string {
  // Basit Excel XML formatı
  let xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<Worksheet ss:Name="Finansal Rapor">
<Table>`

  const data = reportData.type === 'comprehensive' ? reportData.historical : reportData

  // Başlık satırları
  xml += `<Row><Cell><Data ss:Type="String">Finansal Rapor</Data></Cell></Row>`
  xml += `<Row></Row>`
  
  // Özet bilgiler
  xml += `<Row><Cell><Data ss:Type="String">Toplam Gelir</Data></Cell><Cell><Data ss:Type="Number">${data.summary.totalIncome}</Data></Cell></Row>`
  xml += `<Row><Cell><Data ss:Type="String">Toplam Gider</Data></Cell><Cell><Data ss:Type="Number">${data.summary.totalExpense}</Data></Cell></Row>`
  xml += `<Row><Cell><Data ss:Type="String">Bakiye</Data></Cell><Cell><Data ss:Type="Number">${data.summary.balance}</Data></Cell></Row>`
  xml += `<Row></Row>`
  
  // Aylık veriler başlığı
  xml += `<Row><Cell><Data ss:Type="String">Ay</Data></Cell><Cell><Data ss:Type="String">Gelir</Data></Cell><Cell><Data ss:Type="String">Gider</Data></Cell></Row>`
  
  // Aylık veriler
  data.monthlyTrends.forEach((month: any) => {
    xml += `<Row><Cell><Data ss:Type="String">${month.month}</Data></Cell><Cell><Data ss:Type="Number">${month.income}</Data></Cell><Cell><Data ss:Type="Number">${month.expense}</Data></Cell></Row>`
  })

  xml += `</Table></Worksheet></Workbook>`
  
  return xml
}

// PDF formatında rapor oluştur (HTML formatında)
function generatePDF(reportData: any, reportType: string, dateRange: any): string {
  const data = reportData.type === 'comprehensive' ? reportData.historical : reportData
  
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Finansal Rapor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .positive { color: green; }
        .negative { color: red; }
        .ai-section { background: #e3f2fd; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Apartman Yönetimi Finansal Raporu</h1>
        <p>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
        <p>Dönem: ${dateRange.start} - ${dateRange.end}</p>
    </div>
    
    <div class="summary">
        <h2>Finansal Özet</h2>
        <p><strong>Toplam Gelir:</strong> ₺${data.summary.totalIncome.toLocaleString('tr-TR')}</p>
        <p><strong>Toplam Gider:</strong> ₺${data.summary.totalExpense.toLocaleString('tr-TR')}</p>
        <p><strong>Net Bakiye:</strong> <span class="${data.summary.balance >= 0 ? 'positive' : 'negative'}">₺${data.summary.balance.toLocaleString('tr-TR')}</span></p>
        <p><strong>Kar Marjı:</strong> %${data.summary.profitMargin}</p>
    </div>
    
    <h2>Aylık Gelir-Gider Analizi</h2>
    <table class="table">
        <thead>
            <tr><th>Ay</th><th>Gelir (₺)</th><th>Gider (₺)</th><th>Net (₺)</th></tr>
        </thead>
        <tbody>`
  
  data.monthlyTrends.forEach((month: any) => {
    const net = month.income - month.expense
    html += `<tr>
        <td>${month.month}</td>
        <td>${month.income.toLocaleString('tr-TR')}</td>
        <td>${month.expense.toLocaleString('tr-TR')}</td>
        <td class="${net >= 0 ? 'positive' : 'negative'}">${net.toLocaleString('tr-TR')}</td>
    </tr>`
  })
  
  html += `</tbody></table>`
  
  // AI tahminleri ekle
  if (reportData.aiInsights || reportData.predictions) {
    html += `
    <div class="ai-section">
        <h2>🤖 AI Tahminleri</h2>
        <p><strong>Gelecek Ay Tahmini:</strong></p>`
    
    const predictions = reportData.aiInsights || reportData
    if (predictions.summary) {
      html += `
        <p>Tahmini Gelir: ₺${predictions.summary.totalIncome.toLocaleString('tr-TR')}</p>
        <p>Tahmini Gider: ₺${predictions.summary.totalExpense.toLocaleString('tr-TR')}</p>
        <p>Tahmini Net: <span class="${predictions.summary.netBalance >= 0 ? 'positive' : 'negative'}">₺${predictions.summary.netBalance.toLocaleString('tr-TR')}</span></p>
        <p>Güvenilirlik: %${Math.round(predictions.summary.confidence * 100)}</p>`
    }
    
    if (predictions.insights) {
      html += `<h3>AI Önerileri:</h3><ul>`
      predictions.insights.forEach((insight: any) => {
        html += `<li><strong>${insight.message}</strong> - ${insight.suggestion}</li>`
      })
      html += `</ul>`
    }
    
    html += `</div>`
  }
  
  html += `</body></html>`
  
  return html
} 