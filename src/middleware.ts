import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Giriş yapmamış kullanıcıları login sayfasına yönlendir
    if (!token && path !== '/auth/signin') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Ana sayfaya gelen kullanıcıları rollerine göre yönlendir
    if (path === '/') {
      if (token?.role === 'RESIDENT') {
        return NextResponse.redirect(new URL('/resident/dashboard', req.url))
      } else if (token?.role === 'ADMIN' || token?.role === 'MANAGER') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
    }

    // Admin ve yönetici sayfaları için kontrol
    if (path.startsWith('/admin') || path.startsWith('/reports')) {
      if (token?.role !== 'ADMIN' && token?.role !== 'MANAGER') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Site sakini sayfaları için kontrol
    if (path.startsWith('/resident')) {
      if (token?.role !== 'RESIDENT') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Aktif olmayan kullanıcıları engelle
    if (token && !token.isActive) {
      return NextResponse.redirect(new URL('/account-suspended', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Public sayfalar için token kontrolü yapma
        if (
          path.startsWith('/auth/') ||
          path === '/unauthorized' ||
          path === '/account-suspended'
        ) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/reports/:path*',
    '/resident/:path*',
    '/profile/:path*',
  ],
}
