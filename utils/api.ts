import axios from 'axios';
import { storage } from './storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

// Dinamik API URL belirleme
const getApiUrl = () => {
  // Bilgisayarınızın gerçek IP adresi (ipconfig ile bulundu)
  const COMPUTER_IP = '10.192.90.95';
  
  if (__DEV__) {
    // Geliştirme ortamında
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    
    // Platform bazlı URL belirleme
    return `http://${COMPUTER_IP}:3000`;
  } else {
    // Production ortamında
    return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-domain.com';
  }
};

const API_URL = getApiUrl();
console.log('🌐 API URL:', API_URL);

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 saniye timeout
});

// Network durumu kontrolü
let isOnline = true;
NetInfo.addEventListener(state => {
  isOnline = state.isConnected ?? false;
  console.log('📶 Network durumu:', isOnline ? 'Online' : 'Offline');
  
  if (isOnline) {
    // Online olduğunda kuyruktaki işlemleri çalıştır
    apiQueue.processQueue();
  }
});

// Request interceptor - Token ekleme ve network kontrolü
api.interceptors.request.use(
  async (config) => {
    // Network kontrolü
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('NETWORK_ERROR');
    }

    // Token ekleme
    const user = await storage.get('user');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('❌ API Response hatası:', error.message);
    
    if (error.message === 'NETWORK_ERROR') {
      // Network hatası - offline queue'ya ekle
      return Promise.reject(new Error('İnternet bağlantınızı kontrol edin'));
    }
    
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        // Network timeout veya connection error
        return Promise.reject(new Error('Sunucuya bağlanılamıyor. Lütfen daha sonra tekrar deneyin.'));
      }
      
      // HTTP hata kodları
      switch (error.response.status) {
        case 401:
          // Token geçersiz - logout yap
          await storage.remove('user');
          return Promise.reject(new Error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.'));
        case 403:
          return Promise.reject(new Error('Bu işlem için yetkiniz bulunmuyor.'));
        case 404:
          return Promise.reject(new Error('İstenen kaynak bulunamadı.'));
        case 500:
          return Promise.reject(new Error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.'));
        default:
          return Promise.reject(new Error(error.response.data?.message || 'Bir hata oluştu.'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Offline işlemleri için kuyruk sistemi
type QueuedRequest = {
  url: string;
  method: string;
  data?: any;
  id: string;
  timestamp: number;
};

export const apiQueue = {
  async add(request: Omit<QueuedRequest, 'id' | 'timestamp'>) {
    const queue = await this.getQueue();
    const id = Date.now().toString();
    const timestamp = Date.now();
    queue.push({ ...request, id, timestamp });
    await storage.set('apiQueue', queue);
    console.log(`📥 Offline queue'ya eklendi: ${request.method} ${request.url}`);
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

  async clear() {
    await storage.set('apiQueue', []);
  },

  async processQueue() {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('📴 Offline - Queue işleme atlanıyor');
        return;
      }

      const queue = await this.getQueue();
      if (queue.length === 0) {
        return;
      }

      console.log(`🔄 ${queue.length} offline işlem senkronize ediliyor...`);
      let processedCount = 0;

      for (const request of queue) {
        try {
          await api({
            url: request.url,
            method: request.method,
            data: request.data,
          });
          await this.remove(request.id);
          processedCount++;
          console.log(`✅ Senkronize edildi: ${request.method} ${request.url}`);
        } catch (error) {
          console.error(`❌ Queue işleme hatası:`, error);
          
          // 24 saatten eski istekleri temizle
          if (Date.now() - request.timestamp > 24 * 60 * 60 * 1000) {
            await this.remove(request.id);
            console.log('🗑️ Eski istek temizlendi');
          }
          
          // Network hatası değilse kuyruktaki öğeyi kaldır
          if (axios.isAxiosError(error) && error.response) {
            await this.remove(request.id);
          } else {
            // Hala network sorunu var, işlemi durdur
            break;
          }
        }
      }

      if (processedCount > 0) {
        Alert.alert(
          '✅ Senkronizasyon Tamamlandı',
          `${processedCount} offline işlem başarıyla senkronize edildi.`
        );
      }
    } catch (error) {
      console.error('❌ Queue işleme sırasında hata:', error);
    }
  }
};

export default api;
