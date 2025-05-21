"use client"

import { useState, useEffect } from "react"
import {
  Card,
  Title,
  Text,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Metric,
  AreaChart,
  DonutChart,
  BarChart,
  Badge,
  Button,
} from "@tremor/react"
import {
  BanknotesIcon,
  CalendarIcon,
  MegaphoneIcon,
  WrenchIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"

interface DashboardData {
  payments: {
    currentDue: number;
    nextDueDate: string;
    paymentHistory: {
      month: string;
      amount: number;
    }[];
    paymentStatus: {
      name: string;
      value: number;
    }[];
  };
  announcements: {
    total: number;
    unread: number;
    recent: {
      id: string;
      title: string;
      date: string;
      category: string;
      isNew: boolean;
    }[];
  };
  maintenance: {
    total: number;
    active: number;
    requests: {
      id: string;
      title: string;
      date: string;
      status: "pending" | "in_progress" | "completed" | "cancelled";
    }[];
  };
  reservations: {
    upcoming: number;
    facilities: {
      name: string;
      usage: number;
    }[];
    next: {
      id: string;
      facility: string;
      date: string;
      time: string;
    } | null;
  };
}

export function ResidentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Örnek veri yükleme (gerçek uygulamada API'den çekilecek)
    const loadDummyData = () => {
      const dummyData: DashboardData = {
        payments: {
          currentDue: 1200,
          nextDueDate: "2025-05-05",
          paymentHistory: [
            { month: "Ocak", amount: 1200 },
            { month: "Şubat", amount: 1200 },
            { month: "Mart", amount: 1200 },
            { month: "Nisan", amount: 1200 },
            { month: "Mayıs", amount: 1200 },
            { month: "Haziran", amount: 1200 },
          ],
          paymentStatus: [
            { name: "Ödendi", value: 5 },
            { name: "Bekleyen", value: 1 },
          ],
        },
        announcements: {
          total: 12,
          unread: 3,
          recent: [
            {
              id: "1",
              title: "Yıllık Site Toplantısı",
              date: "2025-05-10",
              category: "Toplantı",
              isNew: true,
            },
            {
              id: "2",
              title: "Havuz Bakımı Hakkında",
              date: "2025-05-08",
              category: "Bakım",
              isNew: true,
            },
            {
              id: "3",
              title: "Yaz Etkinlikleri Programı",
              date: "2025-05-01",
              category: "Etkinlik",
              isNew: false,
            },
          ],
        },
        maintenance: {
          total: 8,
          active: 2,
          requests: [
            {
              id: "1",
              title: "Mutfak musluğu arızası",
              date: "2025-04-25",
              status: "in_progress",
            },
            {
              id: "2",
              title: "Balkon kapısı tamir talebi",
              date: "2025-04-20",
              status: "pending",
            },
            {
              id: "3",
              title: "Elektrik prizi değişimi",
              date: "2025-04-10",
              status: "completed",
            },
          ],
        },
        reservations: {
          upcoming: 2,
          facilities: [
            { name: "Havuz", usage: 8 },
            { name: "Spor Salonu", usage: 12 },
            { name: "Toplantı Salonu", usage: 5 },
            { name: "Sauna", usage: 3 },
          ],
          next: {
            id: "1",
            facility: "Toplantı Salonu",
            date: "2025-05-15",
            time: "14:00 - 16:00",
          },
        },
      }
      
      setData(dummyData)
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

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Veriler yüklenirken bir hata oluştu.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('tr-TR', options)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge color="yellow" icon={ClockIcon}>Bekliyor</Badge>
      case "in_progress":
        return <Badge color="blue" icon={ClockIcon}>İşlemde</Badge>
      case "completed":
        return <Badge color="green" icon={CheckCircleIcon}>Tamamlandı</Badge>
      case "cancelled":
        return <Badge color="red" icon={ExclamationCircleIcon}>İptal Edildi</Badge>
      default:
        return <Badge color="gray">Bilinmiyor</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Hoşgeldiniz Kartı */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Title className="text-white">Hoş Geldiniz!</Title>
            <Text className="mt-2 text-blue-100">
              Site yönetim platformuna hoş geldiniz. Aidat, bakım talepleri, duyurular ve daha fazlasını buradan takip edebilirsiniz.
            </Text>
          </div>
          <div className="mt-4 md:mt-0">
            <Button variant="secondary" className="bg-white text-blue-700">
              Profili Görüntüle
            </Button>
          </div>
        </div>
      </Card>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card decoration="top" decorationColor="blue">
          <div className="flex items-start justify-between">
            <div>
              <Text>Güncel Aidat</Text>
              <Metric className="mt-1">₺{data.payments.currentDue}</Metric>
              <Text className="mt-2 text-sm text-gray-500">Son Ödeme: {formatDate(data.payments.nextDueDate)}</Text>
            </div>
            <BanknotesIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <Button size="xs" variant="light" icon={ChevronRightIcon} iconPosition="right">
              Ödeme Yap
            </Button>
          </div>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <div className="flex items-start justify-between">
            <div>
              <Text>Duyurular</Text>
              <Metric className="mt-1">{data.announcements.total}</Metric>
              <Text className="mt-2 text-sm text-gray-500">
                {data.announcements.unread} okunmamış duyuru
              </Text>
            </div>
            <MegaphoneIcon className="h-8 w-8 text-amber-500" />
          </div>
          <div className="mt-4">
            <Button size="xs" variant="light" icon={ChevronRightIcon} iconPosition="right">
              Tümünü Gör
            </Button>
          </div>
        </Card>

        <Card decoration="top" decorationColor="green">
          <div className="flex items-start justify-between">
            <div>
              <Text>Bakım Talepleri</Text>
              <Metric className="mt-1">{data.maintenance.active}</Metric>
              <Text className="mt-2 text-sm text-gray-500">
                Aktif talep
              </Text>
            </div>
            <WrenchIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-4">
            <Button size="xs" variant="light" icon={ChevronRightIcon} iconPosition="right">
              Talep Oluştur
            </Button>
          </div>
        </Card>

        <Card decoration="top" decorationColor="purple">
          <div className="flex items-start justify-between">
            <div>
              <Text>Rezervasyonlar</Text>
              <Metric className="mt-1">{data.reservations.upcoming}</Metric>
              <Text className="mt-2 text-sm text-gray-500">
                Yaklaşan rezervasyon
              </Text>
            </div>
            <CalendarIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-4">
            <Button size="xs" variant="light" icon={ChevronRightIcon} iconPosition="right">
              Rezervasyon Yap
            </Button>
          </div>
        </Card>
      </div>

      {/* Detaylı Bilgiler */}
      <TabGroup>
        <TabList className="mt-8">
          <Tab>Aidat & Ödemeler</Tab>
          <Tab>Duyurular</Tab>
          <Tab>Bakım Talepleri</Tab>
          <Tab>Rezervasyonlar</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <Title>Aidat Ödemeleri</Title>
                <AreaChart
                  className="mt-4 h-72"
                  data={data.payments.paymentHistory}
                  index="month"
                  categories={["amount"]}
                  colors={["blue"]}
                  valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
                />
              </Card>
              
              <Card>
                <Title>Ödeme Durumu</Title>
                <DonutChart
                  className="mt-6 h-60"
                  data={data.payments.paymentStatus}
                  category="value"
                  index="name"
                  colors={["emerald", "amber"]}
                  valueFormatter={(value) => `${value} ay`}
                />
                <div className="mt-6">
                  <Button size="sm" color="blue">Tüm Ödemeleri Görüntüle</Button>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          <TabPanel>
            <div className="mt-6">
              <Card>
                <Title>Son Duyurular</Title>
                <div className="mt-6 space-y-4">
                  {data.announcements.recent.map((announcement) => (
                    <div key={announcement.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-base font-medium text-gray-900">{announcement.title}</h3>
                            {announcement.isNew && (
                              <Badge color="red" size="xs" className="ml-2">Yeni</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatDate(announcement.date)}
                          </p>
                        </div>
                        <Badge color="blue">{announcement.category}</Badge>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button size="xs" variant="light">Detayları Gör</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button size="sm" color="blue">Tüm Duyuruları Görüntüle</Button>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          <TabPanel>
            <div className="mt-6">
              <Card>
                <Title>Bakım Taleplerim</Title>
                <div className="mt-6 space-y-4">
                  {data.maintenance.requests.map((request) => (
                    <div key={request.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{request.title}</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatDate(request.date)}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button size="xs" variant="light">Detayları Gör</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex space-x-2">
                  <Button size="sm" color="blue">Yeni Talep Oluştur</Button>
                  <Button size="sm" variant="secondary">Tüm Talepleri Görüntüle</Button>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <Title>Tesis Kullanımı</Title>
                <BarChart
                  className="mt-4 h-72"
                  data={data.reservations.facilities}
                  index="name"
                  categories={["usage"]}
                  colors={["violet"]}
                  valueFormatter={(value) => `${value} kez`}
                />
              </Card>
              
              <Card>
                <Title>Yaklaşan Rezervasyonum</Title>
                {data.reservations.next ? (
                  <div className="mt-6 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{data.reservations.next.facility}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(data.reservations.next.date)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {data.reservations.next.time}
                        </p>
                      </div>
                      <CalendarIcon className="h-10 w-10 text-purple-500" />
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <Button size="xs" variant="secondary" color="red">İptal Et</Button>
                      <Button size="xs" variant="light">Detaylar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Yaklaşan rezervasyonunuz bulunmuyor.</p>
                      <Button size="sm" color="blue" className="mt-2">
                        Rezervasyon Yap
                      </Button>
                    </div>
                  </div>
                )}
                <div className="mt-6">
                  <Button size="sm" color="blue">Tüm Rezervasyonları Görüntüle</Button>
                </div>
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
