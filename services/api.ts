import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://10.0.2.2:3000'; // Web API'nizin temel URL'si (Android emülatör için güncellendi)
export const TOKEN_KEY = 'user_token'; // SecureStore'da token'ı saklamak için anahtar (EXPORT EDİLDİ)

// Axios instance oluşturma (isteğe bağlı ama iyi bir pratik)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token'ı SecureStore'a kaydetme
export const storeToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing the auth token', error);
    // İsteğe bağlı: Hata yönetimi (örn: kullanıcıya bildirim)
  }
};

// Token'ı SecureStore'dan alma
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting the auth token', error);
    return null;
  }
};

// Token'ı SecureStore'dan silme (logout için)
export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing the auth token', error);
  }
};

// Giriş API'sine istek gönderme
interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token?: string;
  error?: string;
}

export const loginUser = async (email_input: string, password_input: string): Promise<LoginResponse> => {
  try {
    console.log(`API Login isteği gönderiliyor: ${email_input} / ${API_BASE_URL}/api/auth/login`);
    
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      email: email_input,
      password: password_input,
    });
    
    console.log('Login API yanıtı:', response.data);
    
    if (response.data.success && response.data.token) {
      await storeToken(response.data.token);
      console.log('Token güvenli şekilde saklandı');
      
      // API yanıtında user bilgisi olduğunu kontrol et
      if (!response.data.user) {
        console.error('API yanıtında kullanıcı bilgisi yok');
        return { 
          success: false, 
          error: 'Kullanıcı bilgileri alınamadı'
        };
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Login API error:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    return { success: false, error: 'Giriş sırasında bir ağ hatası oluştu.' };
  }
};

// API client'a interceptor ekleyerek her isteğe token'ı otomatik ekleme
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// DUYURULAR (ANNOUNCEMENTS) API

// Duyuru tipi (Mongoose modeline benzer olmalı)
export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category?: string;
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'; // Öncelik düzeyi ekledim
  targetAudience?: 'ALL' | 'BLOCK' | 'RESIDENTS'; // Örnek roller
  block?: string; // Eğer targetAudience BLOCK ise
  createdBy?: string; // User ID
  isActive?: boolean;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  // Diğer alanlar eklenebilir (attachments, pinned vb.)
}

// Duyuru oluşturma/güncelleme için veri tipi
export type AnnouncementData = Omit<Announcement, '_id' | 'createdAt' | 'updatedAt'>;

export const getAnnouncements = async (params?: { category?: string; isActive?: boolean }): Promise<Announcement[]> => {
  try {
    const response = await apiClient.get('/api/announcements', { params });
    return response.data;
  } catch (error: any) {
    console.error('Get announcements error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Duyurular alınamadı');
  }
};

export const createAnnouncement = async (data: AnnouncementData): Promise<Announcement> => {
  try {
    const response = await apiClient.post('/api/announcements', data);
    return response.data;
  } catch (error: any) {
    console.error('Create announcement error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Duyuru oluşturulamadı');
  }
};

export const getAnnouncementById = async (id: string): Promise<Announcement> => {
  try {
    const response = await apiClient.get(`/api/announcements/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Get announcement by ID ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Duyuru bulunamadı');
  }
};

export const updateAnnouncement = async (id: string, data: Partial<AnnouncementData>): Promise<Announcement> => {
  try {
    const response = await apiClient.put(`/api/announcements/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Update announcement ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Duyuru güncellenemedi');
  }
};

export const deleteAnnouncement = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(`/api/announcements/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Delete announcement ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Duyuru silinemedi');
  }
};

// ÖDEMELER / AİDATLAR (PAYMENTS) API

// Ödeme/Aidat tipi (Mongoose modeline benzer olmalı)
export interface Payment {
  _id: string;
  userId: string; // Sakin ID
  apartmentId?: string; // Daire ID (eğer userId yeterli değilse)
  type: 'DUES' | 'INVOICE' | 'OTHER'; // Aidat, Fatura (elektrik, su), Diğer
  description: string;
  amount: number;
  dueDate: string; // ISO Date string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentDate?: string; // ISO Date string (eğer ödendiyse)
  paymentMethod?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH'; // Ödeme yöntemi
  transactionId?: string; // Ödeme işlemi ID'si
  notes?: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

// Ödeme/Aidat oluşturma/güncelleme için veri tipi
export type PaymentData = Omit<Payment, '_id' | 'createdAt' | 'updatedAt'>;

export const getPayments = async (params?: { status?: string; apartmentNo?: string; userId?: string }): Promise<Payment[]> => {
  try {
    const response = await apiClient.get('/api/payments', { params });
    return response.data;
  } catch (error: any) {
    console.error('Get payments error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Ödemeler alınamadı');
  }
};

export const createPayment = async (data: PaymentData): Promise<Payment> => {
  try {
    const response = await apiClient.post('/api/payments', data);
    return response.data;
  } catch (error: any) {
    console.error('Create payment error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Ödeme kaydı oluşturulamadı');
  }
};

export const getPaymentById = async (id: string): Promise<Payment> => {
  try {
    const response = await apiClient.get(`/api/payments/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Get payment by ID ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Ödeme kaydı bulunamadı');
  }
};

export const updatePayment = async (id: string, data: Partial<PaymentData>): Promise<Payment> => {
  try {
    const response = await apiClient.put(`/api/payments/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Update payment ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Ödeme kaydı güncellenemedi');
  }
};

export const deletePayment = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(`/api/payments/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Delete payment ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Ödeme kaydı silinemedi');
  }
};

// REZERVASYONLAR (RESERVATIONS) API

// Tesis tipi
export interface Facility {
  _id: string;
  name: string;
  description: string;
  openingHour: number;
  closingHour: number;
  maxReservationHours: number;
  image?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Rezervasyon tipi
export interface Reservation {
  _id: string;
  userId: string;
  facilityId: string;
  facilityName: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Rezervasyon oluşturma/güncelleme için veri tipi
export type ReservationData = Omit<Reservation, '_id' | 'createdAt' | 'updatedAt' | 'facilityName'>;

// Tesisleri getir
export const getFacilities = async (): Promise<Facility[]> => {
  try {
    const response = await apiClient.get('/api/facilities');
    return response.data;
  } catch (error: any) {
    console.error('Get facilities error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Tesisler alınamadı');
  }
};

// Rezervasyonları getir
export const getReservations = async (params?: { status?: string; userId?: string }): Promise<Reservation[]> => {
  try {
    const response = await apiClient.get('/api/reservations', { params });
    return response.data;
  } catch (error: any) {
    console.error('Get reservations error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Rezervasyonlar alınamadı');
  }
};

// Rezervasyon oluştur
export const createReservation = async (data: ReservationData): Promise<Reservation> => {
  try {
    const response = await apiClient.post('/api/reservations', data);
    return response.data;
  } catch (error: any) {
    console.error('Create reservation error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Rezervasyon oluşturulamadı');
  }
};

// Rezervasyon güncelle (durumunu değiştirme veya iptal etme için)
export const updateReservation = async (id: string, data: Partial<ReservationData>): Promise<Reservation> => {
  try {
    const response = await apiClient.put(`/api/reservations/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Update reservation ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Rezervasyon güncellenemedi');
  }
};

// Rezervasyon iptal et
export const cancelReservation = async (id: string): Promise<Reservation> => {
  try {
    const response = await apiClient.put(`/api/reservations/${id}/cancel`);
    return response.data;
  } catch (error: any) {
    console.error(`Cancel reservation ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Rezervasyon iptal edilemedi');
  }
};

export default apiClient; // Diğer modüllerde kullanmak için instance'ı export et 