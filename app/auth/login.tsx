import { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';
import { loginUser } from '../../services/api';
import Colors from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { setUser, loginWithGoogle } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Form validasyonu
      if (!email || !password) {
        setError('E-posta ve şifre alanları zorunludur.');
        setLoading(false);
        return;
      }

      // API isteği
      const response = await loginUser(email, password);

      if (response.success && response.user && response.token) {
        // Kullanıcı bilgilerini kaydet
        const userWithCorrectRole = {
          ...response.user,
          role: response.user.role as 'ADMIN' | 'MANAGER' | 'RESIDENT'
        };
        setUser(userWithCorrectRole);
        
        // Kullanıcı rolüne göre yönlendirme
        if (userWithCorrectRole.role === 'ADMIN') {
          // Admin paneline yönlendir
          router.replace('/admin');
        } else {
          // Normal kullanıcı paneline yönlendir
          router.replace('/(tabs)');
        }
      } else {
        setError(response.error || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Google Giriş Hatası', 'Google ile giriş yapılamadı');
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
          <Surface style={styles.loginCard}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/apartment.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              <Text style={styles.title}>Site Yönetim Platformu</Text>
              <Text style={styles.subtitle}>Giriş Yap</Text>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formContainer}>
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

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                contentStyle={styles.buttonContent}
                loading={loading}
                disabled={loading}
                buttonColor={Colors.primary}
              >
                Giriş Yap
              </Button>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                mode="outlined"
                icon="google"
                onPress={handleGoogleLogin}
                style={styles.googleButton}
                contentStyle={styles.buttonContent}
                disabled={loading}
                textColor={Colors.darkGray}
                buttonColor={Colors.white}
              >
                Google ile Giriş Yap
              </Button>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => router.push('/auth/register')}
              >
                <Text style={styles.registerText}>
                  Hesabınız yok mu? <Text style={styles.registerTextBold}>Kayıt Olun</Text>
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
  loginCard: {
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
  button: {
    marginTop: 8,
    borderRadius: 6,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  dividerText: {
    marginHorizontal: 12,
    color: Colors.darkGray,
  },
  googleButton: {
    borderColor: Colors.lightGray,
    borderRadius: 6,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    color: Colors.darkGray,
  },
  registerTextBold: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
