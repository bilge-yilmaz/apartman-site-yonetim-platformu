import { connectDB } from './mongodb'
import FCMToken, { IFCMToken } from '@/models/FCMToken'
import NotificationModel, { INotification, NotificationType, NotificationPriority } from '@/models/Notification'
import { 
  sendNotificationToDevice, 
  sendNotificationToMultipleDevices,
  sendNotificationToTopic 
} from './firebase-admin'
import User from '@/models/User'

export interface SendNotificationOptions {
  title: string
  body: string
  type: NotificationType
  priority?: NotificationPriority
  
  // Hedef seçenekleri
  targetUsers?: string[]
  targetRoles?: string[]
  targetBlocks?: string[]
  targetApartments?: string[]
  isGlobal?: boolean
  
  // İçerik
  data?: Record<string, any>
  imageUrl?: string
  actionUrl?: string
  
  // Zamanlama
  scheduledAt?: Date
  expiresAt?: Date
  
  // Gönderen
  createdBy: string
}

export class NotificationService {
  
  /**
   * Bildirim oluştur ve gönder
   */
  static async sendNotification(options: SendNotificationOptions) {
    try {
      await connectDB()

      // Bildirim kaydını oluştur
      const notification = new NotificationModel({
        title: options.title,
        body: options.body,
        type: options.type,
        priority: options.priority || 'NORMAL',
        targetUsers: options.targetUsers,
        targetRoles: options.targetRoles,
        targetBlocks: options.targetBlocks,
        targetApartments: options.targetApartments,
        isGlobal: options.isGlobal,
        data: options.data,
        imageUrl: options.imageUrl,
        actionUrl: options.actionUrl,
        scheduledAt: options.scheduledAt,
        expiresAt: options.expiresAt,
        createdBy: options.createdBy,
        status: options.scheduledAt ? 'SCHEDULED' : 'DRAFT'
      })

      await notification.save()

      // Eğer zamanlanmış değilse hemen gönder
      if (!options.scheduledAt) {
        await this.processNotification(notification._id.toString())
      }

      return {
        success: true,
        notificationId: notification._id,
        message: options.scheduledAt ? 'Bildirim zamanlandı' : 'Bildirim gönderildi'
      }

    } catch (error) {
      console.error('Bildirim gönderme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Bildirimi işle ve gönder
   */
  static async processNotification(notificationId: string) {
    try {
      await connectDB()

      const notification = await NotificationModel.findById(notificationId)
      if (!notification) {
        throw new Error('Bildirim bulunamadı')
      }

      // Hedef kullanıcıları belirle
      const targetUserIds = await this.getTargetUsers(notification)
      
      if (targetUserIds.length === 0) {
        notification.status = 'FAILED'
        notification.failedCount = 1
        await notification.save()
        return { success: false, error: 'Hedef kullanıcı bulunamadı' }
      }

      // FCM token'larını al
      const fcmTokens = await FCMToken.find({
        userId: { $in: targetUserIds },
        isActive: true
      })

      if (fcmTokens.length === 0) {
        notification.status = 'FAILED'
        notification.failedCount = 1
        await notification.save()
        return { success: false, error: 'Aktif FCM token bulunamadı' }
      }

      // Push notification gönder
      const tokens = fcmTokens.map(token => token.token)
      const result = await sendNotificationToMultipleDevices(
        tokens,
        notification.title,
        notification.body,
        {
          type: notification.type,
          notificationId: notificationId,
          actionUrl: notification.actionUrl || '',
          ...notification.data
        }
      )

      // Sonucu kaydet
      notification.status = result.success ? 'SENT' : 'FAILED'
      notification.sentAt = new Date()
      notification.sentCount = result.successCount || 0
      notification.failedCount = result.failureCount || 0
      await notification.save()

      return result

    } catch (error) {
      console.error('Bildirim işleme hatası:', error)
      
      // Hata durumunu kaydet
      try {
        await NotificationModel.findByIdAndUpdate(notificationId, {
          status: 'FAILED',
          failedCount: 1
        })
      } catch (updateError) {
        console.error('Bildirim durumu güncelleme hatası:', updateError)
      }

      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Hedef kullanıcıları belirle
   */
  private static async getTargetUsers(notification: any): Promise<string[]> {
    let userIds: string[] = []

    // Global bildirim
    if (notification.isGlobal) {
      const users = await User.find({ isActive: true }, '_id')
      return users.map(user => user._id.toString())
    }

    // Belirli kullanıcılar
    if (notification.targetUsers && notification.targetUsers.length > 0) {
      userIds = [...userIds, ...notification.targetUsers]
    }

    // Rol bazlı
    if (notification.targetRoles && notification.targetRoles.length > 0) {
      const users = await User.find({
        role: { $in: notification.targetRoles },
        isActive: true
      }, '_id')
      userIds = [...userIds, ...users.map(user => user._id.toString())]
    }

    // Blok bazlı
    if (notification.targetBlocks && notification.targetBlocks.length > 0) {
      const users = await User.find({
        block: { $in: notification.targetBlocks },
        isActive: true
      }, '_id')
      userIds = [...userIds, ...users.map(user => user._id.toString())]
    }

    // Daire bazlı
    if (notification.targetApartments && notification.targetApartments.length > 0) {
      const users = await User.find({
        apartmentNo: { $in: notification.targetApartments },
        isActive: true
      }, '_id')
      userIds = [...userIds, ...users.map(user => user._id.toString())]
    }

    // Tekrar eden ID'leri kaldır
    return Array.from(new Set(userIds))
  }

  /**
   * Zamanlanmış bildirimleri işle
   */
  static async processScheduledNotifications() {
    try {
      await connectDB()

      const now = new Date()
      const scheduledNotifications = await NotificationModel.find({
        status: 'SCHEDULED',
        scheduledAt: { $lte: now }
      })

      for (const notification of scheduledNotifications) {
        await this.processNotification(notification._id.toString())
      }

      return {
        success: true,
        processedCount: scheduledNotifications.length
      }

    } catch (error) {
      console.error('Zamanlanmış bildirim işleme hatası:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Hızlı bildirim gönderme fonksiyonları
export const sendPaymentDueNotification = (userId: string, amount: number, dueDate: Date) => {
  return NotificationService.sendNotification({
    title: 'Aidat Vadesi Yaklaşıyor',
    body: `${amount} TL tutarındaki aidatınızın son ödeme tarihi: ${dueDate.toLocaleDateString('tr-TR')}`,
    type: 'PAYMENT_DUE',
    priority: 'HIGH',
    targetUsers: [userId],
    data: { amount: amount.toString(), dueDate: dueDate.toISOString() },
    actionUrl: '/payments',
    createdBy: 'system'
  })
}

export const sendMaintenanceRequestNotification = (managerId: string, apartmentNo: string, description: string) => {
  return NotificationService.sendNotification({
    title: 'Yeni Bakım Talebi',
    body: `${apartmentNo} numaralı daireden yeni bakım talebi: ${description}`,
    type: 'MAINTENANCE_REQUEST',
    priority: 'NORMAL',
    targetUsers: [managerId],
    data: { apartmentNo, description },
    actionUrl: '/maintenance',
    createdBy: 'system'
  })
}

export const sendAnnouncementNotification = (title: string, body: string, createdBy: string, isGlobal = true) => {
  return NotificationService.sendNotification({
    title,
    body,
    type: 'ANNOUNCEMENT',
    priority: 'NORMAL',
    isGlobal,
    actionUrl: '/announcements',
    createdBy
  })
} 