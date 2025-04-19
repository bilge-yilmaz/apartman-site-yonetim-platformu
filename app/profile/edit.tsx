import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';

export default function EditProfileScreen() {
  const { user, updateProfile, isLoading } = useUserStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [block, setBlock] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setApartmentNo(user.apartmentNo || '');
      setBlock(user.block || '');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı giriniz');
      return;
    }

    try {
      await updateProfile({
        name,
        apartmentNo,
        block,
      });
      
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Profil Bilgilerini Düzenle</Text>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Ad Soyad"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="E-posta"
            value={email}
            disabled
            mode="outlined"
            style={styles.input}
          />
          
          <View style={styles.rowContainer}>
            <TextInput
              label="Blok"
              value={block}
              onChangeText={setBlock}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
            />
            
            <TextInput
              label="Daire No"
              value={apartmentNo}
              onChangeText={setApartmentNo}
              mode="outlined"
              keyboardType="number-pad"
              style={[styles.input, styles.halfInput]}
            />
          </View>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
          >
            Kaydet
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  button: {
    marginBottom: 16,
    paddingVertical: 6,
  },
  cancelButton: {
    marginBottom: 24,
  },
});
