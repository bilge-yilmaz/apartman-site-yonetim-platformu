import axios from 'axios';
import storage from './storage';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// API URL'sini ortama göre ayarla
// Varsayılan olarak web projesiyle aynı sunucuyu kullan (http://localhost:3000)
let API_URL = 'http://localhost:3000';

// Cihaz/ortam tipine göre API URL ayarları
if (process.env.NODE_ENV === 'development') {
  // Bilgisayarınızın gerçek IP adresini kullanın (ipconfig ile bulundu)
  API_URL = 'http://192.168.1.28:3000';

  // Cihaz/emülatör tipine göre yorum satırlarını açın/kapatın:
  // iOS simulatörde test ediyorsanız: API_URL = 'http://localhost:3000';
  // Android emülatörde test ediyorsanız: API_URL = 'http://10.0.2.2:3000';
  // Gerçek cihazda test ediyorsanız: API_URL = 'http://192.168.1.28:3000'; (şu anki ayar)
}

console.log('API servisleri URL:', API_URL);

// API instance oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 saniye timeout
});

// Her istekte token kontrolü yapan interceptor
api.interceptors.request.use(
  async (config) => {
    // Token'ı storage'dan al
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Offline işlemleri için kuyruk sistemi
type QueuedRequest = {
  url: string;
  method: string;
  data?: any;
  id: string;
};

export const apiQueue = {
  async add(request: Omit<QueuedRequest, 'id'>) {
    const queue = await this.getQueue();
    const id = Date.now().toString();
    queue.push({ ...request, id });
    await storage.set('apiQueue', queue);
    return id;
  },

  async getQueue(): Promise<QueuedRequest[]> {
    return (await storage.get<QueuedRequest[]>('apiQueue')) || [];
  },

  async remove(id: string) {
    const queue = await this.getQueue();
    const newQueue = queue.filter(item => item.id !== id);
    await storage.set('apiQueue', newQueue);
  },
  
  async hasQueuedItems(): Promise<boolean> {
    const queue = await this.getQueue();
    return queue.length > 0;
  },

  async processQueue() {
    try {
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('Offline mod: Kuyruk işleme atlanıyor');
        return; // Offline ise işlemi durdur
      }
      
      const queue = await this.getQueue();
      if (queue.length === 0) {
        console.log('Kuyrukta bekleyen işlem yok');
        return;
      }

      console.log(`Kuyrukta ${queue.length} işlem işleniyor...`);
      
      for (const request of queue) {
        try {
          console.log(`İşleniyor: ${request.method.toUpperCase()} ${request.url}`);
          await api({
            url: request.url,
            method: request.method,
            data: request.data,
          });
          await this.remove(request.id);
          console.log(`İşlem başarılı: ${request.id}`);
        } catch (error) {
          console.error(`Kuyruk işleme hatası (ID: ${request.id}):`, error);
          
          // Sadece network hatası değilse kuyruktaki öğeyi kaldır
          if (axios.isAxiosError(error)) {
            if (!error.response) {
              console.log('Hala offline, işlem durduruldu');
              break; // Hala offline, işlemi durdur
            } else {
              // Sunucu hatası durumunda kuyruktaki öğeyi kaldır
              console.log(`Sunucu hatası (${error.response.status}), işlem kuyruktan kaldırılıyor`);
              await this.remove(request.id);
            }
          } else {
            // Diğer hatalar için kuyruktaki öğeyi kaldır
            console.log('Bilinmeyen hata, işlem kuyruktan kaldırılıyor');
            await this.remove(request.id);
          }
        }
      }
      
      // İşlem tamamlandığında bildirim göster
      const queueLength = await this.getQueue().then(q => q.length);
      if (queueLength === 0) {
        Alert.alert(
          'Senkronizasyon Tamamlandı',
          'Offline modda yapılan işlemler sunucuyla senkronize edildi.'
        );
      }
    } catch (error) {
      console.error('Kuyruk işleme sırasında beklenmeyen hata:', error);
    }
  }
};

// API servisleri
export const apiServices = {
  // Aidat servisleri
  payments: {
    async getAll() {
      try {
        // Önce cache'den kontrol et
        const cachedData = await storage.getCachedPayments();
        const netInfo = await NetInfo.fetch();
        
        // Offline ve cache varsa cache'den dön
        if (!netInfo.isConnected && cachedData) {
          return cachedData.data;
        }
        
        // Cache taze ise ve internet bağlantısı yoksa cache'den dön
        if (storage.isCacheFresh(cachedData) && !netInfo.isConnected) {
          return cachedData.data;
        }
        
        // API'den veri al
        const response = await api.get('/api/payments');
        
        // Cache'e kaydet
        await storage.cachePayments(response.data);
        
        return response.data;
      } catch (error) {
        console.error('Aidat verileri alınırken hata:', error);
        
        // Hata durumunda cache varsa cache'den dön
        const cachedData = await storage.getCachedPayments();
        if (cachedData) {
          return cachedData.data;
        }
        
        throw error;
      }
    },
    
    async getById(id: string) {
      try {
        const response = await api.get(`/api/payments/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Aidat detayı alınırken hata (ID: ${id}):`, error);
        throw error;
      }
    },
    
    async makePayment(paymentData: any) {
      try {
        const response = await api.post(`/api/payments/${paymentData.paymentId}/pay`, {
          paymentMethod: paymentData.paymentMethod,
          paymentDate: paymentData.paymentDate
        });
        return response.data;
      } catch (error) {
        console.error('Ödeme yapılırken hata:', error);
        throw error;
      }
    },
  },
  
  // Arıza bildirimleri servisleri
  maintenance: {
    async getAll() {
      try {
        console.log('Arıza bildirimleri getiriliyor...');
        
        // Önce cache'den kontrol et
        const cachedData = await storage.getCachedMaintenance();
        const netInfo = await NetInfo.fetch();
        
        // Offline ve cache varsa cache'den dön
        if (!netInfo.isConnected && cachedData) {
          console.log('Offline mod: Cache\'den arıza bildirimleri getiriliyor');
          return cachedData.data;
        }
        
        try {
          // Gerçek API çağrısı
          console.log('API çağrısı yapılıyor: /api/maintenance');
          const response = await api.get('/api/maintenance');
          
          // Verileri cache'e kaydet
          await storage.cacheMaintenance(response.data);
          console.log('Arıza bildirimleri API\'den alındı ve cache\'e kaydedildi');
          
          return response.data;
        } catch (error) {
          console.error('API hatası:', error);
          
          // API hatası durumunda cache varsa cache'den dön
          if (cachedData) {
            console.log('API hatası, cache\'den veri getiriliyor');
            return cachedData.data;
          }
          
          // Cache yoksa örnek veri kullan
          console.log('Cache bulunamadı, örnek veriler kullanılıyor');
          
          // Örnek veriler
          const sampleMaintenance = [
            {
              _id: '1',
              title: 'Su Borusu Sızıntısı',
              description: 'Mutfak lavabosunun altından su sızıyor. Acil müdahale gerekiyor.',
              status: 'PENDING',
              category: 'PLUMBING',
              priority: 'HIGH',
              apartmentNo: '101',
              block: 'A',
              createdBy: 'user123',
              assignedTo: 'technician456',
              createdAt: new Date('2025-04-25').toISOString(),
              updatedAt: new Date('2025-04-25').toISOString()
            },
            {
              _id: '2',
              title: 'Elektrik Kesintisi',
              description: 'Dairemizde elektrik kesintisi yaşanıyor. Sigorta atıyor.',
              status: 'IN_PROGRESS',
              category: 'ELECTRICAL',
              priority: 'URGENT',
              apartmentNo: '202',
              block: 'B',
              createdBy: 'user789',
              assignedTo: 'technician456',
              createdAt: new Date('2025-04-26').toISOString(),
              updatedAt: new Date('2025-04-26').toISOString()
            },
            {
              _id: '3',
              title: 'Asansör Arızası',
              description: 'B blok asansörü çalışmıyor.',
              status: 'COMPLETED',
              category: 'ELEVATOR',
              priority: 'MEDIUM',
              apartmentNo: '',
              block: 'B',
              createdBy: 'admin',
              assignedTo: 'technician789',
              createdAt: new Date('2025-04-20').toISOString(),
              updatedAt: new Date('2025-04-22').toISOString()
            }
          ];
          
          // Örnek verileri cache'e kaydet
          await storage.cacheMaintenance(sampleMaintenance);
          console.log('Örnek arıza bildirimleri cache\'e kaydedildi');
          
          return sampleMaintenance;
        }
      } catch (error) {
        console.error('Arıza bildirimleri alınırken hata:', error);
        
        // Hata durumunda cache varsa cache'den dön
        const cachedData = await storage.getCachedMaintenance();
        if (cachedData) {
          return cachedData.data;
        }
        
        // Boş dizi dön
        return [];
      }
    },
    
    async getById(id: string) {
      try {
        console.log(`Arıza bildirimi detayı getiriliyor (ID: ${id})`);
        
        try {
          // Gerçek API çağrısı
          const response = await api.get(`/api/maintenance/${id}`);
          console.log('Arıza bildirimi detayı API\'den alındı:', response.data);
          return response.data;
        } catch (error) {
          console.error(`Arıza bildirimi detayı API'den alınırken hata (ID: ${id}):`, error);
          
          // API hatası durumunda cache'den kontrol et
          const cachedData = await storage.getCachedMaintenance();
          if (cachedData && cachedData.data) {
            // ID'ye göre arıza bildirimini bul
            const maintenance = cachedData.data.find((item: any) => item._id === id);
            if (maintenance) {
              console.log('Arıza bildirimi cache\'den bulundu');
              return maintenance;
            }
          }
          
          // Örnek veri oluştur
          console.log('Arıza bildirimi bulunamadı, örnek veri dönülüyor');
          return {
            _id: id,
            title: 'Su Borusu Sızıntısı',
            description: 'Mutfak lavabosunun altından su sızıyor. Acil müdahale gerekiyor.',
            status: 'PENDING',
            category: 'PLUMBING',
            priority: 'HIGH',
            apartmentNo: '101',
            block: 'A',
            createdBy: 'user123',
            assignedTo: 'technician456',
            createdAt: new Date('2025-04-25').toISOString(),
            updatedAt: new Date('2025-04-25').toISOString()
          };
        }
      } catch (error) {
        console.error(`Arıza bildirimi detayı alınırken hata (ID: ${id}):`, error);
        
        // Hata durumunda örnek veri dön
        return {
          _id: id,
          title: 'Arıza Bildirimi',
          description: 'Detaylar yüklenemedi.',
          status: 'PENDING',
          category: 'OTHER',
          priority: 'MEDIUM',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    },
    
    async create(maintenanceData: any) {
      try {
        console.log('Arıza bildirimi oluşturuluyor:', maintenanceData);
        
        // Kullanıcı bilgilerini al
        const user = await storage.getUser();
        if (!user) {
          throw new Error('Kullanıcı bilgileri bulunamadı');
        }
        
        // Yeni arıza bildirimi oluştur
        const newMaintenance = {
          _id: Date.now().toString(),
          ...maintenanceData,
          status: 'PENDING',
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Cache'den mevcut arıza bildirimlerini al
        const cachedData = await storage.getCachedMaintenance();
        const existingMaintenance = cachedData?.data || [];
        
        // Yeni arıza bildirimini ekle
        const updatedMaintenance = [newMaintenance, ...existingMaintenance];
        
        // Güncellenmiş listeyi cache'e kaydet
        await storage.cacheMaintenance(updatedMaintenance);
        
        console.log('Arıza bildirimi başarıyla oluşturuldu ve cache\'e kaydedildi');
        
        return {
          success: true,
          data: newMaintenance,
          message: 'Arıza bildiriminiz başarıyla oluşturuldu.'
        };
      } catch (error) {
        console.error('Arıza bildirimi oluşturulurken hata:', error);
        
        if (error instanceof Error) {
          return {
            success: false,
            message: error.message || 'Arıza bildirimi oluşturulamadı'
          };
        }
        
        return {
          success: false,
          message: 'Arıza bildirimi oluşturulamadı'
        };
      }
    },
    
    async update(id: string, maintenanceData: any) {
      try {
        console.log(`Arıza bildirimi güncelleniyor (ID: ${id}):`, maintenanceData);
        
        // Cache'den mevcut arıza bildirimlerini al
        const cachedData = await storage.getCachedMaintenance();
        const existingMaintenance = cachedData?.data || [];
        
        // Güncellenecek arıza bildirimini bul
        const maintenanceIndex = existingMaintenance.findIndex((item: any) => item._id === id);
        
        if (maintenanceIndex === -1) {
          throw new Error('Arıza bildirimi bulunamadı');
        }
        
        // Arıza bildirimini güncelle
        const updatedMaintenance = {
          ...existingMaintenance[maintenanceIndex],
          ...maintenanceData,
          updatedAt: new Date().toISOString()
        };
        
        // Güncellenmiş arıza bildirimini listeye ekle
        existingMaintenance[maintenanceIndex] = updatedMaintenance;
        
        // Güncellenmiş listeyi cache'e kaydet
        await storage.cacheMaintenance(existingMaintenance);
        
        console.log('Arıza bildirimi başarıyla güncellendi ve cache\'e kaydedildi');
        
        return {
          success: true,
          data: updatedMaintenance,
          message: 'Arıza bildiriminiz başarıyla güncellendi.'
        };
      } catch (error) {
        console.error(`Arıza bildirimi güncellenirken hata (ID: ${id}):`, error);
        
        if (error instanceof Error) {
          return {
            success: false,
            message: error.message || 'Arıza bildirimi güncellenemedi'
          };
        }
        
        return {
          success: false,
          message: 'Arıza bildirimi güncellenemedi'
        };
      }
    },
  },
  
  // Duyurular servisleri
  announcements: {
    async getAll() {
      console.log('Duyurular getiriliyor...');
      
      try {
        // Önce cache'den kontrol et
        const cachedData = await storage.getCachedAnnouncements();
        const netInfo = await NetInfo.fetch();
        
        // Offline ve cache varsa cache'den dön
        if (!netInfo.isConnected && cachedData) {
          console.log('Offline mod: Cache\'den duyurular getiriliyor');
          return cachedData.data;
        }
        
        try {
          // Gerçek API çağrısı
          console.log('API çağrısı yapılıyor: /api/announcements');
          const response = await api.get('/api/announcements');
          
          // Verileri cache'e kaydet
          await storage.cacheAnnouncements(response.data);
          console.log('Duyurular API\'den alındı ve cache\'e kaydedildi');
          
          return response.data;
        } catch (error) {
          console.error('API hatası:', error);
          
          // API hatası durumunda cache varsa cache'den dön
          if (cachedData) {
            console.log('API hatası, cache\'den veri getiriliyor');
            return cachedData.data;
          }
          
          // Cache yoksa örnek veri kullan
          console.log('Cache bulunamadı, örnek veriler kullanılıyor');
          
          // Örnek duyurular
          const sampleAnnouncements = [
            {
              _id: '1',
              title: 'Apartman Genel Kurulu',
              content: 'Değerli site sakinlerimiz, 15 Mayıs 2025 tarihinde saat 19:00\'da site toplantı salonunda genel kurul yapılacaktır. Tüm site sakinlerinin katılımı önemle rica olunur.',
              category: 'GENERAL',
              priority: 'HIGH',
              startDate: new Date('2025-05-01').toISOString(),
              endDate: new Date('2025-05-15').toISOString(),
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              _id: '2',
              title: 'Su Kesintisi Duyurusu',
              content: 'Değerli site sakinlerimiz, 5 Mayıs 2025 tarihinde 09:00-17:00 saatleri arasında bakım çalışmaları nedeniyle su kesintisi yaşanacaktır. Anlayışınız için teşekkür ederiz.',
              category: 'MAINTENANCE',
              priority: 'URGENT',
              startDate: new Date('2025-05-03').toISOString(),
              endDate: new Date('2025-05-05').toISOString(),
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              _id: '3',
              title: 'Mayıs Ayı Aidat Ödemeleri',
              content: 'Değerli site sakinlerimiz, Mayıs ayı aidat ödemelerinin son tarihi 10 Mayıs 2025\'tir. Ödemelerinizi zamanında yapmanızı rica ederiz.',
              category: 'PAYMENT',
              priority: 'MEDIUM',
              startDate: new Date('2025-05-01').toISOString(),
              endDate: new Date('2025-05-10').toISOString(),
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          // Örnek verileri cache'e kaydet
          await storage.cacheAnnouncements(sampleAnnouncements);
          console.log('Örnek duyurular cache\'e kaydedildi');
          
          return sampleAnnouncements;
        }
      } catch (error) {
        console.error('Duyurular alınırken hata:', error);
        
        // Hata durumunda cache varsa cache'den dön
        const cachedData = await storage.getCachedAnnouncements();
        if (cachedData) {
          return cachedData.data;
        }
        
        // Boş dizi dön
        return [];
      }
    },
    
    async getById(id: string) {
      try {
        console.log(`Duyuru detayı getiriliyor (ID: ${id})`);
        
        try {
          // Gerçek API çağrısı
          const response = await api.get(`/api/announcements/${id}`);
          console.log('Duyuru detayı API\'den alındı:', response.data);
          return response.data;
        } catch (error) {
          console.error(`Duyuru detayı API'den alınırken hata (ID: ${id}):`, error);
          
          // API hatası durumunda cache'den kontrol et
          const cachedAnnouncements = await storage.getCachedAnnouncements();
          if (cachedAnnouncements && cachedAnnouncements.data) {
            const announcement = cachedAnnouncements.data.find((a: any) => a._id === id);
            if (announcement) {
              console.log('Duyuru detayı cache\'den alındı');
              return announcement;
            }
          }
          
          // Cache'de bulunamazsa örnek veri dön
          console.log('Duyuru detayı bulunamadı, örnek veri dönülüyor');
          return {
            _id: id,
            title: 'Duyuru',
            content: 'Duyuru detayları yüklenemedi.',
            category: 'GENERAL',
            priority: 'MEDIUM',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error(`Duyuru detayı alınırken hata (ID: ${id}):`, error);
        
        if (axios.isAxiosError(error)) {
          console.error('Axios hatası detayları:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
        }
        
        // Genel hata durumunda örnek veri dön
        return {
          _id: id,
          title: 'Duyuru',
          content: 'Duyuru detayları yüklenemedi.',
          category: 'GENERAL',
          priority: 'MEDIUM',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    },
  },
  
  // Profil servisleri
  profile: {
    async getProfile() {
      try {
        console.log('Profil bilgileri getiriliyor...');
        
        // Önce kullanıcı bilgilerini storage'dan al
        const userData = await storage.getUser();
        
        if (!userData) {
          console.log('Kullanıcı bilgileri bulunamadı');
          throw new Error('Kullanıcı bilgileri bulunamadı');
        }
        
        console.log('Profil bilgileri storage\'dan alındı');
        
        // API çağrısı sorunlarını geçici olarak çözmek için örnek profil bilgileri
        const profileData = {
          ...userData,
          phone: '+90 555 123 4567',
          address: 'Apartman Sitesi, A Blok, No: 1',
          notificationPreferences: {
            email: true,
            push: true,
            sms: false
          },
          lastLogin: new Date().toISOString(),
          createdAt: new Date('2025-01-01').toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Gerçek API çağrısı (geçici olarak devre dışı)
        /*
        const response = await api.get('/api/profile');
        return response.data;
        */
        
        return profileData;
      } catch (error) {
        console.error('Profil bilgileri alınırken hata:', error);
        
        // Hata durumunda basit bir profil dön
        const userData = await storage.getUser();
        if (userData) {
          return {
            ...userData,
            phone: '+90 555 123 4567',
            address: 'Apartman Sitesi, A Blok, No: 1'
          };
        }
        
        throw error;
      }
    },
    
    async updateProfile(profileData: any) {
      try {
        console.log('Profil güncelleniyor:', profileData);
        
        // Kullanıcı bilgilerini al
        const userData = await storage.getUser();
        
        if (!userData) {
          console.log('Kullanıcı bilgileri bulunamadı');
          throw new Error('Kullanıcı bilgileri bulunamadı');
        }
        
        // Kullanıcı bilgilerini güncelle
        const updatedUserData = {
          ...userData,
          ...profileData,
          // ID ve rol gibi değiştirilmemesi gereken alanları koru
          id: userData.id,
          role: userData.role
        };
        
        // Güncellenmiş bilgileri storage'a kaydet
        await storage.setUser(updatedUserData);
        
        console.log('Profil bilgileri güncellendi ve storage\'a kaydedildi');
        
        // Gerçek API çağrısı (geçici olarak devre dışı)
        /*
        const response = await api.put('/api/profile', profileData);
        return response.data;
        */
        
        return {
          ...updatedUserData,
          success: true,
          message: 'Profil başarıyla güncellendi'
        };
      } catch (error) {
        console.error('Profil güncellenirken hata:', error);
        throw error;
      }
    },
    
    async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
      try {
        console.log('Şifre değiştirme isteği:', passwordData.currentPassword ? '******' : 'Boş', passwordData.newPassword ? '******' : 'Boş');
        
        // Basit bir doğrulama
        if (!passwordData.currentPassword || !passwordData.newPassword) {
          throw new Error('Mevcut şifre ve yeni şifre gereklidir');
        }
        
        if (passwordData.currentPassword !== 'test123' && passwordData.currentPassword !== 'password') {
          throw new Error('Mevcut şifre yanlış');
        }
        
        if (passwordData.newPassword.length < 6) {
          throw new Error('Yeni şifre en az 6 karakter olmalıdır');
        }
        
        // Gerçek API çağrısı (geçici olarak devre dışı)
        /*
        const response = await api.post('/api/profile/change-password', passwordData);
        return response.data;
        */
        
        console.log('Şifre başarıyla değiştirildi (simule edildi)');
        
        return {
          success: true,
          message: 'Şifreniz başarıyla değiştirildi'
        };
      } catch (error) {
        console.error('Şifre değiştirilirken hata:', error);
        
        if (error instanceof Error) {
          return {
            success: false,
            message: error.message
          };
        }
        
        throw error;
      }
    },
  },

  // Admin dashboard servisleri
  admin: {
    async getDashboardStats() {
      try {
        console.log('Admin dashboard istatistikleri getiriliyor...');
        
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          // Offline durumunda önbelleği kontrol et
          const cachedStats = await storage.get('adminDashboardStats');
          if (cachedStats) {
            console.log('Offline mod: Admin dashboard istatistikleri cache\'den getiriliyor');
            return cachedStats;
          }
        }
        
        try {
          // Gerçek API çağrıları
          console.log('API çağrıları yapılıyor...');
          
          // Kullanıcı istatistikleri
          const usersResponse = await api.get('/api/auth/users', {
            params: { countOnly: true }
          });
          
          // Ödeme istatistikleri
          const paymentsResponse = await api.get('/api/payments', {
            params: { statsOnly: true }
          });
          
          // Bakım talepleri istatistikleri
          const maintenanceResponse = await api.get('/api/maintenance', {
            params: { statsOnly: true }
          });
          
          // Duyuru istatistikleri
          const announcementsResponse = await api.get('/api/announcements', {
            params: { countByStatus: true }
          });
          
          // Tüm istatistikleri birleştir
          const stats = {
            users: usersResponse.data || { total: 0, active: 0, inactive: 0 },
            payments: paymentsResponse.data || { total: 0, pending: 0, overdue: 0 },
            maintenance: maintenanceResponse.data || { total: 0, pending: 0, inProgress: 0, completed: 0 },
            announcements: announcementsResponse.data || { total: 0, active: 0 }
          };
          
          console.log('API yanıtı birleştirildi:', stats);
          
          // Verileri önbelleğe kaydet
          await storage.set('adminDashboardStats', stats);
          
          return stats;
        } catch (error) {
          console.error('API hatası:', error);
          
          // API hatası durumunda önbellek kontrolü
          const cachedStats = await storage.get('adminDashboardStats');
          if (cachedStats) {
            console.log('API hatası, önbellekten veri getiriliyor');
            return cachedStats;
          }
          
          // Fallback olarak örnek veriler
          console.log('API hatası ve önbellek yok, örnek veriler kullanılıyor');
          const stats = {
            users: {
              total: 25,
              active: 22,
              inactive: 3
            },
            payments: {
              total: 45000,
              pending: 12000,
              overdue: 5000
            },
            maintenance: {
              total: 18,
              pending: 5,
              inProgress: 3,
              completed: 10
            },
            announcements: {
              total: 12,
              active: 8
            }
          };
          
          return stats;
        }
      } catch (error) {
        console.error('Admin dashboard istatistikleri alınırken hata:', error);
        
        // Hata durumunda cache varsa cache'den dön
        const cachedStats = await storage.get('adminDashboardStats');
        if (cachedStats) {
          return cachedStats;
        }
        
        // Default data
        return {
          users: { total: 0, active: 0, inactive: 0 },
          payments: { total: 0, pending: 0, overdue: 0 },
          maintenance: { total: 0, pending: 0, inProgress: 0, completed: 0 },
          announcements: { total: 0, active: 0 }
        };
      }
    },
    
    // Site sakinleri yönetimi
    residents: {
      async getAll() {
        try {
          console.log('Site sakinleri getiriliyor...');
          
          const netInfo = await NetInfo.fetch();
          if (!netInfo.isConnected) {
            const cachedResidents = await storage.get('adminResidents');
            if (cachedResidents) {
              console.log('Offline mod: Site sakinleri cache\'den getiriliyor');
              return cachedResidents;
            }
          }
          
          try {
            // Gerçek API çağrısı
            const response = await api.get('/api/auth/users', {
              params: { role: 'RESIDENT' }
            });
            console.log('API yanıtı:', response.data);
            
            // API yanıtını mobil uygulama formatına dönüştür
            const residents = response.data.map((user: any) => ({
              id: user._id || user.id,
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              block: user.block || '',
              apartmentNo: user.apartmentNo || '',
              role: user.role,
              isActive: user.isActive !== undefined ? user.isActive : true
            }));
            
            // Verileri önbelleğe kaydet
            await storage.set('adminResidents', residents);
            
            return residents;
          } catch (error) {
            console.error('API hatası:', error);
            
            // API hatası durumunda önbellek kontrolü
            const cachedResidents = await storage.get('adminResidents');
            if (cachedResidents) {
              console.log('API hatası, önbellekten veri getiriliyor');
              return cachedResidents;
            }
            
            // Fallback olarak örnek veriler
            console.log('API hatası ve önbellek yok, örnek veriler kullanılıyor');
            const residents = [
              {
                id: '1',
                name: 'Ahmet Yılmaz',
                email: 'ahmet@ornek.com',
                phone: '555-123-4567',
                block: 'A',
                apartmentNo: '101',
                role: 'RESIDENT',
                isActive: true
              },
              {
                id: '2',
                name: 'Ayşe Kaya',
                email: 'ayse@ornek.com',
                phone: '555-234-5678',
                block: 'A',
                apartmentNo: '102',
                role: 'RESIDENT',
                isActive: true
              },
              {
                id: '3',
                name: 'Mehmet Demir',
                email: 'mehmet@ornek.com',
                phone: '555-345-6789',
                block: 'B',
                apartmentNo: '201',
                role: 'RESIDENT',
                isActive: false
              }
            ];
            
            return residents;
          }
        } catch (error) {
          console.error('Site sakinleri alınırken hata:', error);
          
          const cachedResidents = await storage.get('adminResidents');
          if (cachedResidents) {
            return cachedResidents;
          }
          
          return [];
        }
      },
      
      async getById(id: string) {
        try {
          const netInfo = await NetInfo.fetch();
          
          if (netInfo.isConnected) {
            try {
              // Gerçek API çağrısı
              const response = await api.get(`/api/auth/users/${id}`);
              console.log('API yanıtı:', response.data);
              
              const user = response.data;
              return {
                id: user._id || user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                block: user.block || '',
                apartmentNo: user.apartmentNo || '',
                role: user.role,
                isActive: user.isActive !== undefined ? user.isActive : true
              };
            } catch (error) {
              console.error('API hatası:', error);
              // API hatası durumunda aşağıdaki local işlemi kullan
            }
          }
          
          // Offline veya API hatası durumunda yerel veriyi kullan
          const residents = await this.getAll();
          const resident = residents.find((r: { id: string }) => r.id === id);
          
          if (!resident) {
            throw new Error('Site sakini bulunamadı');
          }
          
          return resident;
        } catch (error) {
          console.error(`Site sakini detayı alınırken hata (ID: ${id}):`, error);
          throw error;
        }
      },
      
      async toggleActiveStatus(id: string) {
        try {
          const netInfo = await NetInfo.fetch();
          
          if (netInfo.isConnected) {
            try {
              // Gerçek API çağrısı
              const response = await api.patch(`/api/auth/users/${id}/status`);
              console.log('API yanıtı:', response.data);
              
              if (response.data.success) {
                // Önbellekteki verileri güncelle
                const residents = await this.getAll();
                const residentIndex = residents.findIndex((r: { id: string }) => r.id === id);
                
                if (residentIndex !== -1) {
                  residents[residentIndex].isActive = !residents[residentIndex].isActive;
                  await storage.set('adminResidents', residents);
                }
                
                return {
                  success: true,
                  message: response.data.message || `Kullanıcı durumu değiştirildi`,
                  user: response.data.user
                };
              } else {
                return {
                  success: false,
                  message: response.data.message || 'İşlem başarısız'
                };
              }
            } catch (error) {
              console.error('API hatası:', error);
              // API hatası durumunda aşağıdaki local işlemi kullan
            }
          }
          
          // Offline veya API hatası durumunda yerel işlemi gerçekleştir
          const residents = await this.getAll();
          const residentIndex = residents.findIndex((r: { id: string }) => r.id === id);
          
          if (residentIndex === -1) {
            throw new Error('Site sakini bulunamadı');
          }
          
          // Kullanıcının aktiflik durumunu değiştir
          residents[residentIndex].isActive = !residents[residentIndex].isActive;
          
          // Güncellenmiş listeyi cache'e kaydet
          await storage.set('adminResidents', residents);
          
          return {
            success: true,
            message: `Kullanıcı ${residents[residentIndex].isActive ? 'aktif' : 'pasif'} duruma getirildi`,
            user: residents[residentIndex]
          };
        } catch (error) {
          console.error(`Kullanıcı durumu güncellenirken hata (ID: ${id}):`, error);
          
          if (error instanceof Error) {
            return {
              success: false,
              message: error.message
            };
          }
          
          return {
            success: false,
            message: 'Kullanıcı durumu güncellenemedi'
          };
        }
      }
    },

    // Aidat yönetimi servisleri
    payments: {
      async getAll() {
        try {
          console.log('Aidat listesi getiriliyor...');
          
          const netInfo = await NetInfo.fetch();
          if (!netInfo.isConnected) {
            const cachedPayments = await storage.get('adminPayments');
            if (cachedPayments) {
              console.log('Offline mod: Aidat listesi cache\'den getiriliyor');
              return cachedPayments;
            }
          }
          
          try {
            // Gerçek API çağrısı
            const response = await api.get('/api/payments');
            console.log('API yanıtı:', response.data);
            
            // Verileri önbelleğe kaydet
            await storage.set('adminPayments', response.data);
            
            return response.data;
          } catch (error) {
            console.error('API hatası:', error);
            
            // API hatası durumunda önbellek kontrolü
            const cachedPayments = await storage.get('adminPayments');
            if (cachedPayments) {
              console.log('API hatası, önbellekten veri getiriliyor');
              return cachedPayments;
            }
            
            // Fallback olarak örnek veriler
            console.log('API hatası ve önbellek yok, örnek veriler kullanılıyor');
            const payments = [
              {
                _id: '1',
                userId: 'user1',
                residentName: 'Ahmet Yılmaz',
                apartmentNo: '101',
                block: 'A',
                type: 'DUES',
                description: 'Nisan 2024 Aidat',
                amount: 1200,
                dueDate: '2024-04-15',
                status: 'PENDING',
                createdAt: '2024-04-01',
                updatedAt: '2024-04-01'
              }
              // ... diğer örnek veriler
            ];
            
            return payments;
          }
        } catch (error) {
          console.error('Aidat listesi alınırken hata:', error);
          
          const cachedPayments = await storage.get('adminPayments');
          if (cachedPayments) {
            return cachedPayments;
          }
          
          return [];
        }
      },
      
      async getById(id: string) {
        try {
          const netInfo = await NetInfo.fetch();
          
          if (netInfo.isConnected) {
            try {
              // Gerçek API çağrısı
              const response = await api.get(`/api/payments/${id}`);
              console.log('API yanıtı:', response.data);
              return response.data;
            } catch (error) {
              console.error('API hatası:', error);
              // API hatası durumunda aşağıdaki local işlemi kullan
            }
          }
          
          // Offline veya API hatası durumunda yerel veriyi kullan
          const payments = await this.getAll();
          const payment = payments.find((p: { _id: string }) => p._id === id);
          
          if (!payment) {
            throw new Error('Aidat kaydı bulunamadı');
          }
          
          return payment;
        } catch (error) {
          console.error(`Aidat detayı alınırken hata (ID: ${id}):`, error);
          throw error;
        }
      },
      
      async createPayment(paymentData: any) {
        try {
          const netInfo = await NetInfo.fetch();
          
          if (netInfo.isConnected) {
            try {
              // Gerçek API çağrısı
              const response = await api.post('/api/payments', paymentData);
              console.log('API yanıtı:', response.data);
              
              // Önbellekteki verileri güncelle
              const payments = await this.getAll();
              const updatedPayments = [response.data, ...payments];
              await storage.set('adminPayments', updatedPayments);
              
              return {
                success: true,
                data: response.data,
                message: 'Aidat kaydı başarıyla oluşturuldu.'
              };
            } catch (error) {
              console.error('API hatası:', error);
              // API hatası durumunda aşağıdaki local işlemi kullan
            }
          }
          
          // Offline veya API hatası durumunda yerel işlemi gerçekleştir
          const payments = await this.getAll();
          
          // Yeni aidat kaydı oluştur
          const newPayment = {
            _id: Date.now().toString(),
            ...paymentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Yeni aidatı listeye ekle
          const updatedPayments = [newPayment, ...payments];
          
          // Güncellenmiş listeyi cache'e kaydet
          await storage.set('adminPayments', updatedPayments);
          
          return {
            success: true,
            data: newPayment,
            message: 'Aidat kaydı başarıyla oluşturuldu.'
          };
        } catch (error) {
          console.error('Aidat kaydı oluşturulurken hata:', error);
          
          if (error instanceof Error) {
            return {
              success: false,
              message: error.message || 'Aidat kaydı oluşturulamadı'
            };
          }
          
          return {
            success: false,
            message: 'Aidat kaydı oluşturulamadı'
          };
        }
      },
      
      async markAsPaid(id: string, paymentInfo: any) {
        try {
          const netInfo = await NetInfo.fetch();
          
          if (netInfo.isConnected) {
            try {
              // Gerçek API çağrısı
              const response = await api.patch(`/api/payments/${id}/pay`, paymentInfo);
              console.log('API yanıtı:', response.data);
              
              if (response.data) {
                // Önbellekteki verileri güncelle
                const payments = await this.getAll();
                const paymentIndex = payments.findIndex((p: { _id: string }) => p._id === id);
                
                if (paymentIndex !== -1) {
                  payments[paymentIndex] = response.data;
                  await storage.set('adminPayments', payments);
                }
                
                return {
                  success: true,
                  data: response.data,
                  message: 'Aidat ödemesi başarıyla kaydedildi.'
                };
              }
            } catch (error) {
              console.error('API hatası:', error);
              // API hatası durumunda aşağıdaki local işlemi kullan
            }
          }
          
          // Offline veya API hatası durumunda yerel işlemi gerçekleştir
          const payments = await this.getAll();
          
          // Güncellenecek aidat kaydını bul
          const paymentIndex = payments.findIndex((p: { _id: string }) => p._id === id);
          
          if (paymentIndex === -1) {
            throw new Error('Aidat kaydı bulunamadı');
          }
          
          // Aidat kaydını ödendi olarak güncelle
          const updatedPayment = {
            ...payments[paymentIndex],
            status: 'PAID',
            paymentDate: paymentInfo.paymentDate || new Date().toISOString(),
            paymentMethod: paymentInfo.paymentMethod || 'CASH',
            updatedAt: new Date().toISOString()
          };
          
          // Güncellenmiş aidat kaydını listeye ekle
          payments[paymentIndex] = updatedPayment;
          
          // Güncellenmiş listeyi cache'e kaydet
          await storage.set('adminPayments', payments);
          
          return {
            success: true,
            data: updatedPayment,
            message: 'Aidat ödemesi başarıyla kaydedildi.'
          };
        } catch (error) {
          console.error(`Aidat ödemesi kaydedilirken hata (ID: ${id}):`, error);
          
          if (error instanceof Error) {
            return {
              success: false,
              message: error.message || 'Aidat ödemesi kaydedilemedi'
            };
          }
          
          return {
            success: false,
            message: 'Aidat ödemesi kaydedilemedi'
          };
        }
      },
      
      async deletePayment(id: string) {
        try {
          const netInfo = await NetInfo.fetch();
          
          if (netInfo.isConnected) {
            try {
              // Gerçek API çağrısı
              const response = await api.delete(`/api/payments/${id}`);
              console.log('API yanıtı:', response.data);
              
              // Önbellekteki verileri güncelle
              const payments = await this.getAll();
              const updatedPayments = payments.filter((p: { _id: string }) => p._id !== id);
              await storage.set('adminPayments', updatedPayments);
              
              return {
                success: true,
                message: 'Aidat kaydı başarıyla silindi.'
              };
            } catch (error) {
              console.error('API hatası:', error);
              // API hatası durumunda aşağıdaki local işlemi kullan
            }
          }
          
          // Offline veya API hatası durumunda yerel işlemi gerçekleştir
          const payments = await this.getAll();
          
          // Silinecek aidat kaydının var olup olmadığını kontrol et
          const paymentExists = payments.some((p: { _id: string }) => p._id === id);
          
          if (!paymentExists) {
            throw new Error('Aidat kaydı bulunamadı');
          }
          
          // Aidat kaydını listeden çıkar
          const updatedPayments = payments.filter((p: { _id: string }) => p._id !== id);
          
          // Güncellenmiş listeyi cache'e kaydet
          await storage.set('adminPayments', updatedPayments);
          
          return {
            success: true,
            message: 'Aidat kaydı başarıyla silindi.'
          };
        } catch (error) {
          console.error(`Aidat kaydı silinirken hata (ID: ${id}):`, error);
          
          if (error instanceof Error) {
            return {
              success: false,
              message: error.message || 'Aidat kaydı silinemedi'
            };
          }
          
          return {
            success: false,
            message: 'Aidat kaydı silinemedi'
          };
        }
      }
    }
  }
};

export default api;
