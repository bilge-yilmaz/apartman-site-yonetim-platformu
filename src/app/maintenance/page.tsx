"use client"

import {
  Card,
  Text,
  Badge,
  Grid,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react"
import { WrenchIcon } from "@heroicons/react/24/outline"

const maintenanceRequests = [
  {
    id: 1,
    daire: "A-101",
    sakin: "Ahmet Yılmaz",
    konu: "Su Sızıntısı",
    aciklama: "Mutfak lavabosundan su sızıntısı var",
    tarih: "8 Mart 2024",
    durum: "Bekliyor",
    oncelik: "Yüksek",
  },
  {
    id: 2,
    daire: "B-204",
    sakin: "Ayşe Kaya",
    konu: "Elektrik Arızası",
    aciklama: "Salon prizlerinde elektrik kesintisi yaşanıyor",
    tarih: "7 Mart 2024",
    durum: "İşlemde",
    oncelik: "Orta",
  },
  {
    id: 3,
    daire: "C-302",
    sakin: "Mehmet Demir",
    konu: "İnternet Sorunu",
    aciklama: "İnternet bağlantısında kopma yaşanıyor",
    tarih: "6 Mart 2024",
    durum: "Tamamlandı",
    oncelik: "Düşük",
  },
]

export default function MaintenancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bakım & Arıza</h1>
        <p className="mt-2 text-sm text-gray-700">
          Bakım ve arıza taleplerini takip edin
        </p>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        <Card decoration="top" decorationColor="rose">
          <Text>Bekleyen Talepler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">3</p>
          <Text className="mt-4">2 Yüksek Öncelikli</Text>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <Text>İşlemdeki Talepler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">5</p>
          <Text className="mt-4">Ortalama Çözüm: 2 gün</Text>
        </Card>

        <Card decoration="top" decorationColor="emerald">
          <Text>Tamamlanan Talepler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">28</p>
          <Text className="mt-4">Bu ay</Text>
        </Card>
      </Grid>

      <Card>
        <TabGroup>
          <div className="flex items-center justify-between">
            <TabList variant="solid">
              <Tab>Tüm Talepler</Tab>
              <Tab>Bekleyenler</Tab>
              <Tab>İşlemdekiler</Tab>
              <Tab>Tamamlananlar</Tab>
            </TabList>

            <button
              type="button"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Yeni Talep
            </button>
          </div>

          <TabPanels>
            <TabPanel>
              <div className="mt-6">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Daire</TableHeaderCell>
                      <TableHeaderCell>Sakin</TableHeaderCell>
                      <TableHeaderCell>Konu</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Öncelik</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.daire}</TableCell>
                        <TableCell>{request.sakin}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <WrenchIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            <span>{request.konu}</span>
                          </div>
                        </TableCell>
                        <TableCell>{request.tarih}</TableCell>
                        <TableCell>
                          <Badge
                            color={
                              request.oncelik === "Yüksek"
                                ? "rose"
                                : request.oncelik === "Orta"
                                ? "amber"
                                : "emerald"
                            }
                          >
                            {request.oncelik}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={
                              request.durum === "Bekliyor"
                                ? "rose"
                                : request.durum === "İşlemde"
                                ? "amber"
                                : "emerald"
                            }
                          >
                            {request.durum}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            Detay
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="mt-6">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Daire</TableHeaderCell>
                      <TableHeaderCell>Sakin</TableHeaderCell>
                      <TableHeaderCell>Konu</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Öncelik</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceRequests
                      .filter((request) => request.durum === "Bekliyor")
                      .map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.daire}</TableCell>
                          <TableCell>{request.sakin}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <WrenchIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              <span>{request.konu}</span>
                            </div>
                          </TableCell>
                          <TableCell>{request.tarih}</TableCell>
                          <TableCell>
                            <Badge
                              color={
                                request.oncelik === "Yüksek"
                                  ? "rose"
                                  : request.oncelik === "Orta"
                                  ? "amber"
                                  : "emerald"
                              }
                            >
                              {request.oncelik}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge color="rose">{request.durum}</Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                              Detay
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="mt-6">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Daire</TableHeaderCell>
                      <TableHeaderCell>Sakin</TableHeaderCell>
                      <TableHeaderCell>Konu</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Öncelik</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceRequests
                      .filter((request) => request.durum === "İşlemde")
                      .map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.daire}</TableCell>
                          <TableCell>{request.sakin}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <WrenchIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              <span>{request.konu}</span>
                            </div>
                          </TableCell>
                          <TableCell>{request.tarih}</TableCell>
                          <TableCell>
                            <Badge
                              color={
                                request.oncelik === "Yüksek"
                                  ? "rose"
                                  : request.oncelik === "Orta"
                                  ? "amber"
                                  : "emerald"
                              }
                            >
                              {request.oncelik}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge color="amber">{request.durum}</Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                              Detay
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="mt-6">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Daire</TableHeaderCell>
                      <TableHeaderCell>Sakin</TableHeaderCell>
                      <TableHeaderCell>Konu</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Öncelik</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceRequests
                      .filter((request) => request.durum === "Tamamlandı")
                      .map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.daire}</TableCell>
                          <TableCell>{request.sakin}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <WrenchIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              <span>{request.konu}</span>
                            </div>
                          </TableCell>
                          <TableCell>{request.tarih}</TableCell>
                          <TableCell>
                            <Badge
                              color={
                                request.oncelik === "Yüksek"
                                  ? "rose"
                                  : request.oncelik === "Orta"
                                  ? "amber"
                                  : "emerald"
                              }
                            >
                              {request.oncelik}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge color="emerald">{request.durum}</Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                              Detay
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  )
}
