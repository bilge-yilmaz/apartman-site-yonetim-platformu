import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Card, Button, Badge, Divider } from 'react-native-paper';

// @ts-ignore - Eksik tiplerden kaçınmak için
import DateTimePicker from '@react-native-community/datetimepicker';
// @ts-ignore - Eksik tiplerden kaçınmak için
import RNPickerSelect from 'react-native-picker-select';
import * as Haptics from 'expo-haptics';
import { getReservations, getFacilities, createReservation, cancelReservation, Facility, Reservation } from '../../services/api';
import Colors from '../../constants/Colors';

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
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showNewReservationForm, setShowNewReservationForm] = useState(false);
  
  // Form state
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // For development, use mock data instead of actual API calls
      // In a production app, you would use the actual API calls:
      // const [facilitiesData, reservationsData] = await Promise.all([
      //   getFacilities(),
      //   getReservations(),
      // ]);
      
      // Mock data for testing:
      const facilitiesData: Facility[] = [
        {
          _id: '1',
          name: 'Toplantı Salonu',
          description: 'Site sakinleri için toplantı ve etkinlik salonu',
          openingHour: 9,
          closingHour: 22,
          maxReservationHours: 3,
          isAvailable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'Spor Salonu',
          description: 'Fitness ekipmanları ve spor aletleri',
          openingHour: 7,
          closingHour: 23,
          maxReservationHours: 2,
          isAvailable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '3',
          name: 'Havuz',
          description: 'Açık yüzme havuzu',
          openingHour: 9,
          closingHour: 20,
          maxReservationHours: 2,
          isAvailable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '4',
          name: 'Sauna',
          description: 'Sauna ve buhar odası',
          openingHour: 10,
          closingHour: 21,
          maxReservationHours: 1,
          isAvailable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      const reservationsData: Reservation[] = [
        {
          _id: '1',
          userId: 'user-id',
          facilityId: '1',
          facilityName: 'Toplantı Salonu',
          startTime: '2025-05-15T14:00:00',
          endTime: '2025-05-15T16:00:00',
          status: 'approved',
          createdAt: '2025-05-01T10:30:00',
          updatedAt: '2025-05-01T11:15:00',
        },
        {
          _id: '2',
          userId: 'user-id',
          facilityId: '2',
          facilityName: 'Spor Salonu',
          startTime: '2025-05-10T18:00:00',
          endTime: '2025-05-10T20:00:00',
          status: 'pending',
          createdAt: '2025-05-02T09:45:00',
          updatedAt: '2025-05-02T09:45:00',
        },
        {
          _id: '3',
          userId: 'user-id',
          facilityId: '3',
          facilityName: 'Havuz',
          startTime: '2025-04-20T15:00:00',
          endTime: '2025-04-20T17:00:00',
          status: 'cancelled',
          createdAt: '2025-04-15T14:20:00',
          updatedAt: '2025-04-18T11:30:00',
        },
      ];
      
      setFacilities(facilitiesData);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading reservations data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
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

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const reservationData = {
        userId: 'current-user-id', // Normally this would come from user context/auth
        facilityId: selectedFacility,
        startTime: selectedStartTime.toISOString(),
        endTime: selectedEndTime.toISOString(),
        status: 'pending' as const
      };

      // In a real app, we would call the API:
      // await createReservation(reservationData);
      
      // For demo, just show success message
      Alert.alert('Başarılı', 'Rezervasyon talebiniz oluşturuldu.');
      setShowNewReservationForm(false);
      resetForm();
      
      // Add the new reservation to the local state for immediate display
      const newReservation: Reservation = {
        _id: `temp-${Date.now()}`,
        userId: 'current-user-id',
        facilityId: selectedFacility,
        facilityName: facilities.find(f => f._id === selectedFacility)?.name || '',
        startTime: selectedStartTime.toISOString(),
        endTime: selectedEndTime.toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setReservations(prev => [newReservation, ...prev]);
    } catch (error) {
      console.error('Error creating reservation:', error);
      Alert.alert('Hata', 'Rezervasyon oluşturulurken bir hata meydana geldi.');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      // In a real app, we would call the API:
      // await cancelReservation(reservationId);
      
      // For demo, just update the local state
      setReservations(prev => 
        prev.map(res => 
          res._id === reservationId 
            ? { ...res, status: 'cancelled', updatedAt: new Date().toISOString() } 
            : res
        )
      );
      
      Alert.alert('Başarılı', 'Rezervasyon iptal edildi.');
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      Alert.alert('Hata', 'Rezervasyon iptal edilirken bir hata oluştu.');
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
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Rezervasyonlar</Text>
        <Button 
          mode="contained" 
          onPress={() => setShowNewReservationForm(!showNewReservationForm)}
          style={styles.newButton}
        >
          {showNewReservationForm ? 'Vazgeç' : 'Yeni Rezervasyon'}
        </Button>
      </View>

      {/* Reservation Form */}
      {showNewReservationForm && (
        <Card style={styles.formCard}>
          <Card.Title title="Yeni Rezervasyon" />
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
              />
            </View>

            <Text style={styles.label}>Tarih</Text>
            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
              <MaterialIcons name="date-range" size={24} color={Colors.primary} />
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
            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowStartTimePicker(true)}>
              <Text style={styles.dateTimeText}>
                {selectedStartTime ? formatTime(selectedStartTime) : 'Seçiniz'}
              </Text>
              <MaterialIcons name="access-time" size={24} color={Colors.primary} />
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
              style={[styles.dateTimeButton, !selectedStartTime && styles.disabled]}
              onPress={() => selectedStartTime && setShowEndTimePicker(true)}
              disabled={!selectedStartTime}
            >
              <Text style={[styles.dateTimeText, !selectedStartTime && styles.disabledText]}>
                {selectedEndTime ? formatTime(selectedEndTime) : 'Seçiniz'}
              </Text>
              <MaterialIcons name="access-time" size={24} color={selectedStartTime ? Colors.primary : Colors.lightGray} />
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
                <Text style={styles.facilityInfoTitle}>Tesis Bilgileri:</Text>
                <Text style={styles.facilityInfoText}>
                  {facilities.find(f => f._id === selectedFacility)?.description}
                </Text>
                <Text style={styles.facilityInfoText}>
                  Çalışma Saatleri: {facilities.find(f => f._id === selectedFacility)?.openingHour}:00 - 
                  {facilities.find(f => f._id === selectedFacility)?.closingHour}:00
                </Text>
                <Text style={styles.facilityInfoText}>
                  Maksimum Süre: {facilities.find(f => f._id === selectedFacility)?.maxReservationHours} saat
                </Text>
              </View>
            )}

            <Button 
              mode="contained" 
              style={styles.submitButton}
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
              <FontAwesome5 name="calendar-alt" size={30} color={Colors.lightGray} />
            </View>
            <Card.Content style={styles.facilityCardContent}>
              <Text style={styles.facilityName}>{facility.name}</Text>
              <Text style={styles.facilityDescription} numberOfLines={2}>
                {facility.description}
              </Text>
              <Button 
                mode="contained" 
                compact 
                style={styles.facilityButton}
                onPress={() => {
                  setSelectedFacility(facility._id);
                  setShowNewReservationForm(true);
                }}
              >
                Rezervasyon Yap
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
            Yaklaşan Rezervasyonlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Geçmiş Rezervasyonlar
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
            <FontAwesome5 name="calendar-times" size={40} color={Colors.lightGray} />
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' 
                ? 'Yaklaşan rezervasyonunuz bulunmuyor.' 
                : 'Geçmiş rezervasyonunuz bulunmuyor.'}
            </Text>
            {activeTab === 'upcoming' && (
              <Button 
                mode="contained" 
                style={styles.emptyButton}
                onPress={() => setShowNewReservationForm(true)}
              >
                Rezervasyon Yap
              </Button>
            )}
          </View>
        ) : (
          displayReservations.map(reservation => (
            <Card key={reservation._id} style={styles.reservationCard}>
              <Card.Content>
                <View style={styles.reservationHeader}>
                  <Text style={styles.reservationFacility}>{reservation.facilityName}</Text>
                  {getStatusBadge(reservation.status)}
                </View>
                <Divider style={styles.divider} />
                <View style={styles.reservationDetail}>
                  <MaterialIcons name="date-range" size={16} color={Colors.primary} />
                  <Text style={styles.reservationText}>{formatDate(new Date(reservation.startTime))}</Text>
                </View>
                <View style={styles.reservationDetail}>
                  <MaterialIcons name="access-time" size={16} color={Colors.primary} />
                  <Text style={styles.reservationText}>
                    {formatTime(new Date(reservation.startTime))} - {formatTime(new Date(reservation.endTime))}
                  </Text>
                </View>
                
                {(reservation.status === 'pending' || reservation.status === 'approved') && 
                 new Date(reservation.startTime) > new Date() && (
                  <Button 
                    mode="outlined" 
                    style={styles.cancelButton}
                    onPress={() => confirmCancelReservation(reservation._id)}
                  >
                    İptal Et
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  newButton: {
    backgroundColor: Colors.primary,
  },
  formCard: {
    margin: 16,
    elevation: 4,
  },
  formContent: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
    color: '#555',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dateTimeText: {
    color: '#333',
    fontSize: 16,
  },
  facilityInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e6f2ff',
    borderRadius: 4,
  },
  facilityInfoTitle: {
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  facilityInfoText: {
    color: '#333',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  facilityCardsContainer: {
    paddingLeft: 16,
    marginBottom: 16,
  },
  facilityCard: {
    width: 200,
    marginRight: 12,
    elevation: 3,
  },
  facilityImagePlaceholder: {
    height: 100,
    backgroundColor: '#dedede',
    justifyContent: 'center',
    alignItems: 'center',
  },
  facilityCardContent: {
    padding: 8,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  facilityDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    height: 32,
  },
  facilityButton: {
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  reservationsContainer: {
    margin: 16,
  },
  reservationCard: {
    marginBottom: 12,
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationFacility: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 8,
  },
  divider: {
    marginVertical: 8,
  },
  reservationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reservationText: {
    marginLeft: 8,
    color: '#555',
  },
  cancelButton: {
    marginTop: 12,
    borderColor: Colors.error,
    borderWidth: 1,
  },
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  emptyText: {
    marginTop: 12,
    color: '#888',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#999',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: 'black',
    paddingRight: 30,
  },
}; 