import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, useTheme, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import AdminPageGuard from '../../components/AdminPageGuard';
import { apiServices } from '../../utils/api-services';

export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    users: {
      total: 0,
      active: 0,
      inactive: 0
    },
    payments: {
      total: 0,
      pending: 0,
      overdue: 0
    },
    maintenance: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0
    },
    announcements: {
      total: 0,
      active: 0
    }
  });
  
  const { user } = useUserStore();
  const theme = useTheme();

  // İlk yüklemede ve yenileme durumunda verileri getir
  const fetchDashboardData = async () => {
    try {
      setError(null);
      // API'den dashboard verilerini getir
      const dashboardStats = await apiServices.admin.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Dashboard verileri alınırken hata:', err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sayfa ilk yüklendiğinde verileri getir
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Yetki kontrolü
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.replace('/auth/login');
    }
  }, [user]);

  // Yenileme işlemi
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  return (
    <AdminPageGuard>
      <View style={styles.container}>
        <View style={styles.safeArea} />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Site Yönetimi</Text>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={fetchDashboardData}
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
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Hoş Geldiniz, {user?.name?.split(' ')[0] || 'Yönetici'}</Text>
              <Text style={styles.welcomeSubtitle}>Site yönetim paneline hoş geldiniz.</Text>
            </View>

            {/* Kullanıcı İstatistikleri */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Kullanıcı İstatistikleri</Title>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.users.total}</Text>
                    <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.success }]}>{stats.users.active}</Text>
                    <Text style={styles.statLabel}>Aktif Kullanıcı</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.error }]}>{stats.users.inactive}</Text>
                    <Text style={styles.statLabel}>Pasif Kullanıcı</Text>
                  </View>
                </View>
                <Button 
                  mode="outlined" 
                  onPress={() => router.push("/admin/residents")}
                  style={styles.cardButton}
                >
                  Kullanıcıları Yönet
                </Button>
              </Card.Content>
            </Card>

            {/* Aidat İstatistikleri */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Aidat İstatistikleri</Title>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.success }]}>₺{stats.payments.total.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Toplanan Aidat</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.warning }]}>₺{stats.payments.pending.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Bekleyen Aidat</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.error }]}>₺{stats.payments.overdue.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Gecikmiş Aidat</Text>
                  </View>
                </View>
                <Button 
                  mode="outlined" 
                  onPress={() => router.push("/admin/payments")}
                  style={styles.cardButton}
                >
                  Aidatları Yönet
                </Button>
              </Card.Content>
            </Card>

            {/* Bakım Talepleri */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Bakım Talepleri</Title>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.maintenance.total}</Text>
                    <Text style={styles.statLabel}>Toplam Talep</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.warning }]}>{stats.maintenance.pending}</Text>
                    <Text style={styles.statLabel}>Bekleyen</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.info }]}>{stats.maintenance.inProgress}</Text>
                    <Text style={styles.statLabel}>İşlemde</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.success }]}>{stats.maintenance.completed}</Text>
                    <Text style={styles.statLabel}>Tamamlanan</Text>
                  </View>
                </View>
                <Button 
                  mode="outlined" 
                  onPress={() => router.push("/admin/maintenance")}
                  style={styles.cardButton}
                >
                  Talepleri Yönet
                </Button>
              </Card.Content>
            </Card>

            {/* Son Duyurular */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Son Duyurular</Title>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.announcements.total}</Text>
                    <Text style={styles.statLabel}>Toplam Duyuru</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.success }]}>{stats.announcements.active}</Text>
                    <Text style={styles.statLabel}>Aktif Duyuru</Text>
                  </View>
                </View>
                <Button 
                  mode="outlined" 
                  onPress={() => router.push("/admin/announcements")}
                  style={styles.cardButton}
                >
                  Duyuruları Yönet
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>
        )}
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
  welcomeSection: {
    padding: 16,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  cardButton: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
}); 