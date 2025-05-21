import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Switch, Button, Divider, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import storage from '../../utils/storage';
import AdminPageGuard from '../../components/AdminPageGuard';

export default function AdminSettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const { user, logout } = useUserStore();

  // Yetki kontrolü
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.replace('/auth/login');
    } else {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const settings = await storage.getSettings();
      setNotificationsEnabled(settings.notificationsEnabled);
      setDarkModeEnabled(settings.darkMode === true);
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const handleNotificationsToggle = async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await storage.setSettings({ notificationsEnabled: newValue });
    } catch (error) {
      console.error('Bildirim ayarı kaydedilirken hata:', error);
    }
  };

  const handleDarkModeToggle = async () => {
    try {
      const newValue = !darkModeEnabled;
      setDarkModeEnabled(newValue);
      await storage.setSettings({ darkMode: newValue });
    } catch (error) {
      console.error('Tema ayarı kaydedilirken hata:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Oturumunuzu kapatmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Önbelleği Temizle',
      'Uygulama önbelleğini temizlemek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Temizle', 
          style: 'destructive',
          onPress: async () => {
            // Önbellek temizleme işlemi
            await storage.remove('payments_cache');
            await storage.remove('maintenance_cache');
            await storage.remove('announcements_cache');
            Alert.alert('Başarılı', 'Önbellek temizlendi.');
          }
        },
      ]
    );
  };

  return (
    <AdminPageGuard>
      <View style={styles.container}>
        <View style={styles.safeArea} />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ayarlar</Text>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.title}>Ayarlar</Text>
            <Text style={styles.subtitle}>Uygulama ayarlarını yapılandırın.</Text>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
                
                <List.Item
                  title="E-posta"
                  description={user?.email}
                  left={props => <List.Icon {...props} icon="email" color={Colors.primary} />}
                />
                
                <List.Item
                  title="Rol"
                  description="Yönetici"
                  left={props => <List.Icon {...props} icon="shield-account" color={Colors.primary} />}
                />
                
                <Button 
                  mode="outlined" 
                  onPress={() => router.push('/profile/edit')}
                  style={styles.actionButton}
                  icon="account-edit"
                >
                  Profili Düzenle
                </Button>
              </Card.Content>
            </Card>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>
                
                <List.Item
                  title="Bildirimler"
                  description="Uygulama bildirimlerini al"
                  left={props => <List.Icon {...props} icon="bell" color={Colors.primary} />}
                  right={props => (
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={handleNotificationsToggle}
                      color={Colors.primary}
                    />
                  )}
                />
                
                <List.Item
                  title="Karanlık Tema"
                  description="Karanlık tema kullan"
                  left={props => <List.Icon {...props} icon="theme-light-dark" color={Colors.primary} />}
                  right={props => (
                    <Switch
                      value={darkModeEnabled}
                      onValueChange={handleDarkModeToggle}
                      color={Colors.primary}
                    />
                  )}
                />
                
                <Divider style={styles.divider} />
                
                <Button 
                  mode="outlined" 
                  onPress={handleClearCache}
                  style={styles.actionButton}
                  icon="cached"
                >
                  Önbelleği Temizle
                </Button>
              </Card.Content>
            </Card>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Hakkında</Text>
                
                <List.Item
                  title="Uygulama Versiyonu"
                  description="1.0.0"
                  left={props => <List.Icon {...props} icon="information" color={Colors.primary} />}
                />
                
                <List.Item
                  title="Geliştirici"
                  description="Apartman Site Yönetimi"
                  left={props => <List.Icon {...props} icon="code-tags" color={Colors.primary} />}
                />
              </Card.Content>
            </Card>
            
            <Button 
              mode="contained" 
              onPress={handleLogout}
              style={[styles.actionButton, styles.logoutButton]}
              icon="logout"
              buttonColor={Colors.error}
            >
              Çıkış Yap
            </Button>
          </View>
        </ScrollView>
      </View>
    </AdminPageGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    height: 35,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.black,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  actionButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  logoutButton: {
    marginTop: 16,
    marginBottom: 32,
  },
}); 