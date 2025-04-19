import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { useMaintenanceStore, MaintenanceRequest } from '../../store/maintenance';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function MaintenanceScreen() {
  const { requests, isLoading, fetchRequests, cancelRequest } = useMaintenanceStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleCancel = (request: MaintenanceRequest) => {
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
              Alert.alert('Başarılı', 'Arıza bildirimi iptal edildi');
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

  const renderRequestItem = ({ item }: { item: MaintenanceRequest }) => (
    <Card style={styles.card} onPress={() => router.push(`/maintenance/details/${item._id}`)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.title}</Text>
          <Chip
            style={{
              backgroundColor: getStatusColor(item.status) + '20',
            }}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaInfo}>
            <Chip
              style={{
                backgroundColor: getPriorityColor(item.priority) + '20',
                marginRight: 8,
              }}
              textStyle={{ color: getPriorityColor(item.priority) }}
            >
              {getPriorityText(item.priority)}
            </Chip>
            <Text style={styles.date}>
              {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: tr })}
            </Text>
          </View>

          {item.status === 'PENDING' && (
            <Button
              mode="outlined"
              onPress={() => handleCancel(item)}
              textColor="#F44336"
              style={styles.cancelButton}
            >
              İptal
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      ) : requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Henüz arıza bildiriminiz bulunmamaktadır.
          </Text>
        </View>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/maintenance/create')}
        color="white"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // FAB için alan
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  divider: {
    marginVertical: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    color: '#555',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#757575',
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976D2',
  },
});
