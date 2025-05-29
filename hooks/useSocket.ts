import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { getToken } from '../services/api'
import { useUserStore } from '../store/user'
import Constants from 'expo-constants'
import NotificationService from '../services/notificationService'

// Socket URL belirleme
const getSocketUrl = () => {
  // Environment variable'dan URL al
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    console.log('🌐 Environment Socket URL kullanılıyor:', process.env.EXPO_PUBLIC_SOCKET_URL);
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  
  // Fallback olarak IP adresi kullan
  const COMPUTER_IP = '10.192.90.95';
  const socketUrl = `http://${COMPUTER_IP}:3000`;
  
  if (__DEV__) {
    console.log('🌐 Development Socket URL:', socketUrl);
    return socketUrl;
  }
  
  console.log('🌐 Production Socket URL: https://your-production-api.com');
  return 'https://your-production-api.com'; // Production URL
}

interface Notification {
  id: number
  type: 'announcement' | 'maintenance' | 'payment' | 'reservation'
  title: string
  message: string
  data: any
  timestamp: Date
  read?: boolean
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  error: string | null
  sendNotification: (data: any) => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  notifications: Notification[]
  unreadCount: number
  emitMaintenanceRequest: (request: any) => void
  emitPaymentReceived: (payment: any) => void
  emitReservationRequest: (reservation: any) => void
  markAsRead: (id: number) => void
  removeNotification: (id: number) => void
  clearNotifications: () => void
}

