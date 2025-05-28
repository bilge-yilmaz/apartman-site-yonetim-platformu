import mongoose, { Model } from 'mongoose'

export type UserRole = 'ADMIN' | 'MANAGER' | 'RESIDENT'

export interface IUser {
  email: string
  password?: string
  name: string
  image?: string
  role: UserRole
  apartmentNo?: string
  block?: string
  phone?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

// Model tipini tanımla
interface UserModel extends Model<IUser> {}

// Schema tanımla
const UserSchema = new mongoose.Schema<IUser, UserModel>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String, required: true },
    image: { type: String },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'RESIDENT'],
      default: 'RESIDENT',
    },
    apartmentNo: { type: String, default: '' },
    block: { type: String, default: '' },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
)

// Next.js App Router için model oluşturma
const User = (mongoose.models.User as UserModel) || 
  mongoose.model<IUser, UserModel>('User', UserSchema)

export default User

