import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre gereklidir' },
        { status: 400 }
      )
    }
    
    // Veritabanına bağlan
    await dbConnect()
    console.log('Veritabanı bağlantısı kuruldu')
    
    // Test hesapları için sabit şifre kontrolü
    if (password !== 'test123') {
      console.log('Geçersiz şifre')
      return NextResponse.json(
        { error: 'Geçersiz kimlik bilgileri' },
        { status: 401 }
      )
    }
    
    // Hem users hem de User koleksiyonlarını kontrol et
    let user = null
    
    // Önce users koleksiyonunu dene
    const usersCollection = mongoose.connection.collection('users')
    user = await usersCollection.findOne({ email })
    console.log('users koleksiyonu sorgusu sonucu:', user ? 'Kullanıcı bulundu' : 'Kullanıcı bulunamadı')
    
    // Bulunamazsa User koleksiyonunu dene
    if (!user) {
      const userCollection = mongoose.connection.collection('User')
      user = await userCollection.findOne({ email })
      console.log('User koleksiyonu sorgusu sonucu:', user ? 'Kullanıcı bulundu' : 'Kullanıcı bulunamadı')
    }
    
    if (!user) {
      console.log(`Kullanıcı bulunamadı: ${email}`)
      return NextResponse.json(
        { error: 'Geçersiz kimlik bilgileri' },
        { status: 401 }
      )
    }
    
    console.log(`Kullanıcı bulundu: ${user.email}, Rol: ${user.role}`)
    
    if (!user.isActive) {
      console.log(`Kullanıcı aktif değil: ${email}`)
      return NextResponse.json(
        { error: 'Hesap askıya alınmış' },
        { status: 403 }
      )
    }
    
    // Son giriş zamanını güncelle
    const collection = user._id ? 'users' : 'User'
    await mongoose.connection.collection(collection).updateOne(
      { email },
      { $set: { lastLogin: new Date() } }
    )
    
    // Basit JWT token oluştur
    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      apartmentNo: user.apartmentNo,
      block: user.block,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 1 gün
    }
    
    // Base64Url encode
    const base64UrlEncode = (str: string) => {
      return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    }
    
    // Header
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    
    // Payload
    const encodedPayload = base64UrlEncode(JSON.stringify(payload))
    
    // Basit imza (gerçek doğrulama yapmıyoruz, sadece decode ediyoruz)
    // Gerçek bir uygulamada burada HMAC-SHA256 imzası kullanılmalıdır
    const signature = base64UrlEncode('signature-placeholder')
    
    // JWT token'ı oluştur
    const token = `${header}.${encodedPayload}.${signature}`
    
    // Cookie'ye token'ı kaydet
    cookies().set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 gün
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })
    
  } catch (error) {
    console.error('Giriş sırasında hata:', error)
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
