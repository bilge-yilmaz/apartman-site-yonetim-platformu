import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, FAB } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

// Genişletilmiş MaintenanceRequest tipi
type MaintenanceRequest = {
  _id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  apartmentNo: string;
  block: string;
  createdBy?: string;
  assignedTo?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
};

// Örnek arıza bildirimleri
const SAMPLE_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
  {
    _id: '1',
    title: 'Su Borusu Sızıntısı',
    description: 'Mutfak lavabosunun altından su sızıyor. Acil müdahale gerekiyor.',
    status: 'PENDING',
    category: 'PLUMBING',
    priority: 'HIGH',
    apartmentNo: '101',
    block: 'A',
    createdBy: 'user123',
    assignedTo: 'technician456',
    createdAt: new Date('2025-04-25').toISOString(),
    updatedAt: new Date('2025-04-25').toISOString()
  },
  {
    _id: '2',
    title: 'Elektrik Kesintisi',
    description: 'Dairemizde elektrik kesintisi yaşanıyor. Sigorta atıyor.',
    status: 'IN_PROGRESS',
    category: 'ELECTRICAL',
    priority: 'URGENT',
    apartmentNo: '202',
    block: 'B',
    createdBy: 'user789',
    assignedTo: 'technician456',
    createdAt: new Date('2025-04-26').toISOString(),
    updatedAt: new Date('2025-04-26').toISOString()
  },
  {
    _id: '3',
    title: 'Asansör Arızası',
    description: 'B blok asansörü çalışmıyor.',
    status: 'COMPLETED',
    category: 'ELEVATOR',
    priority: 'MEDIUM',
    apartmentNo: '',
    block: 'B',
    createdBy: 'admin',
    assignedTo: 'technician789',
    createdAt: new Date('2025-04-20').toISOString(),
    updatedAt: new Date('2025-04-22').toISOString()
  }
];

// AsyncStorage anahtarı
const MAINTENANCE_STORAGE_KEY = 'maintenance_requests';

