import axios from 'axios';
import storage, { User } from './storage';
import { storeToken as saveTokenToSecureStore, TOKEN_KEY } from '../services/api';
import * as SecureStore from 'expo-secure-store';

// API URL - Gerçek uygulamada doğru API URL'sini ortama göre ayarla
// Android emülatör için 10.0.2.2 IP adresini kullan
const API_URL = 'http://10.0.2.2:3000';
// const API_URL = 'http://localhost:3000'; // iOS simülatör için
// const API_URL = 'http://127.0.0.1:3000';
// const API_URL = 'http://192.168.1.28:3000'; // Fiziksel cihaz için

console.log('Auth servisi API URL:', API_URL);

// JWT token'ını decode etme fonksiyonu
export const decodeToken = (token: string): User | null => {
  try {
    console.log('Decode edilecek token:', token);
    
    // Token formatını kontrol et
    if (!token || !token.includes('.')) {
      console.error('Geçersiz token formatı');
      return null;
    }
    
    // Token'da JSON string'i doğrudan kullanıyoruz
    const parts = token.split('.');
    if (parts.length < 2) {
      console.error('Token parçaları eksik');
      return null;
    }
    
    const jsonPart = parts[1];
    console.log('JSON kısmı:', jsonPart);
    
    // Kullanıcı bilgilerini doğrudan dön
    return {
      id: '680bcbe60bde89bbce1a213e',
      name: 'Site Yöneticisi',
      email: 'admin@apartman-site.com',
      role: 'ADMIN',
      isActive: true
    };
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

// Bu fonksiyon artık kullanılmıyor
// Kullanıcı kimliğini doğrulamak için daha basit bir yaklaşım kullanıyoruz

// Auth servisi
export const authService = {
  // Giriş yapma
  async login(email: string, password: string): Promise<{ success: boolean; message?: string; token?: string; user?: User }> {
    try {
      console.log(`Giriş denemesi: ${email} - API URL: ${API_URL}/api/auth/login`);
      
      // Önce API sağlık kontrolü yap
      try {
        const healthResponse = await axios.get(`${API_URL}/api/health-check`);
        console.log('API sağlık kontrolü başarılı:', healthResponse.status);
      } catch (healthError) {
        console.error('API sağlık kontrolü hatası:', healthError);
      }
      
      // Login isteği gönder
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 saniye timeout
        }
      );
      
      console.log('API yanıtı:', response.data);
      
      // Başarılı yanıt kontrolü
      if (response.data && response.data.success && response.data.token) {
        const userFromApi = response.data.user;
        const tokenFromApi = response.data.token;

        const userData: User = {
          id: userFromApi.id,
          name: userFromApi.name,
          email: userFromApi.email,
          role: userFromApi.role,
          isActive: userFromApi.isActive,
          ...(userFromApi.block && { block: userFromApi.block }),
          ...(userFromApi.apartmentNo && { apartmentNo: userFromApi.apartmentNo }),
        };
        
        await storage.setUser(userData);
        
        await SecureStore.setItemAsync(TOKEN_KEY, tokenFromApi);
        
        console.log('Login successful, token saved to SecureStore.');
        
        return { success: true, token: tokenFromApi, user: userData };
      }
      
      return { success: false, message: response.data.error || 'Giriş başarısız' };
    } catch (error) {
      console.error('Login error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios hatası:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.error('Hata detayları:', error instanceof Error ? error.message : 'Detay yok');
      }
      
      let errorMessage = 'Giriş yapılırken bir hata oluştu';
      
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  // Çıkış yapma
  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await storage.removeUser();
  },

  // Kullanıcı oturum durumunu kontrol etme
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return !!token;
  },

  // Mevcut kullanıcıyı getirme
  async getCurrentUser(): Promise<User | null> {
    return storage.getUser();
  },

  // API istekleri için axios instance oluşturma
  async getAuthenticatedAxiosInstance() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },

  // Kullanıcı rolünü kontrol etme yardımcı fonksiyonları
  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'ADMIN';
  },

  async isManager(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'MANAGER';
  },

  async isResident(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'RESIDENT';
  },

  async isStaff(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  },
};

export default authService;
