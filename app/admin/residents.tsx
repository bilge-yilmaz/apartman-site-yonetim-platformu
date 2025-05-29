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
import { getUsers, createUser, updateUser, deleteUser, User, UserData } from '../../services/api';

export default function AdminResidentsScreen() {
  const [residents, setResidents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingResident, setEditingResident] = useState<User | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    apartmentNo: string;
    block: string;
    phone: string;
    role: 'ADMIN' | 'RESIDENT';
    isActive: boolean;
  }>({
    name: '',
    email: '',
    apartmentNo: '',
    block: '',
    phone: '',
    role: 'RESIDENT',
    isActive: true,
  });

  const loadResidents = async () => {
    try {
      console.log('👥 Kullanıcılar yükleniyor...');
      const data = await getUsers();
      setResidents(data.sort((a, b) => a.name.localeCompare(b.name)));
      console.log('✅ Kullanıcılar başarıyla yüklendi:', data.length);
    } catch (error: any) {
      console.error('❌ Sakinler yüklenirken hata:', error);
      Alert.alert('Hata', error.message || 'Sakinler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadResidents();
  };

  const openModal = (resident?: User) => {
    if (resident) {
      setEditingResident(resident);
      setFormData({
        name: resident.name,
        email: resident.email,
        apartmentNo: resident.apartmentNo || '',
        block: resident.block || '',
        phone: resident.phone || '',
        role: resident.role,
        isActive: resident.isActive !== false,
      });
    } else {
      setEditingResident(null);
      setFormData({
        name: '',
        email: '',
        apartmentNo: '',
        block: '',
        phone: '',
        role: 'RESIDENT',
        isActive: true,
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingResident(null);
    setFormData({
      name: '',
      email: '',
      apartmentNo: '',
      block: '',
      phone: '',
      role: 'RESIDENT',
      isActive: true,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Hata', 'Ad ve e-posta alanları zorunludur');
      return;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi giriniz');
      return;
    }

    try {
      const userData: UserData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        apartmentNo: formData.apartmentNo.trim() || undefined,
        block: formData.block.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (editingResident) {
        console.log('👤 Kullanıcı güncelleniyor:', editingResident._id);
        await updateUser(editingResident._id, userData);
        Alert.alert('Başarılı', 'Sakin bilgileri güncellendi');
      } else {
        console.log('👤 Yeni kullanıcı oluşturuluyor');
        await createUser(userData);
        Alert.alert('Başarılı', 'Yeni sakin eklendi');
      }

      closeModal();
      loadResidents();
    } catch (error: any) {
      console.error('❌ Sakin kaydedilirken hata:', error);
      Alert.alert('Hata', error.message || 'Sakin kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = (resident: User) => {
    Alert.alert(
      'Sakin Sil',
      `${resident.name} adlı sakini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Kullanıcı siliniyor:', resident._id);
              await deleteUser(resident._id);
              Alert.alert('Başarılı', 'Sakin silindi');
              loadResidents();
            } catch (error: any) {
              console.error('❌ Sakin silinirken hata:', error);
              Alert.alert('Hata', error.message || 'Sakin silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const toggleStatus = async (resident: User) => {
    try {
      console.log('🔄 Kullanıcı durumu değiştiriliyor:', resident._id);
      await updateUser(resident._id, {
        isActive: !resident.isActive,
      });
      loadResidents();
    } catch (error: any) {
      console.error('❌ Durum güncellenirken hata:', error);
      Alert.alert('Hata', error.message || 'Durum güncellenirken bir hata oluştu');
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Yönetici';
      case 'RESIDENT': return 'Sakin';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#8B5CF6';
      case 'RESIDENT': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  // İstatistikler
  const totalResidents = residents.length;
  const activeResidents = residents.filter(r => r.isActive !== false).length;
  const inactiveResidents = residents.filter(r => r.isActive === false).length;
  const adminCount = residents.filter(r => r.role === 'ADMIN').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Sakinler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Site Sakinleri</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalResidents}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{activeResidents}</Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{inactiveResidents}</Text>
          <Text style={styles.statLabel}>Pasif</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>{adminCount}</Text>
          <Text style={styles.statLabel}>Yönetici</Text>
        </View>
      </View>

      {/* Sakinler Listesi */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {residents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Henüz sakin bulunmuyor</Text>
            <Text style={styles.emptySubtext}>Yeni sakin eklemek için + butonuna tıklayın</Text>
          </View>
        ) : (
          residents.map((resident) => (
            <View key={resident._id} style={[
              styles.residentCard,
              !resident.isActive && styles.inactiveCard
            ]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.residentInfo}>
                    <Text style={styles.residentName}>{resident.name}</Text>
                    <Text style={styles.residentEmail}>{resident.email}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.statusButton, resident.isActive ? styles.activeButton : styles.inactiveButton]}
                      onPress={() => toggleStatus(resident)}
                    >
                      <Text style={[styles.statusButtonText, resident.isActive ? styles.activeButtonText : styles.inactiveButtonText]}>
                        {resident.isActive ? 'Aktif' : 'Pasif'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openModal(resident)}
                    >
                      <Ionicons name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(resident)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(resident.role) }]}>
                    <Text style={styles.roleText}>{getRoleText(resident.role)}</Text>
                  </View>
                  {resident.apartmentNo && (
                    <Text style={styles.apartmentInfo}>
                      {resident.block ? `${resident.block}-` : ''}{resident.apartmentNo}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.cardDetails}>
                  {resident.phone && (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailValue}>{resident.phone}</Text>
                    </View>
                  )}
                  {resident.apartmentNo && (
                    <View style={styles.detailRow}>
                      <Ionicons name="home-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailValue}>
                        Daire {resident.block ? `${resident.block}-` : ''}{resident.apartmentNo}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailValue}>
                      Kayıt: {new Date(resident.createdAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
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
                {editingResident ? 'Sakin Düzenle' : 'Yeni Sakin'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ad Soyad *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Ahmet Yılmaz"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>E-posta *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="ahmet@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Blok</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.block}
                    onChangeText={(text) => setFormData({ ...formData, block: text })}
                    placeholder="A"
                  />
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Daire No</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.apartmentNo}
                    onChangeText={(text) => setFormData({ ...formData, apartmentNo: text })}
                    placeholder="101"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Telefon</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="0532 123 4567"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Rol</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    Alert.alert(
                      'Rol Seç',
                      '',
                      [
                        { text: 'Sakin', onPress: () => setFormData({ ...formData, role: 'RESIDENT' }) },
                        { text: 'Yönetici', onPress: () => setFormData({ ...formData, role: 'ADMIN' }) },
                        { text: 'İptal', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.pickerText}>{getRoleText(formData.role)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
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
                  {editingResident ? 'Güncelle' : 'Kaydet'}
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
  residentCard: {
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
  residentInfo: {
    flex: 1,
    marginRight: 12,
  },
  residentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  residentEmail: {
    fontSize: 14,
    color: '#6B7280',
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
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  apartmentInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#4B5563',
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