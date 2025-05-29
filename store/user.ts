import { create } from 'zustand';
import storage, { User } from '../utils/storage';
import { apiServices, apiQueue } from '../utils/api-services';
import authService, { decodeToken } from '../utils/auth';
import NetInfo from '@react-native-community/netinfo';

// User tipi artık storage.ts'den içe aktarılıyor

type UserStore = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  hydrate: () => Promise<void>;
  loadProfile: () => Promise<void>;
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
      
      // İlk olarak bellekteki kullanıcı bilgilerini kontrol et
      const storedUser = await storage.getUser();
      
      // Token kontrolü
      const token = await storage.getToken();
      console.log('Token durumu:', token ? 'Token var' : 'Token yok');
      
      if (token) {
        // Token'dan kullanıcı bilgilerini çöz
        const decodedUser = decodeToken(token);
        console.log('Token\'dan çözülen kullanıcı:', decodedUser);
        
        if (decodedUser) {
          // Eğer bellekte kullanıcı bilgileri yoksa veya farklıysa, token'dan gelen bilgileri kullan
          if (!storedUser || storedUser.id !== decodedUser.id) {
            console.log('Token\'dan gelen kullanıcı bilgileri kullanılıyor');
            await storage.setUser(decodedUser);
            set({ user: decodedUser });
          } else {
            // Bellekteki kullanıcı bilgilerini kullan
            console.log('Bellekteki kullanıcı bilgileri kullanılıyor');
            set({ user: storedUser });
          }
          
          // Hydrate'da profil API çağrısı yapmıyoruz, sadece cache'den yüklüyoruz
          console.log('Kullanıcı bilgileri başarıyla yüklendi');
        } else {
          console.log('Token decode edilemedi');
          // Token geçersizse ve bellekte kullanıcı bilgileri varsa, bunları kullan
          if (storedUser) {
            console.log('Bellekteki kullanıcı bilgileri kullanılıyor');
            set({ user: storedUser });
          } else {
            console.log('Geçerli kullanıcı bilgisi bulunamadı, oturum kapatılıyor');
            set({ user: null });
            await storage.removeToken();
          }
        }
      } else {
        // Token yoksa ve bellekte kullanıcı bilgileri varsa bunları temizle
        if (storedUser) {
          console.log('Token olmadığı için bellekteki kullanıcı bilgileri temizleniyor');
          await storage.removeUser();
        }
        console.log('Oturum açılmamış');
        set({ user: null });
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenirken hata:', error);
      // Hata durumunda mevcut durumu koruyoruz, null'a çekmiyoruz
    }
  },
  
  loadProfile: async () => {
    try {
      console.log('🔄 Profil bilgileri API\'den yükleniyor...');
      set({ isLoading: true, error: null });
      
      // İnternet bağlantısı kontrolü
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected;
      console.log('📶 İnternet bağlantısı:', isOnline ? 'Var' : 'Yok');
      
      if (!isOnline) {
        console.log('📱 Offline mod: Mevcut kullanıcı bilgileri korunuyor');
        set({ isLoading: false });
        return;
      }
      
      try {
        // Token kontrolü ve yenileme
        const { ensureValidToken } = await import('../utils/auth');
        const tokenResult = await ensureValidToken();
        
        if (!tokenResult.success) {
          console.log('❌ Geçerli token bulunamadı:', tokenResult.message);
          set({ isLoading: false, error: tokenResult.message || 'Token hatası' });
          return;
        }
        
        console.log('✅ Token geçerli, profil bilgileri alınıyor...');
        const profileData = await apiServices.profile.getProfile();
        
        if (profileData) {
          console.log('✅ API\'den alınan profil bilgileri:', profileData);
          // API'den gelen bilgileri öncelikli olarak kullan, eksik alanları mevcut bilgilerle tamamla
          const currentUser = get().user;
          if (currentUser) {
            // API'den gelen bilgileri mevcut bilgilerle birleştir
            const updatedUser = { 
              ...currentUser,
              ...profileData,
              // API'den eksik gelen kritik alanlar için backup
              id: profileData.id || currentUser.id,
              email: profileData.email || currentUser.email,
              role: profileData.role || currentUser.role
            };
            console.log('📝 Güncel profil bilgileri:', updatedUser);
            set({ user: updatedUser, isLoading: false });
            await storage.setUser(updatedUser);
          } else {
            console.log('❌ Mevcut kullanıcı bilgisi bulunamadı');
            set({ isLoading: false, error: 'Kullanıcı bilgisi bulunamadı' });
          }
        } else {
          console.log('❌ API\'den profil bilgisi alınamadı');
          set({ isLoading: false, error: 'Profil bilgileri alınamadı' });
        }
      } catch (error: any) {
        console.error('❌ Profil bilgileri alınırken hata:', error);
        
        // 401 hatası durumunda kullanıcıyı bilgilendir ama oturumu kapatma
        if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('Oturum süreniz dolmuş')) {
          console.log('⚠️ Token geçersiz olabilir, ancak profil sayfasında oturum kapatılmıyor');
          set({ isLoading: false, error: 'Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapmayı deneyin.' });
        } else {
          // Diğer hata durumlarında mevcut bilgileri koruyoruz
          console.log('⚠️ Profil hatası göz ardı ediliyor, mevcut bilgiler korunuyor');
          set({ isLoading: false, error: 'Profil bilgileri güncellenemedi' });
        }
      }
    } catch (error) {
      console.error('💥 Profil yükleme sırasında beklenmeyen hata:', error);
      set({ isLoading: false, error: 'Beklenmeyen bir hata oluştu' });
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
            url: '/auth/profile',
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
