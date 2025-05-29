import { create } from 'zustand';
import {
  getPayments as apiGetPayments,
  // createPayment as apiCreatePayment, // Henüz kullanılmıyor, gerekirse eklenecek
  updatePayment as apiUpdatePayment,
  // getPaymentById as apiGetPaymentById, // get().payments.find kullanılabilir
  Payment, // services/api.ts'den import edildi
  PaymentData, // services/api.ts'den import edildi
  makePayment
} from '../services/api';
// AsyncStorage tabanlı storage importu kaldırılıyor veya sadece diğer amaçlar için tutuluyor.
// import storage from '../utils/storage'; 
import { cachePaymentsDb, getCachedPaymentsDb } from '../utils/database'; // Yeni DB fonksiyonları import edildi
import { apiQueue } from '../utils/api-services'; // Offline kuyruk için (varsa)
import NetInfo from '@react-native-community/netinfo';
import { format } from 'date-fns';
import { useUserStore } from './user'; // currentUser.id almak için

// Payment tipi services/api.ts'den geldiği için buradaki tanım kaldırılabilir veya eşlenik tutulabilir.
// Önemli: status: 'COMPLETED' -> 'PAID' olarak eşleşmeli.

interface PaymentsState {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  fetchPayments: (params?: { userId?: string; status?: string; apartmentNo?: string; type?: string }) => Promise<void>;
  markAsPaid: (id: string, paymentMethod?: string) => Promise<void>;
  processPayment: (id: string, paymentMethod?: string) => Promise<void>;
  clearError: () => void;
  getPaymentById: (id: string) => Payment | undefined;
  // refreshFromCache: () => Promise<void>; // fetchPayments içinde ele alınabilir
}

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  payments: [],
  isLoading: false,
  error: null,
  
  fetchPayments: async (params) => {
    try {
      set({ isLoading: true, error: null });
      console.log('📋 Ödemeler getiriliyor...', params);
      
      const payments = await apiGetPayments(params || {});
      console.log('✅ Ödemeler başarıyla getirildi:', payments.length);
      
      set({ payments, isLoading: false });
    } catch (error: any) {
      console.error('❌ Ödemeler getirme hatası:', error);
      set({ 
        error: error.message || 'Ödemeler yüklenirken hata oluştu',
        isLoading: false 
      });
    }
  },
  
  markAsPaid: async (id: string, paymentMethod = 'USER_MARKED_AS_PAID') => {
    try {
      console.log('✅ Ödeme işaretleniyor:', id, paymentMethod);
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        // Online: API'ye gönder
        await apiUpdatePayment(id, {
          status: 'PAID',
          paymentMethod: paymentMethod as any,
          paymentDate: new Date().toISOString()
        });
        
        // Local state'i güncelle
        const { payments } = get();
        const updatedPayments = payments.map(payment =>
          payment._id === id
            ? { 
                ...payment, 
                status: 'PAID' as Payment['status'],
                paymentMethod: paymentMethod as Payment['paymentMethod'],
                paymentDate: new Date().toISOString()
              }
            : payment
        );
        set({ payments: updatedPayments });
        
        console.log('✅ Ödeme durumu güncellendi (online)');
      } else {
        // Offline: Yerel değişiklikleri kaydet ve kuyruğa ekle
        const { payments } = get();
        const updatedPayments = payments.map(payment =>
          payment._id === id
            ? { 
                ...payment, 
                status: 'PAID' as Payment['status'],
                paymentMethod: paymentMethod as Payment['paymentMethod'],
                paymentDate: new Date().toISOString()
              }
            : payment
        );
        set({ payments: updatedPayments });
        
        // API kuyruğuna ekle
        await apiQueue.add({
          url: `/payments/${id}`,
          method: 'put',
          data: {
            status: 'PAID',
            paymentMethod: paymentMethod,
            paymentDate: new Date().toISOString()
          },
        });
        
        console.log('✅ Ödeme durumu güncellendi (offline, kuyrukta)');
      }
    } catch (error: any) {
      console.error('❌ Ödeme işaretleme hatası:', error);
      set({ error: error.message || 'Ödeme durumu güncellenirken hata oluştu' });
      throw error;
    }
  },
  
  processPayment: async (id: string, paymentMethod = 'ONLINE') => {
    try {
      console.log('💰 Ödeme işlemi başlatılıyor:', id, paymentMethod);
      set({ isLoading: true, error: null });
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        // Online: Gerçek ödeme işlemi
        const updatedPayment = await makePayment(id, paymentMethod);
        
        // Local state'i güncelle
        const { payments } = get();
        const updatedPayments = payments.map(payment =>
          payment._id === id ? updatedPayment : payment
        );
        set({ payments: updatedPayments, isLoading: false });
        
        console.log('✅ Ödeme işlemi tamamlandı (online)');
      } else {
        // Offline: Yerel değişiklikleri kaydet ve kuyruğa ekle
        const { payments } = get();
        const updatedPayments = payments.map(payment =>
          payment._id === id
            ? { 
                ...payment, 
                status: 'PAID' as Payment['status'],
                paymentMethod: paymentMethod as Payment['paymentMethod'],
                paymentDate: new Date().toISOString()
              }
            : payment
        );
        set({ payments: updatedPayments, isLoading: false });
        
        // API kuyruğuna ekle
        await apiQueue.add({
          url: `/payments/${id}`,
          method: 'put',
          data: {
            status: 'PAID',
            paymentMethod: paymentMethod,
            paymentDate: new Date().toISOString()
          },
        });
        
        console.log('✅ Ödeme işlemi tamamlandı (offline, kuyrukta)');
      }
    } catch (error: any) {
      console.error('❌ Ödeme işlemi hatası:', error);
      set({ 
        error: error.message || 'Ödeme işlemi sırasında hata oluştu',
        isLoading: false 
      });
      throw error;
    }
  },
  
  clearError: () => set({ error: null }),
  
  getPaymentById: (id) => {
    return get().payments.find(payment => payment._id === id);
  },
})); 