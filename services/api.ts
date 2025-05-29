import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';

// Dinamik API Base URL belirleme
const getApiBaseUrl = () => {
  // Sabit IP adresi kullan (cache sorununu çözmek için)
  const FIXED_IP = '10.192.90.95:3000';
  
  // Development ortamında
  if (__DEV__) {
    console.log('🌐 Sabit IP adresi kullanılıyor:', `http://${FIXED_IP}`);
    return `http://${FIXED_IP}`;
  }
  
  // Production ortamında
  const prodUrl = process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com';
  console.log('🚀 Production API URL:', prodUrl);
  return prodUrl;
};

const API_BASE_URL = getApiBaseUrl();
export const TOKEN_KEY = 'user_token';

console.log('🔧 API Client konfigürasyonu:', {
  baseURL: API_BASE_URL,
  timeout: 10000,
  platform: Constants.platform
});

// Axios instance oluşturma
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 saniye timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('📤 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`📥 API Response Error: ${error.response?.status || 'Network'} ${error.config?.url}`, error.message);
    return Promise.reject(error);
  }
);

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

// Auth interceptor'ları (logging'den sonra ekleniyor)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Token kontrolü ve gerekirse yenileme
      const { ensureValidToken } = await import('../utils/auth');
      const tokenResult = await ensureValidToken();
      
      if (tokenResult.success && tokenResult.token) {
        config.headers.Authorization = `Bearer ${tokenResult.token}`;
        console.log('🔑 API isteğine token eklendi');
      } else {
        console.log('⚠️ Geçerli token bulunamadı:', tokenResult.message);
        // Token yoksa veya geçersizse Authorization header'ını kaldır
        delete config.headers.Authorization;
      }
    } catch (error) {
      console.log('⚠️ Token kontrol hatası, devam ediliyor:', error);
      // Hata durumunda devam et, token olmadan istek gönder
      delete config.headers.Authorization;
    }
    
    return config;
  },
  (error) => {
    console.log('⚠️ Auth interceptor hatası:', error);
    return Promise.reject(error);
  }
);

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

// Response interceptor - token süresi dolmuşsa otomatik logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 401 hatası alındı, token yenileme deneniyor...');
      originalRequest._retry = true;
      
      try {
        const { refreshToken } = await import('../utils/auth');
        const refreshResult = await refreshToken();
        
        if (refreshResult.success && refreshResult.token) {
          console.log('✅ Token yenilendi, istek tekrarlanıyor');
          originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
          return apiClient(originalRequest);
        } else {
          console.log('❌ Token yenilenemedi, kullanıcı çıkış yapılıyor');
          // Token yenilenemedi, kullanıcıyı logout yap
          await removeToken();
          // Store'a logout sinyali gönder
          try {
            const { useUserStore } = await import('../store/user');
            useUserStore.getState().clearUser();
          } catch (storeError) {
            console.log('⚠️ Store temizleme hatası:', storeError);
          }
        }
      } catch (refreshError) {
        console.error('❌ Token yenileme hatası:', refreshError);
        await removeToken();
        try {
          const { useUserStore } = await import('../store/user');
          useUserStore.getState().clearUser();
        } catch (storeError) {
          console.log('⚠️ Store temizleme hatası:', storeError);
        }
      }
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
    console.log('💳 Ödeme güncelleniyor:', id, data);
    const response = await apiClient.put(`/api/payments/${id}`, data);
    console.log('✅ Ödeme güncelleme yanıtı:', response.data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`❌ Update payment ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Ödeme kaydı güncellenemedi');
  }
};

export const makePayment = async (id: string, paymentMethod: string = 'ONLINE'): Promise<Payment> => {
  try {
    console.log('💰 Ödeme yapılıyor:', id, paymentMethod);
    const response = await apiClient.put(`/api/payments/${id}`, {
      status: 'PAID',
      paymentMethod: paymentMethod,
      paymentDate: new Date().toISOString()
    });
    console.log('✅ Ödeme başarılı:', response.data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`❌ Make payment ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Ödeme işlemi başarısız');
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
    const queryParams = new URLSearchParams();
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get(`/api/user-notifications?${queryParams.toString()}`);
    console.log('✅ Kullanıcı bildirimleri başarıyla alındı:', response.data.length);
    return response.data;
  } catch (error: any) {
    console.error('❌ Bildirimler alınırken hata:', error.response?.data || error.message);
    throw new Error('Bildirimler alınamadı');
  }
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  try {
    const response = await apiClient.put(`/api/user-notifications/${id}`, { isRead: true });
    console.log('✅ Bildirim okundu olarak işaretlendi:', id);
    return response.data;
  } catch (error: any) {
    console.error('❌ Bildirim okundu olarak işaretlenirken hata:', error.response?.data || error.message);
    throw new Error('Bildirim güncellenemedi');
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
    const response = await apiClient.delete(`/api/user-notifications/${id}`);
    console.log('✅ Bildirim başarıyla silindi:', id);
    return response.data;
  } catch (error: any) {
    console.error('❌ Bildirim silinirken hata:', error.response?.data || error.message);
    throw new Error('Bildirim silinemedi');
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
    console.log('🏢 Tesisler yükleniyor...', API_BASE_URL);
    const response = await apiClient.get('/api/facilities');
    console.log('✅ Tesisler API yanıtı:', response.data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('❌ Get facilities error:', error.response?.data || error.message);
    console.error('❌ API Base URL:', API_BASE_URL);
    console.error('❌ Error details:', error);
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
    const response = await apiClient.delete(`/api/reservations/${id}`);
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

// ADMIN DASHBOARD API
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  payments: {
    total: number;
    pending: number;
    overdue: number;
    collected: number;
  };
  maintenance: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  announcements: {
    total: number;
    active: number;
  };
  reservations?: {
    total: number;
    pending: number;
    approved: number;
  };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    console.log('📊 Dashboard istatistikleri getiriliyor...');
    const response = await apiClient.get('/api/admin/dashboard-stats');
    console.log('✅ Dashboard istatistikleri alındı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Dashboard istatistikleri alınırken hata:', error);
    throw new Error(error.response?.data?.message || 'Dashboard istatistikleri alınırken bir hata oluştu');
  }
};

