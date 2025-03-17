"use client"

import {
  Card,
  Text,
  Grid,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  TextInput,
  Select,
  SelectItem,
} from "@tremor/react"
import { useState } from "react"

export default function SettingsPage() {
  const [siteAdi, setSiteAdi] = useState("Örnek Site")
  const [adres, setAdres] = useState("Örnek Mahallesi, Örnek Sokak No:1")
  const [yoneticiAdi, setYoneticiAdi] = useState("Ahmet Yılmaz")
  const [telefon, setTelefon] = useState("0532 123 4567")
  const [email, setEmail] = useState("yonetici@email.com")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ayarlar</h1>
        <p className="mt-2 text-sm text-gray-700">
          Site yönetim platformu ayarlarını düzenleyin
        </p>
      </div>

      <TabGroup>
        <TabList variant="solid">
          <Tab>Genel</Tab>
          <Tab>Bildirimler</Tab>
          <Tab>Güvenlik</Tab>
          <Tab>Yedekleme</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <div className="mt-6 space-y-8">
              <Card>
                <Text>Site Bilgileri</Text>
                <div className="mt-4 space-y-4">
                  <div>
                    <Text>Site Adı</Text>
                    <TextInput
                      className="mt-2"
                      value={siteAdi}
                      onChange={(e) => setSiteAdi(e.target.value)}
                    />
                  </div>
                  <div>
                    <Text>Adres</Text>
                    <TextInput
                      className="mt-2"
                      value={adres}
                      onChange={(e) => setAdres(e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <Text>Yönetici Bilgileri</Text>
                <div className="mt-4 space-y-4">
                  <div>
                    <Text>Ad Soyad</Text>
                    <TextInput
                      className="mt-2"
                      value={yoneticiAdi}
                      onChange={(e) => setYoneticiAdi(e.target.value)}
                    />
                  </div>
                  <div>
                    <Text>Telefon</Text>
                    <TextInput
                      className="mt-2"
                      value={telefon}
                      onChange={(e) => setTelefon(e.target.value)}
                    />
                  </div>
                  <div>
                    <Text>E-posta</Text>
                    <TextInput
                      className="mt-2"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <Text>Aidat Ayarları</Text>
                <div className="mt-4 space-y-4">
                  <div>
                    <Text>Ödeme Son Günü</Text>
                    <Select className="mt-2" defaultValue="10">
                      <SelectItem value="5">Her ayın 5&apos;i</SelectItem>
                      <SelectItem value="10">Her ayın 10&apos;u</SelectItem>
                      <SelectItem value="15">Her ayın 15&apos;i</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <Text>Gecikme Faizi (%)</Text>
                    <Select className="mt-2" defaultValue="1.5">
                      <SelectItem value="1">%1</SelectItem>
                      <SelectItem value="1.5">%1.5</SelectItem>
                      <SelectItem value="2">%2</SelectItem>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="mt-6 space-y-8">
              <Card>
                <Text>E-posta Bildirimleri</Text>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text>Aidat Hatırlatmaları</Text>
                      <Text className="text-gray-500">
                        Son ödeme günü yaklaşan aidatlar için hatırlatma
                      </Text>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        id="aidatHatirlatma"
                      />
                      <label
                        className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-gray-200 p-1 duration-300 ease-in-out peer-checked:bg-blue-600"
                        htmlFor="aidatHatirlatma"
                      >
                        <div className="h-4 w-4 rounded-full bg-white duration-300 ease-in-out peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Text>Duyuru Bildirimleri</Text>
                      <Text className="text-gray-500">
                        Yeni duyurular eklendiğinde bildirim
                      </Text>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        id="duyuruBildirim"
                      />
                      <label
                        className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-gray-200 p-1 duration-300 ease-in-out peer-checked:bg-blue-600"
                        htmlFor="duyuruBildirim"
                      >
                        <div className="h-4 w-4 rounded-full bg-white duration-300 ease-in-out peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Text>Arıza Bildirimleri</Text>
                      <Text className="text-gray-500">
                        Yeni arıza talepleri için bildirim
                      </Text>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        id="arizaBildirim"
                      />
                      <label
                        className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-gray-200 p-1 duration-300 ease-in-out peer-checked:bg-blue-600"
                        htmlFor="arizaBildirim"
                      >
                        <div className="h-4 w-4 rounded-full bg-white duration-300 ease-in-out peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <Text>SMS Bildirimleri</Text>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text>Acil Duyurular</Text>
                      <Text className="text-gray-500">
                        Önemli duyurular için SMS bildirimi
                      </Text>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        id="smsBildirim"
                      />
                      <label
                        className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-gray-200 p-1 duration-300 ease-in-out peer-checked:bg-blue-600"
                        htmlFor="smsBildirim"
                      >
                        <div className="h-4 w-4 rounded-full bg-white duration-300 ease-in-out peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="mt-6 space-y-8">
              <Card>
                <Text>Şifre Değiştirme</Text>
                <div className="mt-4 space-y-4">
                  <div>
                    <Text>Mevcut Şifre</Text>
                    <TextInput
                      className="mt-2"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Text>Yeni Şifre</Text>
                    <TextInput
                      className="mt-2"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Text>Yeni Şifre (Tekrar)</Text>
                    <TextInput
                      className="mt-2"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Şifreyi Değiştir
                  </button>
                </div>
              </Card>

              <Card>
                <Text>İki Faktörlü Doğrulama</Text>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text>SMS ile Doğrulama</Text>
                      <Text className="text-gray-500">
                        Giriş yaparken SMS kodu ile doğrulama
                      </Text>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        id="2fa"
                      />
                      <label
                        className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-gray-200 p-1 duration-300 ease-in-out peer-checked:bg-blue-600"
                        htmlFor="2fa"
                      >
                        <div className="h-4 w-4 rounded-full bg-white duration-300 ease-in-out peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="mt-6 space-y-8">
              <Card>
                <Text>Otomatik Yedekleme</Text>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text>Günlük Yedekleme</Text>
                      <Text className="text-gray-500">
                        Her gün otomatik yedek alınır
                      </Text>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        id="autoBackup"
                      />
                      <label
                        className="flex h-6 w-11 cursor-pointer items-center rounded-full bg-gray-200 p-1 duration-300 ease-in-out peer-checked:bg-blue-600"
                        htmlFor="autoBackup"
                      >
                        <div className="h-4 w-4 rounded-full bg-white duration-300 ease-in-out peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Text>Yedekleme Zamanı</Text>
                    <Select className="mt-2" defaultValue="00:00">
                      <SelectItem value="00:00">00:00</SelectItem>
                      <SelectItem value="03:00">03:00</SelectItem>
                      <SelectItem value="06:00">06:00</SelectItem>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card>
                <Text>Manuel Yedekleme</Text>
                <div className="mt-4">
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Yedek Al
                  </button>
                </div>
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          İptal
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Kaydet
        </button>
      </div>
    </div>
  )
}
