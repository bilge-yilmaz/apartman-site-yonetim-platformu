import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, DataTable, Button, FAB, Searchbar, Chip, Menu, SegmentedButtons, ActivityIndicator, Modal, Portal, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import AdminPageGuard from '../../components/AdminPageGuard';
import { apiServices } from '../../utils/api-services';

// Ödeme tipi
interface Payment {
  _id: string;
  userId: string;
  residentName?: string;
  type: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  paymentDate?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  apartmentNo?: string;
  block?: string;
}

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const { user } = useUserStore();

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

  const loadPayments = async () => {
    try {
      setError(null);
      // API'den aidatları getir
      const paymentsData = await apiServices.admin.payments.getAll();
      setPayments(paymentsData);
    } catch (err) {
      console.error('Aidat verileri alınırken hata:', err);
      setError('Aidat verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
          payment.residentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment._id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPayments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const openMenu = (payment: Payment, event: any) => {
    setSelectedPayment(payment);
    setMenuPosition({
      x: event.nativeEvent ? event.nativeEvent.pageX - 100 : 0,
      y: event.nativeEvent ? event.nativeEvent.pageY : 0
    });
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleEditPayment = () => {
    closeMenu();
    // Düzenleme işlevi gelecek
    Alert.alert('Bilgi', 'Düzenleme işlevi yakında eklenecek.');
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    
    closeMenu();
    
    Alert.alert(
      'Aidat Kaydını Sil',
      `"${selectedPayment.description}" kaydını silmek istediğinize emin misiniz?`,
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await apiServices.admin.payments.deletePayment(selectedPayment._id);
              
              if (result.success) {
                // Silinen aidatı listeden çıkar
                const updatedPayments = payments.filter(p => p._id !== selectedPayment._id);
                setPayments(updatedPayments);
                
                Alert.alert('Başarılı', 'Aidat kaydı başarıyla silindi.');
              } else {
                Alert.alert('Hata', result.message || 'Aidat kaydı silinemedi.');
              }
            } catch (error) {
              console.error('Aidat silme hatası:', error);
              Alert.alert('Hata', 'Aidat kaydı silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsPaid = () => {
    closeMenu();
    setPaymentModalVisible(true);
  };
  
  const confirmPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      const paymentInfo = {
        paymentMethod,
        paymentDate: new Date().toISOString()
      };
      
      const result = await apiServices.admin.payments.markAsPaid(selectedPayment._id, paymentInfo);
      
      if (result.success) {
        // Ödendi olarak işaretlenen aidatı güncelle
        const updatedPayments = payments.map(p => 
          p._id === selectedPayment._id ? result.data : p
        );
        
        setPayments(updatedPayments);
        setPaymentModalVisible(false);
        Alert.alert('Başarılı', 'Aidat ödemesi başarıyla kaydedildi.');
      } else {
        Alert.alert('Hata', result.message || 'Aidat ödemesi kaydedilemedi.');
      }
    } catch (error) {
      console.error('Ödeme kaydetme hatası:', error);
      Alert.alert('Hata', 'Aidat ödemesi kaydedilirken bir hata oluştu.');
    }
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
    <AdminPageGuard>
      <View style={styles.container}>
        <View style={styles.safeArea} />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aidat Yönetimi</Text>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Aidat verileri yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={loadPayments}
              style={styles.retryButton}
            >
              Tekrar Dene
            </Button>
          </View>
        ) : (
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
              {filteredPayments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cash-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>
                    {searchQuery || statusFilter !== 'all' ? 'Filtrelere uygun aidat kaydı bulunamadı.' : 'Henüz kayıtlı aidat bulunmamaktadır.'}
                  </Text>
                </View>
              ) : (
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
                        <DataTable.Cell>
                          <View>
                            <Text style={styles.paymentDescription}>{payment.description}</Text>
                            {payment.residentName && (
                              <Text style={styles.paymentResident}>
                                {payment.residentName} {payment.block && payment.apartmentNo ? `(${payment.block}-${payment.apartmentNo})` : ''}
                              </Text>
                            )}
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell numeric>₺{payment.amount.toLocaleString()}</DataTable.Cell>
                        <DataTable.Cell>{new Date(payment.dueDate).toLocaleDateString('tr-TR')}</DataTable.Cell>
                        <DataTable.Cell>{getStatusChip(payment.status)}</DataTable.Cell>
                        <DataTable.Cell>
                          <TouchableOpacity onPress={(e) => openMenu(payment, e)}>
                            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                          </TouchableOpacity>
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
          onPress={() => Alert.alert('Bilgi', 'Yeni aidat ekleme işlevi yakında eklenecek.')}
          color="white"
        />

        {selectedPayment && (
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={menuPosition}
          >
            {selectedPayment.status === 'PENDING' || selectedPayment.status === 'OVERDUE' ? (
              <Menu.Item 
                onPress={handleMarkAsPaid} 
                title="Ödendi İşaretle" 
                leadingIcon="check-circle" 
              />
            ) : null}
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
        
        <Portal>
          <Modal
            visible={paymentModalVisible}
            onDismiss={() => setPaymentModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Ödeme Bilgileri</Text>
            <Text style={styles.modalSubtitle}>
              {selectedPayment?.description} - ₺{selectedPayment?.amount?.toLocaleString()}
            </Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.inputLabel}>Ödeme Yöntemi:</Text>
              <SegmentedButtons
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                buttons={[
                  { value: 'CASH', label: 'Nakit' },
                  { value: 'CARD', label: 'Kart' },
                  { value: 'BANK_TRANSFER', label: 'Havale' },
                ]}
                style={styles.paymentMethodButtons}
              />
            </View>
            
            <View style={styles.modalButtonContainer}>
              <Button 
                mode="outlined" 
                onPress={() => setPaymentModalVisible(false)}
                style={styles.modalButton}
              >
                İptal
              </Button>
              <Button 
                mode="contained" 
                onPress={confirmPayment}
                style={styles.modalButton}
              >
                Onayla
              </Button>
            </View>
          </Modal>
        </Portal>
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
  paymentDescription: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  paymentResident: {
    fontSize: 12,
    color: '#7f8c8d',
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.primary,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  paymentMethodButtons: {
    marginBottom: 8,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
}); 