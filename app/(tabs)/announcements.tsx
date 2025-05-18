import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Chip, useTheme, Button } from 'react-native-paper';
import { useEffect, useCallback } from 'react';
import { useAnnouncementsStore } from '../../store/announcementsStore';
import { Announcement } from '../../services/api';
import { router } from 'expo-router';

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const {
    announcements,
    isLoading,
    error,
    fetchAnnouncements,
  } = useAnnouncementsStore();

  const loadAnnouncements = useCallback(async () => {
    await fetchAnnouncements({ isActive: true });
  }, [fetchAnnouncements]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    if (error) {
      Alert.alert('Hata', error);
    }
  }, [error]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'URGENT': return '#FF5252';
      case 'HIGH': return '#FF9800';
      case 'MEDIUM': return '#2196F3';
      case 'LOW': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'GENERAL': return 'Genel';
      case 'MAINTENANCE': return 'Bakım';
      case 'PAYMENT': return 'Ödeme';
      case 'EVENT': return 'Etkinlik';
      default: return category || 'Diğer';
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => (
    <Card 
      style={styles.card} 
      onPress={() => router.push(`/announcements/${item._id}` as any)}
    >
      <Card.Content>
        <Title>{item.title}</Title>
        <View style={styles.chipContainer}>
          {item.category && <Chip style={styles.chip}>{getCategoryLabel(item.category)}</Chip>}
        </View>
        <Paragraph style={styles.content} numberOfLines={3}>{item.content}</Paragraph>
        <Text style={styles.date}>
          Yayınlanma: {new Date(item.createdAt).toLocaleDateString('tr-TR')}
        </Text>
      </Card.Content>
    </Card>
  );

  if (isLoading && announcements.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Duyurular yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {announcements.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz duyuru bulunmuyor.</Text>
          <Button onPress={loadAnnouncements} style={{marginTop: 10}} mode="outlined">
            Tekrar Dene
          </Button>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadAnnouncements}
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
