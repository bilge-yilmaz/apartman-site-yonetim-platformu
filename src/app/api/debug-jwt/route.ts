import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    // Cookie'den token'ı al
    const token = req.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({
        error: 'Token bulunamadı',
        hasToken: false,
        cookieNames: Array.from(req.cookies.getAll().map(c => c.name))
      })
    }

    // Environment variables kontrol et
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
    
    console.log('🔍 JWT Debug:')
    console.log('Token var:', !!token)
    console.log('Token preview:', token.substring(0, 50) + '...')
    console.log('JWT_SECRET var:', !!process.env.JWT_SECRET)
    console.log('JWT_SECRET preview:', jwtSecret.substring(0, 10) + '...')
    
    // Token'ı decode et (verify etmeden)
    let decoded
    try {
      decoded = jwt.decode(token, { complete: true })
      console.log('Token decoded:', decoded)
    } catch (decodeError) {
      console.log('Token decode hatası:', decodeError)
    }
    
    // Token'ı verify et
    let verified
    let verifyError
    try {
      verified = jwt.verify(token, jwtSecret)
      console.log('Token verified:', verified)
    } catch (error) {
      verifyError = error
      console.log('Token verify hatası:', error)
    }
    
    return NextResponse.json({
      hasToken: true,
      tokenPreview: token.substring(0, 50) + '...',
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretPreview: jwtSecret.substring(0, 10) + '...',
      decoded,
      verified,
      verifyError: verifyError ? {
        name: verifyError.name,
        message: verifyError.message
      } : null,
      cookieNames: Array.from(req.cookies.getAll().map(c => c.name))
    })
    
  } catch (error) {
    console.error('JWT debug hatası:', error)
    return NextResponse.json(
      { 
        error: 'JWT debug hatası', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
} 