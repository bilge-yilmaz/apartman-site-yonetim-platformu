import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Maintenance from '@/models/Maintenance';
import { Model } from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const apartmentNo = searchParams.get('apartmentNo');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    
    let query: any = {};
    if (status) query.status = status;
    if (apartmentNo) query.apartmentNo = apartmentNo;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    
    const maintenanceRequests = await (Maintenance as Model<any>).find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    return NextResponse.json(maintenanceRequests);
  } catch (error) {
    console.error('Error in GET /api/maintenance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const maintenanceRequest = await (Maintenance as Model<any>).create(body);
    
    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/maintenance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
