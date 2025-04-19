import { create } from 'zustand';
import api, { apiQueue } from '../utils/api';
import { storage } from '../utils/storage';

export type MaintenanceRequest = {
  _id: string;
  apartmentNo: string;
  block: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
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

type MaintenanceStore = {
  requests: MaintenanceRequest[];
  isLoading: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
  createRequest: (data: Omit<MaintenanceRequest, '_id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
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
      const response = await api.get('/maintenance');
      const requests = response.data || [];
      
      set({ requests, isLoading: false });
      // Offline kullanım için önbelleğe al
      storage.set('maintenance_cache', {
        data: requests,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Arıza bildirimleri alınamadı:', error);
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Arıza bildirimleri alınamadı'
      });
      
      // Offline durum için önbellekten oku
      await get().refreshFromCache();
    }
  },
  
  createRequest: async (data) => {
    try {
      set({ isLoading: true, error: null });
      
      // Online ise doğrudan API'ye gönder
      const response = await api.post('/maintenance', data);
      
      // Yeni listeyi çek
      await get().fetchRequests();
      return response.data;
    } catch (error: any) {
      console.error('Arıza bildirimi oluşturulamadı:', error);
      
      // Offline ise kuyruğa ekle
      if (error.message === 'Network Error') {
        const tempId = `temp_${Date.now()}`;
        const newRequest: MaintenanceRequest = {
          _id: tempId,
          ...data,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await apiQueue.add({
          url: '/maintenance',
          method: 'POST',
          data
        });
        
        // Kullanıcıya hemen geri bildirim vermek için yerel state'i güncelle
        const updatedRequests = [...get().requests, newRequest];
        set({ requests: updatedRequests, isLoading: false });
        storage.set('maintenance_cache', {
          data: updatedRequests,
          timestamp: new Date().toISOString(),
        });
        
        return;
      }
      
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Arıza bildirimi oluşturulamadı'
      });
      throw error;
    }
  },
  
  updateRequest: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      await api.put(`/maintenance/${id}`, data);
      await get().fetchRequests();
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
      await api.put(`/maintenance/${id}`, { status: 'CANCELLED' });
      await get().fetchRequests();
    } catch (error: any) {
      console.error('Arıza bildirimi iptal edilemedi:', error);
      
      // Offline ise kuyruğa ekle
      if (error.message === 'Network Error') {
        await apiQueue.add({
          url: `/maintenance/${id}`,
          method: 'PUT',
          data: { status: 'CANCELLED' }
        });
        
        // Kullanıcıya hemen geri bildirim vermek için yerel state'i güncelle
        const updatedRequests = get().requests.map(request => 
          request._id === id 
            ? { ...request, status: 'CANCELLED' as const, updatedAt: new Date().toISOString() }
            : request
        );
        
        set({ requests: updatedRequests, isLoading: false });
        storage.set('maintenance_cache', {
          data: updatedRequests,
          timestamp: new Date().toISOString(),
        });
        
        return;
      }
      
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
    const cached = await storage.get<{data: MaintenanceRequest[], timestamp: string}>('maintenance_cache');
    if (cached?.data) {
      set({ requests: cached.data });
    }
  },
}));
