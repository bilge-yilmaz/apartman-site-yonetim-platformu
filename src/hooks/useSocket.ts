import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  autoConnect?: boolean
  userId?: string
  userRole?: 'admin' | 'resident'
  apartmentId?: string
  blockId?: string
}

interface User {
  id?: string
  name?: string
  email?: string
  role?: string
  apartmentNo?: string
  block?: string
}

interface Notification {
  id: number
  type: string
  title: string
  message: string
  data: any
  timestamp: Date
  read?: boolean
  autoRemoveTimer?: NodeJS.Timeout
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    autoConnect = true,
    userId: providedUserId,
    userRole: providedUserRole,
    apartmentId: providedApartmentId,
    blockId: providedBlockId
  } = options
  
  console.log('🚀 useSocket hook çağrıldı!', {
    providedUserId,
    providedUserRole,
    providedApartmentId,
    providedBlockId,
    autoConnect
  })

  const [user, setUser] = useState<User | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const socketRef = useRef<Socket | null>(null)

  // Kullanıcı bilgilerini al
  useEffect(() => {
    const fetchUserInfo = () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        console.log('🔍 Token kontrol ediliyor:', token ? 'Token var' : 'Token yok')

        if (token) {
          const base64Payload = token.split('.')[1]
          const payload = JSON.parse(atob(base64Payload))
          console.log('👤 Token payload:', payload)
          setUser({
            id: payload.id || payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            apartmentNo: payload.apartmentNo,
            block: payload.block
          })
        } else {
          console.log('❌ Token bulunamadı!')
          setUser(null)
        }
      } catch (error) {
        console.error('Token decode hatası:', error)
        setUser(null)
      }
    }

    fetchUserInfo()
  }, [])

  // Kullanıcı bilgilerini belirle (props öncelikli)
  const userId = providedUserId || user?.id
  const userRole = providedUserRole || (user?.role === 'ADMIN' || user?.role === 'MANAGER' ? 'admin' : 'resident')
  const apartmentId = providedApartmentId || user?.apartmentNo
  const blockId = providedBlockId || user?.block

  console.log('🔧 Kullanıcı bilgileri:', {
    user,
    userId,
    userRole,
    apartmentId,
    blockId,
    providedUserId,
    providedUserRole
  })

  // Bildirim ekleme fonksiyonu
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'autoRemoveTimer'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      read: false
    }

    console.log('📥 Yeni bildirim ekleniyor:', newNotification)

    setNotifications(prev => {
      const updated = [...prev, newNotification]
      console.log('📋 Güncel bildirim listesi:', updated.length, 'adet')
      return updated
    })

    // 1 saat sonra otomatik kaldır
    const timer = setTimeout(() => {
      console.log('⏰ Bildirim otomatik kaldırılıyor:', newNotification.id)
      setNotifications(prev => prev.filter(notif => notif.id !== newNotification.id))
    }, 3600000) // 1 saat

    // Timer'ı notification objesine ekle
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === newNotification.id 
          ? { ...notif, autoRemoveTimer: timer }
          : notif
      )
    )
  }, [])

  // Socket bağlantısını kur (sadece userId varsa)
  useEffect(() => {
    if (!autoConnect || !userId) return

    console.log('🔌 Socket bağlantısı kuruluyor...', { userId, userRole })
    
    // Eski socket'i temizle
    if (socketRef.current) {
      console.log('🧹 Eski socket temizleniyor...')
      socketRef.current.disconnect()
      socketRef.current = null
    }

    // Yeni socket oluştur
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true // Her kullanıcı için yeni socket
    })

    socketRef.current = socket

    // Bağlantı event'leri
    socket.on('connect', () => {
      console.log('✅ Socket bağlandı:', socket.id, 'Kullanıcı:', userId, 'Rol:', userRole)
      setIsConnected(true)

      // Kullanıcı odalarına katıl
      if (userRole === 'admin') {
        console.log('🔑 Admin emit ediliyor...')
        socket.emit('join-admin')
        console.log('✅ Admin emit edildi!')
      } else if (userRole === 'resident') {
        console.log('🏠 Resident emit ediliyor...')
        socket.emit('join-resident')
        console.log('✅ Resident emit edildi!')
      }

      if (apartmentId) {
        console.log('🏢 Apartman odasına katılıyor:', apartmentId)
        socket.emit('join-apartment', apartmentId)
      }

      if (blockId) {
        console.log('🏘️ Blok odasına katılıyor:', blockId)
        socket.emit('join-block', blockId)
      }

      if (userId) {
        console.log('👤 Kullanıcı odasına katılıyor:', userId)
        socket.emit('join-user', userId)
      }
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket bağlantısı kesildi')
      setIsConnected(false)
    })

         // Tüm event'leri dinle (debug için)
     socket.onAny((eventName, ...args) => {
       console.log('🎯 Socket event alındı:', eventName, args)
       console.log('🔍 Event detayları:', { eventName, argsLength: args.length, firstArg: args[0] })
     })

    // Bildirim event'leri
    socket.on('announcement-notification', (data) => {
      console.log('📢 Yeni duyuru bildirimi alındı:', data)
      addNotification({
        type: 'announcement',
        title: 'Yeni Duyuru',
        message: data.title || data.message,
        data: data,
        timestamp: new Date()
      })
    })

    socket.on('maintenance-notification', (data) => {
      console.log('🔧 Bakım-onarım bildirimi alındı:', data)
      addNotification({
        type: 'maintenance',
        title: data.type === 'new-request' ? 'Yeni Arıza Bildirimi' : 'Arıza Durumu Güncellendi',
        message: data.data.description || 'Bakım-onarım bildirimi',
        data: data,
        timestamp: new Date()
      })
    })

    socket.on('payment-notification', (data) => {
      console.log('💰 Ödeme bildirimi alındı:', data)
      addNotification({
        type: 'payment',
        title: data.type === 'payment-received' ? 'Ödeme Alındı' : 'Ödeme Hatırlatması',
        message: data.data.message || 'Ödeme bildirimi',
        data: data,
        timestamp: new Date()
      })
    })

    socket.on('reservation-notification', (data) => {
      console.log('📅 Rezervasyon bildirimi alındı:', data)
      addNotification({
        type: 'reservation',
        title: 'Yeni Rezervasyon',
        message: data.data.facilityName || 'Rezervasyon bildirimi',
        data: data,
        timestamp: new Date()
      })
    })

    // Cleanup
    return () => {
      console.log('🔌 Socket bağlantısı kapatılıyor...')
      socket.disconnect()
    }
  }, [userId, userRole, apartmentId, blockId, addNotification, autoConnect])

  // Bildirim gönderme fonksiyonları
  const emitAnnouncement = (announcement: any) => {
    if (socketRef.current) {
      socketRef.current.emit('new-announcement', announcement)
    }
  }

  const emitMaintenanceRequest = (request: any) => {
    if (socketRef.current) {
      socketRef.current.emit('maintenance-request', request)
    }
  }

  const emitMaintenanceUpdate = (update: any) => {
    if (socketRef.current) {
      socketRef.current.emit('maintenance-update', update)
    }
  }

  const emitPaymentReceived = (payment: any) => {
    if (socketRef.current) {
      socketRef.current.emit('payment-received', payment)
    }
  }

  const emitPaymentReminder = (reminder: any) => {
    if (socketRef.current) {
      socketRef.current.emit('payment-reminder', reminder)
    }
  }

  const emitReservationRequest = (reservation: any) => {
    if (socketRef.current) {
      socketRef.current.emit('reservation-request', reservation)
    }
  }

  // Bildirimi okundu olarak işaretle
  const markAsRead = (id: number) => {
    console.log('👁️ Bildirim okundu olarak işaretleniyor:', id)
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id 
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  // Bildirimi kaldırma
  const removeNotification = (id: number) => {
    console.log('🗑️ Bildirim manuel olarak kaldırılıyor:', id)
    setNotifications(prev => {
      const notification = prev.find(notif => notif.id === id)
      if (notification?.autoRemoveTimer) {
        clearTimeout(notification.autoRemoveTimer)
      }
      return prev.filter(notif => notif.id !== id)
    })
  }

  // Tüm bildirimleri temizleme
  const clearNotifications = () => {
    console.log('🧹 Tüm bildirimler temizleniyor')
    setNotifications(prev => {
      // Tüm timer'ları temizle
      prev.forEach(notif => {
        if (notif.autoRemoveTimer) {
          clearTimeout(notif.autoRemoveTimer)
        }
      })
      return []
    })
  }

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    markAsRead,
    emitAnnouncement,
    emitMaintenanceRequest,
    emitMaintenanceUpdate,
    emitPaymentReceived,
    emitPaymentReminder,
    emitReservationRequest,
    removeNotification,
    clearNotifications
  }
} 
