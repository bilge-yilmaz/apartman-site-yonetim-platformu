import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  try {
    // Cron job güvenliği için API anahtarını kontrol et
    const headersList = headers()
    const cronApiKey = headersList.get('x-cron-api-key')

    if (cronApiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ödeme hatırlatıcılarını çalıştır
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/reminders`, {
      method: 'POST',
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
