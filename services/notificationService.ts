import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Notification handler ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface LocalNotification {
  title: string;
  message: string;
  data?: any;
  categoryIdentifier?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Push notification izinlerini al
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications sadece fiziksel cihazlarda çalışır');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification izni verilmedi');
        return false;
      }

      // Android için notification channel oluştur
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Apartman Bildirimleri',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('✅ Push notification izinleri alındı');
      return true;
    } catch (error) {
      console.error('❌ Push notification izin hatası:', error);
      return false;
    }
  }

  // Expo push token al
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push token sadece fiziksel cihazlarda alınabilir');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Expo projenizin ID'si
      });

      this.expoPushToken = token.data;
      console.log('✅ Expo push token alındı:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Expo push token alma hatası:', error);
      return null;
    }
  }

  // Local notification göster
  async showLocalNotification(notification: LocalNotification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data || {},
          categoryIdentifier: notification.categoryIdentifier,
        },
        trigger: null, // Hemen göster
      });

      console.log('✅ Local notification gösterildi:', notification.title);
    } catch (error) {
      console.error('❌ Local notification hatası:', error);
    }
  }

  // Socket bildirimini local notification olarak göster
  async showSocketNotification(socketData: any): Promise<void> {
    try {
      const notification: LocalNotification = {
        title: socketData.title || 'Yeni Bildirim',
        message: socketData.message || '',
        data: socketData,
        categoryIdentifier: this.getCategoryIdentifier(socketData.type),
      };

      await this.showLocalNotification(notification);
    } catch (error) {
      console.error('❌ Socket notification gösterme hatası:', error);
    }
  }

  // Bildirim tipine göre kategori belirle
  private getCategoryIdentifier(type: string): string {
    switch (type) {
      case 'announcement':
      case 'announcement-notification':
        return 'ANNOUNCEMENT';
      case 'maintenance':
      case 'maintenance-notification':
        return 'MAINTENANCE';
      case 'payment':
      case 'payment-notification':
        return 'PAYMENT';
      case 'reservation':
      case 'reservation-notification':
        return 'RESERVATION';
      default:
        return 'GENERAL';
    }
  }

  // Badge sayısını güncelle
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Badge count güncelleme hatası:', error);
    }
  }

  // Tüm bildirimleri temizle
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
      console.log('✅ Tüm bildirimler temizlendi');
    } catch (error) {
      console.error('❌ Bildirim temizleme hatası:', error);
    }
  }

  // Notification listener'ları ayarla
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    // Uygulama açıkken gelen bildirimler
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Bildirim alındı:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Bildirime tıklandığında
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Bildirime tıklandı:', response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  // Listener'ları temizle
  removeNotificationListeners(listeners: {
    notificationListener: Notifications.Subscription;
    responseListener: Notifications.Subscription;
  }) {
    listeners.notificationListener.remove();
    listeners.responseListener.remove();
  }
}

export default NotificationService.getInstance(); 