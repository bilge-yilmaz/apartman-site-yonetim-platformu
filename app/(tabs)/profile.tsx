import { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, Divider, Avatar } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';

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
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.notLoggedInText}>Giriş yapmadınız</Text>
          <Button 
            mode="contained" 
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
          >
            Giriş Yap
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        {user.image ? (
          <Image source={{ uri: user.image }} style={styles.avatar} />
        ) : (
          <Avatar.Text 
            size={100} 
            label={user.name?.substring(0, 2).toUpperCase() || 'U'} 
            style={styles.avatarText}
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
          <Text style={styles.sectionTitle}>Daire Bilgileri</Text>
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
          >
            Profili Düzenle
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <Divider style={styles.divider} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Bildirim Ayarları</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Yardım ve Destek</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Hakkında</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    backgroundColor: '#1976D2',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  email: {
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  roleContainer: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  roleText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  editButton: {
    marginTop: 16,
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemText: {
    fontSize: 16,
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
  notLoggedInText: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 16,
  },
  loginButton: {
    width: 200,
  },
});
