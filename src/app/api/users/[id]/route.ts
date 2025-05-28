import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// GET - Tek kullanıcı getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = await User.findById(params.id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('User GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcı getirilemedi' },
      { status: 500 }
    );
  }
}

// PUT - Kullanıcı güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, email, apartmentNo, block, phone, isActive, role } = body;
    
    // Mevcut kullanıcıyı bul
    const existingUser = await User.findById(params.id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    // Email kontrolü (başka kullanıcıda aynı email var mı?)
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: params.id } 
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Bu email adresi zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }
    
    // Daire numarası kontrolü (RESIDENT için)
    if (role === 'RESIDENT' && apartmentNo && apartmentNo !== existingUser.apartmentNo) {
      const apartmentExists = await User.findOne({ 
        apartmentNo, 
        role: 'RESIDENT',
        isActive: true,
        _id: { $ne: params.id }
      });
      if (apartmentExists) {
        return NextResponse.json(
          { success: false, error: 'Bu daire numarası zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }
    
    // Güncelleme verileri
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (role) updateData.role = role;
    
    // RESIDENT için daire bilgileri
    if (role === 'RESIDENT') {
      if (apartmentNo) updateData.apartmentNo = apartmentNo;
      if (block) updateData.block = block;
    } else {
      // ADMIN ise daire bilgilerini temizle
      updateData.apartmentNo = undefined;
      updateData.block = undefined;
    }
    
    updateData.updatedAt = new Date();
    
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Kullanıcı başarıyla güncellendi'
    });
    
  } catch (error) {
    console.error('User PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcı güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Kullanıcı sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    // Soft delete (isActive = false)
    await User.findByIdAndUpdate(params.id, { 
      isActive: false,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });
    
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcı silinemedi' },
      { status: 500 }
    );
  }
} 