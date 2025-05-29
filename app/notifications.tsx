import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Card, 
  ActivityIndicator, 
  Badge,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useUserStore } from '../store/user';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useSocket } from '../hooks/useSocket';
import { getNotifications, markNotificationAsRead, deleteNotification, Notification } from '../services/api';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Socket bağlantısı
  const { notifications: socketNotifications } = useSocket();
  
  // Bildirimleri yükle
  const loadNotifications = useCallback(async () => {
    try {
      console.log('📥 Bildirimler yükleme başlatıldı...');
      setLoading(true);
      const data = await getNotifications({ limit: 50 });
      console.log('📥 API\'den gelen bildirimler:', data);
      console.log('📥 Bildirim sayısı:', Array.isArray(data) ? data.length : 'Array değil');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Bildirimler yüklenirken hata:', error);
      Alert.alert('Hata', 'Bildirimler yüklenemedi');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Socket bildirimlerini API bildirimlerine dönüştür
  const convertSocketNotifications = useCallback((socketNotifs: any[]): Notification[] => {
    // Güvenli kontrol: socketNotifs'in array olduğundan emin ol
    if (!Array.isArray(socketNotifs)) {
      return [];
    }
    
    return socketNotifs
      .filter(socketNotif => socketNotif && typeof socketNotif === 'object')
      .map(socketNotif => ({
        _id: `socket-${socketNotif.id || Date.now()}`,
        userId: user?.id || '',
        title: socketNotif.title || 'Bildirim',
        message: socketNotif.message || '',
        type: socketNotif.type || 'announcement',
        isRead: socketNotif.read || false,
        data: socketNotif.data || {},
        createdAt: socketNotif.timestamp ? socketNotif.timestamp.toISOString() : new Date().toISOString(),
        updatedAt: socketNotif.timestamp ? socketNotif.timestamp.toISOString() : new Date().toISOString()
      }));
  }, [user?.id]);
  
  // Tüm bildirimleri birleştir (API + Socket)
  const allNotifications = useMemo(() => {
    const apiNotifications = Array.isArray(notifications) ? notifications : [];
    const convertedSocketNotifications = convertSocketNotifications(socketNotifications || []);
    
    console.log('📊 Bildirim istatistikleri:', {
      apiCount: apiNotifications.length,
      socketCount: convertedSocketNotifications.length,
      totalSocket: socketNotifications?.length || 0
    });
    
    // Birleştir ve tarihe göre sırala
    const combined = [...apiNotifications, ...convertedSocketNotifications];
    const sorted = combined.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    console.log('📊 Toplam birleştirilmiş bildirim sayısı:', sorted.length);
    return sorted;
  }, [notifications, socketNotifications, convertSocketNotifications]);
  
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  
  // Yenileme işlemi
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);
  
  // Bildirimi okundu olarak işaretle
  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification || notification.isRead) return;
    
    console.log('📖 Bildirim okundu olarak işaretleniyor:', notification._id, notification.title);
    
    try {
      // Socket bildirimi ise
      if (notification._id.startsWith('socket-')) {
        console.log('📖 Socket bildirimi okundu olarak işaretleniyor...');
        // Socket bildirimi için local state güncelle
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        console.log('✅ Socket bildirimi local state\'de güncellendi');
      } else {
        console.log('📖 API bildirimi okundu olarak işaretleniyor...');
        // API bildirimi ise
        await markNotificationAsRead(notification._id);
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        console.log('✅ API bildirimi başarıyla güncellendi');
      }
    } catch (error) {
      console.error('❌ Bildirim okundu olarak işaretlenirken hata:', error);
      Alert.alert('Hata', 'Bildirim güncellenemedi');
    }
  };
  
  // Bildirimi sil
  const handleDeleteNotification = async (notificationId: string) => {
    console.log('🗑️ Bildirim silme işlemi başlatılıyor:', notificationId);
    
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              // Socket bildirimi ise
              if (notificationId.startsWith('socket-')) {
                console.log('🗑️ Socket bildirimi siliniyor...');
                // Socket bildirimi için sadece local state'den kaldır
                setNotifications(prev => prev.filter(n => n._id !== notificationId));
                console.log('✅ Socket bildirimi local state\'den kaldırıldı');
              } else {
                console.log('🗑️ API bildirimi siliniyor...');
                // API bildirimi ise
                await deleteNotification(notificationId);
                setNotifications(prev => prev.filter(n => n._id !== notificationId));
                console.log('✅ API bildirimi başarıyla silindi');
              }
            } catch (error) {
              console.error('❌ Bildirim silinirken hata:', error);
              Alert.alert('Hata', 'Bildirim silinemedi');
            }
          }
        }
      ]
    );
  };
  
  // Bildirim tipine göre ikon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement': return 'megaphone';
      case 'maintenance': return 'construct';
      case 'payment': return 'cash';
      case 'reservation': return 'calendar';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };
  
  // Bildirim tipine göre renk
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'announcement': return Colors.primary;
      case 'maintenance': return '#f59e0b';
      case 'payment': return '#10b981';
      case 'reservation': return '#8b5cf6';
      case 'system': return '#6b7280';
      default: return Colors.primary;
    }
  };
  
  // Okunmamış ve okunmuş bildirimleri ayır
  const unreadNotifications = allNotifications.filter(n => !n.isRead);
  const readNotifications = allNotifications.filter(n => n.isRead);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Bildirimler</Text>
            {unreadNotifications.length > 0 && (
              <Badge style={styles.headerBadge}>{unreadNotifications.length}</Badge>
            )}
          </View>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {allNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>Bildirim Yok</Text>
              <Text style={styles.emptyStateText}>
                Henüz hiç bildiriminiz bulunmuyor
              </Text>
            </View>
          ) : (
            <>
              {/* Okunmamış Bildirimler */}
              {unreadNotifications.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Okunmamış ({unreadNotifications.length})
                  </Text>
                  {unreadNotifications.map((notification) => (
                    <TouchableOpacity
                      key={notification._id}
                      style={[styles.notificationCard, styles.unreadCard]}
                      onPress={() => handleMarkAsRead(notification)}
                      activeOpacity={0.7}
                    >
                      <Card style={styles.card}>
                        <Card.Content style={styles.cardContent}>
                          <View style={styles.notificationHeader}>
                            <View style={styles.notificationLeft}>
                              <View style={[
                                styles.notificationIcon,
                                { backgroundColor: getNotificationColor(notification.type) }
                              ]}>
                                <Ionicons 
                                  name={getNotificationIcon(notification.type) as any} 
                                  size={20} 
                                  color="white" 
                                />
                              </View>
                              <View style={styles.notificationContent}>
                                <Text style={styles.notificationTitle} numberOfLines={2}>
                                  {notification.title}
                                </Text>
                                <Text style={styles.notificationMessage} numberOfLines={3}>
                                  {notification.message}
                                </Text>
                                <Text style={styles.notificationDate}>
                                  {format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteNotification(notification._id)}
                            >
                              <Ionicons name="close" size={20} color="#6b7280" />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.unreadIndicator} />
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Okunmuş Bildirimler */}
              {readNotifications.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Okunmuş ({readNotifications.length})
                  </Text>
                  {readNotifications.map((notification) => (
                    <TouchableOpacity
                      key={notification._id}
                      style={styles.notificationCard}
                      activeOpacity={0.7}
                    >
                      <Card style={styles.card}>
                        <Card.Content style={styles.cardContent}>
                          <View style={styles.notificationHeader}>
                            <View style={styles.notificationLeft}>
                              <View style={[
                                styles.notificationIcon,
                                { backgroundColor: '#e5e7eb' }
                              ]}>
                                <Ionicons 
                                  name={getNotificationIcon(notification.type) as any} 
                                  size={20} 
                                  color="#6b7280" 
                                />
                              </View>
                              <View style={styles.notificationContent}>
                                <Text style={[styles.notificationTitle, styles.readTitle]} numberOfLines={2}>
                                  {notification.title}
                                </Text>
                                <Text style={[styles.notificationMessage, styles.readMessage]} numberOfLines={3}>
                                  {notification.message}
                                </Text>
                                <Text style={styles.notificationDate}>
                                  {format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteNotification(notification._id)}
                            >
                              <Ionicons name="close" size={20} color="#6b7280" />
                            </TouchableOpacity>
                          </View>
                        </Card.Content>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerBadge: {
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  notificationCard: {
    marginBottom: 12,
  },
  unreadCard: {
    position: 'relative',
  },
  card: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  readTitle: {
    color: '#6b7280',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  readMessage: {
    color: '#9ca3af',
  },
  notificationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteButton: {
    padding: 4,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 