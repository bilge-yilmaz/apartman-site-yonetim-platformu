import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, RadioButton, SegmentedButtons, ActivityIndicator, Menu, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';
import { createMaintenanceRequest, MaintenanceRequestData } from '../../services/api';
import { checkNetworkConnection } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage anahtarı (offline backup için)
const MAINTENANCE_STORAGE_KEY = 'maintenance_requests';

// Arıza kategorileri
const CATEGORIES = [
  { value: 'PLUMBING', label: 'Tesisatçı' },
  { value: 'ELECTRICAL', label: 'Elektrikçi' },
  { value: 'HEATING', label: 'Isıtma/Soğutma' },
  { value: 'ELEVATOR', label: 'Asansör' },
  { value: 'CLEANING', label: 'Temizlik' },
  { value: 'SECURITY', label: 'Güvenlik' },
  { value: 'OTHER', label: 'Diğer' },
];

export default function CreateMaintenanceScreen() {
  const { user } = useUserStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [category, setCategory] = useState<'ELECTRICAL' | 'PLUMBING' | 'HEATING' | 'ELEVATOR' | 'CLEANING' | 'SECURITY' | 'OTHER'>('OTHER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Offline backup için AsyncStorage'a kaydet
  const saveToLocalStorage = async (data: any) => {
    try {
      const storedData = await AsyncStorage.getItem(MAINTENANCE_STORAGE_KEY);
      let currentRequests: any[] = [];
      
      if (storedData) {
        currentRequests = JSON.parse(storedData);
      }
      
      const newRequest = {
        _id: `offline_${Date.now()}`,
        ...data,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOffline: true
      };
      
      const updatedRequests = [newRequest, ...currentRequests];
      await AsyncStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(updatedRequests));
      
      return newRequest;
    } catch (error) {
      console.error('Local storage save error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen bir başlık giriniz');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Hata', 'Lütfen bir açıklama giriniz');
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🔧 Arıza bildirimi gönderiliyor...');
      
      // Network kontrolü
      const isConnected = await checkNetworkConnection();
      
      const requestData: MaintenanceRequestData = {
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        apartmentNo: user.apartmentNo || 'Belirtilmemiş',
        block: user.block || 'Belirtilmemiş',
        status: 'PENDING'
      };
      
      if (isConnected) {
        try {
          // Online: API'ye gönder
          console.log('📡 Online mod: API\'ye gönderiliyor');
          const result = await createMaintenanceRequest(requestData);
          console.log('✅ Arıza bildirimi başarıyla oluşturuldu:', result);
        
          Alert.alert('Başarılı', 'Arıza bildiriminiz başarıyla gönderildi ve yöneticilere iletildi.', [
            { 
              text: 'Tamam', 
              onPress: () => {
                router.replace('/(tabs)/maintenance');
              }
            }
          ]);
        } catch (apiError: any) {
          console.error('❌ API hatası:', apiError);
          
          // API hatası durumunda offline olarak kaydet
          console.log('💾 API hatası nedeniyle offline olarak kaydediliyor');
          await saveToLocalStorage(requestData);
          
          Alert.alert(
            'Uyarı', 
            'Arıza bildiriminiz geçici olarak cihazınızda kaydedildi. İnternet bağlantınız düzeldiğinde otomatik olarak gönderilecektir.',
            [
              { 
                text: 'Tamam', 
                onPress: () => {
                  router.replace('/(tabs)/maintenance');
                }
              }
            ]
          );
        }
      } else {
        // Offline: Local storage'a kaydet
        console.log('📱 Offline mod: Yerel olarak kaydediliyor');
        await saveToLocalStorage(requestData);
        
        Alert.alert(
          'Offline Mod', 
          'İnternet bağlantınız olmadığı için arıza bildiriminiz cihazınızda kaydedildi. Bağlantınız düzeldiğinde otomatik olarak gönderilecektir.',
          [
            { 
              text: 'Tamam', 
              onPress: () => {
                router.replace('/(tabs)/maintenance');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Arıza bildirimi oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Arıza bildirimi oluşturulurken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(cat => cat.value === value)?.label || value;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Yeni Arıza Bildirimi</Text>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Başlık"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            placeholder="Örn: Musluk arızası, elektrik kesintisi..."
          />
          
          <TextInput
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={styles.input}
            placeholder="Arızanın detaylarını açıklayın..."
          />
          
          <Text style={styles.label}>Kategori</Text>
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setCategoryMenuVisible(true)}
                style={styles.categoryButton}
                contentStyle={styles.categoryButtonContent}
              >
                {getCategoryLabel(category)}
              </Button>
            }
          >
            {CATEGORIES.map((cat) => (
              <Menu.Item
                key={cat.value}
                onPress={() => {
                  setCategory(cat.value as any);
                  setCategoryMenuVisible(false);
                }}
                title={cat.label}
              />
            ))}
          </Menu>
          
          <Text style={styles.label}>Öncelik</Text>
          <SegmentedButtons
            value={priority}
            onValueChange={(value) => setPriority(value as any)}
            buttons={[
              { value: 'LOW', label: 'Düşük' },
              { value: 'MEDIUM', label: 'Orta' },
              { value: 'HIGH', label: 'Yüksek' },
              { value: 'URGENT', label: 'Acil' },
            ]}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Daire: {user?.block}-{user?.apartmentNo}
            </Text>
            <Text style={styles.infoSubText}>
              Bu bildirim yöneticilere iletilecektir
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={isSubmitting}
            disabled={isSubmitting}
            icon="tools"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Arıza Bildir'}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={isSubmitting}
          >
            İptal
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
  },
  infoSubText: {
    fontSize: 14,
    color: '#777',
  },
  button: {
    marginBottom: 16,
    paddingVertical: 6,
  },
  cancelButton: {
    marginBottom: 24,
  },
  categoryButton: {
    marginBottom: 16,
  },
  categoryButtonContent: {
    justifyContent: 'flex-start',
  },
});
