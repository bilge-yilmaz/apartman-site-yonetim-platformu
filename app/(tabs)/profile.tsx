import { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, Divider, Avatar } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';
import BottomNav from '../../components/BottomNav';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function ProfileScreen() {
  const { user, hydrate, logout, isLoading } = useUserStore();

  useEffect(() => {
    hydrate();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Yönetici';
      case 'MANAGER':
        return 'Site Yöneticisi';
      case 'RESIDENT':
        return 'Site Sakini';
      default:
        return role;
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.safeArea} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        
        <View style={styles.notLoggedInContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="person-outline" size={36} color="#999" />
          </View>
          <Text style={styles.notLoggedInText}>Giriş yapmadınız</Text>
          <Button 
            mode="contained" 
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
            buttonColor={Colors.primary}
          >
            Giriş Yap
          </Button>
        </View>
        
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeader}>
          {user.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <Avatar.Text 
              size={80} 
              label={user.name?.substring(0, 2).toUpperCase() || 'U'} 
              style={styles.avatarText}
              labelStyle={styles.avatarLabel}
            />
          )}
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>{getRoleText(user.role || 'RESIDENT')}</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="home-outline" size={24} color={Colors.primary} style={{marginRight: 8}} />
              <Text style={styles.sectionTitle}>Daire Bilgileri</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blok</Text>
              <Text style={styles.infoValue}>{user.block || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Daire No</Text>
              <Text style={styles.infoValue}>{user.apartmentNo || '-'}</Text>
            </View>
            
            <Button 
              mode="outlined" 
              icon="pencil" 
              onPress={() => router.push('/profile/edit')}
              style={styles.editButton}
              textColor={Colors.primary}
            >
              Profili Düzenle
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="settings-outline" size={24} color={Colors.primary} style={{marginRight: 8}} />
              <Text style={styles.sectionTitle}>Hesap</Text>
            </View>
            <Divider style={styles.divider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemContent}>
                <Ionicons name="notifications-outline" size={22} color="#666" style={{marginRight: 12}} />
                <Text style={styles.menuItemText}>Bildirim Ayarları</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemContent}>
                <Ionicons name="help-circle-outline" size={22} color="#666" style={{marginRight: 12}} />
                <Text style={styles.menuItemText}>Yardım ve Destek</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemContent}>
                <Ionicons name="information-circle-outline" size={22} color="#666" style={{marginRight: 12}} />
                <Text style={styles.menuItemText}>Hakkında</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <Button 
              mode="outlined" 
              icon="logout" 
              onPress={handleLogout}
              textColor="#F44336"
              style={styles.logoutButton}
              loading={isLoading}
              disabled={isLoading}
            >
              Çıkış Yap
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    backgroundColor: Colors.primary,
  },
  avatarLabel: {
    fontSize: 26,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    color: Colors.black,
  },
  email: {
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  roleContainer: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  roleText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#757575',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
  editButton: {
    marginTop: 16,
    borderColor: Colors.primary,
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.black,
  },
  logoutButton: {
    marginTop: 16,
    borderColor: '#F44336',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  notLoggedInText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 16,
    width: 200,
  },
});
