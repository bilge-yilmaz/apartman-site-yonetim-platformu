import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, useTheme, MD3Theme } from 'react-native-paper';
import { router } from 'expo-router';
import { usePaymentsStore } from '../../store/paymentsStore';
import { Payment } from '../../services/api';
import { useUserStore } from '../../store/user';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAppContext } from '../../utils/appContext';

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
      'Ödeme İşlemi',
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

  // Choose which payments to display based on whether we're using API data or local data
  const displayPayments = useLocalData ? localPayments : payments;

  const filteredPayments = displayPayments.filter(payment => {
    if (selectedFilter === 'ALL') return true;
    return payment.status === selectedFilter;
  });

  const getStatusChipStyle = (status: Payment['status']) => {
    switch (status) {
      case 'PAID': return { backgroundColor: theme.colors.surfaceVariant, textColor: theme.colors.primary };
      case 'PENDING': return { backgroundColor: theme.colors.surfaceVariant, textColor: theme.colors.tertiary };
      case 'OVERDUE': return { backgroundColor: theme.colors.errorContainer, textColor: theme.colors.error };
      case 'CANCELLED': return { backgroundColor: theme.colors.onSurfaceDisabled, textColor: theme.colors.surfaceDisabled };
      default: return { backgroundColor: theme.colors.backdrop, textColor: theme.colors.surfaceDisabled};
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

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <Card style={styles.card} onPress={() => router.push(`/payments/details/${item._id}` as any)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.descriptionText}>{item.description}</Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusChipStyle(item.status).backgroundColor }]}
            textStyle={{ color: getStatusChipStyle(item.status).textColor, fontWeight: 'bold', fontSize: 12 }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.cardBodyRow}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Tutar:</Text>
            <Text style={[styles.value, styles.amountValue]}>{item.amount.toFixed(2)} TL</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Son Ödeme Tarihi:</Text>
            <Text style={styles.value}>
              {format(new Date(item.dueDate), 'dd MMM yyyy', { locale: tr })}
            </Text>
          </View>
        </View>

        {item.status === 'PAID' && item.paymentDate && (
          <View style={styles.cardBodyRow}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Ödeme Tarihi:</Text>
              <Text style={styles.value}>
                {format(new Date(item.paymentDate), 'dd MMM yyyy', { locale: tr })}
              </Text>
            </View>
             {item.paymentMethod && (
              <View style={styles.infoItem}>
                <Text style={styles.label}>Ödeme Yöntemi:</Text>
                <Text style={styles.value}>{item.paymentMethod.replace('_', ' ')}</Text>
              </View>
            )}
          </View>
        )}

        {item.status === 'PENDING' && (!currentUser || currentUser.id === item.userId) && (
          <Button
            mode="contained"
            icon="check-circle-outline"
            onPress={() => handlePayment(item)}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            theme={{ roundness: 2 }}
          >
            Ödendi İşaretle
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['ALL', 'PENDING', 'PAID'] as const).map((filter) => {
          const isActive = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                isActive && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && { color: theme.colors.onPrimaryContainer, fontWeight: 'bold' },
                ]}
              >
                {filter === 'ALL' ? 'Tümü' : filter === 'PENDING' ? 'Bekleyen' : 'Ödenen'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {useLocalData && (
        <View style={styles.demoModeContainer}>
          <Text style={styles.demoModeText}>Demo Modu: Örnek veriler gösteriliyor</Text>
        </View>
      )}

      {isLoading && !useLocalData && displayPayments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredPayments.length > 0 ? (
        <FlatList
          data={filteredPayments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading || refreshing}
              onRefresh={onRefresh} 
              colors={[theme.colors.primary]} 
              tintColor={theme.colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedFilter === 'PENDING'
              ? 'Bekleyen ödeme/aidat bulunmamaktadır.'
              : selectedFilter === 'PAID'
              ? 'Ödenmiş kayıt bulunmamaktadır.'
              : 'Ödeme/aidat kaydı bulunmamaktadır.'}
          </Text>
          <Button onPress={loadPayments} style={{marginTop: 10}} mode="outlined">Tekrar Dene</Button>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
    color: theme.colors.onSurface,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    marginBottom: 10,
  },
  cardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: theme.colors.outline,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  amountValue: {
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 10,
    marginBottom: 5,
  },
  actionButtonLabel: {
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  filterText: {
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  demoModeContainer: {
    backgroundColor: theme.colors.errorContainer,
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  demoModeText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

