import mongoose, { Model } from 'mongoose'

export interface IFCMToken {
  userId: string
  token: string
  deviceType: 'web' | 'android' | 'ios'
  deviceInfo?: {
    userAgent?: string
    platform?: string
    appVersion?: string
  }
  isActive: boolean
  lastUsed: Date
  createdAt: Date
  updatedAt: Date
}

interface FCMTokenModel extends Model<IFCMToken> {}

const FCMTokenSchema = new mongoose.Schema<IFCMToken, FCMTokenModel>(
  {
    userId: { 
      type: String, 
      required: true,
      ref: 'User'
    },
    token: { 
      type: String, 
      required: true,
      unique: true
    },
    deviceType: {
      type: String,
      enum: ['web', 'android', 'ios'],
      required: true
    },
    deviceInfo: {
      userAgent: { type: String },
      platform: { type: String },
      appVersion: { type: String }
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    lastUsed: { 
      type: Date, 
      default: Date.now 
    }
  },
  {
    timestamps: true,
  }
)

// Index'ler
FCMTokenSchema.index({ userId: 1, deviceType: 1 })
FCMTokenSchema.index({ token: 1 }, { unique: true })
FCMTokenSchema.index({ isActive: 1 })

const FCMToken = (mongoose.models.FCMToken as FCMTokenModel) || 
  mongoose.model<IFCMToken, FCMTokenModel>('FCMToken', FCMTokenSchema)

export default FCMToken 