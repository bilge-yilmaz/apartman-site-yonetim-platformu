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
import { MaintenanceStorage, MaintenanceRequest } from '../../services/offlineStorage';

export default function AdminMaintenanceScreen() {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [formData, setFormData] = useState<{
    apartmentNo: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'ELEVATOR' | 'OTHER';
  assignedTo?: string;
    estimatedCost?: string;
    actualCost?: string;
  }>({
      apartmentNo: '',
    title: '',
    description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
    category: 'OTHER',
  });

  const loadMaintenanceRequests = async () => {
    try {
      const data = await MaintenanceStorage.getAll();
      setMaintenanceRequests(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Bakım talepleri yüklenirken hata:', error);
      Alert.alert('Hata', 'Bakım talepleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMaintenanceRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMaintenanceRequests();
  };

  const openModal = (request?: MaintenanceRequest) => {
    if (request) {
      setEditingRequest(request);
      setFormData({
        apartmentNo: request.apartmentNo,
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
        category: request.category,
        assignedTo: request.assignedTo || '',
        estimatedCost: request.estimatedCost?.toString() || '',
        actualCost: request.actualCost?.toString() || '',
      });
    } else {
      setEditingRequest(null);
      setFormData({
        apartmentNo: '',
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        category: 'OTHER',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingRequest(null);
    setFormData({
      apartmentNo: '',
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      category: 'OTHER',
    });
  };

  const handleSave = async () => {
    if (!formData.apartmentNo.trim() || !formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Hata', 'Daire no, başlık ve açıklama alanları zorunludur');
      return;
    }

    try {
      const requestData = {
        apartmentNo: formData.apartmentNo.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        category: formData.category,
        assignedTo: formData.assignedTo?.trim() || undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
        ...(formData.status === 'IN_PROGRESS' && !editingRequest?.startDate && { startDate: new Date().toISOString() }),
        ...(formData.status === 'COMPLETED' && !editingRequest?.completionDate && { completionDate: new Date().toISOString() }),
      };

      if (editingRequest) {
        await MaintenanceStorage.update(editingRequest.id, requestData);
        Alert.alert('Başarılı', 'Bakım talebi güncellendi');
      } else {
        await MaintenanceStorage.create(requestData);
        Alert.alert('Başarılı', 'Bakım talebi oluşturuldu');
      }

      closeModal();
      loadMaintenanceRequests();
    } catch (error) {
      console.error('Bakım talebi kaydedilirken hata:', error);
      Alert.alert('Hata', 'Bakım talebi kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = (request: MaintenanceRequest) => {
    Alert.alert(
      'Bakım Talebi Sil',
      `"${request.title}" talebini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await MaintenanceStorage.delete(request.id);
              Alert.alert('Başarılı', 'Bakım talebi silindi');
              loadMaintenanceRequests();
            } catch (error) {
              console.error('Bakım talebi silinirken hata:', error);
              Alert.alert('Hata', 'Bakım talebi silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const updateStatus = async (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'IN_PROGRESS' && !request.startDate) {
        updateData.startDate = new Date().toISOString();
      }
      
      if (newStatus === 'COMPLETED' && !request.completionDate) {
        updateData.completionDate = new Date().toISOString();
      }

      await MaintenanceStorage.update(request.id, updateData);
      loadMaintenanceRequests();
      Alert.alert('Başarılı', 'Durum güncellendi');
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      Alert.alert('Hata', 'Durum güncellenirken bir hata oluştu');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Bekliyor';
      case 'IN_PROGRESS': return 'Devam Ediyor';
      case 'COMPLETED': return 'Tamamlandı';
      case 'CANCELLED': return 'İptal Edildi';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'IN_PROGRESS': return '#3B82F6';
      case 'COMPLETED': return '#10B981';
      case 'CANCELLED': return '#6B7280';
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

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'PLUMBING': return 'Tesisatçı';
      case 'ELECTRICAL': return 'Elektrikçi';
      case 'HVAC': return 'Klima/Isıtma';
      case 'STRUCTURAL': return 'Yapısal';
      case 'ELEVATOR': return 'Asansör';
      case 'OTHER': return 'Diğer';
      default: return category;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // İstatistikler
  const pendingCount = maintenanceRequests.filter(r => r.status === 'PENDING').length;
  const inProgressCount = maintenanceRequests.filter(r => r.status === 'IN_PROGRESS').length;
  const completedCount = maintenanceRequests.filter(r => r.status === 'COMPLETED').length;
  const urgentCount = maintenanceRequests.filter(r => r.priority === 'URGENT').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Bakım talepleri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bakım Talepleri</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                  
      {/* İstatistikler */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>Devam Eden</Text>
                  </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
                    </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{urgentCount}</Text>
          <Text style={styles.statLabel}>Acil</Text>
                    </View>
                  </View>
                  
      {/* Bakım Talepleri Listesi */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {maintenanceRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Henüz bakım talebi bulunmuyor</Text>
            <Text style={styles.emptySubtext}>Yeni talep eklemek için + butonuna tıklayın</Text>
          </View>
        ) : (
          maintenanceRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.requestTitle}>{request.title}</Text>
                  <View style={styles.cardActions}>
                    {request.status === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => updateStatus(request, 'IN_PROGRESS')}
                      >
                        <Ionicons name="play" size={14} color="white" />
                        <Text style={styles.startButtonText}>Başlat</Text>
                      </TouchableOpacity>
                    )}
                    {request.status === 'IN_PROGRESS' && (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => updateStatus(request, 'COMPLETED')}
                      >
                        <Ionicons name="checkmark" size={14} color="white" />
                        <Text style={styles.completeButtonText}>Tamamla</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openModal(request)}
                    >
                      <Ionicons name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(request)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.apartmentNo}>Daire {request.apartmentNo}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
                    <Text style={styles.priorityText}>{getPriorityText(request.priority)}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.description}>{request.description}</Text>
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Kategori:</Text>
                    <Text style={styles.detailValue}>{getCategoryText(request.category)}</Text>
                  </View>
                  {request.assignedTo && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Atanan:</Text>
                      <Text style={styles.detailValue}>{request.assignedTo}</Text>
                    </View>
                  )}
                  {request.estimatedCost && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tahmini Maliyet:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(request.estimatedCost)}</Text>
                    </View>
                  )}
                  {request.actualCost && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Gerçek Maliyet:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(request.actualCost)}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Oluşturulma:</Text>
                    <Text style={styles.detailValue}>{formatDate(request.createdAt)}</Text>
                  </View>
                  {request.startDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Başlangıç:</Text>
                      <Text style={styles.detailValue}>{formatDate(request.startDate)}</Text>
                    </View>
                  )}
                  {request.completionDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tamamlanma:</Text>
                      <Text style={styles.detailValue}>{formatDate(request.completionDate)}</Text>
                    </View>
                  )}
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
              <Text style={styles.modalTitle}>
                {editingRequest ? 'Bakım Talebi Düzenle' : 'Yeni Bakım Talebi'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Daire No *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.apartmentNo}
                  onChangeText={(text) => setFormData({ ...formData, apartmentNo: text })}
                  placeholder="101"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Başlık *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Arıza başlığı"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Açıklama *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Detaylı açıklama"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Kategori</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => {
                      Alert.alert(
                        'Kategori Seç',
                        '',
                        [
                          { text: 'Tesisatçı', onPress: () => setFormData({ ...formData, category: 'PLUMBING' }) },
                          { text: 'Elektrikçi', onPress: () => setFormData({ ...formData, category: 'ELECTRICAL' }) },
                          { text: 'Klima/Isıtma', onPress: () => setFormData({ ...formData, category: 'HVAC' }) },
                          { text: 'Yapısal', onPress: () => setFormData({ ...formData, category: 'STRUCTURAL' }) },
                          { text: 'Asansör', onPress: () => setFormData({ ...formData, category: 'ELEVATOR' }) },
                          { text: 'Diğer', onPress: () => setFormData({ ...formData, category: 'OTHER' }) },
                          { text: 'İptal', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.pickerText}>{getCategoryText(formData.category)}</Text>
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
                <Text style={styles.formLabel}>Durum</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    Alert.alert(
                      'Durum Seç',
                      '',
                      [
                        { text: 'Bekliyor', onPress: () => setFormData({ ...formData, status: 'PENDING' }) },
                        { text: 'Devam Ediyor', onPress: () => setFormData({ ...formData, status: 'IN_PROGRESS' }) },
                        { text: 'Tamamlandı', onPress: () => setFormData({ ...formData, status: 'COMPLETED' }) },
                        { text: 'İptal Edildi', onPress: () => setFormData({ ...formData, status: 'CANCELLED' }) },
                        { text: 'İptal', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.pickerText}>{getStatusText(formData.status)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Atanan Kişi</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.assignedTo}
                  onChangeText={(text) => setFormData({ ...formData, assignedTo: text })}
                  placeholder="Teknisyen adı"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Tahmini Maliyet (TL)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.estimatedCost}
                    onChangeText={(text) => setFormData({ ...formData, estimatedCost: text })}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Gerçek Maliyet (TL)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.actualCost}
                    onChangeText={(text) => setFormData({ ...formData, actualCost: text })}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingRequest ? 'Güncelle' : 'Kaydet'}
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
  requestCard: {
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
  requestTitle: {
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
    gap: 8,
  },
  apartmentNo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
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