import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Avatar, Divider, ActivityIndicator, Surface, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage anahtarı
const ANNOUNCEMENTS_STORAGE_KEY = 'announcements';
const MAINTENANCE_STORAGE_KEY = 'maintenance_requests';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [weather, setWeather] = useState({ temp: '22°C', condition: 'Güneşli' });
  
  // Verileri yükle
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Duyuruları yükle
      const announcementsData = await AsyncStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
      if (announcementsData) {
        const parsedAnnouncements = JSON.parse(announcementsData);
        setAnnouncements(parsedAnnouncements.slice(0, 3)); // Son 3 duyuru
      }
      
      // Arıza bildirimlerini yükle
      const maintenanceData = await AsyncStorage.getItem(MAINTENANCE_STORAGE_KEY);
      if (maintenanceData) {
        const parsedMaintenance = JSON.parse(maintenanceData);
        setMaintenanceRequests(parsedMaintenance.slice(0, 3)); // Son 3 arıza
      }
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Sayfa yüklenirken verileri getir
  useEffect(() => {
    loadData();
  }, []);
  
  // Yenileme işlemi
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // Yükleniyor göstergesi
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Karşılama Kartı */}
      <Surface style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <Avatar.Text 
            size={60} 
            label={user?.name?.substring(0, 1) || 'A'} 
            style={{ backgroundColor: "#0066cc" }} 
          />
          <View style={styles.welcomeHeaderText}>
            <Text style={styles.welcomeTitle}>Hoş Geldiniz,</Text>
            <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
            <Text style={styles.userApartment}>{user?.block}-{user?.apartmentNo}</Text>
          </View>
        </View>
        
        <View style={styles.weatherContainer}>
          <Text style={styles.temperature}>{weather.temp}</Text>
          <Text style={styles.weatherCondition}>{weather.condition}</Text>
        </View>
      </Surface>
      
      {/* Hızlı Erişim Menüsü */}
      <View style={styles.quickAccessContainer}>
        <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/(tabs)/announcements')}>
          <Avatar.Icon size={40} icon="bullhorn" style={{ backgroundColor: "#4CAF50" }} />
          <Text style={styles.quickAccessText}>Duyurular</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/(tabs)/maintenance')}>
          <Avatar.Icon size={40} icon="tools" style={{ backgroundColor: "#FF9800" }} />
          <Text style={styles.quickAccessText}>Arızalar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/(tabs)/payments')}>
          <Avatar.Icon size={40} icon="cash" style={{ backgroundColor: "#2196F3" }} />
          <Text style={styles.quickAccessText}>Ödemeler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAccessItem} onPress={() => router.push('/(tabs)/profile')}>
          <Avatar.Icon size={40} icon="account" style={{ backgroundColor: "#9C27B0" }} />
          <Text style={styles.quickAccessText}>Profil</Text>
        </TouchableOpacity>
      </View>
      
      {/* Son Duyurular */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Son Duyurular</Title>
          <Button 
            mode="text" 
            onPress={() => router.push('/(tabs)/announcements')}
            labelStyle={styles.seeAllButtonLabel}
          >
            Tümünü Gör
          </Button>
        </View>
        
        {announcements.length > 0 ? (
          announcements.map((announcement: any, index) => (
            <Card key={announcement._id} style={styles.card}>
              <Card.Content>
                <Title>{announcement.title}</Title>
                <Paragraph numberOfLines={2}>{announcement.content}</Paragraph>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>
                    {format(new Date(announcement.createdAt), 'dd MMMM yyyy', { locale: tr })}
                  </Text>
                  {announcement.priority === 'HIGH' && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>Önemli</Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph>Henüz duyuru bulunmuyor.</Paragraph>
            </Card.Content>
          </Card>
        )}
      </View>
      
      {/* Son Arıza Bildirimleri */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Arıza Bildirimlerim</Title>
          <Button 
            mode="text" 
            onPress={() => router.push('/(tabs)/maintenance')}
            labelStyle={styles.seeAllButtonLabel}
          >
            Tümünü Gör
          </Button>
        </View>
        
        {maintenanceRequests.length > 0 ? (
          maintenanceRequests.map((request: any, index) => (
            <Card key={request._id} style={styles.card}>
              <Card.Content>
                <Title>{request.title}</Title>
                <Paragraph numberOfLines={2}>{request.description}</Paragraph>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>
                    {format(new Date(request.createdAt), 'dd MMMM yyyy', { locale: tr })}
                  </Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: 
                      request.status === 'COMPLETED' ? '#4CAF50' : 
                      request.status === 'IN_PROGRESS' ? '#FF9800' : 
                      request.status === 'CANCELLED' ? '#F44336' : '#2196F3'
                  }]}>
                    <Text style={styles.statusText}>
                      {request.status === 'COMPLETED' ? 'Tamamlandı' : 
                       request.status === 'IN_PROGRESS' ? 'İşlemde' : 
                       request.status === 'CANCELLED' ? 'İptal Edildi' : 'Bekliyor'}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph>Henüz arıza bildiriminiz bulunmuyor.</Paragraph>
            </Card.Content>
          </Card>
        )}
      </View>
      
      {/* Yardım Butonu */}
      <View style={styles.helpContainer}>
        <Button 
          mode="contained" 
          icon="help-circle" 
          onPress={() => Alert.alert('Yardım', 'Yardım almak için yönetici ile iletişime geçebilirsiniz.')}
          style={styles.helpButton}
        >
          Yardım Al
        </Button>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  welcomeCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userApartment: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  weatherContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  temperature: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherCondition: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAccessItem: {
    alignItems: 'center',
    width: '22%',
  },
  quickAccessText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButtonLabel: {
    fontSize: 14,
    color: '#0066cc',
  },
  card: {
    marginBottom: 12,
    borderRadius: 8,
  },
  emptyCard: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  priorityBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  helpContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  helpButton: {
    width: '60%',
    borderRadius: 24,
  },
});
