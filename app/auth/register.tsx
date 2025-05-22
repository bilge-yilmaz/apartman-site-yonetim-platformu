import { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import api from '../../utils/api';
import Colors from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [block, setBlock] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    
    if (!name || !email || !password || !confirmPassword || !apartmentNo || !block) {
      setError('Lütfen tüm alanları doldurunuz');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
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
      setError(error.response?.data?.message || 'Kayıt işlemi sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Surface style={styles.registerCard}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/apartment.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              <Text style={styles.title}>Site Yönetim Platformu</Text>
              <Text style={styles.subtitle}>Hesap Oluştur</Text>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formContainer}>
              <TextInput
                label="Ad Soyad"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                outlineColor={Colors.lightGray}
                activeOutlineColor={Colors.primary}
                left={<TextInput.Icon icon="account" color={Colors.primary} />}
              />

              <TextInput
                label="E-posta"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor={Colors.lightGray}
                activeOutlineColor={Colors.primary}
                left={<TextInput.Icon icon="email" color={Colors.primary} />}
              />

              <View style={styles.rowContainer}>
                <TextInput
                  label="Blok"
                  value={block}
                  onChangeText={setBlock}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  outlineColor={Colors.lightGray}
                  activeOutlineColor={Colors.primary}
                  left={<TextInput.Icon icon="home-city" color={Colors.primary} />}
                />
                
                <TextInput
                  label="Daire No"
                  value={apartmentNo}
                  onChangeText={setApartmentNo}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={[styles.input, styles.halfInput]}
                  outlineColor={Colors.lightGray}
                  activeOutlineColor={Colors.primary}
                  left={<TextInput.Icon icon="door" color={Colors.primary} />}
                />
              </View>

              <TextInput
                label="Şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                mode="outlined"
                style={styles.input}
                outlineColor={Colors.lightGray}
                activeOutlineColor={Colors.primary}
                left={<TextInput.Icon icon="lock" color={Colors.primary} />}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? 'eye' : 'eye-off'}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    color={Colors.primary}
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
                outlineColor={Colors.lightGray}
                activeOutlineColor={Colors.primary}
                left={<TextInput.Icon icon="lock-check" color={Colors.primary} />}
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.button}
                contentStyle={styles.buttonContent}
                loading={isLoading}
                disabled={isLoading}
                buttonColor={Colors.primary}
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
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  registerCard: {
    padding: 24,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: Colors.white,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.darkGray,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.white,
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
    borderRadius: 6,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: Colors.darkGray,
  },
  loginTextBold: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
