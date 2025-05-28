'use client'

import { useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import NotificationCenter from '@/components/notifications/NotificationCenter'

export default function SocketTestPage() {
  const [testResult, setTestResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    isConnected,
    notifications,
    emitAnnouncement,
    emitMaintenanceRequest,
    emitPaymentReceived,
    emitReservationRequest
  } = useSocket()

  const sendTestNotification = async (type: string, data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-socket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data })
      })
      
      const result = await response.json()
      setTestResult(`✅ ${result.message}`)
    } catch (error) {
      setTestResult(`❌ Hata: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testScenarios = [
    {
      title: 'Duyuru Bildirimi',
      type: 'announcement',
      data: { title: 'Test Duyuru', content: 'Bu bir test duyurusudur' },
      color: 'bg-blue-500'
    },
    {
      title: 'Arıza Bildirimi',
      type: 'maintenance', 
      data: { title: 'Test Arıza', description: 'Asansör arızası test bildirimi' },
      color: 'bg-orange-500'
    },
    {
      title: 'Ödeme Bildirimi',
      type: 'payment',
      data: { message: 'Aidat ödemesi alındı', amount: 1500 },
      color: 'bg-green-500'
    },
    {
      title: 'Rezervasyon Bildirimi',
      type: 'reservation',
      data: { facilityName: 'Toplantı Salonu', date: new Date() },
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Socket.IO Test Merkezi
              </h1>
              <p className="text-gray-600 mt-1">
                Gerçek zamanlı bildirim sistemini test edin
              </p>
            </div>
            <NotificationCenter />
          </div>
        </div>

        {/* Bağlantı Durumu */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Bağlantı Durumu</h2>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">
                {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
              </span>
            </div>
            <div className="text-gray-600">
              Toplam Bildirim: {notifications.length}
            </div>
          </div>
        </div>

        {/* Test Butonları */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Senaryoları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => sendTestNotification(scenario.type, scenario.data)}
                disabled={isLoading || !isConnected}
                className={`${scenario.color} text-white p-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity`}
              >
                <div className="text-left">
                  <div className="font-semibold">{scenario.title}</div>
                  <div className="text-sm opacity-90 mt-1">
                    {scenario.type} bildirimi gönder
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Client-side Test Butonları */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Client-side Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => emitAnnouncement({
                title: 'Client Test Duyuru',
                content: 'Bu client-side test duyurusudur',
                targetType: 'all'
              })}
              disabled={!isConnected}
              className="bg-indigo-500 text-white p-4 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              Client Duyuru Gönder
            </button>
            
            <button
              onClick={() => emitMaintenanceRequest({
                title: 'Client Test Arıza',
                description: 'Bu client-side test arızasıdır',
                priority: 'high'
              })}
              disabled={!isConnected}
              className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              Client Arıza Gönder
            </button>
          </div>
        </div>

        {/* Test Sonucu */}
        {testResult && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Test Sonucu</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm">{testResult}</code>
            </div>
          </div>
        )}

        {/* Bildirim Listesi */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Alınan Bildirimler ({notifications.length})
          </h2>
          {notifications.length === 0 ? (
            <p className="text-gray-500">Henüz bildirim yok</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(-5).reverse().map((notification, index) => (
                <div key={notification.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {notification.title}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">
                        {notification.message}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(notification.timestamp).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      notification.type === 'announcement' ? 'bg-blue-100 text-blue-800' :
                      notification.type === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                      notification.type === 'payment' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {notification.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 