export default function MaintenanceScreen() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Arıza bildirimlerini getir
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      console.log('Arıza bildirimleri getiriliyor...');
      
      // AsyncStorage'dan arıza bildirimlerini al
      const storedData = await AsyncStorage.getItem(MAINTENANCE_STORAGE_KEY);
      
      if (storedData) {
        // Eğer kayıtlı veri varsa, onu kullan
        const parsedData = JSON.parse(storedData);
        console.log('AsyncStorage\'dan', parsedData.length, 'arıza bildirimi alındı');
        setRequests(parsedData);
      } else {
        // Kayıtlı veri yoksa, örnek verileri kullan
        console.log('Örnek arıza bildirimleri kullanılıyor');
        setRequests(SAMPLE_MAINTENANCE_REQUESTS);
        // Örnek verileri AsyncStorage'a kaydet
        await AsyncStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(SAMPLE_MAINTENANCE_REQUESTS));
      }
    } catch (error) {
      console.error('Arıza bildirimleri alınırken hata:', error);
      // Hata durumunda örnek verileri kullan
      setRequests(SAMPLE_MAINTENANCE_REQUESTS);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Arıza bildirimini iptal et
  const cancelRequest = async (id: string) => {
    try {
      console.log('Arıza bildirimi iptal ediliyor:', id);
      
      // Arıza bildirimini bul ve durumunu güncelle
      const updatedRequests = requests.map(request => 
        request._id === id 
          ? { ...request, status: 'CANCELLED' as const, updatedAt: new Date().toISOString() }
          : request
      );
      
      // Güncellenmiş listeyi ayarla
      setRequests(updatedRequests);
      
      // AsyncStorage'a kaydet
      await AsyncStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(updatedRequests));
      
      return true;
    } catch (error) {
      console.error('Arıza bildirimi iptal edilirken hata:', error);
      return false;
    }
  };

  // Sayfa ilk yüklenirken arıza bildirimlerini getir
  useEffect(() => {
    console.log('Arıza bildirimleri ekranı yüklendi');
    fetchRequests();
  }, []);
  
  // Sayfa focus olduğunda arıza bildirimlerini yeniden getir
  useFocusEffect(
    useCallback(() => {
      console.log('Arıza bildirimleri ekranı focus oldu');
      fetchRequests();
      return () => {
        console.log('Arıza bildirimleri ekranı focus kaybetti');
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleCancel = async (item: MaintenanceRequest) => {
    try {
      Alert.alert(
        'İptal Onayı',
        `"${item.title}" başlıklı arıza bildirimini iptal etmek istediğinize emin misiniz?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'İptal Et',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              
              // Arıza bildirimini güncelle
              const updatedRequests = requests.map(req =>
                req._id === item._id
                  ? { ...req, status: 'CANCELLED' as const, updatedAt: new Date().toISOString() }
                  : req
              );
              
              // AsyncStorage'a kaydet
              await AsyncStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(updatedRequests));
              
              // State'i güncelle
              setRequests(updatedRequests);
              setIsLoading(false);
              
              Alert.alert('Başarılı', 'Arıza bildirimi iptal edildi.');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Arıza bildirimi iptal edilirken hata:', error);
      setIsLoading(false);
      Alert.alert('Hata', 'Arıza bildirimi iptal edilirken bir hata oluştu.');
    }
  };

  // İptal edilen arıza bildirimlerini sil
  const handleDeleteCancelled = async () => {
    // İptal edilmiş arıza bildirimleri var mı kontrol et
    const cancelledRequests = requests.filter(req => req.status === 'CANCELLED');
    
    if (cancelledRequests.length === 0) {
      Alert.alert('Bilgi', 'İptal edilmiş arıza bildirimi bulunmuyor.');
      return;
    }
    
    Alert.alert(
      'İptal Edilenleri Sil',
      `${cancelledRequests.length} adet iptal edilmiş arıza bildirimini silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            
            // İptal edilmemiş arıza bildirimlerini filtrele
            const filteredRequests = requests.filter(req => req.status !== 'CANCELLED');
            
            // AsyncStorage'a kaydet
            await AsyncStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(filteredRequests));
            
            // State'i güncelle
            setRequests(filteredRequests);
            setIsLoading(false);
            
            Alert.alert('Başarılı', `${cancelledRequests.length} adet iptal edilmiş arıza bildirimi silindi.`);
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return '#4CAF50';
      case 'MEDIUM':
        return '#FFC107';
      case 'HIGH':
        return '#FF9800';
      case 'URGENT':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Düşük';
      case 'MEDIUM':
        return 'Orta';
      case 'HIGH':
        return 'Yüksek';
      case 'URGENT':
        return 'Acil';
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFC107';
      case 'IN_PROGRESS':
        return '#2196F3';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#757575';
      default:
        return '#757575';
    }
  };

    const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Bekliyor';
      case 'IN_PROGRESS':
        return 'İşlemde';
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return status;
    }
  };
  
  // Kategori adını Türkçe'ye çevirme
  const getCategoryText = (category?: string) => {
    if (!category) return '';
    
    switch (category.toUpperCase()) {
      case 'PLUMBING': return 'Su Tesisatı';
      case 'ELECTRICAL': return 'Elektrik';
      case 'ELEVATOR': return 'Asansör';
      case 'HEATING': return 'Isıtma';
      case 'GENERAL': return 'Genel';
      default: return category;
    }
  };

  // Filter maintenance requests based on active tab
  const activeRequests = requests.filter(
    req => req.status === 'PENDING' || req.status === 'IN_PROGRESS'
  );
  
  const completedRequests = requests.filter(
    req => req.status === 'COMPLETED' || req.status === 'CANCELLED'
  );

  const displayRequests = activeTab === 'active' ? activeRequests : completedRequests;

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arızalar</Text>
      </View>
      
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Arıza Bildirimleri</Text>
            <Text style={styles.subtitle}>Site içerisindeki arızaları bildirebilirsiniz</Text>
          </View>
          <Button 
            mode="contained" 
            onPress={() => router.push('/maintenance/create')}
            style={styles.newButton}
            labelStyle={{ fontWeight: '600' }}
            icon="plus"
          >
            Yeni
          </Button>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'active' && styles.activeTab]} 
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              <Ionicons 
                name="construct-outline" 
                size={16} 
                color={activeTab === 'active' ? '#fff' : '#7f8c8d'} 
              /> Aktif ({activeRequests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]} 
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={16} 
                color={activeTab === 'completed' ? '#fff' : '#7f8c8d'} 
              /> Tamamlananlar ({completedRequests.length})
            </Text>
          </TouchableOpacity>
        </View>
      
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Arıza bildirimleri yükleniyor...</Text>
          </View>
        ) : displayRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="construct-outline" size={36} color="#999" />
            </View>
            <Text style={styles.emptyTitle}>Arıza Bildiriminiz Yok</Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'active' 
                ? 'Aktif arıza bildiriminiz bulunmuyor.' 
                : 'Tamamlanan arıza bildiriminiz bulunmuyor.'}
            </Text>
            <Button 
              mode="contained" 
              onPress={() => router.push('/maintenance/create')}
              style={styles.createButton}
              icon="plus"
            >
              Arıza Bildirimi Oluştur
            </Button>
          </View>
        ) : (
          <View style={styles.maintenanceContainer}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'active' ? 'Aktif Arıza Bildirimlerim' : 'Tamamlanan Arıza Bildirimlerim'}
            </Text>
            {displayRequests.map(item => {
              // Get color based on status
              let borderColor;
              switch(item.status) {
                case 'PENDING':
                  borderColor = Colors.warning;
                  break;
                case 'IN_PROGRESS':
                  borderColor = Colors.info;
                  break;
                case 'COMPLETED':
                  borderColor = Colors.success;
                  break;
                case 'CANCELLED':
                  borderColor = Colors.error;
                  break;
                default:
                  borderColor = Colors.lightGray;
              }
              
              return (
                <Card 
                  key={item._id} 
                  style={[styles.maintenanceCard, { borderLeftColor: borderColor }]}
                  mode="elevated"
                >
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Chip 
                        mode="flat"
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor: 
                              item.status === 'COMPLETED' ? Colors.success :
                              item.status === 'IN_PROGRESS' ? Colors.info :
                              item.status === 'CANCELLED' ? Colors.error : Colors.warning
                          }
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {item.status === 'COMPLETED' ? 'Tamamlandı' :
                           item.status === 'IN_PROGRESS' ? 'İşlemde' :
                           item.status === 'CANCELLED' ? 'İptal Edildi' : 'Bekliyor'}
                        </Text>
                      </Chip>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <Text style={styles.description}>{item.description}</Text>
                    
                    <View style={styles.detailRow}>
                      <View style={styles.detail}>
                        <MaterialIcons name="location-on" size={18} color={Colors.primary} />
                        <Text style={styles.detailText}>
                          {item.block || '-'}-{item.apartmentNo || '-'}
                        </Text>
                      </View>
                      
                      <View style={styles.detail}>
                        <MaterialIcons name="date-range" size={18} color={Colors.primary} />
                        <Text style={styles.detailText}>
                          {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: tr })}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.tagsRow}>
                      {/* Öncelik etiketi */}
                      <Chip 
                        mode="flat"
                        style={[
                          styles.priorityChip,
                          {
                            backgroundColor: 
                              item.priority === 'URGENT' ? '#F44336' :
                              item.priority === 'HIGH' ? '#FF9800' :
                              item.priority === 'MEDIUM' ? '#2196F3' : '#4CAF50'
                          }
                        ]}
                      >
                        <Text style={styles.chipText}>
                          Öncelik: {item.priority === 'URGENT' ? 'Acil' :
                                    item.priority === 'HIGH' ? 'Yüksek' :
                                    item.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                        </Text>
                      </Chip>
                      
                      {/* Kategori etiketi */}
                      {item.category && (
                        <Chip 
                          mode="outlined" 
                          style={styles.categoryChip}
                        >
                          <Text style={styles.categoryText}>{getCategoryText(item.category)}</Text>
                        </Chip>
                      )}
                    </View>
                    
                    {item.status === 'PENDING' && (
                      <Button 
                        mode="outlined" 
                        onPress={() => handleCancel(item)}
                        style={styles.cancelButton}
                        icon="close"
                      >
                        İptal Et
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              );
            })}
            
            {activeTab === 'completed' && completedRequests.filter(req => req.status === 'CANCELLED').length > 0 && (
              <Button 
                mode="text" 
                onPress={handleDeleteCancelled}
                style={styles.deleteButton}
                icon="delete-sweep"
                textColor={Colors.error}
              >
                İptal Edilenleri Sil
              </Button>
            )}
          </View>
        )}
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push('/maintenance/create')}
        color="white"
      />
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    marginTop: 6,
    marginBottom: 12,
  },
  newButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
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
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 4,
    backgroundColor: Colors.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eee',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: '#7f8c8d',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  maintenanceContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2c3e50',
  },
  maintenanceCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderLeftWidth: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
  },
  headerContainer: {
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    marginVertical: 8,
    alignSelf: 'center',
  },
  deleteButtonLabel: {
    fontSize: 12,
    color: '#F44336',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // FAB için alan bırak
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    color: '#333',
  },
  statusChip: {
    height: 28,
    borderRadius: 14,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
    lineHeight: 22,
  },
  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
    gap: 8,
  },
  priorityChip: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  chipText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChip: {
    height: 32,
    borderRadius: 16,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
  },
  categoryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    marginTop: 12,
    borderColor: Colors.error,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 65,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    elevation: 6,
  },
});
