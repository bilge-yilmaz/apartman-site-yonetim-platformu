import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button, FAB, Searchbar, Chip, Menu, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/user';
import { Announcement } from '../../services/api';

export default function AdminAnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const { user } = useUserStore();

  // Örnek veriler
  const sampleAnnouncements: Announcement[] = [
    {
      _id: '1',
      title: 'Yıllık Aidat Artışı',
      content: 'Değerli site sakinlerimiz, yönetim kurulu kararıyla 2025 yılı aidat miktarları %10 oranında artırılmıştır. Yeni aidat miktarları Mayıs ayından itibaren geçerli olacaktır.',
      priority: 'HIGH',
      createdBy: 'admin',
      isActive: true,
      createdAt: '2024-04-20T10:00:00Z',
      updatedAt: '2024-04-20T10:00:00Z'
    },
    {
      _id: '2',
      title: 'Havuz Bakımı',
      content: 'Sitemizin havuzu yaz sezonu için hazırlanacaktır. 5-10 Mayıs tarihleri arasında havuz kullanıma kapalı olacaktır.',
      priority: 'MEDIUM',
      createdBy: 'admin',
      isActive: true,
      createdAt: '2024-04-18T14:30:00Z',
      updatedAt: '2024-04-18T14:30:00Z'
    },
    {
      _id: '3',
      title: 'Asansör Bakımı',
      content: 'A Blok asansörü 2 Mayıs Cuma günü 09:00-12:00 saatleri arasında bakım nedeniyle kullanılamayacaktır.',
      priority: 'HIGH',
      createdBy: 'admin',
      isActive: true,
      createdAt: '2024-04-15T09:15:00Z',
      updatedAt: '2024-04-15T09:15:00Z'
    },
    {
      _id: '4',
      title: 'Otopark Düzenlemesi',
      content: 'Otopark alanında yeni düzenleme yapılacaktır. Lütfen araçlarınızı 3 Mayıs saat 08:00\'e kadar belirtilen alanlara çekiniz.',
      priority: 'MEDIUM',
      createdBy: 'admin',
      isActive: true,
      createdAt: '2024-04-12T16:45:00Z',
      updatedAt: '2024-04-12T16:45:00Z'
    },
    {
      _id: '5',
      title: 'Çocuk Parkı Yenileniyor',
      content: 'Sitemizin çocuk parkı yenilenecektir. Çalışmalar 20-25 Mayıs tarihleri arasında gerçekleştirilecektir.',
      priority: 'LOW',
      createdBy: 'admin',
      isActive: true,
      createdAt: '2024-04-10T11:20:00Z',
      updatedAt: '2024-04-10T11:20:00Z'
    }
  ];

  // Yetki kontrolü
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.replace('/auth/login');
    }
  }, [user]);

  // Verileri yükle
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Filtreleme
  useEffect(() => {
    filterAnnouncements();
  }, [searchQuery, announcements]);

  const loadAnnouncements = () => {
    // Gerçek uygulamada API'den veriler çekilir
    setAnnouncements(sampleAnnouncements);
    setFilteredAnnouncements(sampleAnnouncements);
  };

  const filterAnnouncements = () => {
    if (searchQuery.trim() === '') {
      setFilteredAnnouncements(announcements);
    } else {
      const filtered = announcements.filter(
        announcement =>
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAnnouncements(filtered);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
    setRefreshing(false);
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const openMenu = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleEditAnnouncement = () => {
    closeMenu();
    // Düzenleme sayfasına yönlendirme yapılacak
    console.log('Düzenle:', selectedAnnouncement);
  };

  const handleDeleteAnnouncement = () => {
    closeMenu();
    // Silme işlemi yapılacak
    console.log('Sil:', selectedAnnouncement);
  };

  const getPriorityChip = (priority: Announcement['priority']) => {
    let color = '';
    let text = '';

    switch (priority) {
      case 'URGENT':
        color = Colors.error;
        text = 'ACİL';
        break;
      case 'HIGH':
        color = '#FF9800';
        text = 'ÖNEMLİ';
        break;
      case 'MEDIUM':
        color = Colors.warning;
        text = 'ORTA';
        break;
      case 'LOW':
        color = Colors.success;
        text = 'DÜŞÜK';
        break;
      default:
        color = Colors.lightGray;
        text = 'BİLGİ';
    }

    return (
      <Chip 
        mode="flat"
        style={{
          backgroundColor: color,
        }}
        textStyle={{ color: 'white', fontSize: 12 }}
      >
        {text}
      </Chip>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.safeArea} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Duyurular</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Duyurular</Text>
          <Text style={styles.subtitle}>Site duyurularını görüntüleyin ve yönetin.</Text>
          
          <Searchbar
            placeholder="Ara..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          {filteredAnnouncements.map((announcement) => (
            <Card 
              key={announcement._id} 
              style={[
                styles.card, 
                { 
                  borderLeftWidth: 5,
                  borderLeftColor: 
                    announcement.priority === 'URGENT' ? Colors.error :
                    announcement.priority === 'HIGH' ? '#FF9800' :
                    announcement.priority === 'MEDIUM' ? Colors.warning : 
                    Colors.success
                }
              ]}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle}>{announcement.title}</Text>
                    {getPriorityChip(announcement.priority)}
                  </View>
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => openMenu(announcement)}
                  />
                </View>
                
                <Text style={styles.cardDate}>
                  {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                </Text>
                
                <Text style={styles.cardContent} numberOfLines={3}>
                  {announcement.content}
                </Text>
                
                <View style={styles.cardActions}>
                  <Button 
                    mode="text" 
                    onPress={() => console.log('Detay:', announcement._id)}
                  >
                    Detaylar
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => console.log('Yeni duyuru ekle')}
        color="white"
      />

      {selectedAnnouncement && (
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={{ x: 0, y: 0 }} // Bu değerler kullanıcı tıklamasına göre güncellenecek
        >
          <Menu.Item 
            onPress={handleEditAnnouncement} 
            title="Düzenle" 
            leadingIcon="pencil" 
          />
          <Menu.Item 
            onPress={handleDeleteAnnouncement} 
            title="Sil" 
            leadingIcon="delete" 
          />
        </Menu>
      )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    marginBottom: 8,
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
}); 