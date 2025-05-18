import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ImageBackground, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Avatar, Divider, ActivityIndicator, Surface, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../../store/user';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import BottomNav from '../../components/BottomNav';

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
  const [weather, setWeather] = useState({ temp: '22°C', condition: 'Güneşli', icon: 'sunny' });
  const [searchQuery, setSearchQuery] = useState('');
  
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
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const featuredServices = [
    { id: 1, icon: 'megaphone-outline' as const, label: 'Duyurular', route: '/(tabs)/announcements' as const, color: '#53B175' },
    { id: 2, icon: 'construct-outline' as const, label: 'Arızalar', route: '/(tabs)/maintenance' as const, color: '#F8A44C' },
    { id: 3, icon: 'cash-outline' as const, label: 'Ödemeler', route: '/(tabs)/payments' as const, color: '#3183F5' },
    { id: 4, icon: 'calendar-outline' as const, label: 'Rezervasyon', route: '/(tabs)/reservations' as const, color: '#A23FEB' },
  ];
  
  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Arama Bölümü */}
        <View style={styles.searchSection}>
          <Text style={styles.appTitle}>Apartman Yönetimi</Text>
          <Text style={styles.searchTitle}>Nasıl yardımcı olabiliriz?</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Arama yapın..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Servisler */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.servicesContainer}>
            {featuredServices.map((service) => (
              <TouchableOpacity 
                key={service.id}
                style={styles.serviceItem}
                onPress={() => router.push(service.route)}
              >
                <View style={[styles.serviceIconContainer, {backgroundColor: service.color}]}>
                  <Ionicons name={service.icon} size={24} color={Colors.white} />
                </View>
                <Text style={styles.serviceText}>{service.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Son Duyurular */}
        <View style={styles.dealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Duyurular</Text>
            <Text 
              style={styles.seeAllText}
              onPress={() => router.push('/(tabs)/announcements')}
            >
              Tümünü Gör
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {announcements.length > 0 ? (
              announcements.map((announcement: any, index) => (
                <TouchableOpacity 
                  key={announcement._id} 
                  style={styles.dealCard}
                  onPress={() => router.push({
                    pathname: '/(tabs)/announcements/[id]' as any,
                    params: { id: announcement._id }
                  })}
                >
                  <View style={[styles.dealImagePlaceholder, {backgroundColor: Colors.primary}]}>
                    <Ionicons name="newspaper-outline" size={36} color={Colors.white} />
                  </View>
                  <View style={styles.dealContent}>
                    <View style={styles.dealTitleRow}>
                      <Text style={styles.dealTitle} numberOfLines={1}>{announcement.title}</Text>
                      <View style={styles.ratingContainer}>
                        {announcement.priority === 'HIGH' && (
                          <View style={styles.priorityIcon}>
                            <Ionicons name="alert" size={12} color={Colors.white} />
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.dealLocation} numberOfLines={1}>
                      {format(new Date(announcement.createdAt), 'dd MMM yyyy', { locale: tr })}
                    </Text>
                    <Text style={styles.dealDesc} numberOfLines={2}>{announcement.content}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="alert-circle-outline" size={36} color="#999" />
                </View>
                <Text style={styles.emptyText}>Henüz duyuru bulunmuyor.</Text>
              </View>
            )}
          </ScrollView>
        </View>
        
        {/* Popüler Hizmetler */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Arıza Bildirimlerim</Text>
            <Text 
              style={styles.seeAllText}
              onPress={() => router.push('/(tabs)/maintenance')}
            >
              Tümünü Gör
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {maintenanceRequests.length > 0 ? (
              maintenanceRequests.map((request: any, index) => (
                <TouchableOpacity 
                  key={request._id} 
                  style={styles.dealCard}
                  onPress={() => router.push({
                    pathname: '/(tabs)/maintenance/[id]' as any,
                    params: { id: request._id }
                  })}
                >
                  <View style={[styles.dealImagePlaceholder, {backgroundColor: 
                    request.status === 'COMPLETED' ? Colors.success : 
                    request.status === 'IN_PROGRESS' ? Colors.warning : 
                    request.status === 'CANCELLED' ? Colors.error : Colors.info
                  }]}>
                    <Ionicons name="construct-outline" size={36} color={Colors.white} />
                  </View>
                  <View style={styles.dealContent}>
                    <View style={styles.dealTitleRow}>
                      <Text style={styles.dealTitle} numberOfLines={1}>{request.title}</Text>
                      <View style={styles.statusBadgeSmall}>
                        <Text style={styles.statusTextSmall}>
                          {request.status === 'COMPLETED' ? 'Tamamlandı' : 
                           request.status === 'IN_PROGRESS' ? 'İşlemde' : 
                           request.status === 'CANCELLED' ? 'İptal' : 'Bekliyor'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.dealLocation} numberOfLines={1}>
                      {format(new Date(request.createdAt), 'dd MMM yyyy', { locale: tr })}
                    </Text>
                    <Text style={styles.dealDesc} numberOfLines={2}>{request.description}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="construct-outline" size={36} color="#999" />
                </View>
                <Text style={styles.emptyText}>Henüz arıza bildiriminiz bulunmuyor.</Text>
              </View>
            )}
          </ScrollView>
        </View>
        
        {/* Hızlı İşlemler */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/(tabs)/maintenance/new' as any)}
            >
              <View style={[styles.actionIconContainer, {backgroundColor: Colors.warning}]}>
                <Ionicons name="build-outline" size={24} color={Colors.white} />
              </View>
              <Text style={styles.actionText}>Arıza Bildir</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/(tabs)/payments/new' as any)}
            >
              <View style={[styles.actionIconContainer, {backgroundColor: Colors.success}]}>
                <Ionicons name="card-outline" size={24} color={Colors.white} />
              </View>
              <Text style={styles.actionText}>Ödeme Yap</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/(tabs)/reservations/new' as any)}
            >
              <View style={[styles.actionIconContainer, {backgroundColor: '#9C27B0'}]}>
                <Ionicons name="calendar-outline" size={24} color={Colors.white} />
              </View>
              <Text style={styles.actionText}>Rezervasyon</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => Alert.alert('Yardım', 'Yardım almak için yönetici ile iletişime geçebilirsiniz.')}
            >
              <View style={[styles.actionIconContainer, {backgroundColor: Colors.info}]}>
                <Ionicons name="help-circle-outline" size={24} color={Colors.white} />
              </View>
              <Text style={styles.actionText}>Yardım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* BottomNav bileşenini kullan */}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    height: 35, // Sadece durum çubuğu için yer 
    backgroundColor: Colors.white,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.black,
  },
  contentContainer: {
    paddingBottom: 80,
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
  searchSection: {
    padding: 16,
    backgroundColor: Colors.white,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.black,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    height: '100%',
  },
  filterButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicesSection: {
    padding: 16,
    backgroundColor: Colors.white,
    marginTop: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.black,
  },
  servicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceItem: {
    alignItems: 'center',
    width: '23%',
  },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
    color: Colors.black,
    textAlign: 'center',
  },
  dealsSection: {
    padding: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  horizontalScrollContent: {
    paddingRight: 16,
  },
  dealCard: {
    width: 260,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dealImagePlaceholder: {
    height: 120,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealContent: {
    padding: 16,
  },
  dealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIcon: {
    backgroundColor: Colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  dealLocation: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  dealDesc: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 20,
    marginTop: 4,
  },
  emptyStateCard: {
    width: 260,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  popularSection: {
    padding: 16,
    marginTop: 8,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  statusTextSmall: {
    color: '#4a4a4a',
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    padding: 16,
    marginTop: 8,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '500',
  },
});
