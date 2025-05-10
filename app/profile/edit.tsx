import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Text, TextInput, Button, Avatar, IconButton, Surface, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function EditProfileScreen() {
  const { user, updateProfile, isLoading } = useUserStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [block, setBlock] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setApartmentNo(user.apartmentNo || '');
      setBlock(user.block || '');
      
      // Animasyon efektleri
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
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
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <MaterialCommunityIcons name="account-circle-outline" size={64} color="#1976D2" style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>Profil bilgileri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <Surface style={styles.headerCard}>
        <LinearGradient
          colors={['#1976D2', '#0D47A1']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <IconButton
                icon="arrow-left"
                iconColor="white"
                size={24}
                onPress={() => router.back()}
                style={styles.backButton}
              />
              <Text style={styles.headerTitle}>Profil Düzenle</Text>
            </View>
            
            <View style={styles.avatarContainer}>
              <Avatar.Text 
                size={80} 
                label={name ? name.substring(0, 2).toUpperCase() : 'KK'} 
                style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
                color="#fff"
              />
              <IconButton
                icon="camera"
                iconColor="white"
                size={20}
                style={styles.cameraButton}
                onPress={() => Alert.alert('Bilgi', 'Profil fotoğrafı değiştirme özelliği yakında eklenecektir.')}
              />
            </View>
          </View>
        </LinearGradient>
      </Surface>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
          <Surface style={styles.formCard}>
            <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.formContainer}>
          <TextInput
            label="Ad Soyad"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
            outlineStyle={styles.inputOutline}
          />
          
          <TextInput
            label="E-posta"
            value={email}
            disabled
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
            outlineStyle={styles.inputOutline}
          />
          
          <Text style={styles.sectionTitle}>Daire Bilgileri</Text>
          <Divider style={styles.divider} />
          
          <View style={styles.rowContainer}>
            <TextInput
              label="Blok"
              value={block}
              onChangeText={setBlock}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              left={<TextInput.Icon icon="office-building" />}
              outlineStyle={styles.inputOutline}
            />
            
            <TextInput
              label="Daire No"
              value={apartmentNo}
              onChangeText={setApartmentNo}
              mode="outlined"
              keyboardType="number-pad"
              style={[styles.input, styles.halfInput]}
              left={<TextInput.Icon icon="door" />}
              outlineStyle={styles.inputOutline}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="content-save"
            >
              Kaydet
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.cancelButtonLabel}
              icon="close"
            >
              İptal
            </Button>
          </View>
        </View>
          </Surface>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#1976D2',
  },
  headerCard: {
    elevation: 4,
    borderRadius: 0,
  },
  headerGradient: {
    borderRadius: 0,
    paddingTop: 40, // Status bar height
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    marginBottom: 8,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    margin: 0,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 8,
    marginBottom: 4,
  },
  divider: {
    marginBottom: 16,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputOutline: {
    borderRadius: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#1976D2',
  },
  buttonContent: {
    height: 48,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginBottom: 24,
    borderRadius: 8,
    borderColor: '#757575',
  },
  cancelButtonLabel: {
    fontSize: 16,
    color: '#757575',
  },
});
