import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret'
)

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
  error?: string
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    // Cookie'den token al
    const token = request.cookies.get('token')?.value

    if (!token) {
      return {
        success: false,
        error: 'Token bulunamadı'
      }
    }

    // Token'ı doğrula
    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      success: true,
      user: {
        id: payload.id as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as string
      }
    }
  } catch (error) {
    console.error('Token doğrulama hatası:', error)
    return {
      success: false,
      error: 'Geçersiz token'
    }
  }
} 