export const useSocket = (): UseSocketReturn => {
  const { user } = useUserStore()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const initSocket = async () => {
      try {
        console.log('🔍 Socket bağlantısı başlatılıyor...');
        console.log('👤 User bilgisi:', user);
        
        const token = await getToken()
        console.log('🔑 Token durumu:', token ? 'Mevcut' : 'Yok');
        
        if (!token || !user) {
          console.log('❌ Token veya user bilgisi yok, socket bağlantısı kurulmuyor')
          setError('Token veya kullanıcı bilgisi eksik');
          return
        }

        const socketUrl = getSocketUrl();
        console.log('🔌 Socket bağlantısı kuruluyor...', socketUrl);
        
        const socket = io(socketUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          forceNew: true // Yeni bağlantı zorla
        })

        // Detaylı bağlantı logging
        socket.on('connect', () => {
          console.log('✅ Socket bağlandı:', socket.id)
          console.log('🏠 Kullanıcı bilgileri:', {
            id: user.id,
            role: user.role,
            apartmentNo: user.apartmentNo,
            block: user.block
          });
          setIsConnected(true)
          setError(null)

          // Kullanıcı odalarına katıl
          if (user.role === 'ADMIN') {
            console.log('👑 Admin odasına katılıyor...');
            socket.emit('join-admin')
          } else if (user.role === 'RESIDENT') {
            console.log('🏠 Resident odasına katılıyor...');
            socket.emit('join-resident')
            if (user.apartmentNo) {
              console.log(`🏠 Apartman ${user.apartmentNo} odasına katılıyor...`);
              socket.emit('join-apartment', user.apartmentNo)
            }
            if (user.block) {
              console.log(`🏢 Blok ${user.block} odasına katılıyor...`);
              socket.emit('join-block', user.block)
            }
          }
          
          // Kullanıcı ID bazlı odaya katıl
          console.log(`👤 User-${user.id} odasına katılıyor...`);
          socket.emit('join-user', user.id)
        })

        socket.on('disconnect', (reason) => {
          console.log('❌ Socket bağlantısı kesildi:', reason)
          setIsConnected(false)
        })

        socket.on('connect_error', (error) => {
          console.error('❌ Socket bağlantı hatası:', error)
          console.error('❌ Hata detayları:', {
            message: error.message,
            description: (error as any).description,
            context: (error as any).context,
            type: (error as any).type
          });
          setError('Bağlantı hatası: ' + error.message)
          setIsConnected(false)
        })

        socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Socket yeniden bağlandı, deneme:', attemptNumber)
          setIsConnected(true)
          setError(null)
        })

        socket.on('reconnect_error', (error) => {
          console.error('❌ Socket yeniden bağlantı hatası:', error)
          setError('Yeniden bağlantı hatası: ' + error.message)
        })

        // Bildirim dinleyicileri
        socket.on('notification', (data) => {
          console.log('🔔 Yeni bildirim alındı:', data)
          handleNotification(data)
        })

        socket.on('announcement-notification', (data) => {
          console.log('📢 Yeni duyuru bildirimi alındı:', data)
          handleNotification(data)
        })

        socket.on('maintenance-notification', (data) => {
          console.log('🔧 Bakım bildirimi alındı:', data)
          handleNotification(data)
        })

        socket.on('payment-notification', (data) => {
          console.log('💰 Ödeme bildirimi alındı:', data)
          handleNotification(data)
        })

        socket.on('reservation-notification', (data) => {
          console.log('📅 Rezervasyon bildirimi alındı:', data)
          handleNotification(data)
        })

        // Eski format destekleri (geriye uyumluluk için)
        socket.on('announcement', (data) => {
          console.log('📢 Eski format duyuru alındı:', data)
          handleAnnouncement(data)
        })

        socket.on('maintenance-update', (data) => {
          console.log('🔧 Eski format bakım güncellemesi alındı:', data)
          handleMaintenanceUpdate(data)
        })

        socket.on('payment-reminder', (data) => {
          console.log('💰 Eski format ödeme hatırlatması alındı:', data)
          handlePaymentReminder(data)
        })

        socketRef.current = socket

      } catch (error) {
        console.error('Socket başlatma hatası:', error)
        setError('Socket başlatılamadı: ' + (error as Error).message)
      }
    }

    initSocket()

    // Cleanup
    return () => {
      if (socketRef.current) {
        console.log('Socket bağlantısı kapatılıyor...')
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [user])

  // Bildirim işleyicileri
  const handleNotification = (data: any) => {
    console.log('🔔 Bildirim işleniyor:', data)
    
    // Yeni format: { type: 'announcement-notification', data: { ... } }
    // Eski format: { type: 'general', title: '...', message: '...' }
    let notificationData = data
    
    // Eğer data.data varsa, yeni format
    if (data.data) {
      notificationData = data.data
    }
    
    // Bildirimi state'e ekle
    const newNotification: Notification = {
      id: notificationData.id || Date.now(),
      type: getNotificationType(notificationData.type || data.type),
      title: notificationData.title || 'Yeni Bildirim',
      message: notificationData.message || '',
      data: notificationData,
      timestamp: new Date(notificationData.timestamp || Date.now()),
      read: false
    }
    
    console.log('📱 Yeni bildirim ekleniyor:', newNotification)
    setNotifications(prev => [newNotification, ...prev])
    
    // TODO: Expo Notifications ile push notification göster
    // showPushNotification(newNotification)
  }

  // Bildirim tipini normalize et
  const getNotificationType = (type: string): 'announcement' | 'maintenance' | 'payment' | 'reservation' => {
    switch (type) {
      case 'announcement-notification':
      case 'announcement':
      case 'system':
        return 'announcement'
      case 'maintenance-notification':
      case 'maintenance':
        return 'maintenance'
      case 'payment-notification':
      case 'payment':
        return 'payment'
      case 'reservation-notification':
      case 'reservation':
        return 'reservation'
      default:
        return 'announcement'
    }
  }

  const handleAnnouncement = (data: any) => {
    // Duyuru store'unu güncelle
    console.log('Duyuru işleniyor:', data)
    
    // Duyuru bildirimini ekle
    const announcementNotification: Notification = {
      id: Date.now(),
      type: 'announcement',
      title: 'Yeni Duyuru',
      message: data.title || data.message || 'Yeni bir duyuru yayınlandı',
      data: data,
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [announcementNotification, ...prev])
  }

  const handleMaintenanceUpdate = (data: any) => {
    // Bakım store'unu güncelle
    console.log('Bakım güncellemesi işleniyor:', data)
    
    // Bakım bildirimini ekle
    const maintenanceNotification: Notification = {
      id: Date.now(),
      type: 'maintenance',
      title: 'Bakım Güncellemesi',
      message: data.message || 'Bakım talebinizde güncelleme var',
      data: data,
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [maintenanceNotification, ...prev])
  }

  const handlePaymentReminder = (data: any) => {
    // Ödeme store'unu güncelle
    console.log('Ödeme hatırlatması işleniyor:', data)
    
    // Ödeme bildirimini ekle
    const paymentNotification: Notification = {
      id: Date.now(),
      type: 'payment',
      title: 'Ödeme Hatırlatması',
      message: data.message || 'Aidat ödeme tarihiniz yaklaşıyor',
      data: data,
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [paymentNotification, ...prev])
  }

  // Socket fonksiyonları
  const sendNotification = (data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-notification', data)
    } else {
      console.warn('Socket bağlı değil, bildirim gönderilemedi')
    }
  }

  const joinRoom = (room: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-room', room)
      console.log(`${room} odasına katıldı`)
    }
  }

  const leaveRoom = (room: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-room', room)
      console.log(`${room} odasından ayrıldı`)
    }
  }

  // Bildirim gönderme fonksiyonları
  const emitMaintenanceRequest = (request: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('maintenance-request', {
        ...request,
        userId: user?.id,
        userName: user?.name,
        apartmentNo: user?.apartmentNo,
        block: user?.block
      })
    }
  }

  const emitPaymentReceived = (payment: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('payment-received', {
        ...payment,
        userId: user?.id,
        userName: user?.name
      })
    }
  }

  const emitReservationRequest = (reservation: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('reservation-request', {
        ...reservation,
        userId: user?.id,
        userName: user?.name,
        apartmentNo: user?.apartmentNo
      })
    }
  }

  // Bildirimi okundu olarak işaretle
  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  // Bildirimi kaldırma
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  // Tüm bildirimleri temizleme
  const clearNotifications = () => {
    setNotifications([])
  }

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter(notif => !notif.read).length

  return {
    socket: socketRef.current,
    isConnected,
    error,
    sendNotification,
    joinRoom,
    leaveRoom,
    notifications,
    unreadCount,
    emitMaintenanceRequest,
    emitPaymentReceived,
    emitReservationRequest,
    markAsRead,
    removeNotification,
    clearNotifications
  }
} 