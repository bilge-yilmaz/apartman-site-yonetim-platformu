'use client'

import { useState, useEffect } from 'react'
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useNotifications } from '@/hooks/useNotifications'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationWidgetProps {
  className?: string
}

export default function NotificationWidget({ className = '' }: NotificationWidgetProps) {
  const {
    isSupported,
    permission,
    isLoading,
    error,
    requestPermission,
    registerToken,
    notifications,
    clearNotifications
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const [hasSetup, setHasSetup] = useState(false)

  // Otomatik setup
  useEffect(() => {
    if (isSupported && !hasSetup) {
      handleSetupNotifications()
    }
  }, [isSupported, hasSetup])

  const handleSetupNotifications = async () => {
    if (permission === 'granted') {
      await registerToken()
      setHasSetup(true)
    } else if (permission === 'default') {
      const granted = await requestPermission()
      if (granted) {
        await registerToken()
        setHasSetup(true)
      }
    }
  }

  const getStatusColor = () => {
    if (!isSupported) return 'text-gray-400'
    if (permission === 'granted') return 'text-green-500'
    if (permission === 'denied') return 'text-red-500'
    return 'text-yellow-500'
  }

  const getStatusText = () => {
    if (!isSupported) return 'Desteklenmiyor'
    if (permission === 'granted') return 'Aktif'
    if (permission === 'denied') return 'Reddedildi'
    return 'Bekliyor'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Notification Badge */}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
        
        {/* Status Indicator */}
        <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
          permission === 'granted' ? 'bg-green-500' : 
          permission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
        }`} />
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Bildirimler</h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Setup Section */}
              {!hasSetup && isSupported && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Push bildirimleri almak için izin verin
                  </p>
                  <button
                    onClick={handleSetupNotifications}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Ayarlanıyor...' : 'Bildirimleri Aktifleştir'}
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 mb-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 text-sm">
                        {notification.notification.title}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        {notification.notification.body}
                      </p>
                      {notification.data?.type && (
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {notification.data.type}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <button
                  onClick={clearNotifications}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
                >
                  Tümünü Temizle
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 