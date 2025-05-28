const fs = require('fs')
const path = require('path')

// Test FCM Token'ları
const testTokens = [
  {
    _id: "fcm-token-1",
    userId: 'test-user-1',
    token: 'fcm-token-web-test-123456789',
    deviceType: 'web',
    deviceInfo: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      appVersion: '1.0.0'
    },
    isActive: true,
    lastUsed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "fcm-token-2",
    userId: 'test-user-2',
    token: 'fcm-token-android-test-987654321',
    deviceType: 'android',
    deviceInfo: {
      platform: 'Android',
      appVersion: '1.0.0'
    },
    isActive: true,
    lastUsed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "fcm-token-3",
    userId: 'test-user-3',
    token: 'fcm-token-ios-test-456789123',
    deviceType: 'ios',
    deviceInfo: {
      platform: 'iOS',
      appVersion: '1.0.0'
    },
    isActive: true,
    lastUsed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Test Notification'ları
const testNotifications = [
  {
    _id: "notification-1",
    title: 'Aidat Vadesi Yaklaşıyor',
    body: 'Mart ayı aidatınızın son ödeme tarihi 15 Mart 2024',
    type: 'PAYMENT_DUE',
    priority: 'HIGH',
    targetUsers: ['test-user-1'],
    data: { amount: '500', dueDate: '2024-03-15' },
    actionUrl: '/payments',
    status: 'SENT',
    sentAt: new Date().toISOString(),
    sentCount: 1,
    failedCount: 0,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "notification-2",
    title: 'Yeni Bakım Talebi',
    body: 'A Blok 12 numaralı daireden asansör arızası bildirimi',
    type: 'MAINTENANCE_REQUEST',
    priority: 'NORMAL',
    targetRoles: ['ADMIN', 'MANAGER'],
    data: { apartmentNo: 'A-12', category: 'elevator' },
    actionUrl: '/maintenance',
    status: 'SENT',
    sentAt: new Date().toISOString(),
    sentCount: 2,
    failedCount: 0,
    createdBy: 'test-user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "notification-3",
    title: 'Site Duyurusu',
    body: 'Yarın saat 14:00-16:00 arası su kesintisi olacaktır',
    type: 'ANNOUNCEMENT',
    priority: 'NORMAL',
    isGlobal: true,
    actionUrl: '/announcements',
    status: 'SENT',
    sentAt: new Date().toISOString(),
    sentCount: 50,
    failedCount: 2,
    createdBy: 'admin-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "notification-4",
    title: 'Rezervasyon Onayı',
    body: 'Sosyal tesis rezervasyonunuz onaylandı - 20 Mart 2024, 19:00',
    type: 'RESERVATION_CONFIRMED',
    priority: 'NORMAL',
    targetUsers: ['test-user-2'],
    data: { reservationId: 'res-123', date: '2024-03-20', time: '19:00' },
    actionUrl: '/reservations',
    status: 'SCHEDULED',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "notification-5",
    title: 'Ödeme Alındı',
    body: 'Mart ayı aidatınız başarıyla alınmıştır. Teşekkürler!',
    type: 'PAYMENT_RECEIVED',
    priority: 'LOW',
    targetUsers: ['test-user-3'],
    data: { amount: '500', paymentId: 'pay-456' },
    actionUrl: '/payments',
    status: 'SENT',
    sentAt: new Date().toISOString(),
    sentCount: 1,
    failedCount: 0,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// JSON dosyalarını oluştur
const dataDir = path.join(__dirname, '..', 'data')

// Data klasörünü oluştur
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// FCM Tokens JSON dosyası
fs.writeFileSync(
  path.join(dataDir, 'fcm-tokens.json'),
  JSON.stringify(testTokens, null, 2)
)

// Notifications JSON dosyası
fs.writeFileSync(
  path.join(dataDir, 'notifications.json'),
  JSON.stringify(testNotifications, null, 2)
)

console.log('✅ Test verileri JSON dosyaları olarak oluşturuldu:')
console.log('- src/data/fcm-tokens.json')
console.log('- src/data/notifications.json')
console.log('\nBu dosyaları MongoDB Compass\'a import edebilirsiniz!')
console.log('\nMongoDB Compass\'ta:')
console.log('1. Database\'e bağlanın')
console.log('2. "apartman-site" database\'ini oluşturun')
console.log('3. "fcmtokens" collection\'ını oluşturun ve fcm-tokens.json\'ı import edin')
console.log('4. "notifications" collection\'ını oluşturun ve notifications.json\'ı import edin') 