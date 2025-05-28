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
    
    // Eski durumu al
    const oldRequest = await (Maintenance as Model<any>).findById(params.id).lean();
    
    const maintenanceRequest = await (Maintenance as Model<any>).findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    // Socket.IO ile güncelleme bildirimi gönder
    const io = (global as any).io;
    if (io && oldRequest) {
      const statusChanged = (oldRequest as any).status !== (maintenanceRequest as any).status;
      
      if (statusChanged) {
        const notificationData = {
          id: Date.now(),
          title: 'Arıza Durumu Güncellendi',
          message: `${(maintenanceRequest as any).title || (maintenanceRequest as any).description} - Durum: ${getStatusText((maintenanceRequest as any).status)}`,
          type: 'maintenance',
          priority: (maintenanceRequest as any).priority || 'NORMAL',
          timestamp: new Date(),
          data: {
            maintenanceId: (maintenanceRequest as any)._id,
            apartmentNo: (maintenanceRequest as any).apartmentNo,
            block: (maintenanceRequest as any).block,
            oldStatus: (oldRequest as any).status,
            newStatus: (maintenanceRequest as any).status,
            category: (maintenanceRequest as any).category
          }
        };

        // İlgili apartman sakinlerine bildirim gönder
        if ((maintenanceRequest as any).apartmentNo) {
          io.to(`apartment-${(maintenanceRequest as any).apartmentNo}`).emit('maintenance-notification', {
            type: 'status-update',
            data: notificationData
          });
        }

        // Aynı blokta yaşayan kullanıcılara da bildirim gönder
        if ((maintenanceRequest as any).block) {
          io.to(`block-${(maintenanceRequest as any).block}`).emit('maintenance-notification', {
            type: 'status-update',
            data: notificationData
          });
        }

        // Admin'lere de bildirim gönder
        io.to('admin-room').emit('maintenance-notification', {
          type: 'status-update',
          data: notificationData
        });

        console.log('Arıza durumu güncelleme bildirimi gönderildi:', (maintenanceRequest as any).title);
      }
    }
    
    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error('Error in PUT /api/maintenance/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Durum metni helper fonksiyonu
function getStatusText(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Beklemede'
    case 'IN_PROGRESS':
      return 'İşlemde'
    case 'COMPLETED':
      return 'Tamamlandı'
    case 'CANCELLED':
      return 'İptal Edildi'
    default:
      return status
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
