import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { UserRole } from '@/models/User'

/**
 * Ana sayfa bileşeni
 * Kullanıcıları rollerine göre ilgili dashboard sayfalarına yönlendirir
 * Giriş yapmamış kullanıcıları login sayfasına yönlendirir
 * Aktif olmayan kullanıcıları hesap askıya alındı sayfasına yönlendirir
 */
export default async function Home() {
  // JWT token'ı cookie'den al
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  // Giriş yapmamış kullanıcıları login sayfasına yönlendir
  if (!token) {
    redirect('/auth/signin')
  }

  // Token'ı decode et
  let payload;
  try {
    const base64Payload = token.split('.')[1]
    payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'))
  } catch (error) {
    console.error('Token decode hatası:', error)
    redirect('/auth/signin')
  }

  // Aktif olmayan kullanıcıları hesap askıya alındı sayfasına yönlendir
  if (!payload.isActive) {
    redirect('/account-suspended')
  }

  // Kullanıcı rolünü al
  const userRole = payload.role as UserRole

  // Kullanıcıları rollerine göre yönlendir
  switch (userRole) {
    case 'RESIDENT':
      redirect('/resident/dashboard')
    case 'MANAGER':
    case 'ADMIN':
      redirect('/admin/dashboard')
    default:
      // Geçersiz rol durumunda yetkisiz sayfasına yönlendir
      console.error(`Geçersiz kullanıcı rolü: ${userRole}`)
      redirect('/unauthorized')
  }

  // Bu noktaya asla ulaşılmamalı, ama TypeScript için return ekleyelim
  return null
}
