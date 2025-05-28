'use client'

import { useState, useEffect } from 'react'
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useSocket } from '@/hooks/useSocket'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface NotificationCenterProps {
  userId?: string
  userRole?: 'admin' | 'resident'
  apartmentId?: string
  blockId?: string
}

export default function NotificationCenter(props: NotificationCenterProps = {}) {
  console.log('🔔 NotificationCenter render edildi!', {
    userId: props.userId,
    userRole: props.userRole,
    apartmentId: props.apartmentId,
    blockId: props.blockId
  })
  
  const [isOpen, setIsOpen] = useState(false)
  
  const {
    isConnected,
    notifications,
    markAsRead,
    removeNotification,
    clearNotifications
  } = useSocket(props)

  const unreadCount = notifications.filter(notif => !notif.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return '📢'
      case 'maintenance':
        return '🔧'
      case 'payment':
        return '💰'
      case 'reservation':
        return '📅'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-50 border-blue-200'
      case 'maintenance':
        return 'bg-orange-50 border-orange-200'
      case 'payment':
        return 'bg-green-50 border-green-200'
      case 'reservation':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="relative">
      {/* Bildirim butonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Bağlantı durumu göstergesi */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        
        {/* Okunmamış bildirim sayısı */}
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Bildirim paneli */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Bildirimler
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 text-xs ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>{isConnected ? 'Bağlı' : 'Bağlantı Yok'}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Bildirimler listesi */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz bildirim yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900 font-semibold' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${
                            !notification.read ? 'text-gray-800' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(notification.timestamp, 'dd MMM yyyy HH:mm', { locale: tr })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                        className="text-gray-400 hover:text-gray-600 ml-2"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={clearNotifications}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Tüm bildirimleri temizle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 
