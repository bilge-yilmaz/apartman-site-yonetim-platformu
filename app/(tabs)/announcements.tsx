import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Chip, useTheme } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { apiServices } from '../../utils/api-services';

type Announcement = {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await apiServices.announcements.getAll();
      console.log('Duyurular alındı:', data);
      setAnnouncements(data);
    } catch (error) {
      console.error('Duyurular alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '#FF5252';
      case 'HIGH':
        return '#FF9800';
      case 'MEDIUM':
        return '#2196F3';
      case 'LOW':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'GENERAL':
        return 'Genel';
      case 'MAINTENANCE':
        return 'Bakım';
      case 'PAYMENT':
        return 'Ödeme';
      case 'EVENT':
        return 'Etkinlik';
      default:
        return category;
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.title}</Title>
        <View style={styles.chipContainer}>
          <Chip 
            style={[styles.chip, { backgroundColor: getPriorityColor(item.priority) + '20' }]}
            textStyle={{ color: getPriorityColor(item.priority) }}
          >
            {item.priority === 'URGENT' ? 'Acil' : 
             item.priority === 'HIGH' ? 'Yüksek' :
             item.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
          </Chip>
          <Chip style={styles.chip}>{getCategoryLabel(item.category)}</Chip>
        </View>
        <Paragraph style={styles.content}>{item.content}</Paragraph>
        <Text style={styles.date}>
          {new Date(item.startDate).toLocaleDateString('tr-TR')} - {new Date(item.endDate).toLocaleDateString('tr-TR')}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Duyurular yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {announcements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz duyuru bulunmuyor.</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  chip: {
    marginRight: 8,
  },
  content: {
    marginTop: 8,
    lineHeight: 20,
  },
  date: {
    marginTop: 12,
    fontSize: 12,
    color: '#757575',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
});
