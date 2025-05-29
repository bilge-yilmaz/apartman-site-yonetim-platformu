import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, useTheme, MD3Theme } from 'react-native-paper';
import { router } from 'expo-router';
import { usePaymentsStore } from '../../store/paymentsStore';
import { Payment } from '../../services/api';
import { useUserStore } from '../../store/user';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAppContext } from '../../utils/appContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

// Sample payments in case the API fails
const SAMPLE_PAYMENTS: Payment[] = [
  {
    _id: '1',
    userId: 'user123',
    type: 'DUES',
    description: 'Nisan 2024 Aidat',
    amount: 250,
    dueDate: '2024-04-30',
    status: 'PENDING',
    createdAt: '2024-04-01',
    updatedAt: '2024-04-01'
  },
  {
    _id: '2',
    userId: 'user123',
    type: 'DUES',
    description: 'Mart 2024 Aidat',
    amount: 250,
    dueDate: '2024-03-31',
    status: 'PAID',
    paymentDate: '2024-03-25',
    paymentMethod: 'BANK_TRANSFER',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-25'
  },
  {
    _id: '3',
    userId: 'user123',
    type: 'INVOICE',
    description: 'Ortak Alan Elektrik Faturası',
    amount: 120,
    dueDate: '2024-04-15',
    status: 'PAID',
    paymentDate: '2024-04-10',
    paymentMethod: 'CASH',
    createdAt: '2024-04-01',
    updatedAt: '2024-04-10'
  }
];

