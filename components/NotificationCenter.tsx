import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSocket } from '../hooks/useSocket'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface NotificationCenterProps {
  style?: any
}

export default function NotificationCenter({ style }: NotificationCenterProps) {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    removeNotification,
    clearNotifications
  } = useSocket()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'megaphone-outline'
      case 'maintenance':
        return 'construct-outline'
      case 'payment':
        return 'card-outline'
      case 'reservation':
        return 'calendar-outline'
      default:
        return 'notifications-outline'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return '#3B82F6'
      case 'maintenance':
        return '#F59E0B'
      case 'payment':
        return '#10B981'
      case 'reservation':
        return '#8B5CF6'
      default:
        return '#6B7280'
    }
  }

  const handleNotificationPress = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    // Burada bildirimin türüne göre ilgili sayfaya yönlendirme yapılabilir
  }

  const handleRemoveNotification = (id: number) => {
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => removeNotification(id) }
      ]
    )
  }

  const handleClearAll = () => {
    Alert.alert(
      'Tüm Bildirimleri Temizle',
      'Tüm bildirimleri silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Temizle', style: 'destructive', onPress: clearNotifications }
      ]
    )
  }

  const renderNotificationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={24}
            color={getNotificationColor(item.type)}
          />
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>
              {format(new Date(item.timestamp), 'dd MMM yyyy HH:mm', { locale: tr })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveNotification(item.id)}
          >
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  )

  return (
    <>
      <TouchableOpacity
        style={[styles.notificationButton, style]}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="notifications-outline" size={24} color="#374151" />
        
        {/* Bağlantı durumu göstergesi */}
        <View style={[
          styles.connectionIndicator,
          { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
        ]} />
        
        {/* Okunmamış bildirim sayısı */}
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bildirimler</Text>
            <View style={styles.headerRight}>
              <View style={styles.connectionStatus}>
                <View style={[
                  styles.connectionDot,
                  { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={[
                  styles.connectionText,
                  { color: isConnected ? '#10B981' : '#EF4444' }
                ]}>
                  {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bildirimler listesi */}
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>Henüz bildirim yok</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.notificationsList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleClearAll}
              >
                <Text style={styles.clearAllText}>Tüm bildirimleri temizle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  connectionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadNotification: {
    backgroundColor: '#F8FAFC',
  },
  notificationContent: {
    padding: 16,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginLeft: 36,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearAllButton: {
    padding: 12,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
}) 