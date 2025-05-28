const fs = require('fs')
const path = require('path')

// Gelir kategorileri
const IncomeCategory = {
  AIDAT: 'AIDAT',
  ORTAK_ALAN_KIRA: 'ORTAK_ALAN_KIRA',
  CEZA: 'CEZA',
  DIGER_GELIR: 'DIGER_GELIR'
}

// Gider kategorileri
const ExpenseCategory = {
  PERSONEL: 'PERSONEL',
  ELEKTRIK: 'ELEKTRIK',
  SU: 'SU',
  DOGALGAZ: 'DOGALGAZ',
  TEMIZLIK: 'TEMIZLIK',
  GUVENLIK: 'GUVENLIK',
  BAKIM_ONARIM: 'BAKIM_ONARIM',
  ASANSOR: 'ASANSOR',
  SIGORTA: 'SIGORTA',
  DIGER_GIDER: 'DIGER_GIDER'
}

// Mevsimsel faktörler
const SEASONAL_FACTORS = {
  1: 1.4, 2: 1.3, 3: 1.0, 4: 0.9, 5: 0.8, 6: 1.1,
  7: 1.2, 8: 1.2, 9: 0.9, 10: 1.0, 11: 1.1, 12: 1.3
}

// Rastgele sayı üretici
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min
}

// Trend ekle (yıllık %5-15 artış)
function applyTrend(baseAmount, monthIndex) {
  const yearlyGrowth = randomFloat(0.05, 0.15) // %5-15 yıllık artış
  const monthlyGrowth = yearlyGrowth / 12
  return baseAmount * (1 + monthlyGrowth * monthIndex)
}

