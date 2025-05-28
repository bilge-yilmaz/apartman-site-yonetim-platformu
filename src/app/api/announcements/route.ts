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
    
    // Socket.IO ile gerçek zamanlı bildirim gönder
    const io = (global as any).io;
    if (io) {
      const notificationData = {
        id: Date.now(),
        title: announcement.title,
        message: announcement.content || announcement.description || 'Yeni duyuru yayınlandı',
        type: 'announcement',
        priority: announcement.priority || 'NORMAL',
        timestamp: new Date(),
        data: {
          announcementId: announcement._id,
          category: announcement.category,
          isUrgent: announcement.isUrgent || false
        }
      };

      // Duyuru kategorisine göre hedefleme
      if (announcement.targetType === 'all' || !announcement.targetType) {
        // Tüm kullanıcılara gönder
        io.emit('announcement-notification', notificationData);
        console.log('Duyuru tüm kullanıcılara gönderildi:', announcement.title);
      } else if (announcement.targetBlocks && announcement.targetBlocks.length > 0) {
        // Belirli bloklara gönder
        for (const block of announcement.targetBlocks) {
          io.to(`block-${block}`).emit('announcement-notification', notificationData);
        }
        console.log('Duyuru belirli bloklara gönderildi:', announcement.targetBlocks);
      } else if (announcement.targetRoles && announcement.targetRoles.length > 0) {
        // Belirli rollere gönder
        for (const role of announcement.targetRoles) {
          if (role === 'ADMIN' || role === 'MANAGER') {
            io.to('admin-room').emit('announcement-notification', notificationData);
          } else if (role === 'RESIDENT') {
            io.emit('announcement-notification', notificationData);
          }
        }
        console.log('Duyuru belirli rollere gönderildi:', announcement.targetRoles);
      } else {
        // Varsayılan: tüm kullanıcılara gönder
        io.emit('announcement-notification', notificationData);
        console.log('Duyuru varsayılan olarak tüm kullanıcılara gönderildi');
      }
    }
    
    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error in POST /api/announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
