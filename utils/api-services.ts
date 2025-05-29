import storage from './storage';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import api, { apiQueue } from './api'; // Yeni API instance'ını kullan

console.log('🔧 API servisleri yükleniyor...');

// API servisleri
export const apiServices = {
  // Genel HTTP metodları
  async get(url: string) {
    try {
      console.log('🌐 API GET çağrısı:', url);
      const response = await api.get(url);
      console.log('✅ API GET yanıtı:', url, 'Status:', response.status);
      console.log('📊 API GET verisi:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('❌ API GET hatası:', url, error.message);
      if (error.response) {
        console.error('📋 Hata detayı:', error.response.status, error.response.data);
      }
      throw error;
    }
  },

  async post(url: string, data?: any) {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} hatası:`, error);
      
      // Offline durumunda queue'ya ekle
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        await apiQueue.add({
          url,
          method: 'post',
          data
        });
        throw new Error('İşlem offline queue\'ya eklendi. İnternet bağlantınız geldiğinde otomatik olarak işlenecek.');
      }
      
      throw error;
    }
  },

  async put(url: string, data?: any) {
    try {
      const response = await api.put(url, data);
      return response.data;
        } catch (error) {
      console.error(`PUT ${url} hatası:`, error);
      
      // Offline durumunda queue'ya ekle
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        await apiQueue.add({
          url,
          method: 'put',
          data
        });
        throw new Error('İşlem offline queue\'ya eklendi. İnternet bağlantınız geldiğinde otomatik olarak işlenecek.');
      }
      
      throw error;
    }
  },

  async patch(url: string, data?: any) {
    try {
      const response = await api.patch(url, data);
      return response.data;
    } catch (error) {
      console.error(`PATCH ${url} hatası:`, error);
      
      // Offline durumunda queue'ya ekle
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        await apiQueue.add({
          url,
          method: 'patch',
          data
        });
        throw new Error('İşlem offline queue\'ya eklendi. İnternet bağlantınız geldiğinde otomatik olarak işlenecek.');
      }
      
      throw error;
    }
  },

  async delete(url: string) {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} hatası:`, error);
      
      // Offline durumunda queue'ya ekle
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        await apiQueue.add({
          url,
          method: 'delete'
        });
        throw new Error('İşlem offline queue\'ya eklendi. İnternet bağlantınız geldiğinde otomatik olarak işlenecek.');
      }
      
      throw error;
    }
  },

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
        const response = await apiServices.get('/payments');
        
        // Cache'e kaydet
        await storage.cachePayments(response);
        
        return response;
      } catch (error) {
        console.error('Ödeme listesi alınırken hata:', error);
        
        // Hata durumunda cache'den dön
        const cachedData = await storage.getCachedPayments();
        if (cachedData) {
          return cachedData.data;
        }
        
        throw error;
      }
    },
    
    async getById(id: string) {
      try {
        const response = await apiServices.get(`/payments/${id}`);
        return response;
      } catch (error) {
        console.error(`Ödeme detayı alınırken hata (ID: ${id}):`, error);
        throw error;
      }
    },
    
    async makePayment(paymentData: any) {
      try {
        const response = await apiServices.post(`/payments/${paymentData.paymentId}/pay`, {
          paymentMethod: paymentData.paymentMethod,
          paymentDate: paymentData.paymentDate
        });
        
        // Cache'i temizle
        await storage.remove('payments_cache');
        
        return response;
      } catch (error) {
        console.error('Ödeme yapılırken hata:', error);
        throw error;
      }
      }
  },
  
  // Bakım-onarım servisleri
  maintenance: {
    async getAll() {
      try {
        // Önce cache'den kontrol et
        const cachedData = await storage.getCachedMaintenance();
        const netInfo = await NetInfo.fetch();
        
        // Offline ve cache varsa cache'den dön
        if (!netInfo.isConnected && cachedData) {
          console.log('Offline mod: Bakım talepleri cache\'den alınıyor');
          return cachedData.data;
        }
        
        // Cache kontrolünü geçici olarak devre dışı bırak - her zaman API'den çek
        // if (storage.isCacheFresh(cachedData)) {
        //   console.log('Cache taze: Bakım talepleri cache\'den alınıyor');
        //   return cachedData.data;
        // }
        
        // Gerçek API çağrısı - /api prefix'i kaldırıldı çünkü base URL'de var
        console.log('API çağrısı yapılıyor: /maintenance');
        const response = await apiServices.get('/maintenance');
        console.log('API\'den gelen maintenance verileri:', response);
          
          // Verileri cache'e kaydet
        await storage.cacheMaintenance(response);
        console.log('Bakım talepleri cache\'e kaydedildi');
          
        return response;
        } catch (error) {
        console.error('Bakım talepleri alınırken hata:', error);
        
        // Hata durumunda cache'den dön
        const cachedData = await storage.getCachedMaintenance();
        if (cachedData) {
          console.log('Hata durumu: Bakım talepleri cache\'den alınıyor');
          return cachedData.data;
        }
        
        throw error;
      }
    },
    
    async getById(id: string) {
        try {
          // Gerçek API çağrısı
        const response = await apiServices.get(`/maintenance/${id}`);
        console.log('Arıza bildirimi detayı API\'den alındı:', response);
        return response;
      } catch (error) {
        console.error(`Arıza bildirimi detayı alınırken hata (ID: ${id}):`, error);
        throw error;
      }
    },
    
    async create(maintenanceData: any) {
      try {
        const response = await apiServices.post('/maintenance', maintenanceData);
        
        // Cache'i temizle
        await storage.remove('maintenance_cache');
        
        return response;
      } catch (error) {
        console.error('Bakım talebi oluşturulurken hata:', error);
        throw error;
      }
    },
    
    async update(id: string, maintenanceData: any) {
      try {
        const response = await apiServices.put(`/maintenance/${id}`, maintenanceData);
        
        // Cache'i temizle
        await storage.remove('maintenance_cache');
        
        return response;
      } catch (error) {
        console.error('Bakım talebi güncellenirken hata:', error);
        throw error;
      }
    }
  },

  // Duyuru servisleri
  announcements: {
    async getAll() {
      try {
        // Önce cache'den kontrol et
        const cachedData = await storage.getCachedAnnouncements();
        const netInfo = await NetInfo.fetch();
        
        // Offline ve cache varsa cache'den dön
        if (!netInfo.isConnected && cachedData) {
          console.log('Offline mod: Duyurular cache\'den alınıyor');
          return cachedData.data;
        }
        
        // Cache taze ise cache'den dön
        if (storage.isCacheFresh(cachedData)) {
          console.log('Cache taze: Duyurular cache\'den alınıyor');
            return cachedData.data;
          }
          
        // Gerçek API çağrısı
        console.log('API çağrısı yapılıyor: /announcements');
        const response = await apiServices.get('/announcements');
        
        // Verileri cache'e kaydet
        await storage.cacheAnnouncements(response);
        console.log('Duyurular cache\'e kaydedildi');
        
        return response;
      } catch (error) {
        console.error('Duyurular alınırken hata:', error);
        
        // Hata durumunda cache'den dön
        const cachedData = await storage.getCachedAnnouncements();
        if (cachedData) {
          console.log('Hata durumu: Duyurular cache\'den alınıyor');
          return cachedData.data;
        }
        
        throw error;
      }
    },
    
    async getById(id: string) {
        try {
          // Gerçek API çağrısı
        const response = await apiServices.get(`/announcements/${id}`);
        console.log('Duyuru detayı API\'den alındı:', response);
        return response;
      } catch (error) {
        console.error(`Duyuru detayı alınırken hata (ID: ${id}):`, error);
        throw error;
      }
    }
  },

  // Kullanıcı profil servisleri
  profile: {
    async getProfile() {
      try {
        const response = await apiServices.get('/auth/profile');
        return response;
      } catch (error) {
        console.error('Profil bilgileri alınırken hata:', error);
        throw error;
      }
    },
    
    async updateProfile(profileData: any) {
      try {
        const response = await apiServices.put('/auth/profile', profileData);
        return response;
      } catch (error) {
        console.error('Profil güncellenirken hata:', error);
        throw error;
      }
    },
    
    async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
      try {
        const response = await apiServices.post('/auth/change-password', passwordData);
        return response;
      } catch (error) {
        console.error('Şifre değiştirilirken hata:', error);
        throw error;
      }
  },

    async getDashboardStats() {
      try {
          // Kullanıcı istatistikleri
        const usersResponse = await apiServices.get('/auth/users?countOnly=true');
          
          // Ödeme istatistikleri
        const paymentsResponse = await apiServices.get('/payments?statsOnly=true');
          
          // Bakım talepleri istatistikleri
        const maintenanceResponse = await apiServices.get('/maintenance?statsOnly=true');
          
          // Duyuru istatistikleri
        const announcementsResponse = await apiServices.get('/announcements?countByStatus=true');
        
        return {
          users: usersResponse,
          payments: paymentsResponse,
          maintenance: maintenanceResponse,
          announcements: announcementsResponse
        };
        } catch (error) {
        console.error('Dashboard istatistikleri alınırken hata:', error);
        throw error;
      }
    }
  },

  // Admin servisleri
  admin: {
    residents: {
      async getAll() {
          try {
            // Gerçek API çağrısı
          const response = await apiServices.get('/auth/users?role=RESIDENT');
          console.log('API yanıtı:', response);
          return response;
          } catch (error) {
          console.error('Sakinler listesi alınırken hata:', error);
          throw error;
        }
      },
      
      async getById(id: string) {
            try {
              // Gerçek API çağrısı
          const response = await apiServices.get(`/auth/users/${id}`);
          console.log('API yanıtı:', response);
          return response;
            } catch (error) {
          console.error(`Sakin detayı alınırken hata (ID: ${id}):`, error);
          throw error;
        }
      },
      
      async toggleActiveStatus(id: string) {
            try {
              // Gerçek API çağrısı
          const response = await apiServices.patch(`/auth/users/${id}/status`);
          console.log('API yanıtı:', response);
          return response;
            } catch (error) {
          console.error('Sakin durumu değiştirilirken hata:', error);
          throw error;
        }
      }
    },

    payments: {
      async getAll() {
          try {
            // Gerçek API çağrısı
          const response = await apiServices.get('/payments');
          console.log('API yanıtı:', response);
          return response;
          } catch (error) {
          console.error('Admin ödeme listesi alınırken hata:', error);
          throw error;
        }
      },
      
      async getById(id: string) {
            try {
              // Gerçek API çağrısı
          const response = await apiServices.get(`/payments/${id}`);
          console.log('API yanıtı:', response);
          return response;
            } catch (error) {
          console.error(`Admin ödeme detayı alınırken hata (ID: ${id}):`, error);
          throw error;
        }
      },
      
      async createPayment(paymentData: any) {
            try {
              // Gerçek API çağrısı
          const response = await apiServices.post('/payments', paymentData);
          console.log('API yanıtı:', response);
          return response;
            } catch (error) {
          console.error('Ödeme oluşturulurken hata:', error);
          throw error;
        }
      },
      
      async markAsPaid(id: string, paymentInfo: any) {
            try {
              // Gerçek API çağrısı
          const response = await apiServices.patch(`/payments/${id}/pay`, paymentInfo);
          console.log('API yanıtı:', response);
          return response;
            } catch (error) {
          console.error('Ödeme onaylanırken hata:', error);
          throw error;
        }
      },
      
      async deletePayment(id: string) {
            try {
              // Gerçek API çağrısı
          const response = await apiServices.delete(`/payments/${id}`);
          console.log('API yanıtı:', response);
          return response;
            } catch (error) {
          console.error('Ödeme silinirken hata:', error);
          throw error;
        }
      }
    }
  }
};

export { apiQueue };
export default apiServices;

