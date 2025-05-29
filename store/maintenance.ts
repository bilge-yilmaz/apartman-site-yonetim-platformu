import { create } from 'zustand';
import { apiQueue, apiServices } from '../utils/api-services';
import storage from '../utils/storage';
import NetInfo from '@react-native-community/netinfo';

export type MaintenanceRequest = {
  _id: string;
  apartmentNo: string;
  block: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'ELEVATOR' | 'OTHER';
  images?: string[];
  assignedTo?: string;
  comments?: {
    user: string;
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

// API yanıt tipi
type ApiResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

type MaintenanceStore = {
  requests: MaintenanceRequest[];
  isLoading: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
  createRequest: (data: Omit<MaintenanceRequest, '_id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<ApiResponse>;
  updateRequest: (id: string, data: Partial<MaintenanceRequest>) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  getRequestById: (id: string) => MaintenanceRequest | undefined;
  refreshFromCache: () => Promise<void>;
};

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,
  
  fetchRequests: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔧 Arıza bildirimleri getiriliyor...');
      
      // Cache'i temizle
      await storage.clearMaintenanceCache();
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      console.log('📶 İnternet bağlantısı:', netInfo.isConnected ? 'Bağlı' : 'Bağlı değil');
      
      try {
        if (netInfo.isConnected) {
          // Online: API'den veri al
          console.log('🌐 API\'den arıza bildirimleri getiriliyor...');
          const requests = await apiServices.maintenance.getAll();
          console.log('📊 API\'den gelen arıza bildirimleri sayısı:', requests?.length || 0);
          console.log('📋 API\'den gelen arıza bildirimleri:', JSON.stringify(requests, null, 2));
          
          set({ requests: requests || [], isLoading: false });
          // Offline kullanım için önbelleğe al
          await storage.cacheMaintenance(requests || []);
          console.log('💾 Arıza bildirimleri cache\'e kaydedildi');
          return;
        }
      } catch (apiError) {
        console.error('❌ API\'den arıza bildirimleri alınırken hata:', apiError);
        // API hatası durumunda boş dizi döndür, cache'den mock veri alma
        set({ requests: [], isLoading: false, error: 'API bağlantı hatası' });
        return;
      }
      
      // Offline durumunda boş dizi döndür
      console.log('📱 Offline mod: Boş liste gösteriliyor');
        set({ requests: [], isLoading: false });
    } catch (error: any) {
      console.error('💥 Arıza bildirimleri alınamadı:', error);
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Arıza bildirimleri alınamadı',
        requests: [] // Hata durumunda boş dizi
      });
    }
  },
  
  createRequest: async (data) => {
    try {
      set({ isLoading: true, error: null });
      console.log('Arıza bildirimi oluşturuluyor:', data);
      
      // Yeni arıza bildirimi oluştur
      const newRequest: MaintenanceRequest = {
        _id: `new_${Date.now()}`,
        ...data,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      console.log('İnternet bağlantısı:', netInfo.isConnected ? 'Bağlı' : 'Bağlı değil');
      
      // API'ye göndermeyi dene
      try {
        if (netInfo.isConnected) {
          console.log('API\'ye arıza bildirimi gönderiliyor...');
          const response = await apiServices.maintenance.create(data);
          console.log('API yanıtı:', response);
          
          if (response && response.success) {
            // Eğer API yanıtı içinde data varsa, onu kullan
            if (response.data) {
              newRequest._id = response.data._id || newRequest._id;
            }
          }
        } else {
          console.log('Offline mod: Arıza bildirimi kuyruğa ekleniyor');
          await apiQueue.add({
            url: '/maintenance',
            method: 'post',
            data
          });
        }
      } catch (apiError) {
        console.error('API hatası:', apiError);
        // API hatası olsa bile devam et, yerel olarak kaydet
      }
      
      // Mevcut arıza bildirimlerini al
      const currentRequests = get().requests || [];
      console.log('Mevcut arıza bildirimi sayısı:', currentRequests.length);
      
      // Yeni arıza bildirimini ekle
      const updatedRequests = [newRequest, ...currentRequests];
      
      // State'i güncelle
      set({ requests: updatedRequests, isLoading: false });
      console.log('Arıza bildirimleri güncellendi, yeni toplam:', updatedRequests.length);
      
      // Cache'e kaydet
      await storage.cacheMaintenance(updatedRequests);
      console.log('Arıza bildirimleri cache\'e kaydedildi');
      
      return {
        success: true,
        data: newRequest,
        message: 'Arıza bildirimi başarıyla oluşturuldu'
      };
    } catch (error: any) {
      console.error('Arıza bildirimi oluşturulamadı:', error);
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Arıza bildirimi oluşturulamadı'
      });
      
      return {
        success: false,
        message: error.message || 'Arıza bildirimi oluşturulamadı'
      };
    }
  },
  
  updateRequest: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        // Online: API'ye gönder
        await apiServices.maintenance.update(id, data);
        
        // Yeni listeyi çek
        await get().fetchRequests();
      } else {
        // Offline: Kuyruğa ekle
        await apiQueue.add({
          url: `/maintenance/${id}`,
          method: 'put',
          data
        });
        
        // Kullanıcıya hemen geri bildirim vermek için yerel state'i güncelle
        const updatedRequests = get().requests.map(request => 
          request._id === id 
            ? { ...request, ...data, updatedAt: new Date().toISOString() }
            : request
        );
        
        set({ requests: updatedRequests, isLoading: false });
        await storage.cacheMaintenance(updatedRequests);
      }
    } catch (error: any) {
      console.error('Arıza bildirimi güncellenemedi:', error);
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Arıza bildirimi güncellenemedi'
      });
      throw error;
    }
  },
  
  cancelRequest: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        // Online: API'ye gönder
        await apiServices.maintenance.update(id, { status: 'CANCELLED' });
        
        // Yeni listeyi çek
        await get().fetchRequests();
      } else {
        // Offline: Kuyruğa ekle
        await apiQueue.add({
          url: `/maintenance/${id}`,
          method: 'put',
          data: { status: 'CANCELLED' }
        });
        
        // Kullanıcıya hemen geri bildirim vermek için yerel state'i güncelle
        const updatedRequests = get().requests.map(request => 
          request._id === id 
            ? { ...request, status: 'CANCELLED' as const, updatedAt: new Date().toISOString() }
            : request
        );
        
        set({ requests: updatedRequests, isLoading: false });
        await storage.cacheMaintenance(updatedRequests);
      }
    } catch (error: any) {
      console.error('Arıza bildirimi iptal edilemedi:', error);
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Arıza bildirimi iptal edilemedi'
      });
      throw error;
    }
  },
  
  getRequestById: (id) => {
    return get().requests.find(request => request._id === id);
  },
  
  refreshFromCache: async () => {
    const cached = await storage.getCachedMaintenance();
    if (cached?.data) {
      set({ requests: cached.data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
