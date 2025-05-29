import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardStats, DashboardStats } from '../../services/api';

const screenWidth = Dimensions.get('window').width;

export default function AdminReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      console.log('📊 Dashboard istatistikleri yükleniyor...');
      const stats = await getDashboardStats();
      setDashboardStats(stats);
      setError(null);
      console.log('✅ Dashboard istatistikleri başarıyla yüklendi');
    } catch (error: any) {
      console.error('❌ Rapor verileri yüklenirken hata:', error);
      setError(error.message || 'Rapor verileri yüklenirken bir hata oluştu');
      Alert.alert('Hata', error.message || 'Rapor verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'PAID': return '#10B981';
      case 'OVERDUE': return '#EF4444';
      case 'COMPLETED': return '#10B981';
      case 'IN_PROGRESS': return '#3B82F6';
      case 'CANCELLED': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Bekliyor';
      case 'PAID': return 'Ödendi';
      case 'OVERDUE': return 'Gecikmiş';
      case 'COMPLETED': return 'Tamamlandı';
      case 'IN_PROGRESS': return 'Devam Ediyor';
      case 'CANCELLED': return 'İptal';
      default: return status;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Raporlar hazırlanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !dashboardStats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Hata</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadReportData}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Raporlar</Text>
          <Text style={styles.headerSubtitle}>Apartman yönetim istatistikleri</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === '3months' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('3months')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === '3months' && styles.activePeriodButtonText]}>
              3 Ay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === '6months' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('6months')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === '6months' && styles.activePeriodButtonText]}>
              6 Ay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === '1year' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('1year')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === '1year' && styles.activePeriodButtonText]}>
              1 Yıl
            </Text>
          </TouchableOpacity>
        </View>

        {dashboardStats && (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="people" size={24} color="#3B82F6" />
                  <Text style={styles.summaryTitle}>Toplam Kullanıcı</Text>
                </View>
                <Text style={styles.summaryValue}>{dashboardStats.users.total}</Text>
                <Text style={styles.summaryChange}>
                  Aktif: {dashboardStats.users.active} | Pasif: {dashboardStats.users.inactive}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="card" size={24} color="#10B981" />
                  <Text style={styles.summaryTitle}>Ödemeler</Text>
                </View>
                <Text style={styles.summaryValue}>{dashboardStats.payments.total}</Text>
                <Text style={styles.summaryChange}>
                  Ödenen: {dashboardStats.payments.collected} | Bekleyen: {dashboardStats.payments.pending}
                </Text>
              </View>
            </View>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="construct" size={24} color="#F59E0B" />
                  <Text style={styles.summaryTitle}>Bakım Talepleri</Text>
                </View>
                <Text style={styles.summaryValue}>{dashboardStats.maintenance.total}</Text>
                <Text style={styles.summaryChange}>
                  Tamamlanan: {dashboardStats.maintenance.completed} | Devam Eden: {dashboardStats.maintenance.inProgress}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="megaphone" size={24} color="#8B5CF6" />
                  <Text style={styles.summaryTitle}>Duyurular</Text>
                </View>
                <Text style={styles.summaryValue}>{dashboardStats.announcements.total}</Text>
                <Text style={styles.summaryChange}>
                  Aktif: {dashboardStats.announcements.active}
                </Text>
              </View>
            </View>

            {/* Payment Status Breakdown */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Ödeme Durumu Detayı</Text>
              <View style={styles.statusGrid}>
                <View style={[styles.statusCard, { borderLeftColor: getStatusColor('PAID') }]}>
                  <Text style={styles.statusValue}>{dashboardStats.payments.collected}</Text>
                  <Text style={styles.statusLabel}>Ödenen</Text>
                </View>
                <View style={[styles.statusCard, { borderLeftColor: getStatusColor('PENDING') }]}>
                  <Text style={styles.statusValue}>{dashboardStats.payments.pending}</Text>
                  <Text style={styles.statusLabel}>Bekleyen</Text>
                </View>
                <View style={[styles.statusCard, { borderLeftColor: getStatusColor('OVERDUE') }]}>
                  <Text style={styles.statusValue}>{dashboardStats.payments.overdue}</Text>
                  <Text style={styles.statusLabel}>Gecikmiş</Text>
                </View>
              </View>
            </View>

            {/* Maintenance Status Breakdown */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Bakım Durumu Detayı</Text>
              <View style={styles.statusGrid}>
                <View style={[styles.statusCard, { borderLeftColor: getStatusColor('PENDING') }]}>
                  <Text style={styles.statusValue}>{dashboardStats.maintenance.pending}</Text>
                  <Text style={styles.statusLabel}>Bekleyen</Text>
                </View>
                <View style={[styles.statusCard, { borderLeftColor: getStatusColor('IN_PROGRESS') }]}>
                  <Text style={styles.statusValue}>{dashboardStats.maintenance.inProgress}</Text>
                  <Text style={styles.statusLabel}>Devam Eden</Text>
                </View>
                <View style={[styles.statusCard, { borderLeftColor: getStatusColor('COMPLETED') }]}>
                  <Text style={styles.statusValue}>{dashboardStats.maintenance.completed}</Text>
                  <Text style={styles.statusLabel}>Tamamlanan</Text>
                </View>
              </View>
            </View>

            {/* Reservations if available */}
            {dashboardStats.reservations && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Rezervasyon Durumu</Text>
                <View style={styles.statusGrid}>
                  <View style={[styles.statusCard, { borderLeftColor: getStatusColor('PENDING') }]}>
                    <Text style={styles.statusValue}>{dashboardStats.reservations.pending}</Text>
                    <Text style={styles.statusLabel}>Bekleyen</Text>
                  </View>
                  <View style={[styles.statusCard, { borderLeftColor: getStatusColor('COMPLETED') }]}>
                    <Text style={styles.statusValue}>{dashboardStats.reservations.approved}</Text>
                    <Text style={styles.statusLabel}>Onaylanan</Text>
                  </View>
                  <View style={[styles.statusCard, { borderLeftColor: '#6B7280' }]}>
                    <Text style={styles.statusValue}>{dashboardStats.reservations.total}</Text>
                    <Text style={styles.statusLabel}>Toplam</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activePeriodButtonText: {
    color: 'white',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  summaryCard: {
    width: '48%',
    marginBottom: 16,
    marginRight: '2%',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 11,
    color: '#6B7280',
  },
  sectionContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  statusCard: {
    width: '48%',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
}); 
 
 
 