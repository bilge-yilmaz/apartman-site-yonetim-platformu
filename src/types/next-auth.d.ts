import { DefaultSession, DefaultUser } from 'next-auth'
import { UserRole } from '@/models/User'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      role: UserRole
      apartmentNo?: string
      block?: string
      isActive: boolean
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole
    apartmentNo?: string
    block?: string
    isActive: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    apartmentNo?: string
    block?: string
    isActive: boolean
  }
}
