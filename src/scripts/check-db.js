// MongoDB veritabanını kontrol eden script
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI çevre değişkeni bulunamadı!');
  process.exit(1);
}

async function checkDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Tüm koleksiyonları listele
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Veritabanındaki koleksiyonlar:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // users koleksiyonundaki kullanıcıları kontrol et
    if (collections.some(c => c.name === 'users')) {
      const users = await mongoose.connection.db.collection('users').find({}).toArray();
      console.log(`\nKullanıcı sayısı: ${users.length}`);
      
      if (users.length > 0) {
        console.log('\nKullanıcı bilgileri:');
        users.forEach(user => {
          console.log(`- Email: ${user.email}, Rol: ${user.role}, Aktif: ${user.isActive}`);
        });
      } else {
        console.log('Kullanıcı bulunamadı!');
      }
    } else {
      console.log('\nusers koleksiyonu bulunamadı!');
    }

  } catch (error) {
    console.error('Veritabanı kontrolü sırasında hata oluştu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Veritabanı kontrolünü başlat
checkDatabase();
