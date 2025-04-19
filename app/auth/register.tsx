import { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import api from '../../utils/api';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [block, setBlock] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !apartmentNo || !block) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurunuz');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/register', {
        name,
        email,
        password,
        apartmentNo,
        block,
      });
      
      Alert.alert(
        'Başarılı', 
        'Kayıt işleminiz tamamlandı. Yönetici onayından sonra giriş yapabilirsiniz.',
        [{ text: 'Tamam', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Kayıt Hatası', 
        error.response?.data?.message || 'Kayıt işlemi sırasında bir hata oluştu'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Hesap Oluştur</Text>
        </View>

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
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
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

          <TextInput
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? 'eye' : 'eye-off'}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />

          <TextInput
            label="Şifre Tekrar"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
          >
            Kayıt Ol
          </Button>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginText}>
              Zaten hesabınız var mı? <Text style={styles.loginTextBold}>Giriş Yapın</Text>
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
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
    marginTop: 8,
    paddingVertical: 6,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  loginTextBold: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
});
