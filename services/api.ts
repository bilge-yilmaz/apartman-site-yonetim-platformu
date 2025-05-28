import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';

// Dinamik API Base URL belirleme
const getApiBaseUrl = () => {
  // Development ortamında
  if (__DEV__) {
    // iOS Simulator için localhost
    if (Constants.platform?.ios) {
      return 'http://localhost:3000';
    }
    // Android Emulator için 10.0.2.2
    else if (Constants.platform?.android) {
      return 'http://10.0.2.2:3000';
    }
    // Fiziksel cihaz için local network IP (değiştirin)
    else {
      return 'http://192.168.1.100:3000'; // Kendi IP adresinizi yazın
    }
  }
  // Production ortamında
  return 'https://your-production-api.com'; // Production URL'inizi yazın
};

const API_BASE_URL = getApiBaseUrl();
export const TOKEN_KEY = 'user_token';

// Axios instance oluşturma
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 saniye timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Network durumu kontrol fonksiyonu
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  } catch (error) {
    console.error('Network check error:', error);
    return false;
  }
};

// Token yönetimi fonksiyonları
export const storeToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing the auth token', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting the auth token', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing the auth token', error);
  }
};

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Login Response
interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    apartmentNo?: string;
    block?: string;
  };
  token?: string;
  error?: string;
}

// Login fonksiyonu
export const loginUser = async (email_input: string, password_input: string): Promise<LoginResponse> => {
  try {
    // Network kontrolü
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      return { success: false, error: 'İnternet bağlantınızı kontrol edin.' };
    }

    console.log(`API Login isteği gönderiliyor: ${email_input} / ${API_BASE_URL}/api/auth/login`);
    
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      email: email_input,
      password: password_input,
    });
    
    console.log('Login API yanıtı:', response.data);
    
    if (response.data.success && response.data.token) {
      await storeToken(response.data.token);
      console.log('Token güvenli şekilde saklandı');
      
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
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      return { success: false, error: 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.' };
    }
    
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    return { success: false, error: 'Giriş sırasında bir hata oluştu.' };
  }
};

// Kullanıcı profili getirme
export const getUserProfile = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.get('/api/auth/profile');
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Get user profile error:', error.response?.data || error.message);
    return { success: false, error: 'Profil bilgileri alınamadı' };
  }
};

// API client interceptor'ları
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

// Response interceptor - token süresi dolmuşsa otomatik logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token süresi dolmuş, kullanıcıyı logout yap
      await removeToken();
      // Router'a logout sinyali gönder (store üzerinden)
    }
    return Promise.reject(error);
  }
);

// DUYURULAR API
export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category?: string;
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  targetAudience?: 'ALL' | 'BLOCK' | 'RESIDENTS';
  block?: string;
  createdBy?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  isPinned?: boolean;
}

export type AnnouncementData = Omit<Announcement, '_id' | 'createdAt' | 'updatedAt'>;

export const getAnnouncements = async (params?: { category?: string; isActive?: boolean }): Promise<Announcement[]> => {
  try {
    const response = await apiClient.get('/api/announcements', { params });
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get announcements error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Duyurular alınamadı');
  }
};

