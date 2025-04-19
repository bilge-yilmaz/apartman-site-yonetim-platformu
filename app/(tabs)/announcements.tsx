import { View, Text } from 'react-native';

export default function AnnouncementsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Duyurular</Text>
      <Text style={{ marginTop: 12, color: '#888', fontSize: 16 }}>
        Site duyurularını burada görebilirsiniz.
      </Text>
    </View>
  );
}
