import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Image } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, FAB } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const renderRequestItem = ({ item }: { item: MaintenanceRequest }) => (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Chip 
            mode="flat"
            style={[
              styles.statusChip,
              {
                backgroundColor: 
                  item.status === 'COMPLETED' ? '#4CAF50' :
                  item.status === 'IN_PROGRESS' ? '#FF9800' :
                  item.status === 'CANCELLED' ? '#F44336' : '#2196F3'
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
        
        <Text style={styles.description}>{item.description}</Text>
        
        <Divider style={styles.divider} />
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Daire:</Text>
            <Text style={styles.infoValue}>{item.block}-{item.apartmentNo}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tarih:</Text>
            <Text style={styles.infoValue}>
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

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Arıza bildirimleri yükleniyor...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image 
            source={{ uri: 'https://img.icons8.com/fluency/240/000000/maintenance.png' }} 
            style={styles.emptyImage} 
          />
          <Text style={styles.emptyTitle}>Arıza Bildiriminiz Yok</Text>
          <Text style={styles.emptyText}>Henüz arıza bildiriminiz bulunmuyor. Yeni bir arıza bildirimi oluşturmak için aşağıdaki butonu kullanabilirsiniz.</Text>
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
        <>
          <FlatList
            data={requests}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => renderRequestItem({ item })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0066cc']}
              />
            }
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.headerContainer}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>Arıza Bildirimlerim</Text>
                  <Button 
                    mode="text" 
                    onPress={handleDeleteCancelled}
                    style={styles.deleteButton}
                    icon="delete-sweep"
                    labelStyle={styles.deleteButtonLabel}
                  >
                    İptal Edilenleri Sil
                  </Button>
                </View>
                <Text style={styles.headerSubtitle}>{requests.length} adet arıza bildirimi</Text>
              </View>
            }
          />
          
          <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => router.push('/maintenance/create')}
            color="white"
          />
        </>
      )}
    </View>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 24,
    elevation: 4,
    backgroundColor: '#0066cc',
  },
  headerContainer: {
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
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
    marginVertical: 0,
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
    borderColor: '#0066cc',
    paddingHorizontal: 8,
  },
  categoryText: {
    color: '#0066cc',
    fontSize: 13,
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    marginTop: 12,
    borderColor: '#F44336',
    borderRadius: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066cc',
    borderRadius: 28,
    elevation: 6,
  },
});
