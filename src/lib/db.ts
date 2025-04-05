import mongoose from 'mongoose';

// MongoDB bağlantı durumunu takip etmek için tip tanımlaması
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global değişken tipi tanımlaması
declare global {
  var mongooseConnection: MongooseConnection | undefined;
}

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MongoDB URI çevre değişkeni tanımlanmamış. Lütfen .env dosyasını kontrol edin.');
}

// Bağlantı önbelleği
let cached: MongooseConnection = global.mongooseConnection || { conn: null, promise: null };

// Global değişkeni güncelle
if (!global.mongooseConnection) {
  global.mongooseConnection = cached;
}

/**
 * MongoDB veritabanına bağlantı sağlar
 * @returns Mongoose bağlantısı
 */
async function dbConnect(): Promise<typeof mongoose> {
  // Mevcut bağlantıyı kullan
  if (cached.conn) {
    console.log('Mevcut MongoDB bağlantısı kullanılıyor');
    return cached.conn;
  }

  // Yeni bağlantı oluştur
  if (!cached.promise) {
    console.log('Yeni MongoDB bağlantısı oluşturuluyor...');
    
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('MongoDB bağlantısı başarılı!');
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
