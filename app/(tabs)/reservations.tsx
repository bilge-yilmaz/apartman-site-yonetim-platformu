import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Card, Button, Badge, Divider } from 'react-native-paper';
import { FAB } from 'react-native-paper';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore - Eksik tiplerden kaçınmak için
import DateTimePicker from '@react-native-community/datetimepicker';
// @ts-ignore - Eksik tiplerden kaçınmak için
import RNPickerSelect from 'react-native-picker-select';
import * as Haptics from 'expo-haptics';
import { getReservations, getFacilities, createReservation, cancelReservation, Facility, Reservation, checkNetworkConnection } from '../../services/api';

// AsyncStorage anahtarları
const RESERVATIONS_STORAGE_KEY = 'reservations_cache';
const FACILITIES_STORAGE_KEY = 'facilities_cache';

// dateFormat.ts içindeki fonksiyonları burada tanımlayalım (geçici çözüm)
const formatDate = (date: Date): string => {
  if (!date) return '';
  
  try {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return ''; 
  }
};

const formatTime = (date: Date): string => {
  if (!date) return '';
  
  try {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

export default function ReservationsScreen() {
  const { user } = useUserStore();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showNewReservationForm, setShowNewReservationForm] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Form state
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  // Network durumunu kontrol et
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Cache'den veri yükle
  const loadFromCache = async () => {
    try {
      const [cachedReservations, cachedFacilities] = await Promise.all([
        AsyncStorage.getItem(RESERVATIONS_STORAGE_KEY),
        AsyncStorage.getItem(FACILITIES_STORAGE_KEY)
      ]);

      if (cachedReservations) {
        setReservations(JSON.parse(cachedReservations));
      }
      if (cachedFacilities) {
        setFacilities(JSON.parse(cachedFacilities));
      }
    } catch (error) {
      console.error('Cache yükleme hatası:', error);
    }
  };

  // Cache'e veri kaydet
  const saveToCache = async (reservationsData: Reservation[], facilitiesData: Facility[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservationsData)),
        AsyncStorage.setItem(FACILITIES_STORAGE_KEY, JSON.stringify(facilitiesData))
      ]);
    } catch (error) {
      console.error('Cache kaydetme hatası:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Önce cache'den yükle
      await loadFromCache();
      
      // Network kontrolü
      const networkConnected = await checkNetworkConnection();
      setIsOnline(networkConnected);
      
      if (networkConnected && user?.id) {
        console.log('🔄 Rezervasyonlar API\'den yükleniyor...');
        
        // API'den veri çek
        const [facilitiesData, reservationsData] = await Promise.all([
          getFacilities(),
          getReservations({ userId: user.id })
        ]);
        
        console.log('✅ Rezervasyonlar başarıyla yüklendi:', {
          facilities: facilitiesData.length,
          reservations: reservationsData.length,
          facilitiesData: facilitiesData
        });
      
      setFacilities(facilitiesData);
      setReservations(reservationsData);
        
        // Cache'e kaydet
        await saveToCache(reservationsData, facilitiesData);
      } else {
        console.log('📱 Offline mod: Cache\'den veriler kullanılıyor');
        if (!user?.id) {
          Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.');
        }
      }
    } catch (error: any) {
      console.error('❌ Rezervasyonlar yükleme hatası:', error);
      Alert.alert('Hata', error.message || 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateReservation = async () => {
    if (!selectedFacility || !selectedStartTime || !selectedEndTime) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    if (selectedStartTime >= selectedEndTime) {
      Alert.alert('Hata', 'Bitiş saati başlangıç saatinden sonra olmalıdır.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const selectedFacilityData = facilities.find(f => f._id === selectedFacility);
      
      const reservationData = {
        userId: user.id,
        facilityId: selectedFacility,
        startTime: selectedStartTime.toISOString(),
        endTime: selectedEndTime.toISOString(),
        status: 'pending' as const,
        notes: notes.trim() || undefined
      };

      console.log('📝 Rezervasyon oluşturuluyor:', reservationData);

      if (isOnline) {
        // Online: API'ye gönder
        const newReservation = await createReservation(reservationData);
        console.log('✅ Rezervasyon başarıyla oluşturuldu:', newReservation);
        
        // Local state'i güncelle
        setReservations(prev => [newReservation, ...prev]);
        
        Alert.alert('Başarılı', 'Rezervasyonunuz başarıyla oluşturuldu ve onay için gönderildi.');
      } else {
        // Offline: Local storage'a kaydet
        const offlineReservation: Reservation = {
          _id: `offline_${Date.now()}`,
          ...reservationData,
          facilityName: selectedFacilityData?.name || 'Bilinmeyen Tesis',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updatedReservations = [offlineReservation, ...reservations];
        setReservations(updatedReservations);
        await saveToCache(updatedReservations, facilities);
        
        Alert.alert('Offline Mod', 'Rezervasyonunuz cihazınızda kaydedildi. İnternet bağlantınız düzeldiğinde otomatik olarak gönderilecektir.');
      }
      
      resetForm();
      setShowNewReservationForm(false);
    } catch (error: any) {
      console.error('❌ Rezervasyon oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Rezervasyon oluşturulurken bir hata oluştu.');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      console.log('🚫 Rezervasyon iptal ediliyor:', reservationId);
      
      if (isOnline) {
        // Online: API'ye gönder
        await cancelReservation(reservationId);
        console.log('✅ Rezervasyon başarıyla iptal edildi');
        
        // Local state'i güncelle
      setReservations(prev => 
        prev.map(res => 
          res._id === reservationId 
              ? { ...res, status: 'cancelled' as const, updatedAt: new Date().toISOString() } 
            : res
        )
      );
      
        Alert.alert('Başarılı', 'Rezervasyon başarıyla iptal edildi.');
      } else {
        // Offline: Sadece local state'i güncelle
        const updatedReservations = reservations.map(res => 
          res._id === reservationId 
            ? { ...res, status: 'cancelled' as const, updatedAt: new Date().toISOString() } 
            : res
        );
        
        setReservations(updatedReservations);
        await saveToCache(updatedReservations, facilities);
        
        Alert.alert('Offline Mod', 'Rezervasyon iptal edildi. İnternet bağlantınız düzeldiğinde sunucuya gönderilecektir.');
      }
    } catch (error: any) {
      console.error('❌ Rezervasyon iptal etme hatası:', error);
      Alert.alert('Hata', error.message || 'Rezervasyon iptal edilirken bir hata oluştu.');
    }
  };

  const confirmCancelReservation = (reservationId: string) => {
    Alert.alert(
      'Rezervasyon İptali',
      'Bu rezervasyonu iptal etmek istediğinizden emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'İptal Et', 
          style: 'destructive', 
          onPress: () => handleCancelReservation(reservationId) 
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedFacility('');
    setSelectedDate(new Date());
    setSelectedStartTime(null);
    setSelectedEndTime(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setSelectedStartTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setSelectedEndTime(selectedTime);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge style={[styles.badge, { backgroundColor: Colors.warning }]}>Bekliyor</Badge>;
      case 'approved':
        return <Badge style={[styles.badge, { backgroundColor: Colors.success }]}>Onaylandı</Badge>;
      case 'rejected':
        return <Badge style={[styles.badge, { backgroundColor: Colors.error }]}>Reddedildi</Badge>;
      case 'cancelled':
        return <Badge style={[styles.badge, { backgroundColor: Colors.lightGray }]}>İptal Edildi</Badge>;
      default:
        return <Badge style={styles.badge}>Bilinmiyor</Badge>;
    }
  };

  // Filter reservations based on active tab
  const upcomingReservations = reservations.filter(
    res => new Date(res.startTime) > new Date() && 
    (res.status === 'approved' || res.status === 'pending')
  );
  
  const pastReservations = reservations.filter(
    res => new Date(res.startTime) <= new Date() || 
    (res.status === 'rejected' || res.status === 'cancelled')
  );

  const displayReservations = activeTab === 'upcoming' ? upcomingReservations : pastReservations;

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rezervasyonlar</Text>
      </View>
      
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rezervasyonlar</Text>
            <Text style={styles.subtitle}>Site tesislerini kolayca ayırtın</Text>
          </View>
          <Button 
            mode="contained" 
            onPress={() => setShowNewReservationForm(!showNewReservationForm)}
            style={styles.newButton}
            labelStyle={{ fontWeight: '600' }}
            icon={showNewReservationForm ? 'close' : 'plus'}
          >
            {showNewReservationForm ? 'Vazgeç' : 'Yeni'}
          </Button>
        </View>

        {/* Reservation Form */}
        {showNewReservationForm && (
          <Card style={styles.formCard}>
            <Card.Title 
              title="Yeni Rezervasyon" 
              titleStyle={styles.cardTitle} 
              left={(props) => <Ionicons name="calendar" size={24} color={Colors.primary} />}
            />
            <Card.Content style={styles.formContent}>
              <Text style={styles.label}>Tesis</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  onValueChange={(value: string) => setSelectedFacility(value)}
                  items={facilities.map(facility => ({ 
                    label: facility.name, 
                    value: facility._id 
                  }))}
                  style={pickerSelectStyles}
                  placeholder={{ label: 'Tesis Seçin', value: null }}
                  value={selectedFacility}
                  Icon={() => <Ionicons name="chevron-down" size={20} color="#999" />}
                />
              </View>

              <Text style={styles.label}>Tarih</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateTimeContainer}>
                  <Ionicons name="calendar-outline" size={22} color={Colors.primary} style={styles.dateTimeIcon} />
                  <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.label}>Başlangıç Saati</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <View style={styles.dateTimeContainer}>
                  <Ionicons name="time-outline" size={22} color={Colors.primary} style={styles.dateTimeIcon} />
                  <Text style={styles.dateTimeText}>
                    {selectedStartTime ? formatTime(selectedStartTime) : 'Seçiniz'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
              
              {showStartTimePicker && (
                <DateTimePicker
                  value={selectedStartTime || new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartTimeChange}
                />
              )}

              <Text style={styles.label}>Bitiş Saati</Text>
              <TouchableOpacity 
                style={[
                  styles.dateTimeButton, 
                  !selectedStartTime && styles.disabled
                ]}
                onPress={() => selectedStartTime && setShowEndTimePicker(true)}
                disabled={!selectedStartTime}
              >
                <View style={styles.dateTimeContainer}>
                  <Ionicons name="hourglass-outline" size={22} color={selectedStartTime ? Colors.primary : Colors.lightGray} style={styles.dateTimeIcon} />
                  <Text style={[
                    styles.dateTimeText, 
                    !selectedStartTime && styles.disabledText
                  ]}>
                    {selectedEndTime ? formatTime(selectedEndTime) : 'Seçiniz'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={selectedStartTime ? "#999" : "#ddd"} />
              </TouchableOpacity>
              
              {showEndTimePicker && (
                <DateTimePicker
                  value={selectedEndTime || selectedStartTime || new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndTimeChange}
                  minimumDate={selectedStartTime || undefined}
                />
              )}

              {selectedFacility && facilities.find(f => f._id === selectedFacility) && (
                <View style={styles.facilityInfo}>
                  <View style={styles.facilityInfoHeader}>
                    <Ionicons name="information-circle" size={22} color={Colors.primary} />
                    <Text style={styles.facilityInfoTitle}>Tesis Bilgileri</Text>
                  </View>
                  <Text style={styles.facilityInfoText}>
                    {facilities.find(f => f._id === selectedFacility)?.description}
                  </Text>
                  <View style={styles.facilityInfoDetail}>
                    <Ionicons name="time-outline" size={18} color={Colors.primary} style={{marginRight: 8}} />
                    <Text style={styles.facilityInfoText}>
                      Çalışma Saatleri: {facilities.find(f => f._id === selectedFacility)?.openingHour}:00 - 
                      {facilities.find(f => f._id === selectedFacility)?.closingHour}:00
                    </Text>
                  </View>
                  <View style={styles.facilityInfoDetail}>
                    <Ionicons name="hourglass-outline" size={18} color={Colors.primary} style={{marginRight: 8}} />
                    <Text style={styles.facilityInfoText}>
                      Maksimum Süre: {facilities.find(f => f._id === selectedFacility)?.maxReservationHours} saat
                    </Text>
                  </View>
                </View>
              )}

              <Button 
                mode="contained" 
                style={styles.submitButton}
                labelStyle={{fontSize: 16, fontWeight: '600'}}
                icon="calendar-check"
                onPress={handleCreateReservation}
                disabled={!selectedFacility || !selectedDate || !selectedStartTime || !selectedEndTime}
              >
                Rezervasyon Yap
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Facility Cards */}
        <Text style={styles.sectionTitle}>Tesisler</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facilityCardsContainer}>
          {facilities.map(facility => (
            <Card key={facility._id} style={styles.facilityCard}>
              <View style={styles.facilityImagePlaceholder}>
                {facility.name === 'Toplantı Salonu' && (
                  <FontAwesome5 name="users" size={36} color={Colors.primary} />
                )}
                {facility.name === 'Spor Salonu' && (
                  <FontAwesome5 name="dumbbell" size={36} color={Colors.primary} />
                )}
                {facility.name === 'Havuz' && (
                  <FontAwesome5 name="swimming-pool" size={36} color={Colors.primary} />
                )}
                {facility.name === 'Sauna' && (
                  <Ionicons name="water-outline" size={36} color={Colors.primary} />
                )}
                {!['Toplantı Salonu', 'Spor Salonu', 'Havuz', 'Sauna'].includes(facility.name) && (
                  <FontAwesome5 name="calendar-alt" size={36} color={Colors.primary} />
                )}
              </View>
              <Card.Content style={styles.facilityCardContent}>
                <Text style={styles.facilityName}>{facility.name}</Text>
                <Text style={styles.facilityDescription} numberOfLines={2}>
                  {facility.description}
                </Text>
                <View style={styles.facilityDetails}>
                  <View style={styles.facilityDetail}>
                    <Ionicons name="time-outline" size={14} color="#7f8c8d" />
                    <Text style={styles.facilityDetailText}>
                      {facility.openingHour}:00 - {facility.closingHour}:00
                    </Text>
                  </View>
                  <View style={styles.facilityDetail}>
                    <Ionicons name="hourglass-outline" size={14} color="#7f8c8d" />
                    <Text style={styles.facilityDetailText}>
                      Maks. {facility.maxReservationHours}s
                    </Text>
                  </View>
                </View>
                <Button 
                  mode="contained" 
                  compact 
                  style={styles.facilityButton}
                  icon="calendar-plus"
                  onPress={() => {
                    setSelectedFacility(facility._id);
                    setShowNewReservationForm(true);
                  }}
                >
                  Rezerve Et
                </Button>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              <Ionicons 
                name="calendar-outline" 
                size={16} 
                color={activeTab === 'upcoming' ? '#fff' : '#7f8c8d'} 
              /> Yaklaşan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
              <Ionicons 
                name="time-outline" 
                size={16} 
                color={activeTab === 'past' ? '#fff' : '#7f8c8d'} 
              /> Geçmiş
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reservations List */}
        <View style={styles.reservationsContainer}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'upcoming' ? 'Yaklaşan Rezervasyonlarım' : 'Geçmiş Rezervasyonlarım'}
          </Text>
          
          {displayReservations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="calendar-times" size={48} color={Colors.lightGray} />
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming' 
                  ? 'Yaklaşan rezervasyonunuz bulunmuyor.' 
                  : 'Geçmiş rezervasyonunuz bulunmuyor.'}
              </Text>
              {activeTab === 'upcoming' && (
                <Button 
                  mode="contained" 
                  style={styles.emptyButton}
                  icon="calendar-plus"
                  onPress={() => setShowNewReservationForm(true)}
                >
                  Rezervasyon Yap
                </Button>
              )}
            </View>
          ) : (
            displayReservations.map(reservation => {
              // Rezervasyon durumuna göre sol kenardaki rengi belirleyelim
              let borderColor;
              switch(reservation.status) {
                case 'pending':
                  borderColor = Colors.warning;
                  break;
                case 'approved':
                  borderColor = Colors.success;
                  break;
                case 'rejected':
                  borderColor = Colors.error;
                  break;
                case 'cancelled':
                  borderColor = Colors.lightGray;
                  break;
                default:
                  borderColor = Colors.lightGray;
              }
              
              return (
                <Card 
                  key={reservation._id} 
                  style={[styles.reservationCard, { borderLeftColor: borderColor }]}
                >
                  <Card.Content>
                    <View style={styles.reservationHeader}>
                      <Text style={styles.reservationFacility}>{reservation.facilityName}</Text>
                      {getStatusBadge(reservation.status)}
                    </View>
                    <Divider style={styles.divider} />
                    <View style={styles.reservationDetail}>
                      <MaterialIcons name="date-range" size={18} color={Colors.primary} />
                      <Text style={styles.reservationText}>{formatDate(new Date(reservation.startTime))}</Text>
                    </View>
                    <View style={styles.reservationDetail}>
                      <MaterialIcons name="access-time" size={18} color={Colors.primary} />
                      <Text style={styles.reservationText}>
                        {formatTime(new Date(reservation.startTime))} - {formatTime(new Date(reservation.endTime))}
                      </Text>
                    </View>
                    
                    {(reservation.status === 'pending' || reservation.status === 'approved') && 
                    new Date(reservation.startTime) > new Date() && (
                      <Button 
                        mode="outlined" 
                        style={styles.cancelButton}
                        icon="calendar-remove"
                        onPress={() => confirmCancelReservation(reservation._id)}
                      >
                        İptal Et
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push('/reservations/create' as any)}
        color="white"
      />
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    marginTop: 6,
    marginBottom: 8,
  },
  newButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    elevation: 3,
  },
  formCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  formContent: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 15,
    marginTop: 16,
    marginBottom: 6,
    color: '#34495e',
    fontWeight: '500',
    paddingLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeIcon: {
    marginRight: 8,
  },
  dateTimeText: {
    color: '#333',
    fontSize: 16,
  },
  facilityInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  facilityInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  facilityInfoTitle: {
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 0,
    marginLeft: 8,
    fontSize: 16,
  },
  facilityInfoDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  facilityInfoText: {
    color: '#555',
    fontSize: 15,
    flex: 1,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    color: '#2c3e50',
  },
  facilityCardsContainer: {
    paddingLeft: 16,
    marginBottom: 24,
  },
  facilityCard: {
    width: 250,
    marginRight: 12,
    elevation: 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  facilityImagePlaceholder: {
    height: 120,
    backgroundColor: 'rgba(10, 126, 164, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  facilityCardContent: {
    padding: 12,
  },
  facilityName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    color: '#2c3e50',
  },
  facilityDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 10,
    height: 36,
  },
  facilityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  facilityDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityDetailText: {
    marginLeft: 5,
    color: '#7f8c8d',
    fontSize: 12,
  },
  facilityButton: {
    backgroundColor: Colors.primary,
    marginTop: 6,
    borderRadius: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eee',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: '#7f8c8d',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  reservationsContainer: {
    margin: 16,
  },
  reservationCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#ddd',
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reservationFacility: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  divider: {
    marginVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    height: 1,
  },
  reservationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationText: {
    marginLeft: 10,
    color: '#555',
    fontSize: 15,
  },
  cancelButton: {
    marginTop: 12,
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 8,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  emptyText: {
    marginTop: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontSize: 15,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#bbb',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#333',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#333',
    paddingRight: 30,
  },
  iconContainer: {
    top: 12,
    right: 12,
  },
  placeholder: {
    color: '#999',
  },
}; 