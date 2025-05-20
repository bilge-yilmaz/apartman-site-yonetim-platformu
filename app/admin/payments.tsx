import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, DataTable, Button, FAB, Searchbar, Chip, Menu, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import { Payment } from '../../services/api';

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useUserStore();

  // Örnek veriler
  const samplePayments: Payment[] = [
    {
      _id: '1',
      userId: 'user1',
      type: 'DUES',
      description: 'Nisan 2024 Aidat',
      amount: 1200,
      dueDate: '2024-04-15',
      status: 'PENDING',
      createdAt: '2024-04-01',
      updatedAt: '2024-04-01'
    },
    {
      _id: '2',
      userId: 'user2',
      type: 'DUES',
      description: 'Nisan 2024 Aidat',
      amount: 1200,
      dueDate: '2024-04-15',
      status: 'PAID',
      paymentDate: '2024-04-10',
      paymentMethod: 'BANK_TRANSFER',
      createdAt: '2024-04-01',
      updatedAt: '2024-04-10'
    },
    {
      _id: '3',
      userId: 'user3',
      type: 'DUES',
      description: 'Nisan 2024 Aidat',
      amount: 1500,
      dueDate: '2024-04-15',
      status: 'PENDING',
      createdAt: '2024-04-01',
      updatedAt: '2024-04-01'
    },
    {
      _id: '4',
      userId: 'user4',
      type: 'DUES',
      description: 'Nisan 2024 Aidat',
      amount: 1500,
      dueDate: '2024-04-15',
      status: 'OVERDUE',
      createdAt: '2024-04-01',
      updatedAt: '2024-04-16'
    },
    {
      _id: '5',
      userId: 'user5',
      type: 'DUES',
      description: 'Nisan 2024 Aidat',
      amount: 1800,
      dueDate: '2024-04-15',
      status: 'PAID',
      paymentDate: '2024-04-12',
      paymentMethod: 'CASH',
      createdAt: '2024-04-01',
      updatedAt: '2024-04-12'
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
    loadPayments();
  }, []);

  // Filtreleme
  useEffect(() => {
    filterPayments();
  }, [statusFilter, searchQuery, payments]);

  const loadPayments = () => {
    // Gerçek uygulamada API'den veriler çekilir
    setPayments(samplePayments);
  };

  const filterPayments = () => {
    let filtered = [...payments];
    
    // Status filtreleme
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Arama filtreleme
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        payment =>
          payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.amount.toString().includes(searchQuery.toLowerCase()) ||
          payment._id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPayments(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
    setRefreshing(false);
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const openMenu = (payment: Payment) => {
    setSelectedPayment(payment);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleEditPayment = () => {
    closeMenu();
    // Düzenleme sayfasına yönlendirme yapılacak
    console.log('Düzenle:', selectedPayment);
  };

  const handleDeletePayment = () => {
    closeMenu();
    // Silme işlemi yapılacak
    console.log('Sil:', selectedPayment);
  };

  const handleMarkAsPaid = () => {
    closeMenu();
    // Ödendi olarak işaretle
    console.log('Ödendi olarak işaretle:', selectedPayment);
  };

  const getStatusChip = (status: Payment['status']) => {
    let color = '';
    let text = '';

    switch (status) {
      case 'PAID':
        color = Colors.success;
        text = 'Ödendi';
        break;
      case 'PENDING':
        color = Colors.warning;
        text = 'Bekliyor';
        break;
      case 'OVERDUE':
        color = Colors.error;
        text = 'Gecikmiş';
        break;
      case 'CANCELLED':
        color = Colors.lightGray;
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

  // Toplam tutarları hesapla
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = filteredPayments
    .filter(payment => payment.status === 'PAID')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter(payment => payment.status === 'PENDING')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const overdueAmount = filteredPayments
    .filter(payment => payment.status === 'OVERDUE')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aidat Yönetimi</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Aidat Yönetimi</Text>
          <Text style={styles.subtitle}>Tüm aidat ödemelerini görüntüleyin ve yönetin.</Text>
          
          {/* Özet Kartları */}
          <View style={styles.summaryContainer}>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryLabel}>Toplam</Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>₺{totalAmount.toLocaleString()}</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryLabel}>Ödenen</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>₺{paidAmount.toLocaleString()}</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryLabel}>Bekleyen</Text>
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>₺{pendingAmount.toLocaleString()}</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryLabel}>Gecikmiş</Text>
                <Text style={[styles.summaryValue, { color: Colors.error }]}>₺{overdueAmount.toLocaleString()}</Text>
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
                { value: 'PAID', label: 'Ödenen' },
                { value: 'OVERDUE', label: 'Gecikmiş' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          
          {/* Ödeme Tablosu */}
          <Card style={styles.card}>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>AÇIKLAMA</DataTable.Title>
                <DataTable.Title numeric>TUTAR</DataTable.Title>
                <DataTable.Title>SON ÖDEME</DataTable.Title>
                <DataTable.Title>DURUM</DataTable.Title>
                <DataTable.Title>İŞLEM</DataTable.Title>
              </DataTable.Header>

              {filteredPayments.map((payment) => (
                <DataTable.Row key={payment._id}>
                  <DataTable.Cell>{payment.description}</DataTable.Cell>
                  <DataTable.Cell numeric>₺{payment.amount.toLocaleString()}</DataTable.Cell>
                  <DataTable.Cell>{new Date(payment.dueDate).toLocaleDateString('tr-TR')}</DataTable.Cell>
                  <DataTable.Cell>{getStatusChip(payment.status)}</DataTable.Cell>
                  <DataTable.Cell>
                    <TouchableOpacity onPress={() => openMenu(payment)}>
                      <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                    </TouchableOpacity>
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
        onPress={() => console.log('Yeni aidat ekle')}
        color="white"
      />

      {selectedPayment && (
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={{ x: 0, y: 0 }} // Bu değerler kullanıcı tıklamasına göre güncellenecek
        >
          {selectedPayment.status === 'PENDING' && (
            <Menu.Item 
              onPress={handleMarkAsPaid} 
              title="Ödendi İşaretle" 
              leadingIcon="check-circle" 
            />
          )}
          <Menu.Item 
            onPress={handleEditPayment} 
            title="Düzenle" 
            leadingIcon="pencil" 
          />
          <Menu.Item 
            onPress={handleDeletePayment} 
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
}); 