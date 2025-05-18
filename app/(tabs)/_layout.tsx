import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="reservations" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
