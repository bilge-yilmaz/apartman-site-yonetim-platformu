import { NextRequest, NextResponse } from 'next/server'

// Bu dosya artık kullanılmıyor, ancak Next.js'in route sistemini bozmamak için tutuyoruz
// Kimlik doğrulama için /api/auth/login endpoint'ini kullanıyoruz

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}

export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}
