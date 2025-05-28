import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Alert, 
  TextInput,
  Dimensions,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Avatar, 
  Divider, 
  ActivityIndicator, 
  Surface, 
  IconButton,
  Badge
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { useUserStore } from '../../store/user';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useAnnouncementsStore } from '../../store/announcementsStore';
import { useMaintenanceStore } from '../../store/maintenance';
import { useSocket } from '../../hooks/useSocket';
import { Announcement } from '../../services/api';
import { MaintenanceRequest } from '../../store/maintenance';
import { checkNetworkConnection } from '../../services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  
  // Socket bağlantısı
  const { isConnected, error: socketError, notifications, unreadCount } = useSocket();
  
  // Store'ları bağla
  const { 
    announcements, 
    fetchAnnouncements, 
    isLoading: announcementsLoading,
    error: announcementsError 
  } = useAnnouncementsStore();
  
  const { 
    requests: maintenanceRequests, 
    fetchRequests: fetchMaintenanceRequests,
    isLoading: maintenanceLoading,
    error: maintenanceError
  } = useMaintenanceStore();
  
  // Network durumu kontrol
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkNetworkConnection();
      setIsOnline(connected);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Hata göstergesi
  useEffect(() => {
    if (announcementsError || maintenanceError || socketError) {
      console.warn('API Hataları:', { announcementsError, maintenanceError, socketError });
    }
  }, [announcementsError, maintenanceError, socketError]);
  
  // Verileri yükle
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const connected = await checkNetworkConnection();
      if (!connected) {
        setIsOnline(false);
        return;
      }
      
      setIsOnline(true);
      
      await Promise.allSettled([
        fetchAnnouncements({ isActive: true }),
        fetchMaintenanceRequests()
      ]);
      
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAnnouncements, fetchMaintenanceRequests]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {};
    }, [loadData])
  );
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);
  
  // Hızlı erişim servisleri
  const quickServices = [
    { 
      id: 1, 
      icon: 'megaphone-outline', 
      label: 'Duyurular', 
      route: '/(tabs)/announcements',
      color: Colors.primary,
      count: announcements?.length || 0
    },
    { 
      id: 2, 
      icon: 'construct-outline', 
      label: 'Bakım', 
      route: '/(tabs)/maintenance',
      color: '#f59e0b',
      count: maintenanceRequests?.filter(req => req.status === 'PENDING').length || 0
    },
    { 
      id: 3, 
      icon: 'cash-outline', 
      label: 'Ödemeler', 
      route: '/(tabs)/payments',
      color: '#10b981',
      count: 0
    },
    { 
      id: 4, 
      icon: 'calendar-outline', 
      label: 'Rezervasyon', 
      route: '/(tabs)/reservations',
      color: '#8b5cf6',
      count: 0
    },
  ];
  
  // Son duyurular
  const recentAnnouncements = [...(announcements || [])]
    .sort((a: Announcement, b: Announcement) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);
  
  // Son bakım talepleri
  const recentMaintenanceRequests = [...(maintenanceRequests || [])]
    .sort((a: MaintenanceRequest, b: MaintenanceRequest) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);
  
  // Offline durumu
  if (!isOnline) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.offlineContainer}>
          <Ionicons name="wifi-outline" size={64} color="#6b7280" />
          <Text style={styles.offlineTitle}>Bağlantı Yok</Text>
          <Text style={styles.offlineText}>
            İnternet bağlantınızı kontrol edin ve tekrar deneyin
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Yükleniyor durumu
  if (loading && (announcementsLoading || maintenanceLoading)) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Merhaba,</Text>
            <Text style={styles.headerName}>{user?.name || 'Kullanıcı'}</Text>
            <Text style={styles.headerSubtitle}>
              {user?.apartmentNo ? `Daire ${user.apartmentNo}` : 'Apartman Sakinı'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={24} color="#374151" />
              {unreadCount > 0 && (
                <Badge style={styles.notificationBadge}>{unreadCount}</Badge>
              )}
            </TouchableOpacity>
            <View style={styles.connectionStatus}>
              <Ionicons 
                name={isConnected ? "wifi" : "wifi-outline"} 
                size={20} 
                color={isConnected ? "#10b981" : "#ef4444"} 
              />
            </View>
          </View>
        </View>
      </View>
      
    <ScrollView 
        style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
      }
        showsVerticalScrollIndicator={false}
    >
        {/* Arama Bölümü */}
        <View style={styles.searchSection}>
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
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.filterButtonGradient}
              >
                <Ionicons name="options-outline" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Hızlı Erişim */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.servicesGrid}>
            {quickServices.map((service) => (
              <TouchableOpacity 
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push(service.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
                  <Ionicons name={service.icon as any} size={24} color="white" />
                  {service.count > 0 && (
                    <Badge style={styles.serviceBadge}>{service.count}</Badge>
                  )}
                </View>
                <Text style={styles.serviceLabel}>{service.label}</Text>
        </TouchableOpacity>
            ))}
          </View>
      </View>
      
      {/* Son Duyurular */}
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Duyurular</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
        </View>
        
            {recentAnnouncements.length > 0 ? (
            <View style={styles.announcementsList}>
              {recentAnnouncements.map((announcement: Announcement) => (
                <TouchableOpacity 
                  key={announcement._id} 
                  style={styles.announcementCard}
                  onPress={() => router.push({
                    pathname: '/(tabs)/announcements',
                    params: { selectedId: announcement._id }
                  })}
                  activeOpacity={0.7}
                >
                  <Card style={styles.card}>
                    <Card.Content>
                      <View style={styles.cardHeader}>
                        <View style={styles.priorityBadge}>
                          <Text style={styles.priorityText}>
                            {announcement.priority === 'URGENT' ? 'ACİL' : 'NORMAL'}
                          </Text>
                  </View>
                        <Text style={styles.cardDate}>
                          {format(new Date(announcement.createdAt), 'dd MMM', { locale: tr })}
                    </Text>
                  </View>
                      <Title style={styles.cardTitle} numberOfLines={2}>
                        {announcement.title}
                      </Title>
                      <Paragraph style={styles.cardContent} numberOfLines={3}>
                        {announcement.content}
                      </Paragraph>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
        ) : (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>Henüz duyuru bulunmuyor</Text>
              </View>
        )}
        </View>
        
        {/* Son Bakım Talepleri */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Bakım Talepleri</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/maintenance')}>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
            {recentMaintenanceRequests.length > 0 ? (
            <View style={styles.maintenanceList}>
              {recentMaintenanceRequests.map((request: MaintenanceRequest) => (
                <TouchableOpacity 
                  key={request._id} 
                  style={styles.maintenanceCard}
                  onPress={() => router.push({
                    pathname: '/(tabs)/maintenance',
                    params: { selectedId: request._id }
                  })}
                  activeOpacity={0.7}
                >
                  <Card style={styles.card}>
                    <Card.Content>
                      <View style={styles.maintenanceHeader}>
                  <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(request.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {getStatusText(request.status)}
                          </Text>
                  </View>
                        <Text style={styles.cardDate}>
                          {format(new Date(request.createdAt), 'dd/MM', { locale: tr })}
                        </Text>
                      </View>
                      <Title style={styles.cardTitle} numberOfLines={1}>
                        {request.title}
                      </Title>
                      <Paragraph style={styles.cardContent} numberOfLines={2}>
                        {request.description}
                      </Paragraph>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
            ) : (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>Henüz bakım talebi bulunmuyor</Text>
              </View>
        )}
      </View>
      </ScrollView>
      </View>
  );
}

// Yardımcı fonksiyonlar
const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return '#f59e0b';
    case 'IN_PROGRESS': return '#3b82f6';
    case 'COMPLETED': return '#10b981';
    case 'CANCELLED': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Bekliyor';
    case 'IN_PROGRESS': return 'Devam Ediyor';
    case 'COMPLETED': return 'Tamamlandı';
    case 'CANCELLED': return 'İptal';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  headerName: {
    fontSize: 24,
    color: '#111827',
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
  },
  connectionStatus: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    marginTop: -10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    marginLeft: 12,
  },
  filterButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 60) / 2,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  serviceBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    marginBottom: 8,
  },
  maintenanceList: {
    gap: 12,
  },
  maintenanceCard: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  cardDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  offlineTitle: {
    color: '#374151',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  offlineText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
