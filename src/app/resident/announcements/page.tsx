'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Text,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Badge,
  Button,
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react'
import { MagnifyingGlassIcon, BellIcon, ClockIcon } from '@heroicons/react/24/outline'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  date: string
  isNew: boolean
  isImportant: boolean
}

export default function ResidentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    // Örnek veri yükleme (gerçek uygulamada API'den çekilecek)
    const loadDummyData = () => {
      const dummyAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'Yıllık Site Toplantısı',
          content: 'Değerli site sakinlerimiz, yıllık olağan site toplantımız 15 Mayıs 2025 Cumartesi günü saat 14:00\'te site sosyal tesisinde gerçekleştirilecektir. Tüm site sakinlerimizin katılımını rica ederiz.',
          category: 'Toplantı',
          date: '2025-05-01',
          isNew: true,
          isImportant: true,
        },
        {
          id: '2',
          title: 'Havuz Bakımı Hakkında',
          content: 'Değerli site sakinlerimiz, yaz sezonuna hazırlık kapsamında havuzumuzun bakımı 10-12 Mayıs 2025 tarihleri arasında yapılacaktır. Bu tarihler arasında havuz kullanıma kapalı olacaktır.',
          category: 'Bakım',
          date: '2025-04-28',
          isNew: true,
          isImportant: false,
        },
        {
          id: '3',
          title: 'Yaz Etkinlikleri Programı',
          content: 'Değerli site sakinlerimiz, yaz aylarında gerçekleştireceğimiz etkinliklerin programı ekte sunulmuştur. Etkinliklerimize katılımınızı bekleriz.',
          category: 'Etkinlik',
          date: '2025-04-20',
          isNew: false,
          isImportant: false,
        },
        {
          id: '4',
          title: 'Elektrik Kesintisi Duyurusu',
          content: 'Değerli site sakinlerimiz, BEDAŞ tarafından yapılacak bakım çalışmaları nedeniyle 5 Mayıs 2025 tarihinde 09:00-14:00 saatleri arasında elektrik kesintisi yaşanacaktır.',
          category: 'Kesinti',
          date: '2025-04-15',
          isNew: false,
          isImportant: true,
        },
        {
          id: '5',
          title: 'Çevre Düzenleme Çalışmaları',
          content: 'Değerli site sakinlerimiz, sitemizin peyzaj düzenlemesi 1-10 Mayıs 2025 tarihleri arasında yapılacaktır. Bu süre zarfında bahçe alanlarında çalışmalar olacaktır.',
          category: 'Bakım',
          date: '2025-04-10',
          isNew: false,
          isImportant: false,
        },
        {
          id: '6',
          title: 'Güvenlik Kamera Sistemi Yenileme',
          content: 'Değerli site sakinlerimiz, sitemizin güvenlik kamera sistemi 20 Nisan 2025 tarihinde yenilenmiştir. Yeni sistem 4K çözünürlükte kayıt yapabilmekte ve daha geniş bir alanı kapsamaktadır.',
          category: 'Güvenlik',
          date: '2025-04-05',
          isNew: false,
          isImportant: true,
        },
      ]
      
      setAnnouncements(dummyAnnouncements)
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

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('tr-TR', options)
  }

  const categories = ['Toplantı', 'Bakım', 'Etkinlik', 'Kesinti', 'Güvenlik']

  // Filtreleme işlemi
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || announcement.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const newAnnouncements = filteredAnnouncements.filter(announcement => announcement.isNew)
  const importantAnnouncements = filteredAnnouncements.filter(announcement => announcement.isImportant)
  const regularAnnouncements = filteredAnnouncements.filter(announcement => !announcement.isNew && !announcement.isImportant)

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Duyurular</h1>
        <p className="mt-1 text-sm text-gray-600">
          Site yönetiminden gelen duyuruları görüntüleyin.
        </p>
      </div>

      {/* Arama ve Filtreleme */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="col-span-2">
            <TextInput
              icon={MagnifyingGlassIcon}
              placeholder="Duyurularda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Duyurular */}
      <TabGroup>
        <TabList>
          <Tab>Tüm Duyurular</Tab>
          <Tab>Yeni</Tab>
          <Tab>Önemli</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <div className="space-y-4">
              {filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center">
                          <Title>{announcement.title}</Title>
                          {announcement.isNew && (
                            <Badge color="blue" className="ml-2">Yeni</Badge>
                          )}
                          {announcement.isImportant && (
                            <Badge color="red" className="ml-2">Önemli</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Badge color="gray" className="mr-2">{announcement.category}</Badge>
                          <ClockIcon className="mr-1 h-4 w-4" />
                          <span>{formatDate(announcement.date)}</span>
                        </div>
                        <Text className="mt-4">{announcement.content}</Text>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Arama kriterlerinize uygun duyuru bulunamadı.</p>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>
          
          <TabPanel>
            <div className="space-y-4">
              {newAnnouncements.length > 0 ? (
                newAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center">
                          <Title>{announcement.title}</Title>
                          <Badge color="blue" className="ml-2">Yeni</Badge>
                          {announcement.isImportant && (
                            <Badge color="red" className="ml-2">Önemli</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Badge color="gray" className="mr-2">{announcement.category}</Badge>
                          <ClockIcon className="mr-1 h-4 w-4" />
                          <span>{formatDate(announcement.date)}</span>
                        </div>
                        <Text className="mt-4">{announcement.content}</Text>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Yeni duyuru bulunmuyor.</p>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>
          
          <TabPanel>
            <div className="space-y-4">
              {importantAnnouncements.length > 0 ? (
                importantAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center">
                          <Title>{announcement.title}</Title>
                          {announcement.isNew && (
                            <Badge color="blue" className="ml-2">Yeni</Badge>
                          )}
                          <Badge color="red" className="ml-2">Önemli</Badge>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Badge color="gray" className="mr-2">{announcement.category}</Badge>
                          <ClockIcon className="mr-1 h-4 w-4" />
                          <span>{formatDate(announcement.date)}</span>
                        </div>
                        <Text className="mt-4">{announcement.content}</Text>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Önemli duyuru bulunmuyor.</p>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
