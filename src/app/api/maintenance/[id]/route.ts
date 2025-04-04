import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Maintenance from '@/models/Maintenance';
import { Model } from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const maintenanceRequest = await (Maintenance as Model<any>).findById(params.id).lean();
    
    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }
    
    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error('Error in GET /api/maintenance/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const maintenanceRequest = await (Maintenance as Model<any>).findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }
    
    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error('Error in PUT /api/maintenance/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const maintenanceRequest = await (Maintenance as Model<any>).findByIdAndDelete(params.id).lean();
    
    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/maintenance/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
