// MongoDB'ye test kullanıcıları ekleyen seed script
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI çevre değişkeni bulunamadı!');
  process.exit(1);
}

// User şeması
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'RESIDENT'],
      default: 'RESIDENT',
    },
    apartmentNo: { type: String, default: '' },
    block: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

// User modeli
const User = mongoose.models.users || mongoose.model('users', UserSchema);

// Test kullanıcıları
const testUsers = [
  {
    email: 'admin@site.com',
    name: 'Site Yöneticisi',
    role: 'ADMIN',
    isActive: true,
    apartmentNo: '',
    block: '',
    image: 'https://ui-avatars.com/api/?name=Site+Yöneticisi&background=0D8ABC&color=fff',
    lastLogin: new Date(),
  },
  {
    email: 'resident@site.com',
    name: 'Ahmet Yılmaz',
    role: 'RESIDENT',
    isActive: true,
    apartmentNo: '5',
    block: 'A',
    image: 'https://ui-avatars.com/api/?name=Ahmet+Yılmaz&background=2E7D32&color=fff',
    lastLogin: new Date(),
  },
  {
    email: 'manager@site.com',
    name: 'Mehmet Kaya',
    role: 'MANAGER',
    isActive: true,
    apartmentNo: '',
    block: '',
    image: 'https://ui-avatars.com/api/?name=Mehmet+Kaya&background=C62828&color=fff',
    lastLogin: new Date(),
  }
];

// Kullanıcıları ekle veya güncelle
async function seedUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    for (const userData of testUsers) {
      // Kullanıcıyı email'e göre ara
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        // Kullanıcı varsa güncelle
        console.log(`Kullanıcı güncelleniyor: ${userData.email}`);
        await User.updateOne({ email: userData.email }, { $set: userData });
      } else {
        // Kullanıcı yoksa oluştur
        console.log(`Yeni kullanıcı oluşturuluyor: ${userData.email}`);
        await User.create(userData);
      }
    }

    console.log('Kullanıcı seed işlemi tamamlandı');
  } catch (error) {
    console.error('Seed işlemi sırasında hata oluştu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Seed işlemini başlat
seedUsers();
