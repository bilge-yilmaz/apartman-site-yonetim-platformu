import axios from 'axios';
import storage, { User } from './storage';
import { storeToken as saveTokenToSecureStore, TOKEN_KEY } from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { decodeJwtPayload } from './base64';

// API URL - Gerçek uygulamada doğru API URL'sini ortama göre ayarla
// Android emülatör için 10.0.2.2 IP adresini kullan
const API_URL = 'http://10.192.90.95:3000';
// const API_URL = 'http://localhost:3000'; // iOS simülatör için
// const API_URL = 'http://127.0.0.1:3000';
// const API_URL = 'http://192.168.1.28:3000'; // Fiziksel cihaz için

console.log('Auth servisi API URL:', API_URL);

// Token'ın süresini kontrol etme fonksiyonu
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) {
      console.log('Token payload\'ında exp alanı bulunamadı');
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < currentTime;
    
    console.log('Token süresi kontrolü:', {
      currentTime,
      expTime: payload.exp,
      isExpired,
      remainingTime: payload.exp - currentTime
    });
    
    return isExpired;
  } catch (error) {
    console.error('Token süre kontrolü hatası:', error);
    return true;
  }
};

// Token'ın yakında sona ereceğini kontrol etme (5 dakika kala)
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutesFromNow = currentTime + (5 * 60); // 5 dakika
    
    return payload.exp < fiveMinutesFromNow;
  } catch (error) {
    console.error('Token yakında sona erme kontrolü hatası:', error);
    return true;
  }
};

// JWT token'ını decode etme fonksiyonu
export const decodeToken = (token: string): User | null => {
  try {
    console.log('Token decode ediliyor...');
    
    // Token formatını kontrol et
    if (!token || !token.includes('.')) {
      console.error('Geçersiz token formatı');
      return null;
    }
    
    // Token süresini kontrol et
    if (isTokenExpired(token)) {
      console.error('Token süresi dolmuş');
      return null;
    }
    
    // Yeni hazır yardımcı fonksiyonu kullan
    const payload = decodeJwtPayload(token);
    
    if (!payload) {
      console.error('Token payload\'ı decode edilemedi');
      return null;
    }
    
    console.log('Decode edilen payload:', payload);
    
    // Payload'da gerekli alanların varlığını kontrol et
    if (!payload.id || !payload.email) {
      console.error('Token payload\'ında gerekli alanlar eksik', payload);
      return null;
    }
    
    // Kullanıcı bilgilerini payload'dan çıkar
    const user: User = {
      id: payload.id,
      name: payload.name || 'İsimsiz Kullanıcı',
      email: payload.email,
      role: (payload.role as 'ADMIN' | 'MANAGER' | 'RESIDENT') || 'RESIDENT',
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      block: payload.block || null,
      apartmentNo: payload.apartmentNo || null
    };
    
    console.log('Decoded user from token:', user);
    return user;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

// Token yenileme fonksiyonu
export const refreshToken = async (): Promise<{ success: boolean; token?: string; message?: string }> => {
  try {
    console.log('🔄 Token yenileniyor...');
    
    const currentToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!currentToken) {
      console.log('❌ Yenilenecek token bulunamadı');
      return { success: false, message: 'Token bulunamadı' };
    }
    
    // Token tamamen süresi dolmuşsa yenileme yapamayız
    if (isTokenExpired(currentToken)) {
      console.log('❌ Token tamamen süresi dolmuş, yeniden giriş gerekli');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await storage.removeUser();
      return { success: false, message: 'Token süresi dolmuş, yeniden giriş yapın' };
    }
    
    const response = await axios.post(
      `${API_URL}/api/auth/refresh`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    if (response.data && response.data.success && response.data.token) {
      const newToken = response.data.token;
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      console.log('✅ Token başarıyla yenilendi');
      return { success: true, token: newToken };
    }
    
    console.log('❌ Token yenileme başarısız:', response.data);
    return { success: false, message: 'Token yenilenemedi' };
  } catch (error: any) {
    console.error('❌ Token yenileme hatası:', error);
    
    // 401 hatası durumunda token'ı temizle
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await storage.removeUser();
      return { success: false, message: 'Oturum süresi dolmuş, yeniden giriş yapın' };
    }
    
    return { success: false, message: 'Token yenileme hatası' };
  }
};

// Token'ı kontrol et ve gerekirse yenile
export const ensureValidToken = async (): Promise<{ success: boolean; token?: string; message?: string }> => {
  try {
    const currentToken = await SecureStore.getItemAsync(TOKEN_KEY);
    
    if (!currentToken) {
      console.log('❌ Token bulunamadı');
      return { success: false, message: 'Token bulunamadı' };
    }
    
    // Token tamamen süresi dolmuşsa
    if (isTokenExpired(currentToken)) {
      console.log('⚠️ Token süresi dolmuş, yenileme deneniyor...');
      return await refreshToken();
    }
    
    // Token yakında sona erecekse yenile
    if (isTokenExpiringSoon(currentToken)) {
      console.log('⚠️ Token yakında sona erecek, yenileme deneniyor...');
      const refreshResult = await refreshToken();
      
      // Yenileme başarısızsa mevcut token'ı kullan
      if (!refreshResult.success) {
        console.log('⚠️ Token yenilenemedi, mevcut token kullanılıyor');
        return { success: true, token: currentToken };
      }
      
      return refreshResult;
    }
    
    // Token geçerli
    console.log('✅ Token geçerli');
    return { success: true, token: currentToken };
  } catch (error) {
    console.error('❌ Token kontrol hatası:', error);
    return { success: false, message: 'Token kontrol hatası' };
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
        const tokenFromApi = response.data.token;
        
        // Token'ı güvenli depolamaya kaydet
        await SecureStore.setItemAsync(TOKEN_KEY, tokenFromApi);
        console.log('Token SecureStore\'a kaydedildi');
        
        // Token'dan kullanıcı bilgilerini çıkar
        const decodedUser = decodeToken(tokenFromApi);
        
        if (decodedUser) {
          // API'den dönen kullanıcı bilgileri ile birleştir
          const userFromApi = response.data.user;
          const userData: User = {
            id: userFromApi.id || decodedUser.id,
            name: userFromApi.name || decodedUser.name,
            email: userFromApi.email || decodedUser.email,
            role: userFromApi.role || decodedUser.role,
            isActive: userFromApi.isActive !== undefined ? userFromApi.isActive : decodedUser.isActive,
            block: userFromApi.block || decodedUser.block,
            apartmentNo: userFromApi.apartmentNo || decodedUser.apartmentNo,
          };
          
          // Kullanıcı bilgilerini depola
          await storage.setUser(userData);
          console.log('Kullanıcı bilgileri kaydedildi:', userData);
          
          return { success: true, token: tokenFromApi, user: userData };
        } else {
          console.error('Token decode edilemedi');
          return { success: false, message: 'Kullanıcı bilgileri alınamadı' };
        }
      }
      
      return { success: false, message: response.data.error || 'Giriş başarısız' };
    } catch (error) {
      console.error('Login error:', error);
      
      // Hata mesajı oluştur
      let errorMessage = 'Giriş yapılırken bir hata oluştu';
      
      if (axios.isAxiosError(error)) {
        console.error('Axios hatası:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
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
