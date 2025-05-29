const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/apartman-yonetim');
    console.log('MongoDB bağlantısı başarılı');
    
    // Rezervasyonları kontrol et
    const reservationsCollection = mongoose.connection.db.collection('reservations');
    const reservations = await reservationsCollection.find({}).toArray();
    console.log('\n=== REZERVASYONLAR ===');
    console.log('Toplam rezervasyon sayısı:', reservations.length);
    
    if (reservations.length > 0) {
      reservations.forEach((res, index) => {
        console.log(`${index + 1}. ${res.facilityName || 'Bilinmeyen'} - ${res.apartmentNo || 'N/A'} - ${res.status || 'N/A'} - ${new Date(res.startTime).toLocaleString('tr-TR')}`);
      });
    } else {
      console.log('Henüz rezervasyon bulunmuyor.');
    }
    
    // Bakım taleplerini kontrol et
    const maintenanceCollection = mongoose.connection.db.collection('maintenancerequests');
    const maintenanceRequests = await maintenanceCollection.find({}).toArray();
    console.log('\n=== BAKIM TALEPLERİ ===');
    console.log('Toplam bakım talebi sayısı:', maintenanceRequests.length);
    
    if (maintenanceRequests.length > 0) {
      maintenanceRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.title || 'Başlık yok'} - ${req.apartmentNo || 'N/A'} - ${req.status || 'N/A'} - ${req.category || 'N/A'}`);
      });
    } else {
      console.log('Henüz bakım talebi bulunmuyor.');
    }
    
    // Duyuruları kontrol et
    const announcementsCollection = mongoose.connection.db.collection('announcements');
    const announcements = await announcementsCollection.find({}).toArray();
    console.log('\n=== DUYURULAR ===');
    console.log('Toplam duyuru sayısı:', announcements.length);
    
    if (announcements.length > 0) {
      announcements.slice(0, 5).forEach((ann, index) => {
        console.log(`${index + 1}. ${ann.title || 'Başlık yok'} - ${ann.category || 'N/A'} - ${ann.isActive ? 'Aktif' : 'Pasif'}`);
      });
    } else {
      console.log('Henüz duyuru bulunmuyor.');
    }
    
    // Ödemeleri kontrol et
    const paymentsCollection = mongoose.connection.db.collection('payments');
    const payments = await paymentsCollection.find({}).toArray();
    console.log('\n=== ÖDEMELER ===');
    console.log('Toplam ödeme sayısı:', payments.length);
    
    if (payments.length > 0) {
      payments.slice(0, 5).forEach((pay, index) => {
        console.log(`${index + 1}. ${pay.apartmentNo || 'N/A'} - ${pay.amount || 0}₺ - ${pay.status || 'N/A'} - ${pay.type || 'N/A'}`);
      });
    } else {
      console.log('Henüz ödeme bulunmuyor.');
    }
    
    await mongoose.disconnect();
    console.log('\nVeritabanı bağlantısı kapatıldı.');
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

checkDatabase(); 