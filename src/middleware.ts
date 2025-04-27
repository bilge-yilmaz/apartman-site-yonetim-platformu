import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from './models/User'

// Helper fonksiyonlar
const isAdmin = (role?: string) => role === 'ADMIN'
const isManager = (role?: string) => role === 'MANAGER'
const isResident = (role?: string) => role === 'RESIDENT'
const isStaff = (role?: string) => isAdmin(role) || isManager(role)

// Basit token doğrulama fonksiyonu
const decodeToken = (token: string): any => {
  try {
    // Base64 decode
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Token decode hatası:', error)
    return null
  }
}

// Sayfa gruplarını tanımla
const PUBLIC_PATHS = ['/auth', '/unauthorized', '/account-suspended', '/api']
const ADMIN_ONLY_PATHS = ['/admin/users']
const STAFF_PATHS = ['/admin', '/reports', '/payments', '/maintenance', '/announcements', '/residents', '/reservations']
const RESIDENT_PATHS = ['/resident']
const SHARED_PATHS = ['/profile']

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  // Public sayfalar için token kontrolü yapma
  if (PUBLIC_PATHS.some(prefix => path.startsWith(prefix) || path === prefix)) {
    return NextResponse.next()
  }
  
  // Cookie'den token'ı al
  const authToken = req.cookies.get('token')?.value
  
  // Token yoksa login sayfasına yönlendir
  if (!authToken) {
    console.log(`No token found, redirecting to login: ${path}`)
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
  
  // Token'ı decode et
  const userData = decodeToken(authToken)
  
  // Token geçersizse login sayfasına yönlendir
  if (!userData) {
    console.log(`Invalid token, redirecting to login: ${path}`)
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
  
  const role = userData.role as string | undefined
  const isActive = !!userData.isActive
  
  // Kullanıcı aktif değilse hesap askıya alındı sayfasına yönlendir
  if (!isActive) {
    console.log(`Inactive user ${userData.email} attempted to access ${path}`)
    return NextResponse.redirect(new URL('/account-suspended', req.url))
  }
  
  // Ana sayfaya gelen kullanıcıları rollerine göre yönlendir
  if (path === '/') {
    if (isResident(role)) {
      return NextResponse.redirect(new URL('/resident/dashboard', req.url))
    } else if (isStaff(role)) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
  }
  
  // Sadece yöneticilere özel sayfalar için kontrol
  if (ADMIN_ONLY_PATHS.some(prefix => path.startsWith(prefix))) {
    if (!isAdmin(role)) {
      console.log(`Non-admin user ${userData.email} attempted to access admin-only path: ${path}`)
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }
  
  // Yönetici ve yönetici personeli sayfaları için kontrol
  if (STAFF_PATHS.some(prefix => path.startsWith(prefix))) {
    if (!isStaff(role)) {
      console.log(`Resident user ${userData.email} attempted to access staff path: ${path}`)
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }
  
  // Site sakini sayfaları için kontrol
  if (RESIDENT_PATHS.some(prefix => path.startsWith(prefix))) {
    if (!isResident(role)) {
      console.log(`Staff user ${userData.email} attempted to access resident path: ${path}`)
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }
  
  // Herkesin erişebileceği ortak sayfalar için özel kontrol gerekmez
  // (SHARED_PATHS için herhangi bir kısıtlama yok, sadece oturum açmış olmaları yeterli)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/reports/:path*',
    '/resident/:path*',
    '/profile/:path*',
    '/payments/:path*',
    '/maintenance/:path*',
    '/announcements/:path*',
    '/reservations/:path*',
  ],
}
