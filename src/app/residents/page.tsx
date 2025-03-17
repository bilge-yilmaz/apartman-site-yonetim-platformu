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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Badge,
  TextInput,
} from "@tremor/react"
import { MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline"
import { useState } from "react"

const residents = [
  {
    id: 1,
    daire: "A-101",
    ad: "Ahmet Yılmaz",
    telefon: "0532 123 4567",
    email: "ahmet@email.com",
    durum: "Mülk Sahibi",
    borcDurumu: "Güncel",
  },
  {
    id: 2,
    daire: "B-204",
    ad: "Ayşe Kaya",
    telefon: "0533 234 5678",
    email: "ayse@email.com",
    durum: "Kiracı",
    borcDurumu: "Gecikmiş",
  },
  {
    id: 3,
    daire: "C-302",
    ad: "Mehmet Demir",
    telefon: "0534 345 6789",
    email: "mehmet@email.com",
    durum: "Mülk Sahibi",
    borcDurumu: "Güncel",
  },
]

const blocks = [
  {
    name: "A Blok",
    total: 15,
    occupied: 14,
    owner: 10,
    tenant: 4,
  },
  {
    name: "B Blok",
    total: 15,
    occupied: 13,
    owner: 8,
    tenant: 5,
  },
  {
    name: "C Blok",
    total: 12,
    occupied: 12,
    owner: 7,
    tenant: 5,
  },
]

export default function ResidentsPage() {
  const [search, setSearch] = useState("")

  const filteredResidents = residents.filter(
    (resident) =>
      resident.ad.toLowerCase().includes(search.toLowerCase()) ||
      resident.daire.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Site Sakinleri</h1>
        <p className="mt-2 text-sm text-gray-700">
          Site sakinlerinin bilgilerini görüntüleyin ve yönetin
        </p>
      </div>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        {blocks.map((block) => (
          <Card key={block.name} decoration="top" decorationColor="blue">
            <Text>{block.name}</Text>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {block.occupied}/{block.total}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <Text className="text-gray-500">
                Mülk Sahibi: {block.owner}
              </Text>
              <Text className="text-gray-500">
                Kiracı: {block.tenant}
              </Text>
            </div>
          </Card>
        ))}
      </Grid>

      <Card>
        <div className="flex items-center justify-between">
          <TextInput
            icon={MagnifyingGlassIcon}
            placeholder="Sakin veya daire ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Sakin Ekle
          </button>
        </div>

        <TabGroup className="mt-6">
          <TabList variant="solid">
            <Tab>Tüm Sakinler</Tab>
            <Tab>Mülk Sahipleri</Tab>
            <Tab>Kiracılar</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <div className="mt-6">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Daire</TableHeaderCell>
                      <TableHeaderCell>Ad Soyad</TableHeaderCell>
                      <TableHeaderCell>İletişim</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>Borç Durumu</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResidents.map((resident) => (
                      <TableRow key={resident.id}>
                        <TableCell>{resident.daire}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            <span>{resident.ad}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{resident.telefon}</div>
                            <div className="text-sm text-gray-500">
                              {resident.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={
                              resident.durum === "Mülk Sahibi"
                                ? "blue"
                                : "amber"
                            }
                          >
                            {resident.durum}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={
                              resident.borcDurumu === "Güncel"
                                ? "emerald"
                                : "rose"
                            }
                          >
                            {resident.borcDurumu}
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
                      <TableHeaderCell>Ad Soyad</TableHeaderCell>
                      <TableHeaderCell>İletişim</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>Borç Durumu</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResidents
                      .filter((resident) => resident.durum === "Mülk Sahibi")
                      .map((resident) => (
                        <TableRow key={resident.id}>
                          <TableCell>{resident.daire}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              <span>{resident.ad}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{resident.telefon}</div>
                              <div className="text-sm text-gray-500">
                                {resident.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge color="blue">{resident.durum}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              color={
                                resident.borcDurumu === "Güncel"
                                  ? "emerald"
                                  : "rose"
                              }
                            >
                              {resident.borcDurumu}
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
                      <TableHeaderCell>Ad Soyad</TableHeaderCell>
                      <TableHeaderCell>İletişim</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>Borç Durumu</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResidents
                      .filter((resident) => resident.durum === "Kiracı")
                      .map((resident) => (
                        <TableRow key={resident.id}>
                          <TableCell>{resident.daire}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                              <span>{resident.ad}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{resident.telefon}</div>
                              <div className="text-sm text-gray-500">
                                {resident.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge color="amber">{resident.durum}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              color={
                                resident.borcDurumu === "Güncel"
                                  ? "emerald"
                                  : "rose"
                              }
                            >
                              {resident.borcDurumu}
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
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  )
}
