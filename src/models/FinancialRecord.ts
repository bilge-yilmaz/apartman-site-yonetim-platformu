import mongoose from 'mongoose'

// Gelir kategorileri
export enum IncomeCategory {
  AIDAT = 'AIDAT',
  ORTAK_ALAN_KIRA = 'ORTAK_ALAN_KIRA',
  CEZA = 'CEZA',
  DIGER_GELIR = 'DIGER_GELIR'
}

// Gider kategorileri
export enum ExpenseCategory {
  PERSONEL = 'PERSONEL',
  ELEKTRIK = 'ELEKTRIK',
  SU = 'SU',
  DOGALGAZ = 'DOGALGAZ',
  TEMIZLIK = 'TEMIZLIK',
  GUVENLIK = 'GUVENLIK',
  BAKIM_ONARIM = 'BAKIM_ONARIM',
  ASANSOR = 'ASANSOR',
  SIGORTA = 'SIGORTA',
  DIGER_GIDER = 'DIGER_GIDER'
}

// Finansal kayıt şeması
const FinancialRecordSchema = new mongoose.Schema({
  // Temel bilgiler
  date: { type: Date, required: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  
  // Tutar bilgileri
  amount: { type: Number, required: true },
  currency: { type: String, default: 'TRY' },
  
  // Açıklama
  description: { type: String, required: true },
  notes: { type: String },
  
  // Apartman bilgileri
  apartmentId: { type: String, required: true },
  buildingBlock: { type: String },
  unitNumber: { type: String }, // Hangi daire ile ilgili (varsa)
  
  // Meta bilgiler
  isRecurring: { type: Boolean, default: false }, // Düzenli ödeme mi
  recurringPeriod: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'] },
  isPredicted: { type: Boolean, default: false }, // AI tahmini mi
  confidence: { type: Number, min: 0, max: 1 }, // Tahmin güvenilirliği
  
  // Dış faktörler
  seasonalFactor: { type: Number, default: 1 }, // Mevsimsel çarpan
  inflationRate: { type: Number }, // O dönemdeki enflasyon
  energyPriceIndex: { type: Number }, // Enerji fiyat endeksi
  
  // Sistem bilgileri
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// İndeksler
FinancialRecordSchema.index({ apartmentId: 1, date: -1 })
FinancialRecordSchema.index({ type: 1, category: 1 })
FinancialRecordSchema.index({ date: -1 })

export const FinancialRecord = mongoose.models.FinancialRecord || 
  mongoose.model('FinancialRecord', FinancialRecordSchema, 'financialrecords')

// Tahmin modeli için özet şema
const FinancialSummarySchema = new mongoose.Schema({
  apartmentId: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  
  // Gelir özetleri
  totalIncome: { type: Number, default: 0 },
  incomeByCategory: {
    AIDAT: { type: Number, default: 0 },
    ORTAK_ALAN_KIRA: { type: Number, default: 0 },
    CEZA: { type: Number, default: 0 },
    DIGER_GELIR: { type: Number, default: 0 }
  },
  
  // Gider özetleri
  totalExpense: { type: Number, default: 0 },
  expenseByCategory: {
    PERSONEL: { type: Number, default: 0 },
    ELEKTRIK: { type: Number, default: 0 },
    SU: { type: Number, default: 0 },
    DOGALGAZ: { type: Number, default: 0 },
    TEMIZLIK: { type: Number, default: 0 },
    GUVENLIK: { type: Number, default: 0 },
    BAKIM_ONARIM: { type: Number, default: 0 },
    ASANSOR: { type: Number, default: 0 },
    SIGORTA: { type: Number, default: 0 },
    DIGER_GIDER: { type: Number, default: 0 }
  },
  
  // Net durum
  netBalance: { type: Number, default: 0 },
  
  // Dış faktörler
  inflationRate: { type: Number },
  energyPriceIndex: { type: Number },
  seasonalFactor: { type: Number, default: 1 },
  
  // Meta
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

FinancialSummarySchema.index({ apartmentId: 1, year: -1, month: -1 })

export const FinancialSummary = mongoose.models.FinancialSummary || 
  mongoose.model('FinancialSummary', FinancialSummarySchema) 