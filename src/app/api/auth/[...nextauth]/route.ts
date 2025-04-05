import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb'
import dbConnect from '@/lib/db'
import User, { UserRole } from '@/models/User'

// MongoDB adapter'ı NextAuth ile uyumlu hale getirmek için
const adapter = MongoDBAdapter(clientPromise)

export const authOptions: AuthOptions = {
  adapter: adapter as any, // Type casting to fix adapter compatibility issue
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 saat
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signout',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Veritabanı bağlantısını sağla
          await dbConnect()
          
          // Kullanıcıyı veritabanında ara
          const existingUser = await User.findOne({ 
            email: user.email 
          }).exec()
          
          if (existingUser) {
            // Aktif olmayan kullanıcıların girişini engelle
            if (!existingUser.isActive) {
              console.log(`Kullanıcı ${user.email} aktif değil, giriş engellendi`)
              return false
            }
            console.log(`Kullanıcı ${user.email} giriş yaptı`)
            return true
          } else {
            // Yeni kullanıcı oluştur (varsayılan olarak aktif RESIDENT)
            const newUser = new User({
              email: user.email,
              name: user.name,
              image: user.image,
              role: 'RESIDENT',
              isActive: true, // Varsayılan olarak aktif (geliştirme kolaylığı için)
              apartmentNo: '', // Yönetici tarafından güncellenecek
              block: '', // Yönetici tarafından güncellenecek
            })
            
            await newUser.save()
            console.log(`Yeni kullanıcı ${user.email} oluşturuldu ve giriş yaptı`)
            return true // Yeni kullanıcılar giriş yapabilir
          }
        } catch (error) {
          console.error('Oturum açma hatası:', error)
          return false
        }
      }
      return false
    },
    async jwt({ token, user }) {
      if (user) {
        try {
          await dbConnect()
          const dbUser = await User.findOne({ 
            email: user.email 
          }).exec()
          
          if (dbUser) {
            // Sadece gerekli ve var olan alanları token'a ekle
            token.role = dbUser.role || 'RESIDENT'
            token.isActive = dbUser.isActive || false
            
            if (dbUser.apartmentNo) token.apartmentNo = dbUser.apartmentNo
            if (dbUser.block) token.block = dbUser.block
            
            console.log(`Token oluşturuldu: ${user.email}, rol: ${token.role}`)
          } else {
            console.warn(`Kullanıcı veritabanında bulunamadı: ${user.email}`)
          }
        } catch (error) {
          console.error('JWT oluşturma hatası:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        // Token'dan session'a güvenli bir şekilde değerleri aktar
        session.user.role = token.role as UserRole
        session.user.isActive = !!token.isActive
        
        // Opsiyonel alanlar için null check
        if (token.apartmentNo) session.user.apartmentNo = token.apartmentNo as string
        if (token.block) session.user.block = token.block as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
