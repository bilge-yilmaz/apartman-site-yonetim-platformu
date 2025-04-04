import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import { Model } from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const apartmentNo = searchParams.get('apartmentNo');
    
    let query: any = {};
    if (status) query = { ...query, status };
    if (apartmentNo) query = { ...query, apartmentNo };
    
    const payments = await (Payment as Model<any>).find(query)
      .sort({ dueDate: -1 })
      .limit(100)
      .lean();
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error in GET /api/payments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const payment = await (Payment as Model<any>).create(body);
    
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/payments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
