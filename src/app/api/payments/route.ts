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
    
    // Socket.IO ile ödeme bildirimi gönder
    const io = (global as any).io;
    if (io) {
      const notificationData = {
        id: Date.now(),
        title: 'Yeni Ödeme Kaydı',
        message: `${(payment as any).description || 'Aidat ödemesi'} - ${(payment as any).amount} TL`,
        type: 'payment',
        priority: 'NORMAL',
        timestamp: new Date(),
        data: {
          paymentId: (payment as any)._id,
          apartmentNo: (payment as any).apartmentNo,
          block: (payment as any).block,
          amount: (payment as any).amount,
          status: (payment as any).status || 'PENDING',
          dueDate: (payment as any).dueDate
        }
      };

      // Admin'lere ödeme bildirimi gönder
      io.to('admin-room').emit('payment-notification', {
        type: 'payment-received',
        data: notificationData
      });

      // İlgili apartman sakinlerine bildirim gönder
      if ((payment as any).apartmentNo) {
        io.to(`apartment-${(payment as any).apartmentNo}`).emit('payment-notification', {
          type: 'payment-received',
          data: notificationData
        });
      }

      // Aynı blokta yaşayan kullanıcılara da bildirim gönder
      if ((payment as any).block) {
        io.to(`block-${(payment as any).block}`).emit('payment-notification', {
          type: 'payment-received',
          data: notificationData
        });
      }

      console.log('Ödeme bildirimi gönderildi:', (payment as any).description);
    }
    
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/payments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
