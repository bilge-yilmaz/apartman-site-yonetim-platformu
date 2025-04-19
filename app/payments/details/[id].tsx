import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { usePaymentsStore, Payment } from '../../../store/payments';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function PaymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPaymentById, payments, isLoading, fetchPayments, makePayment } = usePaymentsStore();
  const [payment, setPayment] = useState<Payment | undefined>();

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      // Önce mevcut verilerden kontrol et
      const existingPayment = getPaymentById(id);
      if (existingPayment) {
        setPayment(existingPayment);
      } else {
        // Yoksa API'den yeniden çek
        await fetchPayments();
        setPayment(getPaymentById(id));
      }
    };
    
    fetchData();
  }, [id]);

  const handlePayment = () => {
    if (!payment) return;
    
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
              Alert.alert('Başarılı', 'Ödeme işleminiz tamamlandı', [
                { text: 'Tamam', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Hata', 'Ödeme işlemi sırasında bir hata oluştu');
            }
          },
        },
      ]
    );
  };

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ödeme bilgisi bulunamadı</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Geri Dön
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>
              {format(new Date(payment.dueDate), 'MMMM yyyy', { locale: tr })} Aidatı
            </Text>
            <Chip
              style={{
                backgroundColor: getStatusColor(payment.status) + '20',
              }}
              textStyle={{ color: getStatusColor(payment.status) }}
            >
              {getStatusText(payment.status)}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tutar</Text>
              <Text style={styles.amount}>{payment.amount} TL</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Son Ödeme Tarihi</Text>
              <Text style={styles.infoValue}>
                {format(new Date(payment.dueDate), 'dd MMM yyyy', { locale: tr })}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Daire</Text>
              <Text style={styles.infoValue}>
                {payment.block}-{payment.apartmentNo}
              </Text>
            </View>

            {payment.status === 'COMPLETED' && payment.paymentDate && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Ödeme Tarihi</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: tr })}
                </Text>
              </View>
            )}
          </View>

          {payment.paymentMethod && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Ödeme Yöntemi</Text>
                <Text style={styles.infoValue}>{payment.paymentMethod}</Text>
              </View>
            </View>
          )}

          {payment.description && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <Text style={styles.description}>{payment.description}</Text>
            </>
          )}

          {payment.status === 'PENDING' && (
            <Button
              mode="contained"
              onPress={handlePayment}
              style={styles.payButton}
            >
              Ödeme Yap
            </Button>
          )}

          {payment.status === 'COMPLETED' && (
            <View style={styles.receiptContainer}>
              <Text style={styles.receiptTitle}>Ödeme Bilgileri</Text>
              <Text style={styles.receiptText}>
                {payment.amount} TL tutarındaki {format(new Date(payment.dueDate), 'MMMM yyyy', { locale: tr })} aidatı, {format(new Date(payment.paymentDate!), 'dd MMM yyyy', { locale: tr })} tarihinde {payment.paymentMethod} yöntemiyle ödenmiştir.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  card: {
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    textTransform: 'capitalize',
  },
  divider: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  payButton: {
    marginTop: 24,
  },
  receiptContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2E7D32',
  },
  receiptText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1B5E20',
  },
});
