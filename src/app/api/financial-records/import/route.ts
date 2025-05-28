import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { FinancialRecord } from '@/models/FinancialRecord'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

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

    // Sadece ADMIN erişebilir
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    await connectDB()

    // JSON dosyasını oku
    const filePath = path.join(process.cwd(), 'scripts', 'financial-data.json')
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        error: 'financial-data.json dosyası bulunamadı',
        path: filePath 
      }, { status: 404 })
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const financialData = JSON.parse(fileContent)

    console.log(`📊 ${financialData.length} finansal kayıt import ediliyor...`)

    // Mevcut verileri temizle (isteğe bağlı)
    const body = await request.json()
    if (body.clearExisting) {
      await FinancialRecord.deleteMany({ apartmentId: 'apt_001' })
      console.log('🧹 Mevcut veriler temizlendi')
    }

    // Verileri toplu olarak ekle
    const result = await FinancialRecord.insertMany(financialData)

    console.log(`✅ ${result.length} kayıt başarıyla eklendi`)

    return NextResponse.json({
      success: true,
      message: `${result.length} finansal kayıt başarıyla import edildi`,
      data: {
        importedCount: result.length,
        totalRecords: financialData.length
      }
    })

  } catch (error) {
    console.error('Import Error:', error)
    return NextResponse.json({ 
      error: 'Import sırasında hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
 
 
 