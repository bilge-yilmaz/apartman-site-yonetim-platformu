import { create } from 'zustand';
import api, { apiQueue } from '../utils/api';
import { storage } from '../utils/storage';
import { format } from 'date-fns';

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
      const response = await api.get('/resident/dashboard');
      const payments = response.data.payments || [];
      
      set({ payments, isLoading: false });
      // Offline kullanım için önbelleğe al
      storage.set('payments_cache', {
        data: payments,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Aidat verisi alınamadı:', error);
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Aidat bilgileri alınamadı'
      });
      
      // Offline durum için önbellekten oku
      await get().refreshFromCache();
    }
  },
  
  makePayment: async (paymentId, method) => {
    try {
      set({ isLoading: true, error: null });
      
      // Online ise doğrudan API'ye gönder
      await api.post(`/payments/${paymentId}/pay`, { 
        paymentMethod: method,
        paymentDate: format(new Date(), 'yyyy-MM-dd')
      });
      
      await get().fetchPayments();
    } catch (error: any) {
      console.error('Ödeme yapılamadı:', error);
      
      // Offline ise kuyruğa ekle
      if (error.message === 'Network Error') {
        await apiQueue.add({
          url: `/payments/${paymentId}/pay`,
          method: 'POST',
          data: { 
            paymentMethod: method,
            paymentDate: format(new Date(), 'yyyy-MM-dd')
          }
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
        storage.set('payments_cache', {
          data: updatedPayments,
          timestamp: new Date().toISOString(),
        });
        
        return;
      }
      
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Ödeme yapılamadı'
      });
    }
  },
  
  getPaymentById: (id) => {
    return get().payments.find(payment => payment._id === id);
  },
  
  refreshFromCache: async () => {
    const cached = await storage.get<{data: Payment[], timestamp: string}>('payments_cache');
    if (cached?.data) {
      set({ payments: cached.data });
    }
  },
}));
