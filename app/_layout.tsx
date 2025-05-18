import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lightTheme, darkTheme } from '../constants/theme';
import { AppProvider } from '../utils/appContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
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
