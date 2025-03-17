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
  DateRangePicker,
} from "@tremor/react"
import { CalendarIcon } from "@heroicons/react/24/outline"
import { tr } from "date-fns/locale"

const facilities = [
  {
    id: 1,
    name: "Toplantı Salonu",
    description: "20 kişilik toplantı salonu",
    status: "Müsait",
    image: "/meeting-room.jpg",
  },
  {
    id: 2,
    name: "Spor Salonu",
    description: "Fitness ekipmanları ve yoga alanı",
    status: "Müsait",
    image: "/gym.jpg",
  },
  {
    id: 3,
    name: "Çok Amaçlı Salon",
    description: "Etkinlikler için kullanılabilir alan",
    status: "Rezerve",
    image: "/multi-purpose.jpg",
  },
]

const reservations = [
  {
    id: 1,
    daire: "A-101",
    sakin: "Ahmet Yılmaz",
    tesis: "Toplantı Salonu",
    tarih: "10 Mart 2024",
    saat: "14:00 - 16:00",
    durum: "Onaylandı",
  },
  {
    id: 2,
    daire: "B-204",
    sakin: "Ayşe Kaya",
    tesis: "Spor Salonu",
    tarih: "11 Mart 2024",
    saat: "09:00 - 10:00",
    durum: "Bekliyor",
  },
  {
    id: 3,
    daire: "C-302",
    sakin: "Mehmet Demir",
    tesis: "Çok Amaçlı Salon",
    tarih: "12 Mart 2024",
    saat: "18:00 - 20:00",
    durum: "İptal",
  },
]

export default function ReservationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Rezervasyonlar</h1>
        <p className="mt-2 text-sm text-gray-700">
          Ortak alanların rezervasyonlarını yönetin
        </p>
      </div>

      <div className="flex items-center justify-between">
        <DateRangePicker
          className="max-w-md"
          enableSelect={false}
          locale={tr}
          placeholder="Tarih seçin"
        />
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Yeni Rezervasyon
        </button>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        {facilities.map((facility) => (
          <Card
            key={facility.id}
            decoration="top"
            decorationColor={facility.status === "Müsait" ? "emerald" : "amber"}
          >
            <div className="relative h-48 w-full overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-gray-200" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <Text>{facility.name}</Text>
                <Badge
                  color={facility.status === "Müsait" ? "emerald" : "amber"}
                >
                  {facility.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {facility.description}
              </p>
              <button
                type="button"
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Rezervasyon Yap
              </button>
            </div>
          </Card>
        ))}
      </Grid>

      <Card>
        <TabGroup>
          <TabList variant="solid">
            <Tab>Tüm Rezervasyonlar</Tab>
            <Tab>Onaylananlar</Tab>
            <Tab>Bekleyenler</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <div className="mt-6">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Daire</TableHeaderCell>
                      <TableHeaderCell>Sakin</TableHeaderCell>
                      <TableHeaderCell>Tesis</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Saat</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>{reservation.daire}</TableCell>
                        <TableCell>{reservation.sakin}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            <span>{reservation.tesis}</span>
                          </div>
                        </TableCell>
                        <TableCell>{reservation.tarih}</TableCell>
                        <TableCell>{reservation.saat}</TableCell>
                        <TableCell>
                          <Badge
                            color={
                              reservation.durum === "Onaylandı"
                                ? "emerald"
                                : reservation.durum === "Bekliyor"
                                ? "amber"
                                : "rose"
                            }
                          >
                            {reservation.durum}
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
                      <TableHeaderCell>Tesis</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Saat</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations
                      .filter(
                        (reservation) => reservation.durum === "Onaylandı"
                      )
                      .map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell>{reservation.daire}</TableCell>
                          <TableCell>{reservation.sakin}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              <span>{reservation.tesis}</span>
                            </div>
                          </TableCell>
                          <TableCell>{reservation.tarih}</TableCell>
                          <TableCell>{reservation.saat}</TableCell>
                          <TableCell>
                            <Badge color="emerald">{reservation.durum}</Badge>
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
                      <TableHeaderCell>Tesis</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Saat</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations
                      .filter(
                        (reservation) => reservation.durum === "Bekliyor"
                      )
                      .map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell>{reservation.daire}</TableCell>
                          <TableCell>{reservation.sakin}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              <span>{reservation.tesis}</span>
                            </div>
                          </TableCell>
                          <TableCell>{reservation.tarih}</TableCell>
                          <TableCell>{reservation.saat}</TableCell>
                          <TableCell>
                            <Badge color="amber">{reservation.durum}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-400"
                              >
                                Onayla
                              </button>
                              <button
                                type="button"
                                className="rounded-md bg-rose-500 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-400"
                              >
                                Reddet
                              </button>
                            </div>
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
