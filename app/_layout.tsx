import { Stack } from 'expo-router';
import { useColorScheme, View, Text, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lightTheme, darkTheme } from '../constants/theme';
import { AppProvider } from '../utils/appContext';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      setTimeout(() => {
        setShowSplash(false);
        SplashScreen.hideAsync();
      }, 2000);
    }
  }, [loaded]);

  if (!loaded || showSplash) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="home" size={64} color={Colors.white} />
        </View>
        <Text style={styles.splashTitle}>Apartman Yönetimi</Text>
        <Text style={styles.splashSubtitle}>Modern Yaşam, Modern Yönetim</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
        <AppProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ title: 'Giriş Yap' }} />
            <Stack.Screen name="auth/register" options={{ title: 'Kayıt Ol' }} />
            <Stack.Screen name="profile/edit" options={{ title: 'Profili Düzenle' }} />
            <Stack.Screen name="payments/details/[id]" options={{ title: 'Ödeme Detayı' }} />
            <Stack.Screen name="maintenance/create" options={{ title: 'Arıza Bildir' }} />
            <Stack.Screen name="maintenance/details/[id]" options={{ title: 'Arıza Detayı' }} />
          </Stack>
        </AppProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
