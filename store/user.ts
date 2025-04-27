import { create } from 'zustand';
import storage, { User } from '../utils/storage';
import { apiServices, apiQueue } from '../utils/api-services';
import authService from '../utils/auth';
import NetInfo from '@react-native-community/netinfo';

// User tipi artık storage.ts'den içe aktarılıyor

type UserStore = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
};

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => {
    set({ user });
    storage.set('user', user);
  },
  
  clearUser: () => {
    set({ user: null });
    storage.remove('user');
  },
  
  hydrate: async () => {
    try {
      console.log('Kullanıcı bilgileri yükleniyor...');
      const user = await storage.getUser();
      
      if (user) {
        console.log('Storage\'dan kullanıcı bilgileri alındı:', user);
        set({ user });
        
        // İnternet bağlantısı varsa profil bilgilerini güncelle
        const netInfo = await NetInfo.fetch();
        console.log('İnternet bağlantısı:', netInfo.isConnected ? 'Var' : 'Yok');
        
        if (netInfo.isConnected) {
          try {
            console.log('Profil bilgileri API\'den alınıyor...');
            const profileData = await apiServices.profile.getProfile();
            console.log('Alınan profil bilgileri:', profileData);
            
            if (profileData) {
              const updatedUser = { ...user, ...profileData };
              set({ user: updatedUser });
              await storage.setUser(updatedUser);
              console.log('Kullanıcı bilgileri güncellendi');
            }
          } catch (error) {
            console.error('Profil bilgileri güncellenirken hata:', error);
            // Hata durumunda mevcut kullanıcı bilgilerini kullan
            // Kullanıcı null olarak ayarlanmamalı
          }
        }
      } else {
        console.log('Storage\'da kullanıcı bilgisi bulunamadı');
        
        // Token var mı kontrol et
        const token = await storage.getToken();
        if (token) {
          console.log('Token bulundu, kullanıcı bilgileri oluşturuluyor');
          
          // Basit bir kullanıcı nesnesi oluştur
          const basicUser: User = {
            id: 'temp-id',
            name: 'Site Yöneticisi',
            email: 'admin@apartman-site.com',
            role: 'ADMIN',
            isActive: true
          };
          
          set({ user: basicUser });
          await storage.setUser(basicUser);
          console.log('Geçici kullanıcı bilgileri oluşturuldu');
        } else {
          console.log('Token bulunamadı, kullanıcı oturum açmamış');
          set({ user: null });
        }
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenirken hata:', error);
      // Hata durumunda kullanıcıyı null olarak ayarlama
      // set({ user: null });
    }
  },
  
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await authService.login(email, password);
      
      if (!result.success) {
        set({ isLoading: false, error: result.message || 'Giriş yapılamadı' });
        throw new Error(result.message || 'Giriş yapılamadı');
      }
      
      // Kullanıcı bilgilerini al
      const user = await storage.getUser();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Giriş yapılamadı'
      });
      throw error;
    }
  },
  
  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      // Google ile giriş işlemi için gerekli kodlar burada olacak
      // Şu an için desteklenmiyor
      set({ 
        isLoading: false, 
        error: 'Google ile giriş şu an desteklenmiyor'
      });
      throw new Error('Google ile giriş şu an desteklenmiyor');
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Google ile giriş yapılamadı'
      });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
    } catch (error) {
      console.error('Çıkış hatası:', error);
    } finally {
      set({ user: null, isLoading: false });
    }
  },
  
  updateProfile: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      
      // İnternet bağlantısını kontrol et
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        // Online: API'ye gönder
        const response = await apiServices.profile.updateProfile(userData);
        const updatedUser = { ...get().user, ...response };
        set({ user: updatedUser as User, isLoading: false });
        await storage.setUser(updatedUser as User);
      } else {
        // Offline: Yerel değişiklikleri kaydet ve kuyruğa ekle
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser as User, isLoading: false });
          await storage.setUser(updatedUser as User);
          
          // Profil güncelleme isteğini kuyruğa ekle
          await apiQueue.add({
            url: '/profile',
            method: 'put',
            data: userData,
          });
        }
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Profil güncellenemedi'
      });
      throw error;
    }
  },
}));
