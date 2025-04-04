import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';
import { Model } from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    
    const query: any = {};
    if (category) query.category = category;
    if (isActive !== null) query.isActive = isActive === 'true';

    const announcements = await (Announcement as Model<any>)
      .find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error in GET /api/announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const announcement = await (Announcement as Model<any>).create(body);
    
    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error in POST /api/announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
