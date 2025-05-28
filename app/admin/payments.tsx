import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text, Card, DataTable, Button, FAB, Searchbar, Chip, Menu, SegmentedButtons, ActivityIndicator, Portal, Modal as PaperModal, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import AdminPageGuard from '../../components/AdminPageGuard';
import { apiServices } from '../../utils/api-services';
import { PaymentStorage, Payment as OfflinePayment } from '../../services/offlineStorage';

// Ödeme tipi - offlineStorage'dan gelen interface'i genişletiyoruz
interface Payment extends OfflinePayment {
  _id?: string;
  userId?: string;
  residentName?: string;
  type?: string;
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
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD'>('CASH');
  const { user } = useUserStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<{
    apartmentNo: string;
    amount: string;
    dueDate: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD';
    description: string;
  }>({
    apartmentNo: '',
    amount: '',
    dueDate: '',
    status: 'PENDING',
    description: '',
  });

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
      const data = await PaymentStorage.getAll();
      // OfflinePayment'ı Payment'a dönüştür
      const convertedData: Payment[] = data.map(payment => ({
        ...payment,
        _id: payment.id,
        userId: payment.id,
        type: 'MONTHLY_FEE',
        residentName: `Daire ${payment.apartmentNo}`,
        block: 'A'
      }));
      setPayments(convertedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Ödemeler yüklenirken hata:', error);
      Alert.alert('Hata', 'Ödemeler yüklenirken bir hata oluştu');
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
          payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.amount.toString().includes(searchQuery.toLowerCase()) ||
          payment.residentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPayments(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
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
              await PaymentStorage.delete(selectedPayment.id);
              Alert.alert('Başarılı', 'Aidat kaydı başarıyla silindi.');
              loadPayments();
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
      
      await PaymentStorage.update(selectedPayment.id, {
        status: 'PAID',
        paymentDate: paymentInfo.paymentDate,
        paymentMethod: paymentInfo.paymentMethod as 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD'
      });
      
      Alert.alert('Başarılı', 'Aidat ödemesi başarıyla kaydedildi.');
      loadPayments();
      setPaymentModalVisible(false);
    } catch (error) {
      console.error('Ödeme kaydetme hatası:', error);
      Alert.alert('Hata', 'Aidat ödemesi kaydedilirken bir hata oluştu.');
    }
  };

  const getStatusChip = (status: 'PENDING' | 'PAID' | 'OVERDUE') => {
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

  const openModal = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        apartmentNo: payment.apartmentNo || '',
        amount: payment.amount.toString(),
        dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        description: payment.description || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        apartmentNo: '',
        amount: '',
        dueDate: '',
        status: 'PENDING',
        description: '',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingPayment(null);
    setFormData({
      apartmentNo: '',
      amount: '',
      dueDate: '',
      status: 'PENDING',
      description: '',
    });
  };

  const handleSave = async () => {
    if (!formData.apartmentNo.trim() || !formData.amount.trim() || !formData.dueDate) {
      Alert.alert('Hata', 'Daire no, tutar ve vade tarihi alanları zorunludur');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar giriniz');
      return;
    }

    try {
      const paymentData = {
        apartmentNo: formData.apartmentNo.trim(),
        amount: amount,
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        description: formData.description.trim() || `Aidat - ${formData.apartmentNo}`,
        ...(formData.status === 'PAID' && { paymentDate: new Date().toISOString() }),
      };

      if (editingPayment) {
        await PaymentStorage.update(editingPayment.id, paymentData);
        Alert.alert('Başarılı', 'Ödeme güncellendi');
      } else {
        await PaymentStorage.create(paymentData);
        Alert.alert('Başarılı', 'Ödeme oluşturuldu');
      }

      closeModal();
      loadPayments();
    } catch (error) {
      console.error('Ödeme kaydedilirken hata:', error);
      Alert.alert('Hata', 'Ödeme kaydedilirken bir hata oluştu');
    }
  };

