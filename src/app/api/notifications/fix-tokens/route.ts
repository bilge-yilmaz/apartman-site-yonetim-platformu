import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    
    // Tüm kullanıcıları al
    const users = await mongoose.connection.collection('users')
      .find({})
      .toArray()
    
    // ObjectId ile kayıtlı token'ları bul
    const tokens = await mongoose.connection.collection('fcmtokens')
      .find({})
      .toArray()
    
    console.log('Mevcut tokenlar:', tokens.map(t => ({ userId: t.userId, isActive: t.isActive })))
    
    let fixedCount = 0
    
    // Her token için userId'yi email'e çevir
    for (const token of tokens) {
      // Eğer userId ObjectId formatındaysa, email'e çevir
      const user = users.find(u => u._id.toString() === token.userId)
      
      if (user && user.email) {
        console.log(`Token düzeltiliyor: ${token.userId} -> ${user.email}`)
        
        await mongoose.connection.collection('fcmtokens').updateOne(
          { _id: token._id },
          { 
            $set: { 
              userId: user.email,
              updatedAt: new Date()
            } 
          }
        )
        fixedCount++
      }
    }
    
    // Güncellenmiş token'ları al
    const updatedTokens = await mongoose.connection.collection('fcmtokens')
      .find({})
      .toArray()
    
    return NextResponse.json({
      success: true,
      message: `${fixedCount} token düzeltildi`,
      fixedCount,
      beforeTokens: tokens.map(t => ({ userId: t.userId, isActive: t.isActive })),
      afterTokens: updatedTokens.map(t => ({ userId: t.userId, isActive: t.isActive }))
    })
    
  } catch (error) {
    console.error('Token düzeltme hatası:', error)
    return NextResponse.json(
      { error: 'Token düzeltme hatası' },
      { status: 500 }
    )
  }
} 