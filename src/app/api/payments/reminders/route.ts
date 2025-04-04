import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Payment from '@/models/Payment'
import { Model } from 'mongoose'
import { format, addDays, isBefore, isAfter } from 'date-fns'
import { tr } from 'date-fns/locale'

// Nodemailer için gerekli importlar
import nodemailer from 'nodemailer'

// E-posta gönderimi için transporter oluştur
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST() {
  try {
    await dbConnect()

    const today = new Date()
    const threeDaysFromNow = addDays(today, 3)

    // Vadesi yaklaşan ve gecikmiş ödemeleri bul
    const payments = await (Payment as Model<any>).find({
      $or: [
        // Vadesi 3 gün içinde dolacak ödemeler
        {
          status: 'PENDING',
          dueDate: {
            $gte: today,
            $lte: threeDaysFromNow,
          },
        },
        // Vadesi geçmiş ödemeler
        {
          status: 'OVERDUE',
          dueDate: {
            $lt: today,
          },
        },
      ],
    }).lean()

    // Her ödeme için e-posta gönder
    const emailPromises = payments.map(async (payment) => {
      const isOverdue = isBefore(new Date(payment.dueDate), today)
      const daysOverdue = isOverdue ? 
        Math.floor((today.getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 
        Math.floor((new Date(payment.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      const emailSubject = isOverdue
        ? `Gecikmiş Ödeme Hatırlatması - ${payment.apartmentNo} Nolu Daire`
        : `Yaklaşan Ödeme Hatırlatması - ${payment.apartmentNo} Nolu Daire`

      const emailText = isOverdue
        ? `Sayın ${payment.apartmentNo} nolu daire sakini,\n\n` +
          `${format(new Date(payment.dueDate), 'd MMMM yyyy', { locale: tr })} tarihinde ödenmesi gereken ` +
          `₺${payment.amount.toLocaleString('tr-TR')} tutarındaki ödemeniz ${daysOverdue} gündür gecikmiştir.\n\n` +
          `Lütfen en kısa sürede ödemenizi gerçekleştiriniz.\n\n` +
          `Saygılarımızla,\nSite Yönetimi`
        : `Sayın ${payment.apartmentNo} nolu daire sakini,\n\n` +
          `${format(new Date(payment.dueDate), 'd MMMM yyyy', { locale: tr })} tarihinde ödenmesi gereken ` +
          `₺${payment.amount.toLocaleString('tr-TR')} tutarındaki ödemenizin vadesi ${daysOverdue} gün sonra dolacaktır.\n\n` +
          `Hatırlatma amacıyla bilgilerinize sunarız.\n\n` +
          `Saygılarımızla,\nSite Yönetimi`

      return transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: `${process.env.RESIDENT_EMAIL_PREFIX}${payment.apartmentNo}${process.env.RESIDENT_EMAIL_SUFFIX}`,
        subject: emailSubject,
        text: emailText,
      })
    })

    await Promise.all(emailPromises)

    // Vadesi geçmiş ödemeleri güncelle
    await (Payment as Model<any>).updateMany(
      {
        status: 'PENDING',
        dueDate: { $lt: today },
      },
      {
        $set: { status: 'OVERDUE' },
      }
    )

    return NextResponse.json({
      message: `${payments.length} adet hatırlatma e-postası gönderildi`,
      emailsSent: payments.length,
    })
  } catch (error) {
    console.error('Error sending payment reminders:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