  const markAsPaidOffline = async (payment: Payment) => {
    try {
      await PaymentStorage.update(payment.id, {
        status: 'PAID',
        paymentDate: new Date().toISOString(),
        paymentMethod: 'CASH',
      });
      loadPayments();
      Alert.alert('Başarılı', 'Ödeme alındı olarak işaretlendi');
    } catch (error) {
      console.error('Ödeme durumu güncellenirken hata:', error);
      Alert.alert('Hata', 'Ödeme durumu güncellenirken bir hata oluştu');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Bekliyor';
      case 'PAID': return 'Ödendi';
      case 'OVERDUE': return 'Gecikmiş';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'PAID': return '#10B981';
      case 'OVERDUE': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case 'CASH': return 'Nakit';
      case 'BANK_TRANSFER': return 'Havale';
      case 'CREDIT_CARD': return 'Kredi Kartı';
      default: return '-';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

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
                    <Text style={[styles.summaryValue, { color: Colors.primary }]}>₺{formatCurrency(totalAmount)}</Text>
                  </Card.Content>
                </Card>
                
                <Card style={styles.summaryCard}>
                  <Card.Content>
                    <Text style={styles.summaryLabel}>Ödenen</Text>
                    <Text style={[styles.summaryValue, { color: Colors.success }]}>₺{formatCurrency(paidAmount)}</Text>
                  </Card.Content>
                </Card>
                
                <Card style={styles.summaryCard}>
                  <Card.Content>
                    <Text style={styles.summaryLabel}>Bekleyen</Text>
                    <Text style={[styles.summaryValue, { color: Colors.warning }]}>₺{formatCurrency(pendingAmount)}</Text>
                  </Card.Content>
                </Card>
                
                <Card style={styles.summaryCard}>
                  <Card.Content>
                    <Text style={styles.summaryLabel}>Gecikmiş</Text>
                    <Text style={[styles.summaryValue, { color: Colors.error }]}>₺{formatCurrency(overdueAmount)}</Text>
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
                        <DataTable.Cell numeric>₺{formatCurrency(payment.amount)}</DataTable.Cell>
                        <DataTable.Cell>{formatDate(payment.dueDate)}</DataTable.Cell>
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
          onPress={() => openModal()}
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
          <PaperModal
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
                onValueChange={(value) => setPaymentMethod(value as 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD')}
                buttons={[
                  { value: 'CASH', label: 'Nakit' },
                  { value: 'BANK_TRANSFER', label: 'Havale' },
                  { value: 'CREDIT_CARD', label: 'Kart' },
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
          </PaperModal>
        </Portal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingPayment ? 'Ödeme Düzenle' : 'Yeni Ödeme'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Daire No *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.apartmentNo}
                    onChangeText={(text) => setFormData({ ...formData, apartmentNo: text })}
                    placeholder="101"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Tutar (TL) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.amount}
                    onChangeText={(text) => setFormData({ ...formData, amount: text })}
                    placeholder="1200"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Vade Tarihi *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.dueDate}
                    onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Açıklama</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Aylık aidat"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Durum</Text>
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() => {
                        Alert.alert(
                          'Durum Seç',
                          '',
                          [
                            { text: 'Bekliyor', onPress: () => setFormData({ ...formData, status: 'PENDING' }) },
                            { text: 'Ödendi', onPress: () => setFormData({ ...formData, status: 'PAID' }) },
                            { text: 'Gecikmiş', onPress: () => setFormData({ ...formData, status: 'OVERDUE' }) },
                            { text: 'İptal', style: 'cancel' },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.pickerText}>{getStatusText(formData.status)}</Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {formData.status === 'PAID' && (
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>Ödeme Yöntemi</Text>
                      <TouchableOpacity
                        style={styles.picker}
                        onPress={() => {
                          Alert.alert(
                            'Ödeme Yöntemi Seç',
                            '',
                            [
                              { text: 'Nakit', onPress: () => setFormData({ ...formData, paymentMethod: 'CASH' }) },
                              { text: 'Havale', onPress: () => setFormData({ ...formData, paymentMethod: 'BANK_TRANSFER' }) },
                              { text: 'Kredi Kartı', onPress: () => setFormData({ ...formData, paymentMethod: 'CREDIT_CARD' }) },
                              { text: 'İptal', style: 'cancel' },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.pickerText}>{getPaymentMethodText(formData.paymentMethod)}</Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>
                    {editingPayment ? 'Güncelle' : 'Kaydet'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
}); 