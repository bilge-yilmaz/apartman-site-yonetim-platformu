import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, RadioButton, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage anahtarı
const MAINTENANCE_STORAGE_KEY = 'maintenance_requests';

// Arıza bildirimi tipi
type MaintenanceRequest = {
  _id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  apartmentNo: string;
  block: string;
  createdBy?: string;
  assignedTo?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
};

export default function CreateMaintenanceScreen() {
  const { user } = useUserStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Arıza bildirimi oluştur
  const createMaintenanceRequest = async (data: {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    apartmentNo: string;
    block: string;
  }) => {
    try {
      console.log('Yeni arıza bildirimi oluşturuluyor:', data);
      
      // AsyncStorage'dan mevcut arıza bildirimlerini al
      const storedData = await AsyncStorage.getItem(MAINTENANCE_STORAGE_KEY);
      let currentRequests: MaintenanceRequest[] = [];
      
      if (storedData) {
        currentRequests = JSON.parse(storedData);
        console.log('Mevcut arıza bildirimleri:', currentRequests.length);
      }
      
      // Yeni arıza bildirimi oluştur
      const newRequest: MaintenanceRequest = {
        _id: `new_${Date.now()}`,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'PENDING',
        apartmentNo: data.apartmentNo,
        block: data.block,
        createdBy: user?.id || 'unknown',
        category: 'GENERAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Yeni arıza bildirimini listeye ekle (en başa)
      const updatedRequests = [newRequest, ...currentRequests];
      
      // Güncellenmiş listeyi AsyncStorage'a kaydet
      await AsyncStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(updatedRequests));
      console.log('Arıza bildirimleri güncellendi, yeni toplam:', updatedRequests.length);
      
      return {
        success: true,
        data: newRequest,
        message: 'Arıza bildirimi başarıyla oluşturuldu'
      };
    } catch (error) {
      console.error('Arıza bildirimi oluşturulurken hata:', error);
      return {
        success: false,
        message: 'Arıza bildirimi oluşturulurken bir hata oluştu'
      };
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

    if (!user?.apartmentNo || !user?.block) {
      Alert.alert('Hata', 'Daire bilgileriniz eksik, lütfen profilinizi güncelleyin');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Arıza bildirimi gönderiliyor...');
      
      const result = await createMaintenanceRequest({
        title,
        description,
        priority,
        apartmentNo: user.apartmentNo,
        block: user.block,
      });
      
      console.log('Arıza bildirimi oluşturma sonucu:', result);
      
      if (result && result.success) {
        console.log('Arıza bildirimi başarıyla oluşturuldu');
        
        Alert.alert('Başarılı', 'Arıza bildiriminiz oluşturuldu', [
          { 
            text: 'Tamam', 
            onPress: () => {
              // Ana ekrana dön
              router.replace('/(tabs)');
            }
          }
        ]);
      } else {
        console.error('Arıza bildirimi oluşturulamadı:', result?.message || 'Bilinmeyen hata');
        Alert.alert('Hata', result?.message || 'Arıza bildirimi oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      console.error('Arıza bildirimi oluşturma hatası:', error);
      Alert.alert('Hata', 'Arıza bildirimi oluşturulurken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
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
          />
          
          <TextInput
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={styles.input}
          />
          
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
          </View>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Arıza Bildir
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
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
  button: {
    marginBottom: 16,
    paddingVertical: 6,
  },
  cancelButton: {
    marginBottom: 24,
  },
});
