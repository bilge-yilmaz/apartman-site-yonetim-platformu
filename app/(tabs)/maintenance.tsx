import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, FAB } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useMaintenanceStore, MaintenanceRequest } from '../../store/maintenance';

export default function MaintenanceScreen() {
  const { 
    requests, 
    isLoading, 
    error, 
    fetchRequests, 
    cancelRequest 
  } = useMaintenanceStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Sayfa ilk yüklenirken arıza bildirimlerini getir
  useEffect(() => {
    console.log('🔧 Arıza bildirimleri ekranı yüklendi');
    fetchRequests();
  }, []);
  
  // Requests state'ini izle
  useEffect(() => {
    console.log('📊 Maintenance requests state değişti:');
    console.log('📋 Toplam arıza sayısı:', requests.length);
    console.log('📋 Arıza verileri:', JSON.stringify(requests, null, 2));
  }, [requests]);
  
  // Sayfa focus olduğunda arıza bildirimlerini yeniden getir
  useFocusEffect(
    useCallback(() => {
      console.log('🔧 Arıza bildirimleri ekranı focus oldu');
      fetchRequests();
      return () => {
        console.log('🔧 Arıza bildirimleri ekranı focus kaybetti');
      };
    }, [])
  );

  const onRefresh = async () => {
    console.log('🔄 Arıza bildirimleri yenileniyor...');
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
    console.log('✅ Arıza bildirimleri yenilendi');
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
              try {
                await cancelRequest(item._id);
              Alert.alert('Başarılı', 'Arıza bildirimi iptal edildi.');
              } catch (error) {
                console.error('Arıza bildirimi iptal edilirken hata:', error);
                Alert.alert('Hata', 'Arıza bildirimi iptal edilirken bir hata oluştu.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Arıza bildirimi iptal edilirken hata:', error);
      Alert.alert('Hata', 'Arıza bildirimi iptal edilirken bir hata oluştu.');
    }
  };

  const getCategoryText = (category?: string) => {
    switch (category) {
      case 'PLUMBING': return 'Tesisatçı';
      case 'ELECTRICAL': return 'Elektrikçi';
      case 'HVAC': return 'Klima/Isıtma';
      case 'STRUCTURAL': return 'Yapısal';
      case 'ELEVATOR': return 'Asansör';
      case 'OTHER': return 'Diğer';
      default: return 'Belirtilmemiş';
    }
  };

  // Aktif ve tamamlanan istekleri filtrele
  const activeRequests = requests.filter(req => 
    req.status === 'PENDING' || req.status === 'IN_PROGRESS'
  );
  const completedRequests = requests.filter(req => 
    req.status === 'COMPLETED' || req.status === 'CANCELLED'
  );

  const displayRequests = activeTab === 'active' ? activeRequests : completedRequests;

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arızalar</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.contentHeader}>
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

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Hata: {error}</Text>
            <Button mode="outlined" onPress={fetchRequests}>
              Tekrar Dene
            </Button>
          </View>
        )}
      
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
                          {item.apartmentNo || '-'}
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
          </View>
        )}
      </ScrollView>
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/maintenance/create')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    height: 44,
    backgroundColor: Colors.primary,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  newButton: {
    backgroundColor: Colors.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#fff',
  },
  errorContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  maintenanceContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  maintenanceCard: {
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  divider: {
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  priorityChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  categoryChip: {
    height: 28,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.primary,
  },
  cancelButton: {
    borderColor: Colors.error,
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});
