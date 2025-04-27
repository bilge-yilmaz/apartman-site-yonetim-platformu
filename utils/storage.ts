import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  PAYMENTS_CACHE: 'payments_cache',
  MAINTENANCE_CACHE: 'maintenance_cache',
  ANNOUNCEMENTS_CACHE: 'announcements_cache',
  APP_SETTINGS: 'app_settings',
};

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'RESIDENT';
  block?: string;
  apartmentNo?: string;
  isActive?: boolean;
}

// App settings interface
export interface AppSettings {
  notificationsEnabled: boolean;
  darkMode: boolean | null; // null means system default
  language: string;
  biometricEnabled: boolean;
}

// Default app settings
const DEFAULT_APP_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  darkMode: null,
  language: 'tr',
  biometricEnabled: false,
};

export const storage = {
  // Basic storage operations
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from storage:`, error);
      return null;
    }
  },
  
  async set(key: string, value: any) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key} in storage:`, error);
    }
  },
  
  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from storage:`, error);
    }
  },
  
  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  // Auth specific methods
  async getToken(): Promise<string | null> {
    return this.get<string>(KEYS.AUTH_TOKEN);
  },

  async setToken(token: string) {
    return this.set(KEYS.AUTH_TOKEN, token);
  },

  async removeToken() {
    return this.remove(KEYS.AUTH_TOKEN);
  },

  // User data methods
  async getUser(): Promise<User | null> {
    return this.get<User>(KEYS.USER_DATA);
  },

  async setUser(user: User) {
    return this.set(KEYS.USER_DATA, user);
  },

  async removeUser() {
    return this.remove(KEYS.USER_DATA);
  },

  // App settings methods
  async getSettings(): Promise<AppSettings> {
    const settings = await this.get<AppSettings>(KEYS.APP_SETTINGS);
    return settings || DEFAULT_APP_SETTINGS;
  },

  async setSettings(settings: Partial<AppSettings>) {
    const currentSettings = await this.getSettings();
    return this.set(KEYS.APP_SETTINGS, { ...currentSettings, ...settings });
  },

  // Cache methods for offline support
  async cachePayments(payments: any[]) {
    return this.set(KEYS.PAYMENTS_CACHE, {
      data: payments,
      timestamp: new Date().toISOString(),
    });
  },

  async getCachedPayments() {
    return this.get(KEYS.PAYMENTS_CACHE);
  },

  async cacheMaintenance(maintenance: any[]) {
    return this.set(KEYS.MAINTENANCE_CACHE, {
      data: maintenance,
      timestamp: new Date().toISOString(),
    });
  },

  async getCachedMaintenance() {
    return this.get(KEYS.MAINTENANCE_CACHE);
  },

  async cacheAnnouncements(announcements: any[]) {
    return this.set(KEYS.ANNOUNCEMENTS_CACHE, {
      data: announcements,
      timestamp: new Date().toISOString(),
    });
  },

  async getCachedAnnouncements() {
    return this.get(KEYS.ANNOUNCEMENTS_CACHE);
  },

  // Helper method to check if cache is fresh (less than 1 hour old)
  isCacheFresh(cache: { timestamp: string } | null): boolean {
    if (!cache?.timestamp) return false;
    
    const cacheTime = new Date(cache.timestamp).getTime();
    const now = new Date().getTime();
    const hourInMs = 60 * 60 * 1000;
    
    return now - cacheTime < hourInMs;
  },

  // Logout helper - clears auth data but keeps settings
  async logout() {
    await this.removeToken();
    await this.removeUser();
  },
};

export default storage;