// KULLANICILAR API
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RESIDENT';
  apartmentNo?: string;
  block?: string;
  phone?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserData = Omit<User, '_id' | 'createdAt' | 'updatedAt'>;

export const getUsers = async (params?: { 
  role?: string; 
  block?: string;
  isActive?: boolean;
}): Promise<User[]> => {
  try {
    console.log('👥 Kullanıcılar yükleniyor...');
    const response = await apiClient.get('/api/users', { params });
    console.log('✅ Kullanıcılar başarıyla alındı:', response.data.length);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('❌ Kullanıcılar alınırken hata:', error.response?.data || error.message);
    throw error.response?.data || new Error('Kullanıcılar alınamadı');
  }
};

export const createUser = async (data: UserData): Promise<User> => {
  try {
    console.log('👤 Yeni kullanıcı oluşturuluyor:', data);
    const response = await apiClient.post('/api/users', data);
    console.log('✅ Kullanıcı başarıyla oluşturuldu:', response.data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('❌ Kullanıcı oluşturulurken hata:', error.response?.data || error.message);
    throw error.response?.data || new Error('Kullanıcı oluşturulamadı');
  }
};

export const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`Get user ${id} error:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Kullanıcı bulunamadı');
  }
};

export const updateUser = async (id: string, data: Partial<UserData>): Promise<User> => {
  try {
    console.log('👤 Kullanıcı güncelleniyor:', id, data);
    const response = await apiClient.put(`/api/users/${id}`, data);
    console.log('✅ Kullanıcı başarıyla güncellendi:', response.data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error(`❌ Kullanıcı güncellenirken hata:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Kullanıcı güncellenemedi');
  }
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
  try {
    console.log('🗑️ Kullanıcı siliniyor:', id);
    const response = await apiClient.delete(`/api/users/${id}`);
    console.log('✅ Kullanıcı başarıyla silindi');
    return response.data;
  } catch (error: any) {
    console.error(`❌ Kullanıcı silinirken hata:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Kullanıcı silinemedi');
  }
};

// NOTIFICATION API
export interface SentNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  targetRole: string;
  targetApartment?: string;
  targetBlock?: string;
  priority: string;
  senderName?: string;
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}

export const getSentNotifications = async (params?: {
  type?: string;
  targetRole?: string;
  limit?: number;
}): Promise<SentNotification[]> => {
  try {
    console.log('📋 Gönderilen bildirimler getiriliyor...');
    const response = await apiClient.get('/api/notifications/sent', { params });
    console.log('✅ Gönderilen bildirimler alındı:', response.data.length);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('❌ Gönderilen bildirimler alınırken hata:', error);
    throw new Error(error.response?.data?.message || 'Gönderilen bildirimler alınırken bir hata oluştu');
  }
};

export const sendSocketNotification = async (notificationData: {
  type: string;
  title: string;
  message: string;
  targetRoles?: string[];
  targetApartments?: string[];
  targetBlocks?: string[];
  targetRole?: string;
  targetApartment?: string;
  targetBlock?: string;
  priority: string;
  senderName?: string;
  timestamp?: string;
}): Promise<{ success: boolean; message: string; targetCount: number }> => {
  try {
    console.log('📤 Socket bildirim gönderiliyor:', notificationData);
    const response = await apiClient.post('/api/notifications/send-socket', notificationData);
    console.log('✅ Socket bildirim yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Socket bildirim gönderme hatası:', error);
    throw new Error(error.response?.data?.message || 'Bildirim gönderilirken bir hata oluştu');
  }
};

export default apiClient;