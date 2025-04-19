import { create } from 'zustand';
import { storage } from '../utils/storage';
import api from '../utils/api';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'RESIDENT';
  apartmentNo?: string;
  block?: string;
  token?: string;
  isActive?: boolean;
  image?: string;
};

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
    const user = await storage.get<User>('user');
    set({ user });
  },
  
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/auth/login', { email, password });
      set({ user: response.data, isLoading: false });
      storage.set('user', response.data);
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Giriş yapılamadı'
      });
      throw error;
    }
  },
  
  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      // Google ile giriş web uygulamanızın API'sine bağlanacak
      // Mobil için özel bir endpoint gerekebilir
      const response = await api.post('/auth/google');
      set({ user: response.data, isLoading: false });
      storage.set('user', response.data);
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Google ile giriş yapılamadı'
      });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Çıkış hatası:', error);
    } finally {
      get().clearUser();
    }
  },
  
  updateProfile: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.put('/profile', userData);
      const updatedUser = { ...get().user, ...response.data };
      set({ user: updatedUser as User, isLoading: false });
      storage.set('user', updatedUser);
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Profil güncellenemedi'
      });
      throw error;
    }
  },
}));
