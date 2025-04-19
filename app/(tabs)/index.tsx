import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Apartman Yönetim Mobil</Text>
      <Text style={{ marginTop: 12, color: '#888', fontSize: 16 }}>
        Ana sayfaya hoş geldiniz.
      </Text>
    </View>
  );
}
