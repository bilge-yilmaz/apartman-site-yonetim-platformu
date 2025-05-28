import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reservation from '@/models/Reservation';
import { Model } from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const facility = searchParams.get('facility');
    const status = searchParams.get('status');
    const apartmentNo = searchParams.get('apartmentNo');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const query: any = {};
    if (facility) query.facility = facility;
    if (status) query.status = status;
    if (apartmentNo) query.apartmentNo = apartmentNo;
    
    // Tarih filtresi
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const reservations = await (Reservation as Model<any>)
      .find(query)
      .sort({ startTime: 1 })
      .lean();

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error in GET /api/reservations:', error);
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

    // Çakışan rezervasyon kontrolü
    const existingReservation = await (Reservation as Model<any>).findOne({
      facility: body.facility,
      status: { $ne: 'CANCELLED' },
      $or: [
        {
          startTime: { $lt: new Date(body.endTime) },
          endTime: { $gt: new Date(body.startTime) }
        }
      ]
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Bu zaman diliminde başka bir rezervasyon bulunmaktadır' },
        { status: 400 }
      );
    }
    
    const reservation = await (Reservation as Model<any>).create(body);
    
    // Socket.IO ile rezervasyon bildirimi gönder
    const io = (global as any).io;
    if (io) {
      const notificationData = {
        id: Date.now(),
        title: 'Yeni Rezervasyon',
        message: `${(reservation as any).facility} - ${new Date((reservation as any).startTime).toLocaleDateString('tr-TR')}`,
        type: 'reservation',
        priority: 'NORMAL',
        timestamp: new Date(),
        data: {
          reservationId: (reservation as any)._id,
          facility: (reservation as any).facility,
          apartmentNo: (reservation as any).apartmentNo,
          block: (reservation as any).block,
          startTime: (reservation as any).startTime,
          endTime: (reservation as any).endTime,
          status: (reservation as any).status || 'PENDING'
        }
      };

      // Admin'lere rezervasyon bildirimi gönder
      io.to('admin-room').emit('reservation-notification', {
        type: 'new-reservation',
        data: notificationData
      });

      // İlgili apartman sakinlerine bildirim gönder
      if ((reservation as any).apartmentNo) {
        io.to(`apartment-${(reservation as any).apartmentNo}`).emit('reservation-notification', {
          type: 'new-reservation',
          data: notificationData
        });
      }

      // Aynı blokta yaşayan kullanıcılara da bildirim gönder
      if ((reservation as any).block) {
        io.to(`block-${(reservation as any).block}`).emit('reservation-notification', {
          type: 'new-reservation',
          data: notificationData
        });
      }

      console.log('Rezervasyon bildirimi gönderildi:', (reservation as any).facility);
    }
    
    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error in POST /api/reservations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
