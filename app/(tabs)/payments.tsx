import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, useTheme, MD3Theme } from 'react-native-paper';
import { router } from 'expo-router';
import { usePaymentsStore } from '../../store/paymentsStore';
import { Payment } from '../../services/api';
import { useUserStore } from '../../store/user';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function PaymentsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { user: currentUser } = useUserStore();
  const { payments, isLoading, error, fetchPayments, markAsPaid } = usePaymentsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  const loadPayments = useCallback(async () => {
    if (currentUser) {
      await fetchPayments({ userId: currentUser.id });
    }
  }, [fetchPayments, currentUser]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (error) {
      Alert.alert('Hata', error);
    }
  }, [error]);

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
              await markAsPaid(payment._id, 'USER_MARKED_AS_PAID');
              Alert.alert('Başarılı', 'Ödeme durumu güncellendi.');
              loadPayments();
            } catch (err: any) {
              Alert.alert('Hata', err.message || 'Ödeme durumu güncellenirken bir hata oluştu');
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

        {item.status === 'PENDING' && currentUser?.id === item.userId && (
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

      {isLoading && payments.length === 0 ? (
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
    marginVertical: 10,
    backgroundColor: '#E0E0E0',
  },
  cardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 8,
  },
  label: {
    fontSize: 12,
    color: '#667085',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#333D4A',
    fontWeight: '500',
  },
  amountValue: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surfaceVariant,
  },
  emptyText: {
    fontSize: 16,
    color: '#667085',
    textAlign: 'center',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

