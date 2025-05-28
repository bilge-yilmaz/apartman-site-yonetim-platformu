import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Test endpoint çalışıyor',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  return NextResponse.json({ 
    message: 'POST test endpoint çalışıyor',
    receivedData: body,
    timestamp: new Date().toISOString()
  })
} 