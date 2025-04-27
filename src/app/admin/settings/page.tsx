'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Text,
  Button,
  TabGroup,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react'

interface SiteSettings {
  general: {
    siteName: string
    address: string
    phone: string
    email: string
    taxId: string
  }
  payment: {
    dueDay: number
    lateFeePercentage: number
    bankAccount: string
    iban: string
  }
  notification: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    reminderDaysBefore: number
  }
  security: {
    twoFactorAuth: boolean
    sessionTimeout: number
    passwordExpiry: number
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Örnek veri (gerçek API entegrasyonu yapılabilir)
    const loadDummyData = () => {
      const dummySettings: SiteSettings = {
        general: {
          siteName: 'Yeşil Vadi Sitesi',
          address: 'Atatürk Mah. Yeşil Vadi Sok. No:1, Ümraniye, İstanbul',
          phone: '0216 123 4567',
          email: 'info@yesilvadi.com',
          taxId: '1234567890'
        },
        payment: {
          dueDay: 5,
          lateFeePercentage: 2,
          bankAccount: 'Yeşil Vadi Site Yönetimi',
          iban: 'TR12 3456 7890 1234 5678 9012 34'
        },
        notification: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: false,
          reminderDaysBefore: 3
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordExpiry: 90
        }
      }
      
      setSettings(dummySettings)
      setLoading(false)
    }

    loadDummyData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Ayarlar yüklenirken bir hata oluştu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ayarlar</h1>
        <p className="mt-1 text-sm text-gray-600">
          Site yönetimi ayarlarını yapılandırın.
        </p>
      </div>

      <TabGroup>
        <TabList>
          <Tab>Genel</Tab>
          <Tab>Ödeme</Tab>
          <Tab>Bildirimler</Tab>
          <Tab>Güvenlik</Tab>
        </TabList>

        <TabPanels>

          <TabPanel>
            <Card>
              <Title>Genel Ayarlar</Title>
              <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                Site Adı
              </label>
              <input
                type="text"
                id="siteName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                defaultValue={settings.general.siteName}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    general: {
                      ...settings.general,
                      siteName: e.target.value
                    }
                  });
                }}
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Adres
              </label>
              <textarea
                id="address"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                defaultValue={settings.general.address}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    general: {
                      ...settings.general,
                      address: e.target.value
                    }
                  });
                }}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  defaultValue={settings.general.phone}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      general: {
                        ...settings.general,
                        phone: e.target.value
                      }
                    });
                  }}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-posta
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  defaultValue={settings.general.email}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      general: {
                        ...settings.general,
                        email: e.target.value
                      }
                    });
                  }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                Vergi Numarası
              </label>
              <input
                type="text"
                id="taxId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                defaultValue={settings.general.taxId}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    general: {
                      ...settings.general,
                      taxId: e.target.value
                    }
                  });
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                color="blue" 
                onClick={() => saveSettings('payment')}
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
            {successMessage && successMessage.includes('Ödeme') && (
              <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}
          </div>
        </Card>
      </TabPanel>

          <TabPanel>
            <Card>
              <Title>Ödeme Ayarları</Title>
              <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="dueDay" className="block text-sm font-medium text-gray-700">
                  Son Ödeme Günü
                </label>
                <input
                  type="number"
                  id="dueDay"
                  min="1"
                  max="31"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={settings.payment.dueDay}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        dueDay: parseInt(e.target.value) || 1
                      }
                    });
                  }}
                />
              </div>
              <div>
                <label htmlFor="lateFee" className="block text-sm font-medium text-gray-700">
                  Gecikme Faizi (%)
                </label>
                <input
                  type="number"
                  id="lateFee"
                  min="0"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={settings.payment.lateFeePercentage}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        lateFeePercentage: parseFloat(e.target.value) || 0
                      }
                    });
                  }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700">
                Banka Hesap Adı
              </label>
              <input
                type="text"
                id="bankAccount"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings.payment.bankAccount}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    payment: {
                      ...settings.payment,
                      bankAccount: e.target.value
                    }
                  });
                }}
              />
            </div>
            <div>
              <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
                IBAN
              </label>
              <input
                type="text"
                id="iban"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings.payment.iban}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    payment: {
                      ...settings.payment,
                      iban: e.target.value
                    }
                  });
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                color="blue" 
                onClick={() => saveSettings('payment')}
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
            {successMessage && successMessage.includes('Ödeme') && (
              <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}
          </div>
        </Card>
      </TabPanel>

          <TabPanel>
            <Card>
              <Title>Bildirim Ayarları</Title>
              <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.notification.emailNotifications}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      notification: {
                        ...settings.notification,
                        emailNotifications: e.target.checked
                      }
                    });
                  }}
                />
                <label htmlFor="emailNotifications" className="ml-3 block text-sm font-medium text-gray-700">
                  E-posta Bildirimleri
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="smsNotifications"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.notification.smsNotifications}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      notification: {
                        ...settings.notification,
                        smsNotifications: e.target.checked
                      }
                    });
                  }}
                />
                <label htmlFor="smsNotifications" className="ml-3 block text-sm font-medium text-gray-700">
                  SMS Bildirimleri
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="pushNotifications"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settings.notification.pushNotifications}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      notification: {
                        ...settings.notification,
                        pushNotifications: e.target.checked
                      }
                    });
                  }}
                />
                <label htmlFor="pushNotifications" className="ml-3 block text-sm font-medium text-gray-700">
                  Uygulama Bildirimleri
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="reminderDays" className="block text-sm font-medium text-gray-700">
                Hatırlatma Günü (Son Ödeme Tarihinden Kaç Gün Önce)
              </label>
              <input
                type="number"
                id="reminderDays"
                min="1"
                max="30"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={settings.notification.reminderDaysBefore}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    notification: {
                      ...settings.notification,
                      reminderDaysBefore: parseInt(e.target.value) || 1
                    }
                  });
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                color="blue" 
                onClick={() => saveSettings('payment')}
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
            {successMessage && successMessage.includes('Ödeme') && (
              <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}
          </div>
        </Card>
      </TabPanel>

          <TabPanel>
            <Card>
              <Title>Güvenlik Ayarları</Title>
              <div className="mt-6 space-y-6">
            <div className="flex items-center">
              <input
                id="twoFactorAuth"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={settings.security.twoFactorAuth}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      twoFactorAuth: e.target.checked
                    }
                  });
                }}
              />
              <label htmlFor="twoFactorAuth" className="ml-3 block text-sm font-medium text-gray-700">
                İki Faktörlü Kimlik Doğrulama
              </label>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                  Oturum Zaman Aşımı (dakika)
                </label>
                <input
                  type="number"
                  id="sessionTimeout"
                  min="5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        sessionTimeout: parseInt(e.target.value) || 5
                      }
                    });
                  }}
                />
              </div>
              <div>
                <label htmlFor="passwordExpiry" className="block text-sm font-medium text-gray-700">
                  Şifre Geçerlilik Süresi (gün)
                </label>
                <input
                  type="number"
                  id="passwordExpiry"
                  min="30"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        passwordExpiry: parseInt(e.target.value) || 30
                      }
                    });
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                color="blue" 
                onClick={() => saveSettings('payment')}
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
            {successMessage && successMessage.includes('Ödeme') && (
              <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}
          </div>
        </Card>
      </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )

  // Ayarları kaydetme fonksiyonu
  function saveSettings(section: string) {
    setIsSaving(true);
    
    // Burada gerçek bir API çağrısı yapılabilir
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage(`${getSectionName(section)} ayarları başarıyla kaydedildi.`);
      
      // 3 saniye sonra başarı mesajını kaldır
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }, 1000);
  }
  
  // Bölüm adını döndüren yardımcı fonksiyon
  function getSectionName(section: string): string {
    switch(section) {
      case 'general': return 'Genel';
      case 'payment': return 'Ödeme';
      case 'notification': return 'Bildirim';
      case 'security': return 'Güvenlik';
      default: return '';
    }
  }
}
