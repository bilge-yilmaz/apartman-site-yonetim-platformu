import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Cookie'yi temizle
    const response = NextResponse.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    })

    // Token cookie'sini sil
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: false,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Hemen sil
      sameSite: 'lax'
    })
    
    return response
    
  } catch (error) {
    console.error('Çıkış sırasında hata:', error)
    return NextResponse.json(
      { error: 'Çıkış yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
} 