import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // CORS başlıklarını ekle
  const response = NextResponse.next();

  // Tüm kaynaklardan gelen isteklere izin ver
  response.headers.set('Access-Control-Allow-Origin', '*');
  
  // İzin verilen HTTP metotları
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // İzin verilen başlıklar
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Credentials izni (cookie, auth header vb.)
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Preflight isteklerinin önbelleğe alınma süresi (saniye)
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// Sadece API rotalarına uygula
export const config = {
  matcher: '/api/:path*',
};
