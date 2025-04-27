import { create } from 'zustand';
import { apiQueue, apiServices } from '../utils/api-services';
import storage from '../utils/storage';
import { format } from 'date-fns';
import NetInfo from '@react-native-community/netinfo';

export type Payment = {
  _id: string;
  apartmentNo: string;
  block: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  paymentDate?: string;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

type PaymentsStore = {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  fetchPayments: () => Promise<void>;
  makePayment: (paymentId: string, method: string) => Promise<void>;
  getPaymentById: (id: string) => Payment | undefined;
  refreshFromCache: () => Promise<void>;
};

export const usePaymentsStore = create<PaymentsStore>((set, get) => ({
  payments: [],
  isLoading: false,
  error: null,
  
  fetchPayments: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        // Online: API'den veri al
        const payments = await apiServices.payments.getAll();
        
        set({ payments, isLoading: false });
        // Offline kullanım için önbelleğe al
        await storage.cachePayments(payments);
      } else {
        // Offline: Önbellekten veri al
        console.log('Offline mod: Önbellekten aidat verileri alınıyor');
        await get().refreshFromCache();
      }
    } catch (error: any) {
      console.error('Aidat verisi alınamadı:', error);
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Aidat bilgileri alınamadı'
      });
      
      // Hata durumunda önbellekten oku
      await get().refreshFromCache();
    }
  },
  
  makePayment: async (paymentId, method) => {
    try {
      set({ isLoading: true, error: null });
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      
      const paymentData = { 
        paymentMethod: method,
        paymentDate: format(new Date(), 'yyyy-MM-dd')
      };
      
      if (netInfo.isConnected) {
        // Online: API'ye gönder
        await apiServices.payments.makePayment({
          paymentId,
          ...paymentData
        });
        
        // Başarılı ödeme sonrası verileri yenile
        await get().fetchPayments();
      } else {
        // Offline: Kuyruğa ekle
        await apiQueue.add({
          url: `/payments/${paymentId}/pay`,
          method: 'post',
          data: paymentData
        });
        
        // Kullanıcıya hemen geri bildirim vermek için yerel state'i güncelle
        const updatedPayments = get().payments.map(payment => 
          payment._id === paymentId 
            ? { 
                ...payment, 
                status: 'COMPLETED' as const, 
                paymentDate: new Date().toISOString(), 
                paymentMethod: method 
              }
            : payment
        );
        
        set({ payments: updatedPayments, isLoading: false });
        await storage.cachePayments(updatedPayments);
      }
    } catch (error: any) {
      console.error('Ödeme yapılamadı:', error);
      
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Ödeme yapılamadı'
      });
      throw error;
    }
  },
  
  getPaymentById: (id) => {
    return get().payments.find(payment => payment._id === id);
  },
  
  refreshFromCache: async () => {
    const cached = await storage.getCachedPayments();
    if (cached?.data) {
      set({ payments: cached.data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
