import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { Platform, ToastAndroid, Alert } from 'react-native';

// API URL'sini ortama göre ayarla
const API_URL = 'http://10.0.2.2:3000'; // Android emülatör için

type AppContextType = {
  apiAvailable: boolean | null;
  isOfflineMode: boolean;
  checkApiConnection: () => Promise<boolean>;
};

const AppContext = createContext<AppContextType>({
  apiAvailable: null,
  isOfflineMode: false,
  checkApiConnection: async () => false,
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const isOfflineMode = apiAvailable === false;

  // Check if API is available
  const checkApiConnection = async (): Promise<boolean> => {
    try {
      // First check if we have internet
      const netInfoState = await NetInfo.fetch();
      
      if (!netInfoState.isConnected) {
        console.log('No internet connection, app will work in offline mode.');
        setApiAvailable(false);
        return false;
      }
      
      // Then check if the API server is reachable
      console.log('Checking API connection...');
      const response = await axios.get(`${API_URL}/api/health-check`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('API connection successful');
        setApiAvailable(true);
        return true;
      } else {
        console.log('API returned non-200 status', response.status);
        setApiAvailable(false);
        return false;
      }
    } catch (error) {
      console.error('API connection error:', error);
      setApiAvailable(false);
      
      // Only show message if this is the first time we're detecting the error
      if (apiAvailable !== false) {
        // Show toast message on Android or Alert on iOS
        if (Platform.OS === 'android') {
          ToastAndroid.show('Sunucuya bağlanılamadı. Uygulamada kısıtlı özellikler kullanılabilir.', ToastAndroid.LONG);
        } else {
          Alert.alert(
            'Bağlantı Hatası',
            'Sunucuya bağlanılamadı. Uygulamada kısıtlı özellikler kullanılabilir.',
            [{ text: 'Tamam' }]
          );
        }
      }
      
      return false;
    }
  };

  // Initial check
  useEffect(() => {
    checkApiConnection();
    
    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        checkApiConnection();
      } else {
        setApiAvailable(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ apiAvailable, isOfflineMode, checkApiConnection }}>
      {children}
    </AppContext.Provider>
  );
}; 