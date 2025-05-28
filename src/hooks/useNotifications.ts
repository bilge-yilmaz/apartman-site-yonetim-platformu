import { useState, useEffect, useCallback } from 'react'
import { getFCMToken, onMessageListener } from '@/lib/firebase-client'

interface NotificationPayload {
  notification: {
    title: string
    body: string
  }
  data?: Record<string, string>
}

interface UseNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission | null
  token: string | null
  isLoading: boolean
  error: string | null
  requestPermission: () => Promise<boolean>
  registerToken: () => Promise<boolean>
  notifications: NotificationPayload[]
  clearNotifications: () => void
  setNotifications: React.Dispatch<React.SetStateAction<NotificationPayload[]>>
}

export function useNotifications(): UseNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])

  // Browser desteğini kontrol et
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator)
      setPermission(Notification.permission)
    }
  }, [])

  // Service Worker'ı kaydet
  const registerServiceWorker = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker desteklenmiyor')
      return false
    }

    try {
      // Firebase messaging service worker'ı kaydet
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      })
      
      console.log('Service Worker kaydedildi:', registration)
      
      // Service Worker'ın aktif olmasını bekle
      if (registration.installing) {
        await new Promise((resolve) => {
          const serviceWorker = registration.installing!
          serviceWorker.addEventListener('statechange', () => {
            if (serviceWorker.state === 'activated') {
              resolve(true)
            }
          })
        })
      } else if (registration.waiting) {
        // Eğer waiting state'de ise aktif hale getir
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      
      return true
    } catch (error) {
      console.error('Service Worker kaydetme hatası:', error)
      return false
    }
  }, [])

  // Foreground mesajları dinle
  useEffect(() => {
    if (!isSupported) return

    console.log('Setting up foreground message listener...')
    
    const unsubscribe = onMessageListener((payload: any) => {
      console.log('Foreground notification alındı:', payload)
      setNotifications(prev => [...prev, payload])
      
      // Browser notification göster
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/icon-192x192.png',
          tag: payload.data?.type || 'general'
        })
      }
    })

    return () => {
      if (unsubscribe) {
        console.log('Unsubscribing from message listener')
        unsubscribe()
      }
    }
  }, [isSupported])

  // Notification izni iste
  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log('requestPermission çağrıldı')
    console.log('isSupported:', isSupported)
    console.log('Mevcut permission:', Notification.permission)
    
    if (!isSupported) {
      const errorMsg = 'Browser push notification desteklemiyor'
      console.error(errorMsg)
      setError(errorMsg)
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Service Worker kaydediliyor...')
      // Önce Service Worker'ı kaydet
      const swRegistered = await registerServiceWorker()
      if (!swRegistered) {
        const errorMsg = 'Service Worker kaydedilemedi'
        console.error(errorMsg)
        setError(errorMsg)
        return false
      }

      console.log('Notification.requestPermission() çağrılıyor...')
      const permission = await Notification.requestPermission()
      console.log('Permission sonucu:', permission)
      setPermission(permission)
      
      if (permission === 'granted') {
        console.log('Permission başarıyla verildi')
        return true
      } else {
        const errorMsg = `Notification izni reddedildi: ${permission}`
        console.error(errorMsg)
        setError(errorMsg)
        return false
      }
    } catch (error) {
      const errorMsg = `Notification izni alınamadı: ${error}`
      console.error(errorMsg)
      setError(errorMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, registerServiceWorker])

  // FCM token al ve kaydet
  const registerToken = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      setError('Notification izni gerekli')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // FCM token al
      const fcmToken = await getFCMToken()
      
      if (!fcmToken) {
        setError('FCM token alınamadı')
        return false
      }

      setToken(fcmToken)

      // Token'ı sunucuya kaydet
      const response = await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          deviceType: 'web',
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            appVersion: '1.0.0'
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Token kaydetme hatası')
      }

      console.log('FCM token başarıyla kaydedildi:', result)
      return true

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Token kaydetme hatası')
      console.error('Token registration error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, permission])

  // Bildirimleri temizle
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    isSupported,
    permission,
    token,
    isLoading,
    error,
    requestPermission,
    registerToken,
    notifications,
    clearNotifications,
    setNotifications
  }
} 