// Gelir verisi oluştur
function generateIncomeRecord(apartmentId, date, category, monthIndex) {
  const baseAmounts = {
    [IncomeCategory.AIDAT]: randomBetween(15000, 25000), // 30 daire x 500-800 TL
    [IncomeCategory.ORTAK_ALAN_KIRA]: randomBetween(2000, 5000),
    [IncomeCategory.CEZA]: randomBetween(0, 1500),
    [IncomeCategory.DIGER_GELIR]: randomBetween(0, 3000)
  }

  const baseAmount = baseAmounts[category]
  const seasonalFactor = SEASONAL_FACTORS[date.getMonth() + 1] || 1
  const trendAmount = applyTrend(baseAmount, monthIndex)
  
  // Gelirler için mevsimsellik daha az etkili
  const finalAmount = category === IncomeCategory.AIDAT 
    ? trendAmount // Aidat sabit
    : trendAmount * (0.8 + 0.2 * seasonalFactor)

  const descriptions = {
    [IncomeCategory.AIDAT]: 'Aylık aidat tahsilatı',
    [IncomeCategory.ORTAK_ALAN_KIRA]: 'Ortak alan kira geliri',
    [IncomeCategory.CEZA]: 'Gecikme cezası',
    [IncomeCategory.DIGER_GELIR]: 'Diğer gelirler'
  }

  return {
    date: date.toISOString(),
    type: 'INCOME',
    category,
    amount: Math.round(finalAmount),
    description: descriptions[category],
    apartmentId,
    isRecurring: category === IncomeCategory.AIDAT,
    recurringPeriod: category === IncomeCategory.AIDAT ? 'MONTHLY' : null,
    isPredicted: false,
    seasonalFactor: seasonalFactor,
    createdBy: 'SYSTEM_SEED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// Gider verisi oluştur
function generateExpenseRecord(apartmentId, date, category, monthIndex) {
  const baseAmounts = {
    [ExpenseCategory.PERSONEL]: randomBetween(8000, 12000),
    [ExpenseCategory.ELEKTRIK]: randomBetween(2000, 4000),
    [ExpenseCategory.SU]: randomBetween(800, 1500),
    [ExpenseCategory.DOGALGAZ]: randomBetween(1500, 3000),
    [ExpenseCategory.TEMIZLIK]: randomBetween(1000, 2000),
    [ExpenseCategory.GUVENLIK]: randomBetween(5000, 8000),
    [ExpenseCategory.BAKIM_ONARIM]: randomBetween(1000, 5000),
    [ExpenseCategory.ASANSOR]: randomBetween(800, 1500),
    [ExpenseCategory.SIGORTA]: randomBetween(500, 1000),
    [ExpenseCategory.DIGER_GIDER]: randomBetween(500, 2000)
  }

  const baseAmount = baseAmounts[category]
  const seasonalFactor = SEASONAL_FACTORS[date.getMonth() + 1] || 1
  const trendAmount = applyTrend(baseAmount, monthIndex)
  
  // Kategori özel mevsimsel etkiler
  let finalAmount = trendAmount
  
  switch (category) {
    case ExpenseCategory.ELEKTRIK:
    case ExpenseCategory.DOGALGAZ:
      finalAmount = trendAmount * seasonalFactor
      break
    case ExpenseCategory.SU:
      finalAmount = trendAmount * (0.8 + 0.2 * seasonalFactor)
      break
    case ExpenseCategory.BAKIM_ONARIM:
      // İlkbahar/yaz artışı
      const month = date.getMonth() + 1
      const maintenanceFactor = [6, 7, 8, 9].includes(month) ? 1.3 : 0.9
      finalAmount = trendAmount * maintenanceFactor
      break
    default:
      finalAmount = trendAmount * (0.9 + 0.1 * seasonalFactor)
  }

  const descriptions = {
    [ExpenseCategory.PERSONEL]: 'Personel maaşları',
    [ExpenseCategory.ELEKTRIK]: 'Elektrik faturası',
    [ExpenseCategory.SU]: 'Su faturası',
    [ExpenseCategory.DOGALGAZ]: 'Doğalgaz faturası',
    [ExpenseCategory.TEMIZLIK]: 'Temizlik giderleri',
    [ExpenseCategory.GUVENLIK]: 'Güvenlik hizmetleri',
    [ExpenseCategory.BAKIM_ONARIM]: 'Bakım ve onarım',
    [ExpenseCategory.ASANSOR]: 'Asansör bakımı',
    [ExpenseCategory.SIGORTA]: 'Sigorta primleri',
    [ExpenseCategory.DIGER_GIDER]: 'Diğer giderler'
  }

  return {
    date: date.toISOString(),
    type: 'EXPENSE',
    category,
    amount: Math.round(finalAmount),
    description: descriptions[category],
    apartmentId,
    isRecurring: ![ExpenseCategory.BAKIM_ONARIM, ExpenseCategory.DIGER_GIDER].includes(category),
    recurringPeriod: ![ExpenseCategory.BAKIM_ONARIM, ExpenseCategory.DIGER_GIDER].includes(category) ? 'MONTHLY' : null,
    isPredicted: false,
    seasonalFactor: seasonalFactor,
    createdBy: 'SYSTEM_SEED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// Ana veri oluşturma fonksiyonu
function generateFinancialData() {
  const apartmentId = 'apt_001'
  const records = []
  
  // Son 24 ay için veri oluştur
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 24)
  
  let monthIndex = 0
  
  for (let i = 0; i < 24; i++) {
    const currentDate = new Date(startDate)
    currentDate.setMonth(startDate.getMonth() + i)
    currentDate.setDate(1) // Ayın ilk günü
    
    // Gelir kayıtları
    Object.values(IncomeCategory).forEach(category => {
      // Aidat her ay, diğerleri %70 olasılık
      if (category === IncomeCategory.AIDAT || Math.random() > 0.3) {
        records.push(generateIncomeRecord(apartmentId, currentDate, category, monthIndex))
      }
    })
    
    // Gider kayıtları
    Object.values(ExpenseCategory).forEach(category => {
      // Personel, elektrik, su, güvenlik her ay
      // Diğerleri %80 olasılık
      const regularExpenses = [
        ExpenseCategory.PERSONEL, 
        ExpenseCategory.ELEKTRIK, 
        ExpenseCategory.SU, 
        ExpenseCategory.GUVENLIK
      ]
      
      if (regularExpenses.includes(category) || Math.random() > 0.2) {
        records.push(generateExpenseRecord(apartmentId, currentDate, category, monthIndex))
      }
    })
    
    monthIndex++
  }
  
  return records
}

// Veri oluştur ve kaydet
console.log('Finansal veri oluşturuluyor...')
const financialData = generateFinancialData()

// JSON dosyasına kaydet
const outputPath = path.join(__dirname, 'financial-data.json')
fs.writeFileSync(outputPath, JSON.stringify(financialData, null, 2))

console.log(`✅ ${financialData.length} finansal kayıt oluşturuldu`)
console.log(`📁 Dosya kaydedildi: ${outputPath}`)

// Özet istatistikler
const totalIncome = financialData
  .filter(r => r.type === 'INCOME')
  .reduce((sum, r) => sum + r.amount, 0)

const totalExpense = financialData
  .filter(r => r.type === 'EXPENSE')
  .reduce((sum, r) => sum + r.amount, 0)

console.log('\n📊 Özet İstatistikler:')
console.log(`💰 Toplam Gelir: ${totalIncome.toLocaleString('tr-TR')} TL`)
console.log(`💸 Toplam Gider: ${totalExpense.toLocaleString('tr-TR')} TL`)
console.log(`📈 Net Durum: ${(totalIncome - totalExpense).toLocaleString('tr-TR')} TL`)

// Aylık ortalamalar
const monthlyIncome = totalIncome / 24
const monthlyExpense = totalExpense / 24

console.log(`\n📅 Aylık Ortalamalar:`)
console.log(`💰 Ortalama Aylık Gelir: ${monthlyIncome.toLocaleString('tr-TR')} TL`)
console.log(`💸 Ortalama Aylık Gider: ${monthlyExpense.toLocaleString('tr-TR')} TL`)
console.log(`📈 Ortalama Aylık Net: ${(monthlyIncome - monthlyExpense).toLocaleString('tr-TR')} TL`)

console.log('\n🚀 MongoDB Compass ile bu dosyayı "financialrecords" koleksiyonuna import edebilirsiniz!')
console.log('📋 Import ayarları: JSON format, "Insert" mode') 