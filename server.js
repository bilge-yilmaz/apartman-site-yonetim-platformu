const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Socket.IO server kurulumu
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:8081"], // Expo dev server için
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Kullanıcı bağlandı:', socket.id)

    // Kullanıcı odalarına katılma (apartman/blok bazlı)
    socket.on('join-apartment', (apartmentId) => {
      socket.join(`apartment-${apartmentId}`)
      console.log(`Kullanıcı ${socket.id} apartman ${apartmentId} odasına katıldı`)
    })

    socket.on('join-block', (blockId) => {
      socket.join(`block-${blockId}`)
      console.log(`Kullanıcı ${socket.id} blok ${blockId} odasına katıldı`)
    })

    // Admin odası
    socket.on('join-admin', () => {
      socket.join('admin-room')
      console.log(`Admin ${socket.id} admin odasına katıldı`)
    })

    // Resident odası
    socket.on('join-resident', () => {
      socket.join('resident-room')
      console.log(`Resident ${socket.id} resident odasına katıldı`)
    })

    // Kullanıcı odası (ID bazlı)
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`)
      console.log(`Kullanıcı ${socket.id} user-${userId} odasına katıldı`)
    })

    // Yeni duyuru bildirimi
    socket.on('new-announcement', (data) => {
      if (data.targetType === 'all') {
        io.emit('announcement-notification', data)
      } else if (data.targetType === 'apartment') {
        io.to(`apartment-${data.targetId}`).emit('announcement-notification', data)
      } else if (data.targetType === 'block') {
        io.to(`block-${data.targetId}`).emit('announcement-notification', data)
      }
    })

    // Bakım-onarım bildirimleri
    socket.on('maintenance-request', (data) => {
      // Admin'lere bildirim gönder
      io.to('admin-room').emit('maintenance-notification', {
        type: 'new-request',
        data: data
      })
    })

    socket.on('maintenance-update', (data) => {
      // İlgili kullanıcıya bildirim gönder
      io.to(`user-${data.userId}`).emit('maintenance-notification', {
        type: 'status-update',
        data: data
      })
    })

    // Ödeme bildirimleri
    socket.on('payment-received', (data) => {
      // Admin'lere bildirim gönder
      io.to('admin-room').emit('payment-notification', {
        type: 'payment-received',
        data: data
      })
    })

    socket.on('payment-reminder', (data) => {
      // İlgili kullanıcıya bildirim gönder
      io.to(`user-${data.userId}`).emit('payment-notification', {
        type: 'payment-reminder',
        data: data
      })
    })

    // Rezervasyon bildirimleri
    socket.on('reservation-request', (data) => {
      io.to('admin-room').emit('reservation-notification', {
        type: 'new-reservation',
        data: data
      })
    })

    // Kullanıcı bağlantısı kesildiğinde
    socket.on('disconnect', () => {
      console.log('Kullanıcı bağlantısı kesildi:', socket.id)
    })
  })

  // Global io instance'ı export et
  global.io = io

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.IO server çalışıyor')
    })
}) 