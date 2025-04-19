import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useMaintenanceStore } from '../../store/maintenance';
import { useUserStore } from '../../store/user';

export default function CreateMaintenanceScreen() {
  const { createRequest, isLoading } = useMaintenanceStore();
  const { user } = useUserStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

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
      await createRequest({
        title,
        description,
        priority,
        apartmentNo: user.apartmentNo,
        block: user.block,
      });
      
      Alert.alert('Başarılı', 'Arıza bildiriminiz oluşturuldu', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Arıza bildirimi oluşturulurken bir hata oluştu');
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
            loading={isLoading}
            disabled={isLoading}
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
