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
  Switch,
  Select,
  SelectItem,
  Grid,
  Col,
} from '@tremor/react'
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

interface ResidentSettings {
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    announcements: boolean
    payments: boolean
    maintenance: boolean
    reservations: boolean
  }
  privacy: {
    showPhoneNumber: boolean
    showEmail: boolean
    showVehicleInfo: boolean
  }
  security: {
    twoFactorAuth: boolean
    loginNotifications: boolean
    sessionTimeout: number
  }
  theme: {
    darkMode: boolean
    fontSize: string
    language: string
  }
}

export default function ResidentSettingsPage() {
  const [settings, setSettings] = useState<ResidentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Örnek veri yükleme (gerçek uygulamada API'den çekilecek)
    const loadDummyData = () => {
      const dummySettings: ResidentSettings = {
        notifications: {
          email: true,
          sms: false,
          push: true,
          announcements: true,
          payments: true,
          maintenance: true,
          reservations: true,
        },
        privacy: {
          showPhoneNumber: false,
          showEmail: true,
          showVehicleInfo: false,
        },
        security: {
          twoFactorAuth: false,
          loginNotifications: true,
          sessionTimeout: 30,
        },
        theme: {
          darkMode: false,
          fontSize: 'medium',
          language: 'tr',
        },
      }
      
      setSettings(dummySettings)
      setLoading(false)
    }

    // Simüle edilmiş veri yükleme gecikmesi
    setTimeout(() => {
      loadDummyData()
    }, 1000)
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

  const saveSettings = (section: string) => {
    setIsSaving(true)
    
    // Gerçek uygulamada API'ye gönderilecek
    setTimeout(() => {
      setIsSaving(false)
      setSuccessMessage(`${getSectionName(section)} ayarları başarıyla kaydedildi.`)
      
      // 3 saniye sonra başarı mesajını kaldır
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    }, 1000)
  }
  
  const getSectionName = (section: string): string => {
    switch(section) {
      case 'notifications': return 'Bildirim'
      case 'privacy': return 'Gizlilik'
      case 'security': return 'Güvenlik'
      case 'theme': return 'Tema'
      default: return ''
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ayarlar</h1>
        <p className="mt-1 text-sm text-gray-600">
          Hesap ayarlarınızı yapılandırın.
        </p>
      </div>

      <TabGroup>
        <TabList>
          <Tab>Bildirimler</Tab>
          <Tab>Gizlilik</Tab>
          <Tab>Güvenlik</Tab>
          <Tab>Tema</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Card>
              <Title>Bildirim Ayarları</Title>
              <Text className="mt-2">Hangi bildirimler alacağınızı ve nasıl alacağınızı yapılandırın.</Text>
              
              <div className="mt-6 space-y-6">
                <div>
                  <Title className="text-base font-medium">Bildirim Kanalları</Title>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        <span className="ml-3 text-sm">E-posta Bildirimleri</span>
                      </div>
                      <Switch
                        checked={settings.notifications.email}
                        onChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            email: value,
                          }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                        <span className="ml-3 text-sm">SMS Bildirimleri</span>
                      </div>
                      <Switch
                        checked={settings.notifications.sms}
                        onChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            sms: value,
                          }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BellIcon className="h-5 w-5 text-gray-400" />
                        <span className="ml-3 text-sm">Uygulama Bildirimleri</span>
                      </div>
                      <Switch
                        checked={settings.notifications.push}
                        onChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            push: value,
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Title className="text-base font-medium">Bildirim Türleri</Title>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Duyurular</span>
                      <Switch
                        checked={settings.notifications.announcements}
                        onChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            announcements: value,
                          }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ödemeler</span>
                      <Switch
                        checked={settings.notifications.payments}
                        onChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            payments: value,
                          }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bakım Talepleri</span>
                      <Switch
                        checked={settings.notifications.maintenance}
                        onChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            maintenance: value,
                          }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rezervasyonlar</span>
                      <Switch
                        checked={settings.notifications.reservations}
                        onChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            reservations: value,
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    color="blue" 
                    onClick={() => saveSettings('notifications')}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
                
                {successMessage && successMessage.includes('Bildirim') && (
                  <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
                    {successMessage}
                  </div>
                )}
              </div>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Gizlilik Ayarları</Title>
              <Text className="mt-2">Kişisel bilgilerinizin görünürlüğünü kontrol edin.</Text>
              
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Telefon numaramı diğer site sakinlerine göster</span>
                    <Switch
                      checked={settings.privacy.showPhoneNumber}
                      onChange={(value) => setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          showPhoneNumber: value,
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">E-posta adresimi diğer site sakinlerine göster</span>
                    <Switch
                      checked={settings.privacy.showEmail}
                      onChange={(value) => setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          showEmail: value,
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Araç bilgilerimi diğer site sakinlerine göster</span>
                    <Switch
                      checked={settings.privacy.showVehicleInfo}
                      onChange={(value) => setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          showVehicleInfo: value,
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    color="blue" 
                    onClick={() => saveSettings('privacy')}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
                
                {successMessage && successMessage.includes('Gizlilik') && (
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
              <Text className="mt-2">Hesap güvenlik ayarlarınızı yapılandırın.</Text>
              
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                      <span className="ml-3 text-sm">İki Faktörlü Kimlik Doğrulama</span>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onChange={(value) => setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          twoFactorAuth: value,
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Yeni cihazdan giriş yapıldığında bildir</span>
                    <Switch
                      checked={settings.security.loginNotifications}
                      onChange={(value) => setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          loginNotifications: value,
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                      Oturum Zaman Aşımı (dakika)
                    </label>
                    <Select
                      id="sessionTimeout"
                      value={settings.security.sessionTimeout.toString()}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          sessionTimeout: parseInt(value),
                        }
                      })}
                      className="mt-1"
                    >
                      <SelectItem value="15">15 dakika</SelectItem>
                      <SelectItem value="30">30 dakika</SelectItem>
                      <SelectItem value="60">1 saat</SelectItem>
                      <SelectItem value="120">2 saat</SelectItem>
                      <SelectItem value="240">4 saat</SelectItem>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    color="blue" 
                    onClick={() => saveSettings('security')}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
                
                {successMessage && successMessage.includes('Güvenlik') && (
                  <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
                    {successMessage}
                  </div>
                )}
              </div>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Tema Ayarları</Title>
              <Text className="mt-2">Uygulama görünümünü kişiselleştirin.</Text>
              
              <div className="mt-6 space-y-6">
                <Grid numItems={1} numItemsSm={2} className="gap-4">
                  <Col>
                    <div>
                      <label htmlFor="darkMode" className="block text-sm font-medium text-gray-700">
                        Karanlık Mod
                      </label>
                      <div className="mt-1">
                        <Switch
                          id="darkMode"
                          checked={settings.theme.darkMode}
                          onChange={(value) => setSettings({
                            ...settings,
                            theme: {
                              ...settings.theme,
                              darkMode: value,
                            }
                          })}
                        />
                      </div>
                    </div>
                  </Col>
                  
                  <Col>
                    <div>
                      <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700">
                        Yazı Boyutu
                      </label>
                      <Select
                        id="fontSize"
                        value={settings.theme.fontSize}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          theme: {
                            ...settings.theme,
                            fontSize: value,
                          }
                        })}
                        className="mt-1"
                      >
                        <SelectItem value="small">Küçük</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="large">Büyük</SelectItem>
                      </Select>
                    </div>
                  </Col>
                  
                  <Col>
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                        Dil
                      </label>
                      <Select
                        id="language"
                        value={settings.theme.language}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          theme: {
                            ...settings.theme,
                            language: value,
                          }
                        })}
                        className="mt-1"
                      >
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </Select>
                    </div>
                  </Col>
                </Grid>
                
                <div className="flex justify-end">
                  <Button 
                    color="blue" 
                    onClick={() => saveSettings('theme')}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
                
                {successMessage && successMessage.includes('Tema') && (
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
}
