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
    
    // Socket.IO ile gerçek zamanlı bildirim gönder
    const io = (global as any).io;
    if (io) {
      const notificationData = {
        id: Date.now(),
        title: 'Yeni Arıza Bildirimi',
        message: `${maintenanceRequest.title || maintenanceRequest.description}`,
        type: 'maintenance',
        priority: maintenanceRequest.priority || 'NORMAL',
        timestamp: new Date(),
        data: {
          maintenanceId: maintenanceRequest._id,
          apartmentNo: maintenanceRequest.apartmentNo,
          block: maintenanceRequest.block,
          category: maintenanceRequest.category,
          status: maintenanceRequest.status || 'PENDING'
        }
      };

      // Admin'lere bildirim gönder
      io.to('admin-room').emit('maintenance-notification', {
        type: 'new-request',
        data: notificationData
      });

      // Aynı blokta yaşayan kullanıcılara da bildirim gönder (isteğe bağlı)
      if (maintenanceRequest.block) {
        io.to(`block-${maintenanceRequest.block}`).emit('maintenance-notification', {
          type: 'new-request',
          data: notificationData
        });
      }

      console.log('Yeni arıza bildirimi gönderildi:', maintenanceRequest.title);
    }
    
    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/maintenance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
