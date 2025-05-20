import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, DataTable, Button, FAB, Searchbar, Chip, Menu, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';

// Arıza talebi tipi
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

export default function AdminMaintenanceScreen() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useUserStore();

  // Örnek veriler
  const sampleRequests: MaintenanceRequest[] = [
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
    },
    {
      _id: '4',
      title: 'Kapı Kilidi Arızası',
      description: 'Daire kapısının kilidi düzgün çalışmıyor.',
      status: 'PENDING',
      category: 'GENERAL',
      priority: 'MEDIUM',
      apartmentNo: '202',
      block: 'B',
      createdBy: 'user456',
      createdAt: new Date('2025-04-27').toISOString(),
      updatedAt: new Date('2025-04-27').toISOString()
    },
    {
      _id: '5',
      title: 'Banyo Musluğu Tamiri',
      description: 'Banyo musluğu su damlatıyor.',
      status: 'COMPLETED',
      category: 'PLUMBING',
      priority: 'LOW',
      apartmentNo: '301',
      block: 'C',
      createdBy: 'user789',
      assignedTo: 'technician123',
      createdAt: new Date('2025-04-18').toISOString(),
      updatedAt: new Date('2025-04-20').toISOString()
    }
  ];

  // Yetki kontrolü
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.replace('/auth/login');
    }
  }, [user]);

  // Verileri yükle
  useEffect(() => {
    loadRequests();
  }, []);

  // Filtreleme
  useEffect(() => {
    filterRequests();
  }, [statusFilter, searchQuery, requests]);

  const loadRequests = () => {
    // Gerçek uygulamada API'den veriler çekilir
    setRequests(sampleRequests);
  };

  const filterRequests = () => {
    let filtered = [...requests];
    
    // Status filtreleme
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    // Arama filtreleme
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        request =>
          request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.apartmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.block.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredRequests(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
    setRefreshing(false);
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const openMenu = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleEditRequest = () => {
    closeMenu();
    // Düzenleme sayfasına yönlendirme yapılacak
    console.log('Düzenle:', selectedRequest);
  };

  const handleDeleteRequest = () => {
    closeMenu();
    // Silme işlemi yapılacak
    console.log('Sil:', selectedRequest);
  };

  const handleUpdateStatus = (newStatus: MaintenanceRequest['status']) => {
    closeMenu();
    // Durum güncelleme işlemi yapılacak
    console.log('Durum güncelleme:', selectedRequest, newStatus);
  };

  const getStatusChip = (status: MaintenanceRequest['status']) => {
    let color = '';
    let text = '';

    switch (status) {
      case 'PENDING':
        color = Colors.warning;
        text = 'Bekliyor';
        break;
      case 'IN_PROGRESS':
        color = Colors.info;
        text = 'İşlemde';
        break;
      case 'COMPLETED':
        color = Colors.success;
        text = 'Tamamlandı';
        break;
      case 'CANCELLED':
        color = Colors.error;
        text = 'İptal';
        break;
      default:
        color = Colors.lightGray;
        text = status;
    }

    return (
      <Chip 
        mode="flat"
        style={{
          backgroundColor: color,
        }}
        textStyle={{ color: 'white', fontSize: 12 }}
      >
        {text}
      </Chip>
    );
  };

  const getPriorityChip = (priority: MaintenanceRequest['priority']) => {
    let color = '';
    let text = '';

    switch (priority) {
      case 'URGENT':
        color = Colors.error;
        text = 'Acil';
        break;
      case 'HIGH':
        color = '#FF9800';
        text = 'Yüksek';
        break;
      case 'MEDIUM':
        color = Colors.warning;
        text = 'Orta';
        break;
      case 'LOW':
        color = Colors.success;
        text = 'Düşük';
        break;
      default:
        color = Colors.lightGray;
        text = priority;
    }

    return (
      <Chip 
        mode="flat"
        style={{
          backgroundColor: color,
        }}
        textStyle={{ color: 'white', fontSize: 12 }}
      >
        {text}
      </Chip>
    );
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

  // İstatistikler
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const inProgressRequests = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const completedRequests = requests.filter(r => r.status === 'COMPLETED').length;

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bakım Talepleri</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Bakım Talepleri</Text>
          <Text style={styles.subtitle}>Tüm bakım ve arıza taleplerini görüntüleyin ve yönetin.</Text>
          
          {/* Özet Kartları */}
          <View style={styles.summaryContainer}>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryLabel}>Toplam</Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>{totalRequests}</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryLabel}>Bekleyen</Text>
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>{pendingRequests}</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryLabel}>İşlemde</Text>
                <Text style={[styles.summaryValue, { color: Colors.info }]}>{inProgressRequests}</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryLabel}>Tamamlanan</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>{completedRequests}</Text>
              </Card.Content>
            </Card>
          </View>
          
          {/* Filtreler */}
          <View style={styles.filterContainer}>
            <Searchbar
              placeholder="Ara..."
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchBar}
            />
            
            <SegmentedButtons
              value={statusFilter}
              onValueChange={setStatusFilter}
              buttons={[
                { value: 'all', label: 'Tümü' },
                { value: 'PENDING', label: 'Bekleyen' },
                { value: 'IN_PROGRESS', label: 'İşlemde' },
                { value: 'COMPLETED', label: 'Tamamlanan' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          {/* Talepler */}
          {filteredRequests.map((request) => (
            <Card 
              key={request._id} 
              style={[
                styles.card, 
                { 
                  borderLeftWidth: 5,
                  borderLeftColor: 
                    request.priority === 'URGENT' ? Colors.error :
                    request.priority === 'HIGH' ? '#FF9800' :
                    request.priority === 'MEDIUM' ? Colors.warning : 
                    Colors.success
                }
              ]}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle}>{request.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => openMenu(request)}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.chipRow}>
                  {getStatusChip(request.status)}
                  {getPriorityChip(request.priority)}
                  <Chip mode="outlined" style={styles.categoryChip}>
                    {getCategoryText(request.category)}
                  </Chip>
                </View>
                
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {request.description}
                </Text>
                
                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="location-on" size={16} color={Colors.primary} />
                    <Text style={styles.detailText}>{request.block}-{request.apartmentNo || 'Ortak Alan'}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <MaterialIcons name="date-range" size={16} color={Colors.primary} />
                    <Text style={styles.detailText}>
                      {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardActions}>
                  <Button 
                    mode="text" 
                    onPress={() => console.log('Detay:', request._id)}
                    icon="eye"
                  >
                    Detaylar
                  </Button>
                  
                  {request.status === 'PENDING' && (
                    <Button 
                      mode="text" 
                      onPress={() => handleUpdateStatus('IN_PROGRESS')}
                      icon="play"
                      textColor={Colors.info}
                    >
                      İşleme Al
                    </Button>
                  )}
                  
                  {request.status === 'IN_PROGRESS' && (
                    <Button 
                      mode="text" 
                      onPress={() => handleUpdateStatus('COMPLETED')}
                      icon="check"
                      textColor={Colors.success}
                    >
                      Tamamla
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => console.log('Yeni talep ekle')}
        color="white"
      />

      {selectedRequest && (
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={{ x: 0, y: 0 }} // Bu değerler kullanıcı tıklamasına göre güncellenecek
        >
          <Menu.Item 
            onPress={handleEditRequest} 
            title="Düzenle" 
            leadingIcon="pencil" 
          />
          {selectedRequest.status === 'PENDING' && (
            <Menu.Item 
              onPress={() => handleUpdateStatus('IN_PROGRESS')} 
              title="İşleme Al" 
              leadingIcon="play" 
            />
          )}
          {selectedRequest.status === 'IN_PROGRESS' && (
            <Menu.Item 
              onPress={() => handleUpdateStatus('COMPLETED')} 
              title="Tamamlandı İşaretle" 
              leadingIcon="check" 
            />
          )}
          <Menu.Item 
            onPress={handleDeleteRequest} 
            title="Sil" 
            leadingIcon="delete" 
          />
        </Menu>
      )}
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
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    borderColor: Colors.primary,
  },
  cardDescription: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
}); 