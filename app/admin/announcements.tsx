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
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, Announcement, AnnouncementData } from '../../services/api';

export default function AdminAnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    targetAudience: 'ALL' | 'BLOCK' | 'RESIDENTS';
    block: string;
    isActive: boolean;
    isPinned: boolean;
  }>({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    targetAudience: 'ALL',
    block: '',
    isActive: true,
    isPinned: false,
  });

  const loadAnnouncements = async () => {
    try {
      console.log('📢 Duyurular yükleniyor...');
      const data = await getAnnouncements();
      setAnnouncements(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      console.log('✅ Duyurular başarıyla yüklendi:', data.length);
    } catch (error: any) {
      console.error('❌ Duyurular yüklenirken hata:', error);
      Alert.alert('Hata', error.message || 'Duyurular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  const openModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category || 'GENERAL',
        priority: announcement.priority || 'MEDIUM',
        targetAudience: announcement.targetAudience || 'ALL',
        block: announcement.block || '',
        isActive: announcement.isActive !== false,
        isPinned: announcement.isPinned || false,
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        targetAudience: 'ALL',
        block: '',
        isActive: true,
        isPinned: false,
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      category: 'GENERAL',
      priority: 'MEDIUM',
      targetAudience: 'ALL',
      block: '',
      isActive: true,
      isPinned: false,
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Hata', 'Başlık ve içerik alanları zorunludur');
      return;
    }

    try {
      const announcementData: AnnouncementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        block: formData.targetAudience === 'BLOCK' ? formData.block : undefined,
        isActive: formData.isActive,
        isPinned: formData.isPinned,
      };

      if (editingAnnouncement) {
        console.log('📢 Duyuru güncelleniyor:', editingAnnouncement._id);
        await updateAnnouncement(editingAnnouncement._id, announcementData);
        Alert.alert('Başarılı', 'Duyuru güncellendi');
      } else {
        console.log('📢 Yeni duyuru oluşturuluyor');
        await createAnnouncement(announcementData);
        Alert.alert('Başarılı', 'Duyuru oluşturuldu');
      }

      closeModal();
      loadAnnouncements();
    } catch (error: any) {
      console.error('❌ Duyuru kaydedilirken hata:', error);
      Alert.alert('Hata', error.message || 'Duyuru kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = (announcement: Announcement) => {
    Alert.alert(
      'Duyuru Sil',
      `"${announcement.title}" duyurusunu silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Duyuru siliniyor:', announcement._id);
              await deleteAnnouncement(announcement._id);
              Alert.alert('Başarılı', 'Duyuru silindi');
              loadAnnouncements();
            } catch (error: any) {
              console.error('❌ Duyuru silinirken hata:', error);
              Alert.alert('Hata', error.message || 'Duyuru silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const toggleStatus = async (announcement: Announcement) => {
    try {
      console.log('🔄 Duyuru durumu değiştiriliyor:', announcement._id);
      await updateAnnouncement(announcement._id, {
        isActive: !announcement.isActive,
      });
      loadAnnouncements();
    } catch (error: any) {
      console.error('❌ Duyuru durumu güncellenirken hata:', error);
      Alert.alert('Hata', error.message || 'Duyuru durumu güncellenirken bir hata oluştu');
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'GENERAL': return 'Genel';
      case 'MAINTENANCE': return 'Bakım';
      case 'PAYMENT': return 'Ödeme';
      case 'EVENT': return 'Etkinlik';
      case 'EMERGENCY': return 'Acil';
      default: return category;
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'GENERAL': return '#3B82F6';
      case 'MAINTENANCE': return '#8B5CF6';
      case 'PAYMENT': return '#10B981';
      case 'EVENT': return '#F59E0B';
      case 'EMERGENCY': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Duyurular yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Duyurular</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{announcements.length}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>
            {announcements.filter(a => a.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>
            {announcements.filter(a => !a.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Pasif</Text>
        </View>
      </View>

      {/* Duyuru Listesi */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Henüz duyuru bulunmuyor</Text>
            <Text style={styles.emptySubtext}>Yeni duyuru eklemek için + butonuna tıklayın</Text>
          </View>
        ) : (
          announcements.map((announcement) => (
            <View key={announcement._id} style={[
              styles.announcementCard,
              !announcement.isActive && styles.inactiveCard
            ]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{announcement.title}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.statusButton, announcement.isActive ? styles.activeButton : styles.inactiveButton]}
                      onPress={() => toggleStatus(announcement)}
                    >
                      <Text style={[styles.statusButtonText, announcement.isActive ? styles.activeButtonText : styles.inactiveButtonText]}>
                        {announcement.isActive ? 'Aktif' : 'Pasif'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openModal(announcement)}
                    >
                      <Ionicons name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(announcement)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <View style={[styles.badge, { backgroundColor: getCategoryColor(announcement.category || 'GENERAL') }]}>
                    <Text style={styles.badgeText}>{getCategoryText(announcement.category || 'GENERAL')}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: getPriorityColor(announcement.priority || 'MEDIUM') }]}>
                    <Text style={styles.badgeText}>{getPriorityText(announcement.priority || 'MEDIUM')}</Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardContent}>{announcement.content}</Text>
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
              <Text style={styles.modalTitle}>
                {editingAnnouncement ? 'Duyuru Düzenle' : 'Yeni Duyuru'}
              </Text>
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
                  placeholder="Duyuru başlığı"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>İçerik *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.content}
                  onChangeText={(text) => setFormData({ ...formData, content: text })}
                  placeholder="Duyuru içeriği"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Kategori</Text>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() => {
                        Alert.alert(
                          'Kategori Seç',
                          '',
                          [
                            { text: 'Genel', onPress: () => setFormData({ ...formData, category: 'GENERAL' }) },
                            { text: 'Bakım', onPress: () => setFormData({ ...formData, category: 'MAINTENANCE' }) },
                            { text: 'Ödeme', onPress: () => setFormData({ ...formData, category: 'PAYMENT' }) },
                            { text: 'Etkinlik', onPress: () => setFormData({ ...formData, category: 'EVENT' }) },
                            { text: 'Acil', onPress: () => setFormData({ ...formData, category: 'EMERGENCY' }) },
                            { text: 'İptal', style: 'cancel' },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.pickerText}>{getCategoryText(formData.category)}</Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Öncelik</Text>
                  <View style={styles.pickerContainer}>
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
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Hedef Kitle</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => {
                      Alert.alert(
                        'Hedef Kitle Seç',
                        '',
                        [
                          { text: 'Tümü', onPress: () => setFormData({ ...formData, targetAudience: 'ALL' }) },
                          { text: 'Blok', onPress: () => setFormData({ ...formData, targetAudience: 'BLOCK' }) },
                          { text: 'Kiracılar', onPress: () => setFormData({ ...formData, targetAudience: 'RESIDENTS' }) },
                          { text: 'İptal', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.pickerText}>{formData.targetAudience === 'ALL' ? 'Tümü' : formData.targetAudience === 'BLOCK' ? 'Blok' : 'Kiracılar'}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Blok</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.block}
                  onChangeText={(text) => setFormData({ ...formData, block: text })}
                  placeholder="Blok"
                />
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
                >
                  <View style={[styles.checkbox, formData.isActive && styles.checkboxChecked]}>
                    {formData.isActive && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Aktif</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingAnnouncement ? 'Güncelle' : 'Kaydet'}
                </Text>
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
  announcementCard: {
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
  inactiveCard: {
    opacity: 0.6,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  activeButton: {
    backgroundColor: '#D1FAE5',
  },
  inactiveButton: {
    backgroundColor: '#FEE2E2',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#065F46',
  },
  inactiveButtonText: {
    color: '#991B1B',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  cardDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
}); 