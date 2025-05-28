import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Dimensions, 
  TouchableOpacity,
  StatusBar 
} from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import AdminPageGuard from '../../components/AdminPageGuard';
import { apiServices } from '../../utils/api-services';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    users: {
      total: 125,
      active: 118,
      inactive: 7
    },
    payments: {
      total: 285000,
      pending: 45000,
      overdue: 12000
    },
    maintenance: {
      total: 28,
      pending: 8,
      inProgress: 5,
      completed: 15
    },
    announcements: {
      total: 12,
      active: 8
    }
  });
  
  const { user } = useUserStore();

  // Saat güncelleme
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // İlk yüklemede ve yenileme durumunda verileri getir
  const fetchDashboardData = async () => {
    try {
      setError(null);
      // Simulated delay for loading effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - gerçek API'den gelecek
      setStats({
        users: {
          total: 125,
          active: 118,
          inactive: 7
        },
        payments: {
          total: 285000,
          pending: 45000,
          overdue: 12000
        },
        maintenance: {
          total: 28,
          pending: 8,
          inProgress: 5,
          completed: 15
        },
        announcements: {
          total: 12,
          active: 8
        }
      });
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    gradient, 
    onPress,
    trend 
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
         gradient: [string, string];
    onPress: () => void;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient colors={gradient} style={styles.statGradient}>
        <View style={styles.statHeader}>
          <View style={styles.statIconContainer}>
            <Ionicons name={icon as any} size={24} color="white" />
          </View>
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={trend.isPositive ? "trending-up" : "trending-down"} 
                size={16} 
                color="white" 
              />
              <Text style={styles.trendText}>%{Math.abs(trend.value)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ 
    title, 
    description, 
    icon, 
    color, 
    onPress 
  }: {
    title: string;
    description: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="white" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4e7bff" />
        <LinearGradient colors={['#4e7bff', '#3b5bdb']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Dashboard yükleniyor...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <AdminPageGuard>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4e7bff" />
        
        {/* Modern Header */}
        <LinearGradient colors={['#4e7bff', '#3b5bdb']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Site Yönetimi</Text>
              <Text style={styles.headerSubtitle}>
                Hoş geldiniz, {user?.name?.split(' ')[0] || 'Yönetici'}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
            </View>
          </View>
        </LinearGradient>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4e7bff']} />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Ana Metrikler */}
            <View style={styles.metricsContainer}>
              <Text style={styles.sectionTitle}>📊 Ana Metrikler</Text>
              <View style={styles.metricsGrid}>
                <StatCard
                  title="Toplam Kullanıcı"
                  value={stats.users.total}
                  subtitle={`${stats.users.active} aktif`}
                  icon="people"
                  gradient={['#4e7bff', '#3b5bdb']}
                  onPress={() => router.push("/admin/residents")}
                  trend={{ value: 5.2, isPositive: true }}
                />
                <StatCard
                  title="Aylık Gelir"
                  value={`₺${(stats.payments.total / 1000).toFixed(0)}K`}
                  subtitle="Bu ay toplanan"
                  icon="cash"
                  gradient={['#4caf50', '#388e3c']}
                  onPress={() => router.push("/admin/payments")}
                  trend={{ value: 8.1, isPositive: true }}
                />
                <StatCard
                  title="Bekleyen Talepler"
                  value={stats.maintenance.pending}
                  subtitle={`${stats.maintenance.total} toplam`}
                  icon="construct"
                  gradient={['#ff9800', '#f57c00']}
                  onPress={() => router.push("/admin/maintenance")}
                  trend={{ value: 2.3, isPositive: false }}
                />
                <StatCard
                  title="Aktif Duyurular"
                  value={stats.announcements.active}
                  subtitle={`${stats.announcements.total} toplam`}
                  icon="megaphone"
                  gradient={['#6b7280', '#4b5563']}
                  onPress={() => router.push("/admin/announcements")}
                  trend={{ value: 12.5, isPositive: true }}
                />
              </View>
            </View>

            {/* Hızlı İşlemler */}
            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>⚡ Hızlı İşlemler</Text>
              <View style={styles.actionsGrid}>
                <QuickActionCard
                  title="Yeni Duyuru"
                  description="Site sakinlerine duyuru yayınla"
                  icon="megaphone-outline"
                  color="#4e7bff"
                  onPress={() => router.push("/admin/announcements")}
                />
                <QuickActionCard
                  title="Aidat Oluştur"
                  description="Yeni aidat kaydı oluştur"
                  icon="cash-outline"
                  color="#4caf50"
                  onPress={() => router.push("/admin/payments")}
                />
                <QuickActionCard
                  title="Kullanıcı Ekle"
                  description="Sisteme yeni kullanıcı ekle"
                  icon="person-add-outline"
                  color="#6b7280"
                  onPress={() => router.push("/admin/residents")}
                />
                <QuickActionCard
                  title="AI Raporları"
                  description="Yapay zeka destekli analizler"
                  icon="analytics-outline"
                  color="#ff9800"
                  onPress={() => router.push("/admin/reports")}
                />
              </View>
            </View>

            {/* Detaylı İstatistikler */}
            <View style={styles.detailsContainer}>
              <Text style={styles.sectionTitle}>📈 Detaylı İstatistikler</Text>
              
              {/* Aidat Durumu */}
              <Card style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleContainer}>
                    <Ionicons name="cash" size={20} color="#4e7bff" />
                    <Text style={styles.detailTitle}>Aidat Durumu</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/admin/payments")}>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Toplanan</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '75%', backgroundColor: '#4caf50' }]} />
                    </View>
                    <Text style={styles.progressValue}>₺{stats.payments.total.toLocaleString()}</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Bekleyen</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '20%', backgroundColor: '#ff9800' }]} />
                    </View>
                    <Text style={styles.progressValue}>₺{stats.payments.pending.toLocaleString()}</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Gecikmiş</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '5%', backgroundColor: '#f44336' }]} />
                    </View>
                    <Text style={styles.progressValue}>₺{stats.payments.overdue.toLocaleString()}</Text>
                  </View>
                </View>
              </Card>

              {/* Bakım Talepleri */}
              <Card style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View style={styles.detailTitleContainer}>
                    <Ionicons name="construct" size={20} color="#ff9800" />
                    <Text style={styles.detailTitle}>Bakım Talepleri</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/admin/maintenance")}>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.maintenanceGrid}>
                  <View style={styles.maintenanceItem}>
                    <View style={[styles.maintenanceBadge, { backgroundColor: '#f44336' }]}>
                      <Text style={styles.maintenanceBadgeText}>{stats.maintenance.pending}</Text>
                    </View>
                    <Text style={styles.maintenanceLabel}>Bekleyen</Text>
                  </View>
                  <View style={styles.maintenanceItem}>
                    <View style={[styles.maintenanceBadge, { backgroundColor: '#ff9800' }]}>
                      <Text style={styles.maintenanceBadgeText}>{stats.maintenance.inProgress}</Text>
                    </View>
                    <Text style={styles.maintenanceLabel}>İşlemde</Text>
                  </View>
                  <View style={styles.maintenanceItem}>
                    <View style={[styles.maintenanceBadge, { backgroundColor: '#4caf50' }]}>
                      <Text style={styles.maintenanceBadgeText}>{stats.maintenance.completed}</Text>
                    </View>
                    <Text style={styles.maintenanceLabel}>Tamamlanan</Text>
                  </View>
                </View>
              </Card>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}
      </View>
    </AdminPageGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  metricsContainer: {
    marginTop: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  statCard: {
    width: (width - 60) / 2,
    margin: 10,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    padding: 20,
    borderRadius: 16,
    minHeight: 140,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionsContainer: {
    marginTop: 30,
  },
  actionsGrid: {
    paddingHorizontal: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  detailsContainer: {
    marginTop: 30,
  },
  detailCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  progressContainer: {
    padding: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  maintenanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  maintenanceItem: {
    alignItems: 'center',
  },
  maintenanceBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  maintenanceBadgeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  maintenanceLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
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
    backgroundColor: '#4e7bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
}); 