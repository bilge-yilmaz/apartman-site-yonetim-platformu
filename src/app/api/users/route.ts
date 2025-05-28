import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// GET - Tüm kullanıcıları getir
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || '';
    
    // Arama ve filtreleme koşulları
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { apartmentNo: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.isActive = status === 'active';
    }
    
    if (role) {
      query.role = role;
    }
    
    // Sayfalama
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcılar getirilemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni kullanıcı oluştur
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, email, password, apartmentNo, block, phone, role = 'RESIDENT' } = body;
    
    // Validasyon
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Ad, email ve şifre gereklidir' },
        { status: 400 }
      );
    }
    
    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    // Daire numarası kontrolü (RESIDENT için)
    if (role === 'RESIDENT' && apartmentNo) {
      const existingApartment = await User.findOne({ 
        apartmentNo, 
        role: 'RESIDENT',
        isActive: true 
      });
      if (existingApartment) {
        return NextResponse.json(
          { success: false, error: 'Bu daire numarası zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }
    
    // Şifreyi hashle
    const hashedPassword = await require('crypto').createHash('sha256').update(password).digest('hex');
    
    // Kullanıcı oluştur
    const user = new User({
      name,
      email,
      password: hashedPassword,
      apartmentNo: role === 'RESIDENT' ? apartmentNo : undefined,
      block: role === 'RESIDENT' ? block : undefined,
      phone,
      role,
      isActive: true
    });
    
    await user.save();
    
    // Şifreyi response'dan çıkar
    const userResponse = user.toObject();
    delete (userResponse as any).password;
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Kullanıcı başarıyla oluşturuldu'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcı oluşturulamadı' },
      { status: 500 }
    );
  }
} 