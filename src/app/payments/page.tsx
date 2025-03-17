"use client"

import { Card, Text, Grid, Tab, TabGroup, TabList, TabPanel, TabPanels, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Badge } from "@tremor/react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

const payments = [
  {
    id: 1,
    daire: "A-101",
    sakin: "Ahmet Yılmaz",
    tutar: 750,
    tarih: new Date(2024, 2, 1),
    durum: "Ödendi",
  },
  {
    id: 2,
    daire: "B-204",
    sakin: "Ayşe Kaya",
    tutar: 750,
    tarih: new Date(2024, 2, 1),
    durum: "Bekliyor",
  },
  {
    id: 3,
    daire: "C-302",
    sakin: "Mehmet Demir",
    tutar: 750,
    tarih: new Date(2024, 2, 1),
    durum: "Gecikmiş",
  },
  {
    id: 4,
    daire: "A-102",
    sakin: "Fatma Şahin",
    tutar: 750,
    tarih: new Date(2024, 2, 1),
    durum: "Ödendi",
  },
  {
    id: 5,
    daire: "B-205",
    sakin: "Ali Öztürk",
    tutar: 750,
    tarih: new Date(2024, 2, 1),
    durum: "Bekliyor",
  },
]

export default function PaymentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Aidat & Ödemeler</h1>
        <p className="mt-2 text-sm text-gray-700">
          Aidat ödemelerini takip edin ve yönetin
        </p>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        <Card decoration="top" decorationColor="emerald">
          <Text>Toplam Tahsilat</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">₺75.400</p>
          <Text className="mt-4">Mart 2024</Text>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <Text>Bekleyen Ödemeler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">₺12.500</p>
          <Text className="mt-4">8 Daire</Text>
        </Card>

        <Card decoration="top" decorationColor="rose">
          <Text>Gecikmiş Ödemeler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">₺6.750</p>
          <Text className="mt-4">3 Daire</Text>
        </Card>
      </Grid>

      <Card>
        <TabGroup>
          <div className="flex items-center justify-between">
            <TabList variant="solid">
              <Tab>Tüm Ödemeler</Tab>
              <Tab>Bekleyenler</Tab>
              <Tab>Gecikmiş</Tab>
            </TabList>

            <button
              type="button"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Ödeme Ekle
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
                      <TableHeaderCell>Tutar</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.daire}</TableCell>
                        <TableCell>{payment.sakin}</TableCell>
                        <TableCell>₺{payment.tutar}</TableCell>
                        <TableCell>
                          {format(payment.tarih, "d MMMM yyyy", { locale: tr })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={
                              payment.durum === "Ödendi"
                                ? "emerald"
                                : payment.durum === "Bekliyor"
                                ? "amber"
                                : "red"
                            }
                          >
                            {payment.durum}
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
                      <TableHeaderCell>Tutar</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments
                      .filter((payment) => payment.durum === "Bekliyor")
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.daire}</TableCell>
                          <TableCell>{payment.sakin}</TableCell>
                          <TableCell>₺{payment.tutar}</TableCell>
                          <TableCell>
                            {format(payment.tarih, "d MMMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <Badge color="amber">{payment.durum}</Badge>
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
                      <TableHeaderCell>Tutar</TableHeaderCell>
                      <TableHeaderCell>Tarih</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments
                      .filter((payment) => payment.durum === "Gecikmiş")
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.daire}</TableCell>
                          <TableCell>{payment.sakin}</TableCell>
                          <TableCell>₺{payment.tutar}</TableCell>
                          <TableCell>
                            {format(payment.tarih, "d MMMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <Badge color="red">{payment.durum}</Badge>
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