export default function PaymentsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { user: currentUser } = useUserStore();
  const { payments, isLoading, error, fetchPayments, markAsPaid } = usePaymentsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [localPayments, setLocalPayments] = useState<Payment[]>([]);
  
  // Use the app context to check API availability
  const { isOfflineMode, apiAvailable } = useAppContext();
  const [useLocalData, setUseLocalData] = useState(isOfflineMode);

  console.log("PaymentsScreen - Current user:", JSON.stringify(currentUser)); // Debug log
  console.log("PaymentsScreen - Payments:", payments.length); // Debug log
  console.log("PaymentsScreen - isLoading:", isLoading); // Debug log
  console.log("PaymentsScreen - error:", error); // Debug log
  console.log("PaymentsScreen - API available:", apiAvailable); // Debug log
  console.log("PaymentsScreen - Offline mode:", isOfflineMode); // Debug log

  // Update useLocalData when API availability changes
  useEffect(() => {
    setUseLocalData(isOfflineMode);
  }, [isOfflineMode]);

  const loadPayments = useCallback(async () => {
    if (isOfflineMode) {
      console.log("Loading payments in offline mode");
      setUseLocalData(true);
      setLocalPayments(SAMPLE_PAYMENTS);
      return;
    }

    if (currentUser) {
      console.log("Loading payments for user ID:", currentUser.id); // Debug log
      try {
        await fetchPayments({ userId: currentUser.id });
        setUseLocalData(false);
      } catch (err) {
        console.error("Error loading payments:", err);
        setUseLocalData(true);
        setLocalPayments(SAMPLE_PAYMENTS);
      }
    } else {
      console.warn("Cannot load payments: No current user"); // Debug log
      setUseLocalData(true);
      setLocalPayments(SAMPLE_PAYMENTS);
    }
  }, [fetchPayments, currentUser, isOfflineMode]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Handle case when there is an error or no user - use sample data
  useEffect(() => {
    if (error || !currentUser || isOfflineMode) {
      console.log("Using sample payment data due to:", error || !currentUser ? "No user found" : "Offline mode");
      setLocalPayments(SAMPLE_PAYMENTS);
      setUseLocalData(true);
    }
  }, [error, currentUser, isOfflineMode]);

  useEffect(() => {
    if (error) {
      Alert.alert('Hata', `${error}${isOfflineMode ? ' (Örnek veriler gösteriliyor)' : ''}`);
    }
  }, [error, isOfflineMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const handlePayment = (payment: Payment) => {
    Alert.alert(
      'Ödeme Seçenekleri',
      `${payment.amount} TL tutarındaki ödeme için seçiminizi yapın:`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ödendi İşaretle',
          onPress: () => markAsCompleted(payment),
        },
        {
          text: 'Ödeme Yap',
          onPress: () => processPayment(payment),
        },
      ]
    );
  };

  const markAsCompleted = (payment: Payment) => {
    Alert.alert(
      'Ödeme İşaretleme',
      `${payment.amount} TL tutarındaki ödemeyi (\`${payment.description}\`) 'Ödendi' olarak işaretlemek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Ödendi İşaretle',
          onPress: async () => {
            try {
              if (useLocalData) {
                // Locally mark as paid
                const updatedPayments = localPayments.map(p => 
                  p._id === payment._id 
                    ? {...p, 
                        status: 'PAID' as Payment['status'], 
                        paymentDate: new Date().toISOString().split('T')[0], 
                        paymentMethod: 'USER_MARKED_AS_PAID' as Payment['paymentMethod']
                      } 
                    : p
                );
                setLocalPayments(updatedPayments);
                Alert.alert('Başarılı', 'Ödeme durumu güncellendi (yerel).');
              } else {
                await markAsPaid(payment._id, 'USER_MARKED_AS_PAID');
                Alert.alert('Başarılı', 'Ödeme durumu güncellendi.');
                loadPayments();
              }
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'Ödeme durumu güncellenirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const processPayment = (payment: Payment) => {
    Alert.alert(
      'Ödeme Onayı',
      `${payment.amount} TL tutarındaki ödemeyi yapmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Ödeme Yap',
          onPress: () => makePayment(payment, 'ONLINE'),
        },
      ]
    );
  };

  const makePayment = async (payment: Payment, paymentMethod: string = 'ONLINE') => {
    try {
      if (useLocalData) {
        // Simulate payment processing
        const updatedPayments = localPayments.map(p => 
          p._id === payment._id 
            ? {...p, 
                status: 'PAID' as Payment['status'], 
                paymentDate: new Date().toISOString().split('T')[0], 
                paymentMethod: paymentMethod as Payment['paymentMethod']
              } 
            : p
        );
        setLocalPayments(updatedPayments);
        Alert.alert('Başarılı', 'Ödeme işlemi tamamlandı!');
      } else {
        // Real payment processing
        const { processPayment } = usePaymentsStore.getState();
        await processPayment(payment._id, paymentMethod);
        Alert.alert('Başarılı', 'Ödeme işlemi tamamlandı!');
        loadPayments();
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Ödeme işlemi sırasında bir hata oluştu');
    }
  };

  // Choose which payments to display based on whether we're using API data or local data
  const displayPayments = useLocalData ? localPayments : payments;

  const filteredPayments = displayPayments.filter(payment => {
    if (selectedFilter === 'ALL') return true;
    return payment.status === selectedFilter;
  });

  const getStatusChipStyle = (status: Payment['status']) => {
    switch (status) {
      case 'PAID': return { backgroundColor: Colors.success, textColor: '#fff' };
      case 'PENDING': return { backgroundColor: Colors.warning, textColor: '#fff' };
      case 'OVERDUE': return { backgroundColor: Colors.error, textColor: '#fff' };
      case 'CANCELLED': return { backgroundColor: Colors.lightGray, textColor: '#fff' };
      default: return { backgroundColor: Colors.lightGray, textColor: '#fff'};
    }
  };

  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'PAID': return 'Ödendi';
      case 'PENDING': return 'Bekliyor';
      case 'OVERDUE': return 'Gecikmiş';
      case 'CANCELLED': return 'İptal';
      default: return status;
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const statusStyle = getStatusChipStyle(item.status);
    
    return (
      <Card 
        style={[styles.card, { borderLeftWidth: 5, borderLeftColor: statusStyle.backgroundColor }]} 
        onPress={() => router.push(`/payments/details/${item._id}` as any)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.descriptionText}>{item.description}</Text>
            <Chip
              style={[styles.statusChip, { backgroundColor: statusStyle.backgroundColor }]}
              textStyle={{ color: statusStyle.textColor, fontWeight: 'bold', fontSize: 12 }}
            >
              {getStatusText(item.status)}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detail}>
              <MaterialIcons name="payment" size={18} color={Colors.primary} />
              <Text style={styles.detailText}>{item.amount.toFixed(2)} TL</Text>
            </View>
            <View style={styles.detail}>
              <MaterialIcons name="date-range" size={18} color={Colors.primary} />
              <Text style={styles.detailText}>
                {format(new Date(item.dueDate), 'dd MMM yyyy', { locale: tr })}
              </Text>
            </View>
          </View>

          {item.status === 'PAID' && item.paymentDate && (
            <View style={styles.detailRow}>
              <View style={styles.detail}>
                <MaterialIcons name="event-available" size={18} color={Colors.success} />
                <Text style={styles.detailText}>
                  {format(new Date(item.paymentDate), 'dd MMM yyyy', { locale: tr })}
                </Text>
              </View>
               {item.paymentMethod && (
                <View style={styles.detail}>
                  <MaterialIcons name="credit-card" size={18} color={Colors.primary} />
                  <Text style={styles.detailText}>{item.paymentMethod.replace('_', ' ')}</Text>
                </View>
              )}
            </View>
          )}

          {item.status === 'PENDING' && (!currentUser || currentUser.id === item.userId) && (
            <View style={styles.buttonContainer}>
            <Button
                mode="outlined"
              icon="check-circle-outline"
                onPress={() => markAsCompleted(item)}
                style={[styles.actionButton, styles.markButton]}
                buttonColor={Colors.lightGray}
                textColor={Colors.primary}
            >
              Ödendi İşaretle
            </Button>
              <Button
                mode="contained"
                icon="credit-card"
                onPress={() => processPayment(item)}
                style={[styles.actionButton, styles.payButton]}
                buttonColor={Colors.success}
              >
                Ödeme Yap
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aidatlar</Text>
      </View>
      
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Aidat Ödemeleri</Text>
            <Text style={styles.subtitle}>Aidat ve ödeme bilgilerinizi görüntüleyebilirsiniz</Text>
          </View>
        </View>
      
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedFilter === 'ALL' && styles.activeTab]} 
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[styles.tabText, selectedFilter === 'ALL' && styles.activeTabText]}>
              <Ionicons 
                name="list-outline" 
                size={16} 
                color={selectedFilter === 'ALL' ? '#fff' : '#7f8c8d'} 
              /> Tümü ({displayPayments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedFilter === 'PENDING' && styles.activeTab]} 
            onPress={() => setSelectedFilter('PENDING')}
          >
            <Text style={[styles.tabText, selectedFilter === 'PENDING' && styles.activeTabText]}>
              <Ionicons 
                name="time-outline" 
                size={16} 
                color={selectedFilter === 'PENDING' ? '#fff' : '#7f8c8d'} 
              /> Bekleyenler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedFilter === 'PAID' && styles.activeTab]} 
            onPress={() => setSelectedFilter('PAID')}
          >
            <Text style={[styles.tabText, selectedFilter === 'PAID' && styles.activeTabText]}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={16} 
                color={selectedFilter === 'PAID' ? '#fff' : '#7f8c8d'} 
              /> Ödenenler
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Ödemeler yükleniyor...</Text>
          </View>
        ) : filteredPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="cash-outline" size={36} color="#999" />
            </View>
            <Text style={styles.emptyTitle}>Hiç ödeme bulunamadı</Text>
            <Text style={styles.emptySubText}>
              {selectedFilter !== 'ALL' 
                ? 'Farklı bir filtre seçmeyi deneyin' 
                : 'Yakında ödeme bilgileri burada görünecek'}
            </Text>
          </View>
        ) : (
          <View style={styles.paymentsContainer}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'ALL' 
                ? 'Tüm Ödemeler' 
                : selectedFilter === 'PENDING' 
                ? 'Bekleyen Ödemeler' 
                : 'Ödenen Ödemeler'}
            </Text>
            
            {filteredPayments.map((item) => (
              <View key={item._id}>
                {renderPaymentItem({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Tab bar artık Expo Router tarafından otomatik olarak eklendiği için BottomNav kaldırıldı */}
    </View>
  );
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    marginTop: 6,
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
    fontSize: 14,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  paymentsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2c3e50',
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    color: Colors.black,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    height: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
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
  actionButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  markButton: {
    flex: 1,
    marginRight: 4,
  },
  payButton: {
    flex: 1,
    marginLeft: 4,
  },
});

