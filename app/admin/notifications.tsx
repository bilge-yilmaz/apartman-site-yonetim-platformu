import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/user';
import { sendSocketNotification, getSentNotifications, SentNotification } from '../../services/api';

interface NotificationData {
  id: string;
  type: 'announcement' | 'maintenance' | 'payment' | 'emergency' | 'general';
  title: string;
  message: string;
  targetRole: 'ALL' | 'RESIDENT' | 'ADMIN';
  targetApartment?: string;
  targetBlock?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  sentCount: number;
  status: 'SENT' | 'PENDING' | 'FAILED';
}

export default function AdminNotificationsScreen() {
  const [sentNotifications, setSentNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // API bağlantısı için
  const { user } = useUserStore();

  const [formData, setFormData] = useState({
    type: 'general',
    title: '',
    message: '',
    targetRole: 'ALL' as 'ALL' | 'RESIDENT' | 'ADMIN',
    targetApartment: '',
    targetBlock: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
  });

  useEffect(() => {
    loadSentNotifications();
  }, []);

  const loadSentNotifications = async () => {
    try {
      console.log('📢 Gönderilen bildirimler yükleniyor...');
      
      // API'den gerçek gönderilen bildirimleri çek
      const apiNotifications = await getSentNotifications({ limit: 50 });
      
      // API verilerini frontend formatına çevir
      const formattedNotifications: NotificationData[] = apiNotifications.map((notification: SentNotification) => ({
        id: notification._id,
        type: notification.type as 'announcement' | 'maintenance' | 'payment' | 'emergency' | 'general',
        title: notification.title,
        message: notification.message,
        targetRole: notification.targetRole as 'ALL' | 'RESIDENT' | 'ADMIN',
        targetApartment: notification.targetApartment,
        targetBlock: notification.targetBlock,
        priority: notification.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        createdAt: notification.createdAt,
        sentCount: notification.targetCount,
        status: 'SENT' as const
      }));
      
      setSentNotifications(formattedNotifications);
      console.log('✅ Gönderilen bildirimler yüklendi:', formattedNotifications.length);
    } catch (error: any) {
      console.error('❌ Bildirimler yüklenirken hata:', error);
      // Hata durumunda boş array set et
      setSentNotifications([]);
      Alert.alert('Hata', 'Gönderilen bildirimler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSentNotifications();
  };

  const openModal = () => {
    setFormData({
      type: 'general',
      title: '',
      message: '',
      targetRole: 'ALL',
      targetApartment: '',
      targetBlock: '',
      priority: 'MEDIUM',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      Alert.alert('Hata', 'Başlık ve mesaj alanları zorunludur');
      return;
    }

    try {
      setLoading(true);
      console.log('📤 Bildirim gönderiliyor...');

      const notificationData = {
        type: formData.type,
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetRole: formData.targetRole === 'ALL' ? 'ALL' : 
                   formData.targetRole === 'ADMIN' ? 'ADMIN' : 
                   formData.targetRole === 'RESIDENT' ? 'RESIDENT' : 'ALL',
        targetRoles: formData.targetRole === 'ALL' ? ['ADMIN', 'RESIDENT'] : 
                    formData.targetRole === 'ADMIN' ? ['ADMIN'] : 
                    formData.targetRole === 'RESIDENT' ? ['RESIDENT'] : ['ADMIN', 'RESIDENT'],
        targetApartment: formData.targetApartment.trim() || undefined,
        targetApartments: formData.targetApartment.trim() ? [formData.targetApartment.trim()] : undefined,
        targetBlock: formData.targetBlock.trim() || undefined,
        targetBlocks: formData.targetBlock.trim() ? [formData.targetBlock.trim()] : undefined,
        priority: formData.priority,
        senderName: user?.name || 'Admin',
        timestamp: new Date().toISOString(),
      };

      // API ile bildirim gönder (hem Socket.IO hem de veritabanına kayıt)
      const response = await sendSocketNotification(notificationData);
      console.log('✅ Bildirim API yanıtı:', response);

      Alert.alert('Başarılı', `Bildirim başarıyla gönderildi (${response.targetCount} kişiye)`);
      closeModal();
      
      // Listeyi API'den yenile
      await loadSentNotifications();
    } catch (error: any) {
      console.error('❌ Bildirim gönderme hatası:', error);
      Alert.alert('Hata', error.message || 'Bildirim gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'announcement': return 'Duyuru';
      case 'maintenance': return 'Bakım';
      case 'payment': return 'Ödeme';
      case 'emergency': return 'Acil';
      case 'general': return 'Genel';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return '#3B82F6';
      case 'maintenance': return '#8B5CF6';
      case 'payment': return '#10B981';
      case 'emergency': return '#EF4444';
      case 'general': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Düşük';
      case 'MEDIUM': return 'Orta';
      case 'HIGH': return 'Yüksek';
      case 'URGENT': return 'Acil';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HIGH': return '#F97316';
      case 'URGENT': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTargetText = (targetRole: string, targetApartment?: string, targetBlock?: string) => {
    if (targetApartment) return `Daire ${targetApartment}`;
    if (targetBlock) return `Blok ${targetBlock}`;
    switch (targetRole) {
      case 'ALL': return 'Tüm Kullanıcılar';
      case 'RESIDENT': return 'Sakinler';
      case 'ADMIN': return 'Yöneticiler';
      default: return targetRole;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirim Yönetimi</Text>
        <View style={styles.headerActions}>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{isConnected ? 'Bağlı' : 'Bağlantı Yok'}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openModal}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{sentNotifications.length}</Text>
          <Text style={styles.statLabel}>Gönderilen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>
            {sentNotifications.filter(n => n.priority === 'URGENT').length}
          </Text>
          <Text style={styles.statLabel}>Acil</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>
            {sentNotifications.filter(n => n.status === 'SENT').length}
          </Text>
          <Text style={styles.statLabel}>Başarılı</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>
            {sentNotifications.filter(n => n.status === 'FAILED').length}
          </Text>
          <Text style={styles.statLabel}>Başarısız</Text>
        </View>
      </View>

      {/* Bildirim Listesi */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {sentNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Henüz bildirim gönderilmemiş</Text>
            <Text style={styles.emptySubtext}>Yeni bildirim göndermek için + butonuna tıklayın</Text>
          </View>
        ) : (
          sentNotifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <View style={styles.cardMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(notification.type) }]}>
                      <Text style={styles.badgeText}>{getTypeText(notification.type)}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(notification.priority) }]}>
                      <Text style={styles.badgeText}>{getPriorityText(notification.priority)}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={styles.targetInfo}>
                  <Ionicons name="people-outline" size={16} color="#6B7280" />
                  <Text style={styles.targetText}>
                    {getTargetText(notification.targetRole, notification.targetApartment, notification.targetBlock)}
                  </Text>
                </View>
                <View style={styles.sentInfo}>
                  <Text style={styles.sentCount}>{notification.sentCount} kişiye gönderildi</Text>
                  <Text style={styles.sentDate}>
                    {new Date(notification.createdAt).toLocaleDateString('tr-TR')} {new Date(notification.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Bildirim Gönder</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Başlık *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Bildirim başlığı"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mesaj *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.message}
                  onChangeText={(text) => setFormData({ ...formData, message: text })}
                  placeholder="Bildirim mesajı"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Tip</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => {
                      Alert.alert(
                        'Bildirim Tipi Seç',
                        '',
                        [
                          { text: 'Genel', onPress: () => setFormData({ ...formData, type: 'general' }) },
                          { text: 'Duyuru', onPress: () => setFormData({ ...formData, type: 'announcement' }) },
                          { text: 'Bakım', onPress: () => setFormData({ ...formData, type: 'maintenance' }) },
                          { text: 'Ödeme', onPress: () => setFormData({ ...formData, type: 'payment' }) },
                          { text: 'Acil', onPress: () => setFormData({ ...formData, type: 'emergency' }) },
                          { text: 'İptal', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.pickerText}>{getTypeText(formData.type)}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Öncelik</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => {
                      Alert.alert(
                        'Öncelik Seç',
                        '',
                        [
                          { text: 'Düşük', onPress: () => setFormData({ ...formData, priority: 'LOW' }) },
                          { text: 'Orta', onPress: () => setFormData({ ...formData, priority: 'MEDIUM' }) },
                          { text: 'Yüksek', onPress: () => setFormData({ ...formData, priority: 'HIGH' }) },
                          { text: 'Acil', onPress: () => setFormData({ ...formData, priority: 'URGENT' }) },
                          { text: 'İptal', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.pickerText}>{getPriorityText(formData.priority)}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Hedef Kitle</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    Alert.alert(
                      'Hedef Kitle Seç',
                      '',
                      [
                        { text: 'Tüm Kullanıcılar', onPress: () => setFormData({ ...formData, targetRole: 'ALL' }) },
                        { text: 'Sakinler', onPress: () => setFormData({ ...formData, targetRole: 'RESIDENT' }) },
                        { text: 'Yöneticiler', onPress: () => setFormData({ ...formData, targetRole: 'ADMIN' }) },
                        { text: 'İptal', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.pickerText}>{getTargetText(formData.targetRole)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {formData.targetRole === 'RESIDENT' && (
                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Belirli Daire (İsteğe bağlı)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.targetApartment}
                      onChangeText={(text) => setFormData({ ...formData, targetApartment: text })}
                      placeholder="101"
                    />
                  </View>

                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Belirli Blok (İsteğe bağlı)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.targetBlock}
                      onChangeText={(text) => setFormData({ ...formData, targetBlock: text })}
                      placeholder="A"
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, (!isConnected || loading) && styles.disabledButton]} 
                onPress={handleSendNotification}
                disabled={!isConnected || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.sendButtonText}>Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetText: {
    fontSize: 12,
    color: '#6B7280',
  },
  sentInfo: {
    alignItems: 'flex-end',
  },
  sentCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  sentDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
}); 
 
 
 