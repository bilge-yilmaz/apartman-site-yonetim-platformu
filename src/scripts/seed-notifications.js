const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// MongoDB bağlantısı
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB bağlantısı başarılı')
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error)
    process.exit(1)
  }
}

// FCMToken Schema
const FCMTokenSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    ref: 'User'
  },
  token: { 
    type: String, 
    required: true,
    unique: true
  },
  deviceType: {
    type: String,
    enum: ['web', 'android', 'ios'],
    required: true
  },
  deviceInfo: {
    userAgent: { type: String },
    platform: { type: String },
    appVersion: { type: String }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastUsed: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
})

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  body: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: [
      'PAYMENT_DUE',
      'PAYMENT_RECEIVED', 
      'MAINTENANCE_REQUEST',
      'MAINTENANCE_UPDATE',
      'ANNOUNCEMENT',
      'RESERVATION_CONFIRMED',
      'RESERVATION_REMINDER',
      'GENERAL'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL'
  },
  
  // Hedef
  targetUsers: [{ type: String, ref: 'User' }],
  targetRoles: [{ type: String }],
  targetBlocks: [{ type: String }],
  targetApartments: [{ type: String }],
  isGlobal: { type: Boolean, default: false },
  
  // İçerik
  data: { type: mongoose.Schema.Types.Mixed },
  imageUrl: { type: String },
  actionUrl: { type: String },
  
  // Zamanlama
  scheduledAt: { type: Date },
  expiresAt: { type: Date },
  
  // Durum
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'SENT', 'FAILED'],
    default: 'DRAFT'
  },
  sentAt: { type: Date },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  
  // Meta
  createdBy: { 
    type: String, 
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true,
})

// Modelleri oluştur
const FCMToken = mongoose.model('FCMToken', FCMTokenSchema)
const Notification = mongoose.model('Notification', NotificationSchema)

// Test verilerini ekle
async function seedData() {
  try {
    console.log('Test verileri ekleniyor...')

    // Önce mevcut verileri temizle
    await FCMToken.deleteMany({})
    await Notification.deleteMany({})
    console.log('Mevcut veriler temizlendi')

    // Test FCM Token'ları ekle
    const testTokens = [
      {
        userId: 'test-user-1',
        token: 'fcm-token-web-test-123456789',
        deviceType: 'web',
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          platform: 'Win32',
          appVersion: '1.0.0'
        },
        isActive: true,
        lastUsed: new Date()
      },
      {
        userId: 'test-user-2',
        token: 'fcm-token-android-test-987654321',
        deviceType: 'android',
        deviceInfo: {
          platform: 'Android',
          appVersion: '1.0.0'
        },
        isActive: true,
        lastUsed: new Date()
      },
      {
        userId: 'test-user-3',
        token: 'fcm-token-ios-test-456789123',
        deviceType: 'ios',
        deviceInfo: {
          platform: 'iOS',
          appVersion: '1.0.0'
        },
        isActive: true,
        lastUsed: new Date()
      }
    ]

    await FCMToken.insertMany(testTokens)
    console.log('✅ FCM Token\'ları eklendi:', testTokens.length)

    // Test Notification'ları ekle
    const testNotifications = [
      {
        title: 'Aidat Vadesi Yaklaşıyor',
        body: 'Mart ayı aidatınızın son ödeme tarihi 15 Mart 2024',
        type: 'PAYMENT_DUE',
        priority: 'HIGH',
        targetUsers: ['test-user-1'],
        data: { amount: '500', dueDate: '2024-03-15' },
        actionUrl: '/payments',
        status: 'SENT',
        sentAt: new Date(),
        sentCount: 1,
        failedCount: 0,
        createdBy: 'system'
      },
      {
        title: 'Yeni Bakım Talebi',
        body: 'A Blok 12 numaralı daireden asansör arızası bildirimi',
        type: 'MAINTENANCE_REQUEST',
        priority: 'NORMAL',
        targetRoles: ['ADMIN', 'MANAGER'],
        data: { apartmentNo: 'A-12', category: 'elevator' },
        actionUrl: '/maintenance',
        status: 'SENT',
        sentAt: new Date(),
        sentCount: 2,
        failedCount: 0,
        createdBy: 'test-user-1'
      },
      {
        title: 'Site Duyurusu',
        body: 'Yarın saat 14:00-16:00 arası su kesintisi olacaktır',
        type: 'ANNOUNCEMENT',
        priority: 'NORMAL',
        isGlobal: true,
        actionUrl: '/announcements',
        status: 'SENT',
        sentAt: new Date(),
        sentCount: 50,
        failedCount: 2,
        createdBy: 'admin-user'
      },
      {
        title: 'Rezervasyon Onayı',
        body: 'Sosyal tesis rezervasyonunuz onaylandı - 20 Mart 2024, 19:00',
        type: 'RESERVATION_CONFIRMED',
        priority: 'NORMAL',
        targetUsers: ['test-user-2'],
        data: { reservationId: 'res-123', date: '2024-03-20', time: '19:00' },
        actionUrl: '/reservations',
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 gün sonra
        createdBy: 'system'
      },
      {
        title: 'Ödeme Alındı',
        body: 'Mart ayı aidatınız başarıyla alınmıştır. Teşekkürler!',
        type: 'PAYMENT_RECEIVED',
        priority: 'LOW',
        targetUsers: ['test-user-3'],
        data: { amount: '500', paymentId: 'pay-456' },
        actionUrl: '/payments',
        status: 'SENT',
        sentAt: new Date(),
        sentCount: 1,
        failedCount: 0,
        createdBy: 'system'
      }
    ]

    await Notification.insertMany(testNotifications)
    console.log('✅ Notification\'lar eklendi:', testNotifications.length)

    console.log('\n🎉 Tüm test verileri başarıyla eklendi!')
    console.log('\nMongoDB Compass\'ta şu collection\'ları görebilirsiniz:')
    console.log('- fcmtokens (FCM Token\'ları)')
    console.log('- notifications (Bildirimler)')
    
  } catch (error) {
    console.error('❌ Veri ekleme hatası:', error)
  }
}

// Ana fonksiyon
async function main() {
  await connectDB()
  await seedData()
  await mongoose.connection.close()
  console.log('\n✅ MongoDB bağlantısı kapatıldı')
}

main().catch(console.error) 