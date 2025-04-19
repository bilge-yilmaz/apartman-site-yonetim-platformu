import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { usePaymentsStore, Payment } from '../../store/payments';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function PaymentsScreen() {
  const { payments, isLoading, fetchPayments, makePayment } = usePaymentsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  useEffect(() => {
    fetchPayments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const handlePayment = (payment: Payment) => {
    Alert.alert(
      'Ödeme Yap',
      `${payment.amount} TL tutarındaki aidatı ödemek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ödeme Yap',
          onPress: async () => {
            try {
              await makePayment(payment._id, 'ONLINE');
              Alert.alert('Başarılı', 'Ödeme işleminiz tamamlandı');
            } catch (error) {
              Alert.alert('Hata', 'Ödeme işlemi sırasında bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const filteredPayments = payments.filter(payment => {
    if (selectedFilter === 'ALL') return true;
    return payment.status === selectedFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'PENDING':
        return '#FFC107';
      case 'OVERDUE':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Ödendi';
      case 'PENDING':
        return 'Bekliyor';
      case 'OVERDUE':
        return 'Gecikmiş';
      default:
        return status;
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <Card style={styles.card} onPress={() => router.push(`/payments/details/${item._id}`)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.month}>
            {format(new Date(item.dueDate), 'MMMM yyyy', { locale: tr })}
          </Text>
          <Chip
            style={{
              backgroundColor: getStatusColor(item.status) + '20',
            }}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.cardBody}>
          <View>
            <Text style={styles.label}>Tutar</Text>
            <Text style={styles.amount}>{item.amount} TL</Text>
          </View>

          <View>
            <Text style={styles.label}>Son Ödeme</Text>
            <Text style={styles.date}>
              {format(new Date(item.dueDate), 'dd MMM yyyy', { locale: tr })}
            </Text>
          </View>
        </View>

        {item.status === 'PENDING' && (
          <Button
            mode="contained"
            onPress={() => handlePayment(item)}
            style={styles.payButton}
          >
            Ödeme Yap
          </Button>
        )}

        {item.status === 'COMPLETED' && item.paymentDate && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Ödeme Tarihi:</Text>
            <Text style={styles.paymentValue}>
              {format(new Date(item.paymentDate), 'dd MMM yyyy', { locale: tr })}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'ALL' && styles.selectedFilter,
          ]}
          onPress={() => setSelectedFilter('ALL')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'ALL' && styles.selectedFilterText,
            ]}
          >
            Tümü
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'PENDING' && styles.selectedFilter,
          ]}
          onPress={() => setSelectedFilter('PENDING')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'PENDING' && styles.selectedFilterText,
            ]}
          >
            Bekleyen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'COMPLETED' && styles.selectedFilter,
          ]}
          onPress={() => setSelectedFilter('COMPLETED')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'COMPLETED' && styles.selectedFilterText,
            ]}
          >
            Ödenen
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      ) : filteredPayments.length > 0 ? (
        <FlatList
          data={filteredPayments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedFilter === 'PENDING'
              ? 'Bekleyen aidat bulunmamaktadır.'
              : selectedFilter === 'COMPLETED'
              ? 'Ödenmiş aidat bulunmamaktadır.'
              : 'Aidat kaydı bulunmamaktadır.'}
          </Text>
        </View>
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
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  month: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  divider: {
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 16,
  },
  payButton: {
    marginTop: 12,
  },
  paymentInfo: {
    marginTop: 12,
    flexDirection: 'row',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 8,
  },
  paymentValue: {
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedFilter: {
    backgroundColor: '#1976D2',
  },
  filterText: {
    color: '#757575',
  },
  selectedFilterText: {
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});
