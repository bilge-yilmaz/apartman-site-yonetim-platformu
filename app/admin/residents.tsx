import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, DataTable, Button, FAB, Searchbar, Chip, IconButton, Menu, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import AdminPageGuard from '../../components/AdminPageGuard';
import { apiServices } from '../../utils/api-services';

// Sakin tipi
interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  block: string;
  apartmentNo: string;
  role: string;
  isActive: boolean;
}

export default function AdminResidentsScreen() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const { user } = useUserStore();

  // Yetki kontrolü
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.replace('/auth/login');
    }
  }, [user]);

  // Verileri yükle
  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = async () => {
    try {
      setError(null);
      // API'den sakinleri getir
      const residentsData = await apiServices.admin.residents.getAll();
      setResidents(residentsData);
      setFilteredResidents(residentsData);
    } catch (err) {
      console.error('Site sakinleri alınırken hata:', err);
      setError('Site sakinleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResidents();
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredResidents(residents);
    } else {
      const filtered = residents.filter(
        resident =>
          resident.name.toLowerCase().includes(query.toLowerCase()) ||
          resident.email.toLowerCase().includes(query.toLowerCase()) ||
          resident.apartmentNo?.toLowerCase().includes(query.toLowerCase()) ||
          resident.block?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResidents(filtered);
    }
  };

  const openMenu = (resident: Resident, event: any) => {
    // Menu pozisyonu için event.nativeEvent.pageX ve pageY kullanılabilir
    // Ancak bu örnek için basit bir pozisyon kullanıyoruz
    setSelectedResident(resident);
    setMenuPosition({
      x: event.nativeEvent ? event.nativeEvent.pageX - 100 : 0,
      y: event.nativeEvent ? event.nativeEvent.pageY : 0
    });
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleEditResident = () => {
    closeMenu();
    // Düzenleme sayfasına yönlendirme yapılacak
    console.log('Düzenle:', selectedResident);
    Alert.alert('Bilgi', 'Düzenleme işlevi yakında eklenecek.');
  };

  const handleToggleStatus = async () => {
    if (!selectedResident) return;
    
    closeMenu();
    try {
      const result = await apiServices.admin.residents.toggleActiveStatus(selectedResident.id);
      
      if (result.success) {
        // Statüsü değişen kullanıcıyı güncelle
        const updatedResidents = residents.map(r => 
          r.id === selectedResident.id 
            ? { ...r, isActive: !r.isActive } 
            : r
        );
        
        setResidents(updatedResidents);
        setFilteredResidents(
          searchQuery.trim() === '' 
            ? updatedResidents 
            : updatedResidents.filter(
                r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     r.apartmentNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     r.block?.toLowerCase().includes(searchQuery.toLowerCase())
              )
        );
        
        Alert.alert('Başarılı', `Kullanıcı durumu ${!selectedResident.isActive ? 'aktif' : 'pasif'} olarak değiştirildi.`);
      } else {
        Alert.alert('Hata', result.message || 'Kullanıcı durumu değiştirilemedi.');
      }
    } catch (error) {
      console.error('Statü değiştirme hatası:', error);
      Alert.alert('Hata', 'Kullanıcı durumu değiştirilirken bir hata oluştu.');
    }
  };

  return (
    <AdminPageGuard>
      <View style={styles.container}>
        <View style={styles.safeArea} />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Site Sakinleri</Text>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Site sakinleri yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={loadResidents}
              style={styles.retryButton}
            >
              Tekrar Dene
            </Button>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[Colors.primary]} 
              />
            }
          >
            <View style={styles.content}>
              <Text style={styles.title}>Site Sakinleri</Text>
              <Text style={styles.subtitle}>Tüm site sakinlerini görüntüleyin ve yönetin.</Text>
              
              <Searchbar
                placeholder="Ara..."
                onChangeText={onChangeSearch}
                value={searchQuery}
                style={styles.searchBar}
              />
              
              {filteredResidents.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'Aramanıza uygun sakin bulunamadı.' : 'Henüz kayıtlı site sakini bulunmamaktadır.'}
                  </Text>
                </View>
              ) : (
                <Card style={styles.card}>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>AD SOYAD</DataTable.Title>
                      <DataTable.Title>DAİRE</DataTable.Title>
                      <DataTable.Title>TELEFON</DataTable.Title>
                      <DataTable.Title>DURUM</DataTable.Title>
                      <DataTable.Title>İŞLEMLER</DataTable.Title>
                    </DataTable.Header>

                    {filteredResidents.map((resident) => (
                      <DataTable.Row key={resident.id}>
                        <DataTable.Cell>
                          <View>
                            <Text style={styles.residentName}>{resident.name}</Text>
                            <Text style={styles.residentEmail}>{resident.email}</Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell>{resident.block || '-'}-{resident.apartmentNo || '-'}</DataTable.Cell>
                        <DataTable.Cell>{resident.phone || '-'}</DataTable.Cell>
                        <DataTable.Cell>
                          <Chip 
                            mode="flat"
                            style={{
                              backgroundColor: resident.isActive ? Colors.success : Colors.error,
                            }}
                            textStyle={{ color: 'white', fontSize: 12 }}
                          >
                            {resident.isActive ? 'Aktif' : 'Pasif'}
                          </Chip>
                        </DataTable.Cell>
                        <DataTable.Cell>
                          <View style={styles.actionsContainer}>
                            <TouchableOpacity onPress={(e) => openMenu(resident, e)}>
                              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                            </TouchableOpacity>
                          </View>
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </Card>
              )}
            </View>
          </ScrollView>
        )}

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => Alert.alert('Bilgi', 'Yeni sakin ekleme işlevi yakında eklenecek.')}
          color="white"
        />

        {selectedResident && (
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={menuPosition}
          >
            <Menu.Item 
              onPress={handleEditResident} 
              title="Düzenle" 
              leadingIcon="pencil" 
            />
            <Menu.Item 
              onPress={handleToggleStatus} 
              title={selectedResident.isActive ? "Pasif Yap" : "Aktif Yap"} 
              leadingIcon={selectedResident.isActive ? "close-circle" : "check-circle"} 
            />
          </Menu>
        )}
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
    marginBottom: 8,
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
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  card: {
    elevation: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  residentName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  residentEmail: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
}); 