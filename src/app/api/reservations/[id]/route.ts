import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reservation from '@/models/Reservation';
import { Model } from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const reservation = await (Reservation as Model<any>)
      .findById(params.id)
      .lean();

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error in GET /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const body = await request.json();

    // Eğer durum değişikliği değilse ve tarih değişiyorsa çakışma kontrolü yap
    if (!body.status && (body.startTime || body.endTime)) {
      const currentReservation = await (Reservation as Model<any>).findById(params.id);
      
      const existingReservation = await (Reservation as Model<any>).findOne({
        _id: { $ne: params.id },
        facility: currentReservation.facility,
        status: { $ne: 'CANCELLED' },
        $or: [
          {
            startTime: { $lt: new Date(body.endTime || currentReservation.endTime) },
            endTime: { $gt: new Date(body.startTime || currentReservation.startTime) }
          }
        ]
      });

      if (existingReservation) {
        return NextResponse.json(
          { error: 'Bu zaman diliminde başka bir rezervasyon bulunmaktadır' },
          { status: 400 }
        );
      }
    }

    const reservation = await (Reservation as Model<any>).findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error in PUT /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const reservation = await (Reservation as Model<any>).findByIdAndDelete(
      params.id
    );

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
