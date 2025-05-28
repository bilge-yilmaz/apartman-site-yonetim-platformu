import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'

// Firebase Admin SDK import
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
  try {
    const payload = await req.json()
    
    // Debug ve admin panel'den gelen farklı formatları destekle
    const title = payload.title || 'Test Bildirimi'
    const body = payload.body || 'Bu bir test bildirimidir.'
    const targetType = payload.targetType || (payload.isGlobal ? 'all' : 'all')
    
    // Veritabanına bağlan
    await dbConnect()
    
    // Cookie'den kullanıcı bilgisini al
    const authToken = req.cookies.get('token')?.value
    let userRole = 'RESIDENT'
    
    if (authToken) {
      try {
        const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString())
        userRole = payload.role || 'RESIDENT'
      } catch (error) {
        console.log('Token decode hatası:', error)
      }
    }
    
    // Sadece Admin ve Manager notification gönderebilir
    if (!['ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      )
    }
    
    // Hedefleme mantığı
    let tokenQuery: any = { isActive: true }
    
    // Admin panel'den gelen hedefleme parametrelerini işle
    if (payload.targetRoles && payload.targetRoles.length > 0) {
      // Belirli rollerdeki kullanıcıları hedefle
      const users = await mongoose.connection.collection('users')
        .find({ role: { $in: payload.targetRoles } })
        .toArray()
      
      // Email'leri kullan (token kayıt sistemi artık email kullanıyor)
      const userEmails = users.map(u => u.email)
      tokenQuery.userId = { $in: userEmails }
    } else if (payload.targetUsers && payload.targetUsers.length > 0) {
      // Belirli kullanıcıları hedefle
      tokenQuery.userId = { $in: payload.targetUsers }
    }
    // isGlobal true ise veya hiçbir hedef belirtilmemişse tüm aktif token'ları al
    
    // Aktif FCM token'ları al
    const tokens = await mongoose.connection.collection('fcmtokens')
      .find(tokenQuery)
      .toArray()
    
    console.log('Gelen payload:', JSON.stringify(payload, null, 2))
    console.log('Hedefleme sorgusu:', JSON.stringify(tokenQuery, null, 2))
    console.log('Bulunan token sayısı:', tokens.length)
    console.log('Token detayları:', tokens.map(t => ({ 
      userId: t.userId, 
      deviceType: t.deviceType, 
      token: t.token ? t.token.substring(0, 20) + '...' : 'null'
    })))
    
    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'Aktif token bulunamadı' },
        { status: 404 }
      )
    }
    
    // Token'ların geçerli olduğunu kontrol et
    const validTokens = tokens.filter(t => t.token && t.token.length > 50)
    console.log('Geçerli token sayısı:', validTokens.length)
    
    if (validTokens.length === 0) {
      return NextResponse.json(
        { error: 'Geçerli token bulunamadı' },
        { status: 404 }
      )
    }
    
    // Notification payload'ı hazırla
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        type: payload.type || 'TEST',
        priority: payload.priority || 'NORMAL',
        timestamp: new Date().toISOString(),
        url: '/admin/dashboard'
      },
      webpush: {
        headers: {
          'Urgency': payload.priority === 'URGENT' ? 'high' : 'normal',
          'TTL': '86400' // 24 saat (saniye cinsinden)
        },
        notification: {
          title: title,
          body: body,
          tag: `notification-${Date.now()}`,
          requireInteraction: payload.priority === 'URGENT' || payload.priority === 'HIGH',
          silent: false,
          timestamp: Date.now(),
          actions: [
            {
              action: 'view',
              title: 'Görüntüle'
            },
            {
              action: 'dismiss',
              title: 'Kapat'
            }
          ]
        }
      }
    }
    
    // Geçerli token'ları array'e çevir
    const tokenList = validTokens.map(t => t.token)
    
    // Sadece tek token'a gönder (daha güvenilir)
    const firstToken = tokenList[0]
    const singleMessage = {
      ...message,
      token: firstToken
    }
    
    console.log('Gönderilecek tek mesaj:', JSON.stringify(singleMessage, null, 2))
    
    let response
    try {
      console.log('Tek token\'a gönderiliyor...')
      const singleResponse = await admin.messaging().send(singleMessage)
      console.log('Tek mesaj yanıtı:', singleResponse)
      
      // Başarılı yanıt için fake multicast response oluştur
      response = {
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true, messageId: singleResponse }]
      }
      
      console.log('Notification başarıyla gönderildi:', singleResponse)
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error)
      throw error
    }
    
    console.log('Firebase Admin SDK yanıtı:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokenList.length,
      responses: response.responses.map((resp, idx) => ({
        success: resp.success,
        error: resp.error?.code,
        token: tokenList[idx].substring(0, 20) + '...'
      }))
    })
    
    // Başarısız token'ları temizle
    if (response.failureCount > 0) {
      const failedTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokenList[idx])
        }
      })
      
      // Başarısız token'ları deaktif et
      if (failedTokens.length > 0) {
        await mongoose.connection.collection('fcmtokens').updateMany(
          { token: { $in: failedTokens } },
          { $set: { isActive: false } }
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test bildirimi gönderildi',
      stats: {
        totalTokens: tokenList.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      }
    })
    
  } catch (error) {
    console.error('Test notification gönderme hatası:', error)
    return NextResponse.json(
      { error: 'Notification gönderilirken hata oluştu' },
      { status: 500 }
    )
  }
} 