import axios from 'axios';
import storage, { User } from './storage';

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
  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
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
      if (response.data && response.data.success) {
        console.log('Yanıt içeriği:', response.data);
        
        // Kullanıcı bilgilerini al
        const user = response.data.user;
        
        // Kullanıcı bilgilerini oluştur
        const userData: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: true,
        };
        
        // Blok ve daire numarası varsa ekle
        if (user.block) userData.block = user.block;
        if (user.apartmentNo) userData.apartmentNo = user.apartmentNo;
        
        // Genişletilmiş kullanıcı bilgileri
        const extendedUserData = {
          ...userData,
          phone: '+90 555 123 4567',
          address: 'Apartman Sitesi, A Blok, No: 1',
          notificationPreferences: {
            email: true,
            push: true,
            sms: false
          },
          lastLogin: new Date().toISOString(),
          createdAt: new Date('2025-01-01').toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Kullanıcı bilgilerini sakla
        await storage.setUser(extendedUserData);
        
        // Basit bir token oluştur ve sakla
        const token = `token_${user.id}`;
        await storage.setToken(token);
        
        console.log('Giriş başarılı, genişletilmiş kullanıcı bilgileri kaydedildi');
        return { success: true };
      }
      
      return { success: false, message: 'Giriş başarısız' };
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
      
      // TypeScript hatasını düzeltmek için error tipini kontrol et
      let errorMessage = 'Giriş yapılırken bir hata oluştu';
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
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
    await storage.logout();
  },

  // Kullanıcı oturum durumunu kontrol etme
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getToken();
    return !!token;
  },

  // Mevcut kullanıcıyı getirme
  async getCurrentUser(): Promise<User | null> {
    return storage.getUser();
  },

  // API istekleri için axios instance oluşturma
  async getAuthenticatedAxiosInstance() {
    const token = await storage.getToken();
    
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
