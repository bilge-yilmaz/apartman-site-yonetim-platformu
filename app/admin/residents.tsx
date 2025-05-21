import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, DataTable, Button, FAB, Searchbar, Chip, IconButton, Menu } from 'react-native-paper';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import AdminPageGuard from '../../components/AdminPageGuard';

// Sakin tipi
interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  apartment: string;
  block: string;
  status: 'ACTIVE' | 'PASSIVE';
}

export default function AdminResidentsScreen() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const { user } = useUserStore();

  // Örnek veriler
  const sampleResidents: Resident[] = [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      phone: '0532 123 4567',
      apartment: '101',
      block: 'A',
      status: 'ACTIVE'
    },
    {
      id: '2',
      name: 'Ayşe Demir',
      email: 'ayse@example.com',
      phone: '0533 234 5678',
      apartment: '102',
      block: 'A',
      status: 'ACTIVE'
    },
    {
      id: '3',
      name: 'Mehmet Kaya',
      email: 'mehmet@example.com',
      phone: '0534 345 6789',
      apartment: '201',
      block: 'B',
      status: 'ACTIVE'
    },
    {
      id: '4',
      name: 'Fatma Şahin',
      email: 'fatma@example.com',
      phone: '0535 456 7890',
      apartment: '202',
      block: 'B',
      status: 'PASSIVE'
    },
    {
      id: '5',
      name: 'Ali Öztürk',
      email: 'ali@example.com',
      phone: '0536 567 8901',
      apartment: '301',
      block: 'C',
      status: 'ACTIVE'
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
    loadResidents();
  }, []);

  const loadResidents = () => {
    // Gerçek uygulamada API'den veriler çekilir
    setResidents(sampleResidents);
    setFilteredResidents(sampleResidents);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadResidents();
    setRefreshing(false);
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
          resident.apartment.toLowerCase().includes(query.toLowerCase()) ||
          resident.block.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResidents(filtered);
    }
  };

  const openMenu = (resident: Resident) => {
    setSelectedResident(resident);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleEditResident = () => {
    closeMenu();
    // Düzenleme sayfasına yönlendirme yapılacak
    console.log('Düzenle:', selectedResident);
  };

  const handleDeleteResident = () => {
    closeMenu();
    // Silme işlemi yapılacak
    console.log('Sil:', selectedResident);
  };

  return (
    <AdminPageGuard>
      <View style={styles.container}>
        <View style={styles.safeArea} />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Site Sakinleri</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
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
                    <DataTable.Cell>{resident.block}-{resident.apartment}</DataTable.Cell>
                    <DataTable.Cell>{resident.phone}</DataTable.Cell>
                    <DataTable.Cell>
                      <Chip 
                        mode="flat"
                        style={{
                          backgroundColor: resident.status === 'ACTIVE' ? Colors.success : Colors.error,
                        }}
                        textStyle={{ color: 'white', fontSize: 12 }}
                      >
                        {resident.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                      </Chip>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <View style={styles.actionsContainer}>
                        <TouchableOpacity onPress={() => openMenu(resident)}>
                          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card>
          </View>
        </ScrollView>

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => console.log('Yeni sakin ekle')}
          color="white"
        />

        {selectedResident && (
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={{ x: 0, y: 0 }} // Bu değerler kullanıcı tıklamasına göre güncellenecek
          >
            <Menu.Item 
              onPress={handleEditResident} 
              title="Düzenle" 
              leadingIcon="pencil" 
            />
            <Menu.Item 
              onPress={handleDeleteResident} 
              title="Sil" 
              leadingIcon="delete" 
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
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  residentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  residentEmail: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actionsContainer: {
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