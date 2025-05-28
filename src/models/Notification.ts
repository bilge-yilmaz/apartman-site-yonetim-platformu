import mongoose, { Model } from 'mongoose'

export type NotificationType = 
  | 'PAYMENT_DUE'           // Aidat vadesi
  | 'PAYMENT_RECEIVED'      // Ödeme alındı
  | 'MAINTENANCE_REQUEST'   // Bakım talebi
  | 'MAINTENANCE_UPDATE'    // Bakım güncellesi
  | 'ANNOUNCEMENT'          // Duyuru
  | 'RESERVATION_CONFIRMED' // Rezervasyon onayı
  | 'RESERVATION_REMINDER'  // Rezervasyon hatırlatması
  | 'GENERAL'               // Genel bildirim

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface INotification {
  title: string
  body: string
  type: NotificationType
  priority: NotificationPriority
  
  // Hedef kullanıcılar
  targetUsers?: string[]        // Belirli kullanıcılar
  targetRoles?: string[]        // Belirli roller
  targetBlocks?: string[]       // Belirli bloklar
  targetApartments?: string[]   // Belirli daireler
  isGlobal?: boolean           // Tüm kullanıcılar
  
  // İçerik
  data?: Record<string, any>   // Ek veri
  imageUrl?: string            // Görsel
  actionUrl?: string           // Tıklanınca gidilecek URL
  
  // Zamanlama
  scheduledAt?: Date           // Zamanlanmış gönderim
  expiresAt?: Date            // Son geçerlilik tarihi
  
  // Durum
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED'
  sentAt?: Date
  sentCount?: number
  failedCount?: number
  
  // Meta
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface NotificationModel extends Model<INotification> {}

const NotificationSchema = new mongoose.Schema<INotification, NotificationModel>(
  {
    title: { 
      type: String, 
      required: true,
      maxlength: 100
    },
    body: { 
      type: String, 
      required: true,
      maxlength: 500
    },
    type: {
      type: String,
      enum: [
        'PAYMENT_DUE',
        'PAYMENT_RECEIVED', 
        'MAINTENANCE_REQUEST',
        'MAINTENANCE_UPDATE',
        'ANNOUNCEMENT',
        'RESERVATION_CONFIRMED',
        'RESERVATION_REMINDER',
        'GENERAL'
      ],
      required: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL'
    },
    
    // Hedef
    targetUsers: [{ type: String, ref: 'User' }],
    targetRoles: [{ type: String }],
    targetBlocks: [{ type: String }],
    targetApartments: [{ type: String }],
    isGlobal: { type: Boolean, default: false },
    
    // İçerik
    data: { type: mongoose.Schema.Types.Mixed },
    imageUrl: { type: String },
    actionUrl: { type: String },
    
    // Zamanlama
    scheduledAt: { type: Date },
    expiresAt: { type: Date },
    
    // Durum
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'SENT', 'FAILED'],
      default: 'DRAFT'
    },
    sentAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    
    // Meta
    createdBy: { 
      type: String, 
      required: true,
      ref: 'User'
    }
  },
  {
    timestamps: true,
  }
)

// Index'ler
NotificationSchema.index({ type: 1, status: 1 })
NotificationSchema.index({ scheduledAt: 1, status: 1 })
NotificationSchema.index({ createdBy: 1 })
NotificationSchema.index({ targetUsers: 1 })
NotificationSchema.index({ createdAt: -1 })

const Notification = (mongoose.models.Notification as NotificationModel) || 
  mongoose.model<INotification, NotificationModel>('Notification', NotificationSchema)

export default Notification 