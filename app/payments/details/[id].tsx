import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Text, Card, Button, Chip, Divider, Surface, IconButton, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { usePaymentsStore } from '../../../store/paymentsStore';
import { Payment } from '../../../services/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PaymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPaymentById, payments, isLoading, fetchPayments, markAsPaid } = usePaymentsStore();
  const [payment, setPayment] = useState<Payment | undefined>();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  // Animasyon efektleri
  useEffect(() => {
    if (payment) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [payment]);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      // Önce mevcut verilerden kontrol et
      const existingPayment = getPaymentById(id);
      if (existingPayment) {
        setPayment(existingPayment);
      } else {
        // Yoksa API'den yeniden çek (userId gerekli)
        // await fetchPayments({ userId: 'current-user-id' }); // Bu kısım düzeltilmeli
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
              await markAsPaid(payment._id, 'ONLINE');
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
      case 'PAID':
        return '#4CAF50';
      case 'PENDING':
        return '#FFC107';
      case 'OVERDUE':
        return '#F44336';
      default:
        return '#757575';
    }
  };
  
  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'PAID':
        return ['#43A047', '#2E7D32'];
      case 'PENDING':
        return ['#FFB300', '#F57F17'];
      case 'OVERDUE':
        return ['#E53935', '#C62828'];
      default:
        return ['#757575', '#424242'];
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'check-circle';
      case 'PENDING':
        return 'clock-outline';
      case 'OVERDUE':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
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
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Ödeme bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="dark" />
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>Ödeme bilgisi bulunamadı</Text>
        <Button 
          mode="contained" 
          onPress={() => router.back()}
          style={styles.errorButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Geri Dön
        </Button>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
          <Surface style={styles.headerCard}>
            <LinearGradient
              colors={['#1976D2', '#0D47A1']}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerTopRow}>
                  <IconButton
                    icon="arrow-left"
                    iconColor="white"
                    size={24}
                    onPress={() => router.back()}
                    style={styles.backButton}
                  />
                  <Text style={styles.headerTitle}>Ödeme Detayı</Text>
                </View>
                
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Tutar</Text>
                  <Text style={styles.amountValue}>{payment.amount} ₺</Text>
                </View>
                
                <View style={styles.headerChipRow}>
                  <Chip
                    mode="outlined"
                    style={styles.headerChip}
                    textStyle={styles.headerChipText}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={getStatusIcon(payment.status)}
                        size={16}
                        color="white"
                      />
                    )}
                  >
                    {getStatusText(payment.status)}
                  </Chip>
                  
                  <Text style={styles.dateText}>
                    {format(new Date(payment.dueDate), 'MMMM yyyy', { locale: tr })}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Surface>
          
          <Card style={styles.card}>
            <Card.Content>
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="calendar" size={20} color="#1976D2" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Son Ödeme Tarihi</Text>
                  <Text style={styles.infoValue}>
                    {format(new Date(payment.dueDate), 'dd MMM yyyy', { locale: tr })}
                  </Text>
                </View>
              </View>
            </View>

          <Divider style={styles.infoDivider} />
            
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="home" size={20} color="#1976D2" style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Daire</Text>
                <Text style={styles.infoValue}>
                  {payment.apartmentNo || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
            
          {payment.status === 'PAID' && payment.paymentDate && (
            <>
              <Divider style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="calendar-check" size={20} color="#4CAF50" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Ödeme Tarihi</Text>
                    <Text style={styles.infoValue}>
                      {format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: tr })}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {payment.paymentMethod && (
            <>
              <Divider style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="credit-card" size={20} color="#1976D2" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Ödeme Yöntemi</Text>
                    <Text style={styles.infoValue}>{payment.paymentMethod}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
          </View>

          {payment.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <Surface style={styles.descriptionCard}>
                <Text style={styles.description}>{payment.description}</Text>
              </Surface>
            </View>
          )}

          {payment.status === 'PENDING' && (
            <View style={styles.actionSection}>
              <Button
                mode="contained"
                onPress={handlePayment}
                style={styles.payButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                icon="credit-card-outline"
              >
                Ödeme Yap
              </Button>
            </View>
          )}

          {payment.status === 'PAID' && (
            <View style={styles.receiptSection}>
              <Surface style={styles.receiptContainer}>
                <View style={styles.receiptHeader}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                  <Text style={styles.receiptTitle}>Ödeme Makbuzu</Text>
                </View>
                <Divider style={styles.receiptDivider} />
                <Text style={styles.receiptText}>
                  {payment.amount} ₺ tutarındaki {format(new Date(payment.dueDate), 'MMMM yyyy', { locale: tr })} aidatı, {format(new Date(payment.paymentDate!), 'dd MMM yyyy', { locale: tr })} tarihinde {payment.paymentMethod} yöntemiyle ödenmiştir.
                </Text>
                <View style={styles.receiptActions}>
                  <Button
                    mode="outlined"
                    icon="share-variant"
                    style={styles.receiptButton}
                    labelStyle={{ fontSize: 12 }}
                    onPress={() => Alert.alert('Bilgi', 'Makbuz paylaşma özelliği yakında eklenecektir.')}
                  >
                    Paylaş
                  </Button>
                  <Button
                    mode="outlined"
                    icon="download"
                    style={styles.receiptButton}
                    labelStyle={{ fontSize: 12 }}
                    onPress={() => Alert.alert('Bilgi', 'Makbuz indirme özelliği yakında eklenecektir.')}
                  >
                    İndir
                  </Button>
                </View>
              </Surface>
            </View>
          )}
        </Card.Content>
      </Card>
      </Animated.View>
    </ScrollView>
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1976D2',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#757575',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#1976D2',
  },
  buttonContent: {
    height: 48,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerCard: {
    elevation: 4,
    borderRadius: 0,
    marginBottom: 16,
  },
  headerGradient: {
    borderRadius: 0,
    paddingTop: 40, // Status bar height
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  headerChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerChipText: {
    color: 'white',
  },
  dateText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  card: {
    elevation: 2,
    margin: 16,
    borderRadius: 12,
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#424242',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    padding: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
  },
  descriptionSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  descriptionCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    elevation: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#424242',
  },
  actionSection: {
    marginTop: 24,
  },
  payButton: {
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#1976D2',
  },
  receiptSection: {
    marginTop: 24,
  },
  receiptContainer: {
    padding: 16,
    backgroundColor: '#F9FFF9',
    borderRadius: 12,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#2E7D32',
  },
  receiptDivider: {
    marginVertical: 12,
    backgroundColor: '#E8F5E9',
  },
  receiptText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1B5E20',
    marginBottom: 16,
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  receiptButton: {
    marginLeft: 8,
    borderColor: '#4CAF50',
  },
});
