import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { apiServices } from '../utils/api-services';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

export const NetworkTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      setNetworkInfo(netInfo);
      
      const debug = {
        apiUrl: process.env.EXPO_PUBLIC_API_URL,
        socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL,
        isDev: __DEV__,
        platform: Constants.platform,
        deviceName: Constants.deviceName,
        expoVersion: Constants.expoVersion,
        manifest: Constants.manifest2?.extra?.expoClient || Constants.manifest,
      };
      
      setDebugInfo(debug);
    } catch (error) {
      console.error('Debug info yüklenirken hata:', error);
    }
  };

  const testNetworkConnection = async () => {
    setIsLoading(true);
    try {
      // Network durumunu kontrol et
      const netInfo = await NetInfo.fetch();
      console.log('📶 Network Info:', netInfo);
      setNetworkInfo(netInfo);
      
      if (!netInfo.isConnected) {
        setLastResult('❌ İnternet bağlantısı yok');
        return;
      }

      setLastResult('🔄 API bağlantısı test ediliyor...');
      
      // Basit bir API çağrısı yap
      const response = await apiServices.get('/test-endpoint');
      setLastResult('✅ API bağlantısı başarılı!');
      
      Alert.alert('Başarılı', 'API bağlantısı çalışıyor!');
    } catch (error: any) {
      console.error('❌ Network test hatası:', error);
      const errorMessage = error.message || 'Bilinmeyen hata';
      setLastResult(`❌ Hata: ${errorMessage}`);
      
      Alert.alert('Hata', `Bağlantı hatası: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificEndpoint = async (endpoint: string) => {
    setIsLoading(true);
    try {
      setLastResult(`🔄 ${endpoint} test ediliyor...`);
      const response = await apiServices.get(endpoint);
      setLastResult(`✅ ${endpoint} başarılı!`);
      console.log('API Response:', response);
    } catch (error: any) {
      console.error(`❌ ${endpoint} hatası:`, error);
      setLastResult(`❌ ${endpoint} hatası: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPing = async () => {
    setIsLoading(true);
    try {
      setLastResult('🔄 Ping test ediliyor...');
      const startTime = Date.now();
      
      // AbortController ile timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Basit fetch ile ping testi
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL || 'http://10.192.90.95:3000', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const pingTime = endTime - startTime;
      
      if (response.ok) {
        setLastResult(`✅ Ping başarılı! Süre: ${pingTime}ms`);
      } else {
        setLastResult(`❌ Ping başarısız! Status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Ping hatası:', error);
      if (error.name === 'AbortError') {
        setLastResult('❌ Ping timeout (5 saniye)');
      } else {
        setLastResult(`❌ Ping hatası: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Network Test & Debug</Text>
      
      {/* Test Butonları */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testNetworkConnection}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Test Ediliyor...' : '🌐 Bağlantıyı Test Et'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]} 
          onPress={testPing}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>⚡ Ping Test</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]} 
          onPress={() => testSpecificEndpoint('/payments')}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>💰 Ödemeleri Test Et</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]} 
          onPress={() => testSpecificEndpoint('/announcements')}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>📢 Duyuruları Test Et</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton, isLoading && styles.buttonDisabled]} 
          onPress={loadDebugInfo}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔄 Debug Bilgilerini Yenile</Text>
        </TouchableOpacity>
      </View>

      {/* Test Sonucu */}
      {lastResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>📋 Test Sonucu:</Text>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      ) : null}

      {/* Network Bilgileri */}
      {networkInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>📶 Network Bilgileri:</Text>
          <Text style={styles.infoText}>Bağlı: {networkInfo.isConnected ? '✅ Evet' : '❌ Hayır'}</Text>
          <Text style={styles.infoText}>Tip: {networkInfo.type || 'Bilinmiyor'}</Text>
          <Text style={styles.infoText}>İnternet Erişimi: {networkInfo.isInternetReachable ? '✅ Var' : '❌ Yok'}</Text>
          {networkInfo.details && (
            <>
              <Text style={styles.infoText}>SSID: {networkInfo.details.ssid || 'N/A'}</Text>
              <Text style={styles.infoText}>IP: {networkInfo.details.ipAddress || 'N/A'}</Text>
              <Text style={styles.infoText}>Subnet: {networkInfo.details.subnet || 'N/A'}</Text>
            </>
          )}
        </View>
      )}

      {/* Debug Bilgileri */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🐛 Debug Bilgileri:</Text>
        <Text style={styles.infoText}>API URL: {debugInfo.apiUrl || 'Tanımlı değil'}</Text>
        <Text style={styles.infoText}>Socket URL: {debugInfo.socketUrl || 'Tanımlı değil'}</Text>
        <Text style={styles.infoText}>Development Mode: {debugInfo.isDev ? '✅ Evet' : '❌ Hayır'}</Text>
        <Text style={styles.infoText}>Platform: {debugInfo.platform?.ios ? 'iOS' : debugInfo.platform?.android ? 'Android' : 'Bilinmiyor'}</Text>
        <Text style={styles.infoText}>Device: {debugInfo.deviceName || 'Bilinmiyor'}</Text>
        <Text style={styles.infoText}>Expo Version: {debugInfo.expoVersion || 'Bilinmiyor'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
  },
  infoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
}); 