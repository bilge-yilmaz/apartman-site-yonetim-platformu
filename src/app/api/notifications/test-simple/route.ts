import { NextRequest, NextResponse } from 'next/server'

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
    console.log('Simple test endpoint çağrıldı')
    
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token gerekli' },
        { status: 400 }
      )
    }
    
    console.log('Kullanılacak token:', token.substring(0, 20) + '...')
    const testToken = token
    
    const message = {
      notification: {
        title: 'Simple Test',
        body: 'Bu basit bir test mesajıdır'
      },
      data: {
        type: 'SIMPLE_TEST'
      },
      token: testToken
    }
    
    console.log('Mesaj gönderiliyor:', message)
    
    const response = await admin.messaging().send(message)
    console.log('Başarılı yanıt:', response)
    
    return NextResponse.json({
      success: true,
      messageId: response
    })
    
  } catch (error) {
    console.error('Simple test hatası:', error)
    return NextResponse.json(
      { 
        error: 'Test hatası',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 