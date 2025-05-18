import { create } from 'zustand';
import {
  getPayments as apiGetPayments,
  // createPayment as apiCreatePayment, // Henüz kullanılmıyor, gerekirse eklenecek
  updatePayment as apiUpdatePayment,
  // getPaymentById as apiGetPaymentById, // get().payments.find kullanılabilir
  Payment, // services/api.ts'den import edildi
  PaymentData // services/api.ts'den import edildi
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
  fetchPayments: (params: { userId: string; status?: string; apartmentNo?: string }) => Promise<void>; // userId zorunlu hale geldi
  markAsPaid: (paymentId: string, method: string, paymentDate?: string) => Promise<void>; // makePayment -> markAsPaid
  getPaymentById: (id: string) => Payment | undefined;
  // refreshFromCache: () => Promise<void>; // fetchPayments içinde ele alınabilir
}

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  payments: [],
  isLoading: false,
  error: null,
  
  fetchPayments: async (params) => {
    if (!params.userId) {
      console.warn('fetchPayments called without userId');
      set({ isLoading: false, error: 'Kullanıcı kimliği olmadan aidatlar alınamaz.' });
      return;
    }
    try {
      set({ isLoading: true, error: null });
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        const remotePayments = await apiGetPayments(params);
        set({ payments: remotePayments, isLoading: false });
        await cachePaymentsDb(remotePayments, params.userId); // SQLite cache güncelle
      } else {
        console.log('Offline mode: Fetching payments from SQLite cache');
        const cachedPayments = await getCachedPaymentsDb(params.userId); // SQLite cache'den oku
        if (cachedPayments) {
          set({ payments: cachedPayments, isLoading: false });
        } else {
          set({ isLoading: false, error: 'Çevrimdışı ve önbellekte aidat bulunamadı.' });
        }
      }
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      set({ isLoading: false, error: error.message || 'Aidat bilgileri alınamadı' });
      // Hata durumunda da SQLite önbelleğinden okumayı deneyebiliriz
      try {
        const cachedPayments = await getCachedPaymentsDb(params.userId);
        if (cachedPayments) set({ payments: cachedPayments });
      } catch (cacheError) {
        console.error('Error fetching from SQLite cache after primary error:', cacheError);
      }
    }
  },
  
  markAsPaid: async (paymentId, method, paymentDate) => {
    const paymentToUpdate = get().payments.find(p => p._id === paymentId);
    if (!paymentToUpdate) {
      set({ error: 'Güncellenecek ödeme bulunamadı.'});
      return;
    }

    const updatedPaymentData: Partial<PaymentData> = {
      status: 'PAID',
      paymentMethod: method as Payment['paymentMethod'],
      paymentDate: paymentDate || format(new Date(), 'yyyy-MM-dd'),
    };

    const currentUser = useUserStore.getState().user;
    if (!currentUser) {
        set({ error: 'Ödeme güncellemesi için kullanıcı bulunamadı.'});
        return;
    }

    try {
      set({ isLoading: true, error: null });
      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected) {
        const updatedPayment = await apiUpdatePayment(paymentId, updatedPaymentData);
        const newPayments = get().payments.map((p) => (p._id === paymentId ? updatedPayment : p));
        set({
          payments: newPayments,
          isLoading: false,
        });
        await cachePaymentsDb(newPayments, currentUser.id); // SQLite cache güncelle
      } else {
        console.log('Offline mode: Queuing payment update and updating local SQLite cache');
        const locallyUpdatedPayment = { ...paymentToUpdate, ...updatedPaymentData } as Payment;
        const newPayments = get().payments.map((p) => (p._id === paymentId ? locallyUpdatedPayment : p));
        set({
          payments: newPayments,
          isLoading: false,
        });
        await cachePaymentsDb(newPayments, currentUser.id); // SQLite cache güncelle
        await apiQueue.add({
          url: `/api/payments/${paymentId}`,
          method: 'put',
          data: updatedPaymentData,
        });
      }
    } catch (error: any) {
      console.error('Error marking payment as paid:', error);
      set({ isLoading: false, error: error.message || 'Ödeme güncellenemedi' });
    }
  },
  
  getPaymentById: (id) => {
    return get().payments.find(payment => payment._id === id);
  },
})); 