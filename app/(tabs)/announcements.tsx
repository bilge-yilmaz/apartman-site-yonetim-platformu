import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip, useTheme, Button } from 'react-native-paper';
import { useEffect, useCallback, useState } from 'react';
import { useAnnouncementsStore } from '../../store/announcementsStore';
import { Announcement } from '../../services/api';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const {
    announcements,
    isLoading,
    error,
    fetchAnnouncements,
  } = useAnnouncementsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const loadAnnouncements = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchAnnouncements({ isActive: true });
    } finally {
      setRefreshing(false);
    }
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
      case 'URGENT': return Colors.error;
      case 'HIGH': return Colors.warning;
      case 'MEDIUM': return Colors.info;
      case 'LOW': return Colors.success;
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

  // Filter announcements based on priority
  const urgentAnnouncements = announcements.filter(
    ann => ann.priority === 'URGENT' || ann.priority === 'HIGH'
  );
  
  const regularAnnouncements = announcements.filter(
    ann => ann.priority !== 'URGENT' && ann.priority !== 'HIGH'
  );

  const displayAnnouncements = activeTab === 'urgent' 
    ? urgentAnnouncements 
    : activeTab === 'regular' 
    ? regularAnnouncements 
    : announcements;

  const renderAnnouncementCard = (item: Announcement) => (
    <Card 
      key={item._id}
      style={[styles.announcementCard, { borderLeftColor: getPriorityColor(item.priority) }]} 
      onPress={() => router.push(`/announcements/${item._id}` as any)}
    >
      <Card.Content>
        <Title style={styles.cardTitle}>{item.title}</Title>
        
        <View style={styles.chipContainer}>
          {item.category && 
            <Chip 
              style={styles.categoryChip}
              textStyle={{ color: Colors.primary }}
            >
              {getCategoryLabel(item.category)}
            </Chip>
          }
          {item.priority && (
            <Chip 
              style={[styles.priorityChip, { backgroundColor: getPriorityColor(item.priority) }]}
            >
              <Text style={styles.priorityText}>
                {item.priority === 'HIGH' ? 'Önemli' : 
                  item.priority === 'URGENT' ? 'Acil' : 
                  item.priority === 'MEDIUM' ? 'Normal' : 'Düşük'}
              </Text>
            </Chip>
          )}
        </View>
        
        <Paragraph style={styles.content} numberOfLines={3}>{item.content}</Paragraph>
        
        <View style={styles.detailRow}>
          <View style={styles.detail}>
            <MaterialIcons name="date-range" size={18} color={Colors.primary} />
            <Text style={styles.detailText}>
              {new Date(item.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Duyurular</Text>
      </View>
      
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAnnouncements} colors={[Colors.primary]} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Site Duyuruları</Text>
            <Text style={styles.subtitle}>Tüm site duyurularına buradan ulaşabilirsiniz</Text>
          </View>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              <Ionicons 
                name="list-outline" 
                size={16} 
                color={activeTab === 'all' ? '#fff' : '#7f8c8d'} 
              /> Tümü ({announcements.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'urgent' && styles.activeTab]} 
            onPress={() => setActiveTab('urgent')}
          >
            <Text style={[styles.tabText, activeTab === 'urgent' && styles.activeTabText]}>
              <Ionicons 
                name="alert-circle-outline" 
                size={16} 
                color={activeTab === 'urgent' ? '#fff' : '#7f8c8d'} 
              /> Önemli ({urgentAnnouncements.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'regular' && styles.activeTab]} 
            onPress={() => setActiveTab('regular')}
          >
            <Text style={[styles.tabText, activeTab === 'regular' && styles.activeTabText]}>
              <Ionicons 
                name="information-circle-outline" 
                size={16} 
                color={activeTab === 'regular' ? '#fff' : '#7f8c8d'} 
              /> Normal ({regularAnnouncements.length})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading && announcements.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Duyurular yükleniyor...</Text>
          </View>
        ) : displayAnnouncements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="megaphone-outline" size={36} color="#999" />
            </View>
            <Text style={styles.emptyTitle}>Duyuru Bulunamadı</Text>
            <Text style={styles.emptySubText}>
              {activeTab === 'all' 
                ? 'Henüz duyuru bulunmuyor. Duyurular geldiğinde burada görüntülenecek.' 
                : activeTab === 'urgent'
                ? 'Önemli veya acil bir duyuru bulunmuyor.'
                : 'Normal öncelikli duyuru bulunmuyor.'}
            </Text>
            <Button 
              mode="contained" 
              onPress={loadAnnouncements} 
              style={styles.refreshButton}
              buttonColor={Colors.primary}
            >
              Yenile
            </Button>
          </View>
        ) : (
          <View style={styles.announcementsContainer}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'all' 
                ? 'Tüm Duyurular' 
                : activeTab === 'urgent' 
                ? 'Önemli Duyurular' 
                : 'Normal Duyurular'}
            </Text>
            
            {displayAnnouncements.map((item) => renderAnnouncementCard(item))}
          </View>
        )}
      </ScrollView>

      {/* Tab bar artık Expo Router tarafından otomatik olarak ekleniyor */}
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
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eee',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: '#7f8c8d',
    fontWeight: '500',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  announcementsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2c3e50',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  announcementCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    borderLeftWidth: 5,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: 'rgba(52, 87, 213, 0.1)',
    borderColor: Colors.primary,
    height: 30,
  },
  priorityChip: {
    height: 30,
  },
  priorityText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  content: {
    marginTop: 8,
    lineHeight: 20,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    color: '#757575',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
