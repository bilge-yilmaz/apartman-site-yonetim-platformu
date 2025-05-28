import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'
import admin from 'firebase-admin'

// Firebase Admin SDK'yı initialize et
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "apartman-site",
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@apartman-site.iam.gserviceaccount.com",
    privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCfnEc/xj+jCPH/
9wZkG9gLvl7hE9PLIyD2xQjLJ0gyXQXAZFlnumfxD9WkMLLV0iIinbDAp1JQPAUR
hkUfjy0tLnZgqU0/PyaIgGffm+JUxn/sDCMEVE884ZkvbW1x+2OCsDNvx8NFR8/f
fPwkq9NR/MF3VFTQokJg/BnFp5pp7jN6kKUo2RrufyWeleAv5RIYFxsTIL6ni+yB
cwXbFAzw/PXuL8+TM3J8XwZTRGf5kqFma/mSynQ0wBRnSkvzpApzgsV9QYEe9rai
FEWV7tSBy+sFSvqKHwvrqxZ31Fpr4y2+8xUOYRocW0RNkmO0p2dI7DmchKU6O0xs
5oU/j5grAgMBAAECggEAA61eYtvd2z3V2ezUshX36mHK+uqHBoUwjuYAUms2C2Ic
Jwjo00qhWqPfwIRPJuf2y12XzeTpacuWbIdE108vQdJyGjCsWicCpJeOFDPEbM0i
1ud65pr3ipmlwfNqAjSXQ4tszNZelh15ix3QJ/7MGTyvZ+8tV0i81TWgytH50KVf
DusKQFXN2zO1Q6fZTr+ri8IE0mHdIgyEFv+d9JOQxdfVsbWFxbd5j4eTFFYfYYBN
5eOxf6LAd34wta0mDOOPQ4/JIpzOVqY+VjjDB+pgQV2sTzZB+Od7dPCIgA4uVjDM
dWCIekboynF8Idq9wje/3ud4azHjev0sT6J9EVX7gQKBgQDPwjnmY+No9YkNgh0z
XNEQSxoYYjzsnk/PHkFq1oXwNu05QIpCnaBCbUn1x6DkRGebYvKsf6fCCOw2KdpF
/Eu+N2nyM1bs1+FX9hDMSiVrZZh4KZ9bQP4jCXP5lfHGgBhHRX7ZnuxljnE7ZvwM
OUhEhHMIPnPYVsuQtU9NNQdhwQKBgQDEq/uX5dyWnhm274pjx413lV/txLlTt9Xk
Fj/a/8alCAa8NZaRShAF2/zKjkK//79i7mMeWvaFQXmYmMq9maG0lLmXG1G1/0jS
IZajGPKBs2m9ksMtVxYcQsQCPR5mV/XuVowWfLDAdQm32vdjqKFgcqLw+g4WCpEa
NRJv7Yfc6wKBgCdRl8mdb+VmSpjO3h3hXAOcYwToWqVhVLNbA4BntxN+IakrKL9w
u2q26j9kl3N76qvCrzCsPCCBtcqOYyvJksAeFqPqyXGrbY9LF2TCR5Cquo9LOUh4
5V/WIyfCE+7AQVgDs/0VkaGqso1OcTcTBDVLZ8XQo/X2fzIUzjxLY+lBAoGAE748
FISTv18Br9aeKuQWdIG/TowoGppi03HUWTTCCUEkA/LROaaYsy3hU6gyVTnkSZcq
xhpVkwz+mu4DtELe89TWSLAKZN3KvqV2jMrtVU3geJJqG3wZkR62tI7UJWwBGTsA
9yTvTXKyVg2aNhvwj1ESwGQp09aduGbJggjzUZ8CgYBzhpbSvdA82wTQ42w44Azs
1J/3szAcyADF4SA8Lg55OlcfK2H3WAxLHT+dh5ij2SAyC70ugn6dzNtpdg38Cbdc
vXoydViLGSnQE34zNxB/lk9CUtVrzV5nvPjPbZ6Wbdqk6XBMVwkgI6y10JU9ydCG
xinidRMyPp3y1B/VKTC8Sg==
-----END PRIVATE KEY-----`).replace(/\\n/g, '\n')
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.projectId
  })
}

export async function POST(req: NextRequest) {
  const steps: string[] = []
  
  try {
    steps.push('1. ✅ Debug test başladı')
    
    // Auth kontrolü
    const authToken = req.cookies.get('token')?.value
    let userRole = 'RESIDENT'
    
    if (authToken) {
      try {
        const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString())
        userRole = payload.role || 'RESIDENT'
        steps.push(`2. ✅ Auth token bulundu, role: ${userRole}`)
      } catch (error) {
        steps.push(`2. ❌ Auth token decode hatası: ${error}`)
      }
    } else {
      steps.push('2. ❌ Auth token bulunamadı')
    }
    
    // Role kontrolü
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      steps.push(`3. ❌ Yetkisiz role: ${userRole}`)
      return NextResponse.json({ error: 'Yetkisiz', steps }, { status: 403 })
    }
    steps.push('3. ✅ Role kontrolü başarılı')
    
    // MongoDB bağlantısı
    await dbConnect()
    steps.push('4. ✅ MongoDB bağlantısı başarılı')
    
    // Token'ları al
    const tokens = await mongoose.connection.collection('fcmtokens')
      .find({ isActive: true })
      .toArray()
    steps.push(`5. ✅ Token sorgusu tamamlandı, bulunan: ${tokens.length}`)
    
    if (tokens.length === 0) {
      steps.push('6. ❌ Aktif token bulunamadı')
      return NextResponse.json({ error: 'Token yok', steps }, { status: 404 })
    }
    
    // Geçerli token'ları filtrele
    const validTokens = tokens.filter(t => t.token && t.token.length > 50)
    steps.push(`6. ✅ Geçerli token sayısı: ${validTokens.length}`)
    
    if (validTokens.length === 0) {
      steps.push('7. ❌ Geçerli token bulunamadı')
      return NextResponse.json({ error: 'Geçerli token yok', steps }, { status: 404 })
    }
    
    // İlk token'ı al
    const firstToken = validTokens[0].token
    steps.push(`7. ✅ İlk token alındı: ${firstToken.substring(0, 20)}...`)
    
    // Firebase mesajı hazırla
    const message = {
      notification: {
        title: 'Debug Test Notification',
        body: 'Bu bir debug test bildirimidir'
      },
      data: {
        type: 'DEBUG_TEST',
        timestamp: new Date().toISOString()
      },
      webpush: {
        notification: {
          title: 'Debug Test Notification',
          body: 'Bu bir debug test bildirimidir',
          requireInteraction: true
        }
      },
      token: firstToken
    }
    steps.push('8. ✅ Firebase mesajı hazırlandı')
    
    // Firebase'e gönder
    const response = await admin.messaging().send(message)
    steps.push(`9. ✅ Firebase'e gönderildi, messageId: ${response}`)
    
    return NextResponse.json({
      success: true,
      messageId: response,
      steps
    })
    
  } catch (error) {
    steps.push(`❌ Hata: ${error instanceof Error ? error.message : String(error)}`)
    console.error('Debug test hatası:', error)
    console.error('Adımlar:', steps)
    
    return NextResponse.json(
      { 
        error: 'Debug test hatası',
        details: error instanceof Error ? error.message : String(error),
        steps
      },
      { status: 500 }
    )
  }
} 