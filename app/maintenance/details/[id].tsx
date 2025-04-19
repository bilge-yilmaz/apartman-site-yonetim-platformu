import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { useMaintenanceStore, MaintenanceRequest } from '../../../store/maintenance';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function MaintenanceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRequestById, requests, isLoading, fetchRequests, cancelRequest } = useMaintenanceStore();
  const [request, setRequest] = useState<MaintenanceRequest | undefined>();

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      // Önce mevcut verilerden kontrol et
      const existingRequest = getRequestById(id);
      if (existingRequest) {
        setRequest(existingRequest);
      } else {
        // Yoksa API'den yeniden çek
        await fetchRequests();
        setRequest(getRequestById(id));
      }
    };
    
    fetchData();
  }, [id]);

  const handleCancel = () => {
    if (!request) return;
    
    Alert.alert(
      'Arıza Bildirimi İptali',
      'Bu arıza bildirimini iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(request._id);
              Alert.alert('Başarılı', 'Arıza bildirimi iptal edildi', [
                { text: 'Tamam', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Hata', 'İptal işlemi sırasında bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return '#4CAF50';
      case 'MEDIUM':
        return '#FFC107';
      case 'HIGH':
        return '#FF9800';
      case 'URGENT':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Düşük';
      case 'MEDIUM':
        return 'Orta';
      case 'HIGH':
        return 'Yüksek';
      case 'URGENT':
        return 'Acil';
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFC107';
      case 'IN_PROGRESS':
        return '#2196F3';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#757575';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Bekliyor';
      case 'IN_PROGRESS':
        return 'İşlemde';
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Arıza bildirimi bulunamadı</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Geri Dön
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>{request.title}</Text>
            <Chip
              style={{
                backgroundColor: getStatusColor(request.status) + '20',
              }}
              textStyle={{ color: getStatusColor(request.status) }}
            >
              {getStatusText(request.status)}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Öncelik</Text>
              <Chip
                style={{
                  backgroundColor: getPriorityColor(request.priority) + '20',
                }}
                textStyle={{ color: getPriorityColor(request.priority) }}
              >
                {getPriorityText(request.priority)}
              </Chip>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Oluşturulma Tarihi</Text>
              <Text style={styles.infoValue}>
                {format(new Date(request.createdAt), 'dd MMM yyyy', { locale: tr })}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Daire</Text>
              <Text style={styles.infoValue}>
                {request.block}-{request.apartmentNo}
              </Text>
            </View>

            {request.assignedTo && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Atanan Kişi</Text>
                <Text style={styles.infoValue}>{request.assignedTo}</Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>Açıklama</Text>
          <Text style={styles.description}>{request.description}</Text>

          {request.comments && request.comments.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Yorumlar</Text>
              {request.comments.map((comment, index) => (
                <View key={index} style={styles.commentContainer}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>{comment.user}</Text>
                    <Text style={styles.commentDate}>
                      {format(new Date(comment.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
            </>
          )}

          {request.status === 'PENDING' && (
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.cancelButton}
              textColor="#F44336"
            >
              Arıza Bildirimini İptal Et
            </Button>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  card: {
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  divider: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  commentContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUser: {
    fontWeight: 'bold',
  },
  commentDate: {
    fontSize: 12,
    color: '#757575',
  },
  commentText: {
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 24,
    borderColor: '#F44336',
  },
});
