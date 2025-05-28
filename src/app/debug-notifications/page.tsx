'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'

export default function DebugNotifications() {
  const {
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
  } = useNotifications()

  const [testResult, setTestResult] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[DEBUG] ${message}`)
  }

  useEffect(() => {
    addLog(`Browser support: ${isSupported}`)
    addLog(`Permission: ${permission}`)
    addLog(`Token: ${token ? token.substring(0, 20) + '...' : 'null'}`)
  }, [isSupported, permission, token])

  const handleRequestPermission = async () => {
    addLog('Permission isteniyor...')
    addLog(`Mevcut permission durumu: ${Notification.permission}`)
    addLog(`Browser desteği: ${isSupported}`)
    
    try {
      const success = await requestPermission()
      addLog(`Permission result: ${success}`)
      addLog(`Yeni permission durumu: ${Notification.permission}`)
    } catch (error) {
      addLog(`Permission hatası: ${error}`)
    }
  }

  const handleRegisterToken = async () => {
    addLog('Token kaydediliyor...')
    const success = await registerToken()
    addLog(`Token registration result: ${success}`)
  }

  const handleSendTest = async () => {
    addLog('Test notification gönderiliyor...')
    setTestResult('')
    
    try {
      const response = await fetch('/api/notifications/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Debug Test Notification',
          body: 'Bu bir debug test bildirimidir.',
          targetType: 'all'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setTestResult(`✅ Başarılı: ${JSON.stringify(result, null, 2)}`)
        addLog('Test notification başarıyla gönderildi')
      } else {
        setTestResult(`❌ Hata: ${result.error}`)
        addLog(`Test notification hatası: ${result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Network Hatası: ${error}`)
      addLog(`Network hatası: ${error}`)
    }
  }

  const checkServiceWorker = async () => {
    addLog('Service Worker kontrol ediliyor...')
    
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        addLog(`Service Worker sayısı: ${registrations.length}`)
        
        registrations.forEach((reg, index) => {
          addLog(`SW ${index}: ${reg.scope} - State: ${reg.active?.state}`)
        })
        
        // Firebase messaging SW'yi kontrol et
        const firebaseReg = registrations.find(reg => 
          reg.scope.includes('firebase-messaging-sw') || 
          reg.active?.scriptURL.includes('firebase-messaging-sw')
        )
        
        if (firebaseReg) {
          addLog('✅ Firebase messaging SW bulundu')
        } else {
          addLog('❌ Firebase messaging SW bulunamadı')
        }
      } catch (error) {
        addLog(`Service Worker kontrol hatası: ${error}`)
      }
    } else {
      addLog('❌ Service Worker desteklenmiyor')
    }
  }

  const handleManualPermissionTest = async () => {
    addLog('Manuel permission testi başlıyor...')
    
    try {
      addLog(`Navigator.permissions API: ${'permissions' in navigator}`)
      addLog(`Notification API: ${'Notification' in window}`)
      addLog(`ServiceWorker API: ${'serviceWorker' in navigator}`)
      addLog(`Mevcut permission: ${Notification.permission}`)
      
      if ('Notification' in window) {
        addLog('Notification.requestPermission() çağrılıyor...')
        const result = await Notification.requestPermission()
        addLog(`Permission sonucu: ${result}`)
        
        if (result === 'granted') {
          addLog('✅ Permission başarıyla alındı!')
          // Test notification göster
          new Notification('Test', {
            body: 'Permission başarıyla alındı!',
            icon: '/icon-192x192.png'
          })
        } else {
          addLog(`❌ Permission reddedildi: ${result}`)
        }
      } else {
        addLog('❌ Notification API desteklenmiyor')
      }
    } catch (error) {
      addLog(`❌ Manuel test hatası: ${error}`)
    }
  }

  const testForegroundListener = () => {
    addLog('Foreground listener test ediliyor...')
    
    // Manuel olarak notification state'ini test et
    const testPayload = {
      notification: {
        title: 'Test Foreground Notification',
        body: 'Bu manuel bir test bildirimidir'
      },
      data: {
        type: 'TEST',
        timestamp: new Date().toISOString()
      }
    }
    
    // Notification state'ini güncelle
    setNotifications(prev => [...prev, testPayload])
    addLog('Manuel notification eklendi')
    
    // Browser notification da göster
    if (Notification.permission === 'granted') {
      new Notification(testPayload.notification.title, {
        body: testPayload.notification.body,
        icon: '/icon-192x192.png'
      })
      addLog('Browser notification gösterildi')
    }
  }

  const handleSimpleTest = async () => {
    addLog('Simple Firebase test başlıyor...')
    
    if (!token) {
      addLog('❌ Token bulunamadı! Önce token kaydedin.')
      return
    }
    
    addLog(`Token kullanılıyor: ${token.substring(0, 20)}...`)
    
    try {
      const response = await fetch('/api/notifications/test-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Simple test başarılı: ${result.messageId}`)
        addLog('🎉 Firebase notification gönderildi!')
      } else {
        addLog(`❌ Simple test hatası: ${result.error}`)
        if (result.details) {
          addLog(`Detay: ${result.details}`)
        }
      }
    } catch (error) {
      addLog(`❌ Simple test network hatası: ${error}`)
    }
  }

  const handleDbTest = async () => {
    addLog('MongoDB test başlıyor...')
    
    try {
      const response = await fetch('/api/notifications/test-db')
      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ MongoDB bağlantısı başarılı`)
        addLog(`Toplam token: ${result.totalTokens}`)
        addLog(`Aktif token: ${result.activeTokens}`)
        addLog(`Token detayları:`)
        result.tokens.forEach((t: any, index: number) => {
          addLog(`  ${index + 1}. User: ${t.userId}, Type: ${t.deviceType}, Active: ${t.isActive}, Valid: ${t.hasValidToken}`)
        })
      } else {
        addLog(`❌ MongoDB test hatası: ${result.error}`)
        if (result.details) {
          addLog(`Detay: ${result.details}`)
        }
      }
    } catch (error) {
      addLog(`❌ MongoDB test network hatası: ${error}`)
    }
  }

  const handleDebugTest = async () => {
    addLog('🔍 Adım adım debug test başlıyor...')
    setTestResult('')
    
    try {
      const response = await fetch('/api/notifications/debug-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (response.ok) {
        addLog('✅ Debug test başarılı!')
        addLog(`MessageId: ${result.messageId}`)
        
        // Adımları logla
        result.steps.forEach((step: string) => {
          addLog(step)
        })
        
        setTestResult(`✅ Debug Test Başarılı!\nMessageId: ${result.messageId}\n\nAdımlar:\n${result.steps.join('\n')}`)
      } else {
        addLog(`❌ Debug test hatası: ${result.error}`)
        
        // Hata adımlarını logla
        if (result.steps) {
          result.steps.forEach((step: string) => {
            addLog(step)
          })
        }
        
        setTestResult(`❌ Debug Test Hatası: ${result.error}\n\nDetay: ${result.details}\n\nAdımlar:\n${result.steps?.join('\n') || 'Adım bilgisi yok'}`)
      }
    } catch (error) {
      addLog(`❌ Debug test network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleCheckAllTokens = async () => {
    addLog('👥 Tüm kullanıcı token\'ları kontrol ediliyor...')
    
    try {
      const response = await fetch('/api/notifications/check-tokens')
      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Token kontrolü başarılı`)
        addLog(`Toplam kullanıcı: ${result.totalUsers}`)
        addLog(`Toplam token: ${result.totalTokens}`)
        addLog(`Aktif token: ${result.activeTokens}`)
        
        addLog('📋 Kullanıcı detayları:')
        result.userTokenMap.forEach((user: any) => {
          addLog(`  👤 ${user.email} (${user.role}): ${user.activeTokens}/${user.tokenCount} aktif token`)
          user.tokens.forEach((token: any, index: number) => {
            addLog(`    📱 ${index + 1}. ${token.deviceType} - ${token.isActive ? '✅' : '❌'} - ${token.tokenPreview}`)
          })
        })
        
        setTestResult(`✅ Token Kontrolü\n\nToplam Kullanıcı: ${result.totalUsers}\nToplam Token: ${result.totalTokens}\nAktif Token: ${result.activeTokens}\n\n${JSON.stringify(result.userTokenMap, null, 2)}`)
      } else {
        addLog(`❌ Token kontrol hatası: ${result.error}`)
        setTestResult(`❌ Token Kontrol Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Token kontrol network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleDebugTokens = async () => {
    addLog('🔍 Token debug bilgileri alınıyor...')
    
    try {
      const response = await fetch('/api/notifications/debug-tokens')
      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Debug token kontrolü başarılı`)
        addLog(`Toplam kullanıcı: ${result.users.length}`)
        addLog(`Toplam token: ${result.tokens.length}`)
        
        addLog('👤 Kullanıcılar:')
        result.users.forEach((user: any) => {
          addLog(`  📧 ${user.email} (${user.role}) - ID: ${user._id}`)
        })
        
        addLog('📱 Token\'lar:')
        result.tokens.forEach((token: any, index: number) => {
          addLog(`  ${index + 1}. userId: "${token.userId}" - ${token.deviceType} - ${token.isActive ? '✅' : '❌'}`)
          addLog(`     Token: ${token.tokenPreview}`)
          addLog(`     Created: ${token.createdAt}`)
        })
        
        setTestResult(`🔍 Debug Token Bilgileri\n\n${JSON.stringify(result, null, 2)}`)
      } else {
        addLog(`❌ Debug token hatası: ${result.error}`)
        setTestResult(`❌ Debug Token Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Debug token network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleFixTokens = async () => {
    addLog('🔧 Token\'lar düzeltiliyor...')
    
    try {
      const response = await fetch('/api/notifications/fix-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Token düzeltme başarılı!`)
        addLog(`Düzeltilen token sayısı: ${result.fixedCount}`)
        
        addLog('📋 Önceki durum:')
        result.beforeTokens.forEach((token: any, index: number) => {
          addLog(`  ${index + 1}. userId: "${token.userId}" - ${token.isActive ? '✅' : '❌'}`)
        })
        
        addLog('📋 Sonraki durum:')
        result.afterTokens.forEach((token: any, index: number) => {
          addLog(`  ${index + 1}. userId: "${token.userId}" - ${token.isActive ? '✅' : '❌'}`)
        })
        
        setTestResult(`🔧 Token Düzeltme Sonucu\n\nDüzeltilen: ${result.fixedCount}\n\n${JSON.stringify(result, null, 2)}`)
      } else {
        addLog(`❌ Token düzeltme hatası: ${result.error}`)
        setTestResult(`❌ Token Düzeltme Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Token düzeltme network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleTestRoleTargeting = async () => {
    addLog('🎯 Rol bazlı hedefleme test ediliyor...')
    
    try {
      const response = await fetch('/api/notifications/test-role-targeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRoles: ['RESIDENT']
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Rol hedefleme test başarılı!`)
        addLog(`Hedef roller: ${result.targetRoles.join(', ')}`)
        addLog(`Bulunan kullanıcı sayısı: ${result.targetUsers.length}`)
        addLog(`Bulunan token sayısı: ${result.tokenCount}`)
        
        addLog('👥 Hedef kullanıcılar:')
        result.targetUsers.forEach((user: any) => {
          addLog(`  📧 ${user.email} (${user.role})`)
        })
        
        addLog('📱 Bulunan token\'lar:')
        result.foundTokens.forEach((token: any, index: number) => {
          addLog(`  ${index + 1}. ${token.userId} - ${token.deviceType} - ${token.isActive ? '✅' : '❌'}`)
        })
        
        if (result.tokenCount === 0) {
          addLog('❌ Hiç token bulunamadı! Sorun:')
          addLog(`📧 Hedef email'ler: ${result.userEmails.join(', ')}`)
          addLog('📱 Tüm token\'lar:')
          result.allTokens.forEach((token: any, index: number) => {
            addLog(`  ${index + 1}. ${token.userId} - ${token.isActive ? '✅' : '❌'}`)
          })
        }
        
        setTestResult(`🎯 Rol Hedefleme Test\n\n${JSON.stringify(result, null, 2)}`)
      } else {
        addLog(`❌ Rol hedefleme test hatası: ${result.error}`)
        setTestResult(`❌ Rol Hedefleme Test Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Rol hedefleme test network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleSendRoleNotification = async () => {
    addLog('🚀 Rol bazlı bildirim gönderiliyor...')
    
    try {
      const response = await fetch('/api/notifications/send-role-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRoles: ['RESIDENT'],
          title: 'Test Rol Bildirimi',
          body: 'Bu RESIDENT kullanıcılarına gönderilen test bildirimidir.',
          data: {
            category: 'TEST',
            priority: 'normal'
          }
        })
      })

      addLog(`Response status: ${response.status}`)
      addLog(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)
      
      const responseText = await response.text()
      addLog(`Raw response: ${responseText.substring(0, 200)}...`)
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        addLog(`❌ JSON parse hatası: ${parseError}`)
        setTestResult(`❌ JSON Parse Hatası: ${parseError}\n\nRaw Response: ${responseText}`)
        return
      }
      
      if (response.ok) {
        addLog(`✅ Rol bazlı bildirim başarıyla gönderildi!`)
        addLog(`Hedef roller: ${result.targetRoles.join(', ')}`)
        addLog(`Hedef kullanıcı sayısı: ${result.targetUserCount}`)
        addLog(`Gönderilen token sayısı: ${result.sentTokenCount}`)
        addLog(`Başarılı: ${result.successCount}, Başarısız: ${result.failureCount}`)
        
        addLog('👥 Hedef kullanıcılar:')
        result.targetUsers.forEach((user: any) => {
          addLog(`  📧 ${user.email} (${user.role})`)
        })
        
        addLog('📱 Gönderilen cihazlar:')
        result.sentTo.forEach((device: any, index: number) => {
          addLog(`  ${index + 1}. ${device.userId} - ${device.deviceType}`)
        })
        
        setTestResult(`🚀 Rol Bazlı Bildirim Gönderildi\n\n${JSON.stringify(result, null, 2)}`)
      } else {
        addLog(`❌ Rol bazlı bildirim hatası: ${result.error}`)
        if (result.details) {
          addLog(`Detay: ${result.details}`)
        }
        setTestResult(`❌ Rol Bazlı Bildirim Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Rol bazlı bildirim network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleSendRoleNotificationV2 = async () => {
    addLog('🚀 Rol bazlı bildirim V2 gönderiliyor...')
    
    try {
      const response = await fetch('/api/notifications/send-role-notification-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRoles: ['RESIDENT'],
          title: 'Test Rol Bildirimi V2',
          body: 'Bu RESIDENT kullanıcılarına gönderilen V2 test bildirimidir.',
          data: {
            category: 'TEST_V2',
            priority: 'normal'
          }
        })
      })

      addLog(`Response status: ${response.status}`)
      addLog(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)
      
      const responseText = await response.text()
      addLog(`Raw response: ${responseText.substring(0, 200)}...`)
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        addLog(`❌ JSON parse hatası: ${parseError}`)
        setTestResult(`❌ JSON Parse Hatası: ${parseError}\n\nRaw Response: ${responseText}`)
        return
      }
      
      if (response.ok) {
        addLog(`✅ Rol bazlı bildirim başarıyla gönderildi!`)
        addLog(`Hedef roller: ${result.targetRoles.join(', ')}`)
        addLog(`Hedef kullanıcı sayısı: ${result.targetUserCount}`)
        addLog(`Gönderilen token sayısı: ${result.sentTokenCount}`)
        addLog(`Başarılı: ${result.successCount}, Başarısız: ${result.failureCount}`)
        
        addLog('👥 Hedef kullanıcılar:')
        result.targetUsers.forEach((user: any) => {
          addLog(`  📧 ${user.email} (${user.role})`)
        })
        
        addLog('📱 Gönderilen cihazlar:')
        result.sentTo.forEach((device: any, index: number) => {
          addLog(`  ${index + 1}. ${device.userId} - ${device.deviceType}`)
        })
        
        setTestResult(`🚀 Rol Bazlı Bildirim Gönderildi\n\n${JSON.stringify(result, null, 2)}`)
      } else {
        addLog(`❌ Rol bazlı bildirim hatası: ${result.error}`)
        if (result.details) {
          addLog(`Detay: ${result.details}`)
        }
        setTestResult(`❌ Rol Bazlı Bildirim Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Rol bazlı bildirim network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleTestEndpoint = async () => {
    addLog('🔧 Endpoint testi yapılıyor...')
    
    try {
      const response = await fetch('/api/test-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: 'data'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Test endpoint çalışıyor: ${result.message}`)
        setTestResult(`✅ Test Endpoint Başarılı\n\n${JSON.stringify(result, null, 2)}`)
      } else {
        addLog(`❌ Test endpoint hatası: ${result.error}`)
        setTestResult(`❌ Test Endpoint Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Test endpoint network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleFirebaseDebug = async () => {
    addLog('🔍 Firebase debug testi yapılıyor...')
    
    try {
      const response = await fetch('/api/debug-firebase')
      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Firebase debug başarılı`)
        addLog(`Development Mode: ${result.isDevelopment}`)
        addLog(`Environment: ${JSON.stringify(result.environment)}`)
        addLog(`Mock Test Result: ${JSON.stringify(result.mockTestResult)}`)
        
        setTestResult(`✅ Firebase Debug Başarılı\n\n${JSON.stringify(result, null, 2)}`)
      } else {
        addLog(`❌ Firebase debug hatası: ${result.error}`)
        if (result.stack) {
          addLog(`Stack: ${result.stack}`)
        }
        setTestResult(`❌ Firebase Debug Hatası: ${result.error}\n\nStack: ${result.stack}`)
      }
    } catch (error) {
      addLog(`❌ Firebase debug network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleJwtDebug = async () => {
    addLog('🔍 JWT token debug testi yapılıyor...')
    
    try {
      const response = await fetch('/api/debug-jwt')
      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ JWT debug başarılı`)
        addLog(`Token var: ${result.hasToken}`)
        addLog(`JWT_SECRET var: ${result.hasJwtSecret}`)
        
        if (result.decoded) {
          addLog(`Token header: ${JSON.stringify(result.decoded.header)}`)
          addLog(`Token payload: ${JSON.stringify(result.decoded.payload)}`)
        }
        
        if (result.verified) {
          addLog(`✅ Token doğrulandı: ${result.verified.email} (${result.verified.role})`)
        }
        
        if (result.verifyError) {
          addLog(`❌ Token doğrulama hatası: ${result.verifyError.name} - ${result.verifyError.message}`)
        }
        
        setTestResult(`🔍 JWT Debug\n\n${JSON.stringify(result, null, 2)}`)
      } else {
        addLog(`❌ JWT debug hatası: ${result.error}`)
        setTestResult(`❌ JWT Debug Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ JWT debug network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  const handleLogout = async () => {
    addLog('🚪 Çıkış yapılıyor...')
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        addLog(`✅ Başarıyla çıkış yapıldı`)
        addLog('🔄 Sayfayı yenileyin ve tekrar giriş yapın')
        setTestResult(`✅ Logout Başarılı\n\nSayfayı yenileyin ve tekrar giriş yapın`)
      } else {
        addLog(`❌ Çıkış hatası: ${result.error}`)
        setTestResult(`❌ Logout Hatası: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Çıkış network hatası: ${error}`)
      setTestResult(`❌ Network Hatası: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Notification Debug Panel</h1>
      
      {/* Status */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Durum</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Browser Desteği:</strong> {isSupported ? '✅' : '❌'}
          </div>
          <div>
            <strong>Permission:</strong> {permission || 'null'}
          </div>
          <div>
            <strong>FCM Token:</strong> {token ? '✅ Var' : '❌ Yok'}
          </div>
          <div>
            <strong>Loading:</strong> {isLoading ? '⏳' : '✅'}
          </div>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
            <strong>Hata:</strong> {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">İşlemler</h2>
        <div className="space-y-3">
          <button
            onClick={checkServiceWorker}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Service Worker Kontrol Et
          </button>
          
          <button
            onClick={handleRequestPermission}
            disabled={!isSupported}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Permission İste {permission === 'granted' ? '(Zaten Verilmiş)' : ''}
          </button>
          
          <button
            onClick={handleRegisterToken}
            disabled={!isSupported || permission !== 'granted'}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            Token Kaydet
          </button>
          
          <button
            onClick={handleSendTest}
            disabled={!token}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            Test Notification Gönder
          </button>
          
          <button
            onClick={clearNotifications}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Bildirimleri Temizle
          </button>
          
          <button
            onClick={handleManualPermissionTest}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Manuel Permission Test
          </button>
          
                     <button
             onClick={testForegroundListener}
             className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
           >
             Foreground Listener Test
           </button>
           
           <button
             onClick={handleSimpleTest}
             className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
           >
             Simple Firebase Test
           </button>
           
           <button
             onClick={handleDbTest}
             className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
           >
             MongoDB Test
           </button>
           
           <button
             onClick={handleDebugTest}
             className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
           >
             🔍 Adım Adım Debug Test
           </button>
           
           <button
             onClick={handleCheckAllTokens}
             className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600"
           >
             👥 Tüm Kullanıcı Token'larını Kontrol Et
           </button>
           
           <button
             onClick={handleDebugTokens}
             className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
           >
             🔍 Token Debug Bilgileri
           </button>
           
           <button
             onClick={handleFixTokens}
             className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
           >
             🔧 Token'ları Düzelt (ObjectId → Email)
           </button>
           
           <button
             onClick={handleTestRoleTargeting}
             className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
           >
             🎯 Rol Hedefleme Test (RESIDENT)
           </button>
           
           <button
             onClick={handleSendRoleNotification}
             className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
           >
             🚀 Rol Bazlı Bildirim Gönder (RESIDENT)
           </button>
           
           <button
             onClick={handleSendRoleNotificationV2}
             className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
           >
             🚀 Rol Bazlı Bildirim V2 Gönder (RESIDENT)
           </button>
           
           <button
             onClick={handleTestEndpoint}
             className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
           >
             🔧 Endpoint Test
           </button>
           
           <button
             onClick={handleFirebaseDebug}
             className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
           >
             🔍 Firebase Debug Test
           </button>
           
           <button
             onClick={handleJwtDebug}
             className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
           >
             🔍 JWT Token Debug
           </button>
           
           <button
             onClick={handleLogout}
             className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
           >
             🚪 Logout & Yeniden Giriş
           </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Test Sonucu</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {testResult}
          </pre>
        </div>
      )}

      {/* Received Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Alınan Bildirimler ({notifications.length})</h2>
          <div className="space-y-2">
            {notifications.map((notif, index) => (
              <div key={index} className="bg-green-50 border border-green-200 p-3 rounded">
                <div className="font-semibold">{notif.notification.title}</div>
                <div className="text-gray-600">{notif.notification.body}</div>
                {notif.data && (
                  <div className="text-xs text-gray-500 mt-1">
                    Data: {JSON.stringify(notif.data)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Logs */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3">Debug Logs</h2>
        <div className="bg-black text-green-400 p-3 rounded text-sm h-64 overflow-auto font-mono">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
} 