export const createAnnouncement = async (data: AnnouncementData): Promise<Announcement> => {
  try {
    const response = await apiClient.post('/api/announcements', data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Create announcement error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Duyuru oluşturulamadı');
  }
};

export const getAnnouncementById = async (id: string): Promise<Announcement> => {
  try {
    const response = await apiClient.get(`/api/announcements/${id}`);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`Get announcement by ID ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Duyuru bulunamadı');
  }
};

export const updateAnnouncement = async (id: string, data: Partial<AnnouncementData>): Promise<Announcement> => {
  try {
    const response = await apiClient.put(`/api/announcements/${id}`, data);
    return response.data.data || response.data;
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

// BAKIM TALEPLERİ API
export interface MaintenanceRequest {
  _id: string;
  userId: string;
  apartmentNo: string;
  block?: string;
  category: 'ELECTRICAL' | 'PLUMBING' | 'HEATING' | 'ELEVATOR' | 'CLEANING' | 'SECURITY' | 'OTHER';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  images?: string[];
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceRequestData = Omit<MaintenanceRequest, '_id' | 'createdAt' | 'updatedAt'>;

export const getMaintenanceRequests = async (params?: { 
  status?: string; 
  category?: string; 
  userId?: string;
  apartmentNo?: string;
}): Promise<MaintenanceRequest[]> => {
  try {
    const response = await apiClient.get('/api/maintenance', { params });
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get maintenance requests error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Bakım talepleri alınamadı');
  }
};

export const createMaintenanceRequest = async (data: MaintenanceRequestData): Promise<MaintenanceRequest> => {
  try {
    const response = await apiClient.post('/api/maintenance', data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Create maintenance request error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Bakım talebi oluşturulamadı');
  }
};

export const getMaintenanceRequestById = async (id: string): Promise<MaintenanceRequest> => {
  try {
    const response = await apiClient.get(`/api/maintenance/${id}`);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`Get maintenance request by ID ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Bakım talebi bulunamadı');
  }
};

export const updateMaintenanceRequest = async (id: string, data: Partial<MaintenanceRequestData>): Promise<MaintenanceRequest> => {
  try {
    const response = await apiClient.put(`/api/maintenance/${id}`, data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`Update maintenance request ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Bakım talebi güncellenemedi');
  }
};

export const deleteMaintenanceRequest = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(`/api/maintenance/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Delete maintenance request ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Bakım talebi silinemedi');
  }
};

// ÖDEMELER API
export interface Payment {
  _id: string;
  userId: string;
  apartmentNo?: string;
  type: 'DUES' | 'INVOICE' | 'OTHER';
  description: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentDate?: string;
  paymentMethod?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH';
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentData = Omit<Payment, '_id' | 'createdAt' | 'updatedAt'>;

export const getPayments = async (params?: { 
  status?: string; 
  apartmentNo?: string; 
  userId?: string;
  type?: string;
}): Promise<Payment[]> => {
  try {
    const response = await apiClient.get('/api/payments', { params });
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get payments error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Ödemeler alınamadı');
  }
};

export const createPayment = async (data: PaymentData): Promise<Payment> => {
  try {
    const response = await apiClient.post('/api/payments', data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Create payment error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Ödeme kaydı oluşturulamadı');
  }
};

export const getPaymentById = async (id: string): Promise<Payment> => {
  try {
    const response = await apiClient.get(`/api/payments/${id}`);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`Get payment by ID ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Ödeme kaydı bulunamadı');
  }
};

export const updatePayment = async (id: string, data: Partial<PaymentData>): Promise<Payment> => {
  try {
    const response = await apiClient.put(`/api/payments/${id}`, data);
    return response.data.data || response.data;
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

// BİLDİRİMLER API
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'announcement' | 'payment' | 'maintenance' | 'reservation' | 'system';
  isRead: boolean;
  data?: any; // Ek veri (örn: announcement ID)
  createdAt: string;
  updatedAt: string;
}

export const getNotifications = async (params?: { 
  isRead?: boolean; 
  type?: string;
  limit?: number;
}): Promise<Notification[]> => {
  try {
    const response = await apiClient.get('/api/notifications', { params });
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get notifications error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Bildirimler alınamadı');
  }
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  try {
    const response = await apiClient.put(`/api/notifications/${id}/read`);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`Mark notification as read ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Bildirim okundu olarak işaretlenemedi');
  }
};

export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put('/api/notifications/mark-all-read');
    return response.data;
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Tüm bildirimler okundu olarak işaretlenemedi');
  }
};

export const deleteNotification = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(`/api/notifications/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Delete notification ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Bildirim silinemedi');
  }
};

// REZERVASYONLAR API
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

export type ReservationData = Omit<Reservation, '_id' | 'createdAt' | 'updatedAt' | 'facilityName'>;

export const getFacilities = async (): Promise<Facility[]> => {
  try {
    const response = await apiClient.get('/api/facilities');
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get facilities error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Tesisler alınamadı');
  }
};

export const getReservations = async (params?: { 
  status?: string; 
  userId?: string;
  facilityId?: string;
}): Promise<Reservation[]> => {
  try {
    const response = await apiClient.get('/api/reservations', { params });
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get reservations error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Rezervasyonlar alınamadı');
  }
};

export const createReservation = async (data: ReservationData): Promise<Reservation> => {
  try {
    const response = await apiClient.post('/api/reservations', data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Create reservation error:', error.response?.data || error.message);
    throw error.response?.data || new Error('Rezervasyon oluşturulamadı');
  }
};

export const updateReservation = async (id: string, data: Partial<ReservationData>): Promise<Reservation> => {
  try {
    const response = await apiClient.put(`/api/reservations/${id}`, data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`Update reservation ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Rezervasyon güncellenemedi');
  }
};

export const cancelReservation = async (id: string): Promise<Reservation> => {
  try {
    const response = await apiClient.put(`/api/reservations/${id}/cancel`);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`Cancel reservation ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Rezervasyon iptal edilemedi');
  }
};

// Genel API durumu kontrol fonksiyonu
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/api/health');
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default apiClient; 