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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import { BanknotesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface Payment {
  id: string
  month: string
  amount: number
  dueDate: string
  status: 'paid' | 'pending' | 'overdue'
  paymentDate?: string
}

export default function ResidentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDue, setCurrentDue] = useState(0)
  const [nextDueDate, setNextDueDate] = useState('')

  useEffect(() => {
    // Örnek veri yükleme (gerçek uygulamada API'den çekilecek)
    const loadDummyData = () => {
      const dummyPayments: Payment[] = [
        {
          id: '1',
          month: 'Ocak 2025',
          amount: 1200,
          dueDate: '2025-01-05',
          status: 'paid',
          paymentDate: '2025-01-03',
        },
        {
          id: '2',
          month: 'Şubat 2025',
          amount: 1200,
          dueDate: '2025-02-05',
          status: 'paid',
          paymentDate: '2025-02-04',
        },
        {
          id: '3',
          month: 'Mart 2025',
          amount: 1200,
          dueDate: '2025-03-05',
          status: 'paid',
          paymentDate: '2025-03-02',
        },
        {
          id: '4',
          month: 'Nisan 2025',
          amount: 1200,
          dueDate: '2025-04-05',
          status: 'paid',
          paymentDate: '2025-04-01',
        },
        {
          id: '5',
          month: 'Mayıs 2025',
          amount: 1200,
          dueDate: '2025-05-05',
          status: 'pending',
        },
        {
          id: '6',
          month: 'Haziran 2025',
          amount: 1200,
          dueDate: '2025-06-05',
          status: 'pending',
        },
      ]
      
      setPayments(dummyPayments)
      setCurrentDue(1200)
      setNextDueDate('2025-05-05')
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge color="green">Ödendi</Badge>
      case 'pending':
        return <Badge color="yellow">Bekliyor</Badge>
      case 'overdue':
        return <Badge color="red">Gecikmiş</Badge>
      default:
        return <Badge color="gray">Bilinmiyor</Badge>
    }
  }

  const pendingPayments = payments.filter(payment => payment.status === 'pending')
  const paidPayments = payments.filter(payment => payment.status === 'paid')

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Aidat & Ödemeler</h1>
        <p className="mt-1 text-sm text-gray-600">
          Aidat ödemelerinizi görüntüleyin ve yönetin.
        </p>
      </div>

      {/* Güncel Aidat Bilgisi */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Text className="text-blue-100">Güncel Aidat</Text>
            <div className="mt-2 flex items-center">
              <BanknotesIcon className="mr-2 h-6 w-6 text-white" />
              <span className="text-2xl font-bold text-white">₺{currentDue.toLocaleString('tr-TR')}</span>
            </div>
            <Text className="mt-2 text-blue-100">
              Son Ödeme Tarihi: {formatDate(nextDueDate)}
            </Text>
          </div>
          <div className="mt-4 md:mt-0">
            <Button variant="secondary" className="bg-white text-blue-700">
              Ödeme Yap
            </Button>
          </div>
        </div>
      </Card>

      {/* Aidat Tablosu */}
      <TabGroup>
        <TabList>
          <Tab>Tüm Ödemeler</Tab>
          <Tab>Bekleyen Ödemeler</Tab>
          <Tab>Ödenen Aidatlar</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Card>
              <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                  <Title>Tüm Aidat Ödemeleri</Title>
                  <Text>Son 6 aya ait aidat ödemeleriniz</Text>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Button variant="light" icon={ArrowDownTrayIcon} iconPosition="left">
                    Makbuz İndir
                  </Button>
                </div>
              </div>
              
              <Table className="mt-6">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Dönem</TableHeaderCell>
                    <TableHeaderCell>Tutar</TableHeaderCell>
                    <TableHeaderCell>Son Ödeme Tarihi</TableHeaderCell>
                    <TableHeaderCell>Ödeme Tarihi</TableHeaderCell>
                    <TableHeaderCell>Durum</TableHeaderCell>
                    <TableHeaderCell>İşlem</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.month}</TableCell>
                      <TableCell>₺{payment.amount.toLocaleString('tr-TR')}</TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>
                        {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.status === 'pending' ? (
                          <Button size="xs" color="blue">
                            Öde
                          </Button>
                        ) : payment.status === 'paid' ? (
                          <Button size="xs" variant="light" icon={ArrowDownTrayIcon}>
                            Makbuz
                          </Button>
                        ) : (
                          <Button size="xs" color="red">
                            Öde
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Bekleyen Ödemeler</Title>
              <Text>Henüz ödemediğiniz aidatlar</Text>
              
              {pendingPayments.length > 0 ? (
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Dönem</TableHeaderCell>
                      <TableHeaderCell>Tutar</TableHeaderCell>
                      <TableHeaderCell>Son Ödeme Tarihi</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.month}</TableCell>
                        <TableCell>₺{payment.amount.toLocaleString('tr-TR')}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <Button size="xs" color="blue">
                            Öde
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="mt-6 flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Bekleyen ödemeniz bulunmuyor.</p>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card>
              <Title>Ödenen Aidatlar</Title>
              <Text>Ödediğiniz aidatlar</Text>
              
              {paidPayments.length > 0 ? (
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Dönem</TableHeaderCell>
                      <TableHeaderCell>Tutar</TableHeaderCell>
                      <TableHeaderCell>Ödeme Tarihi</TableHeaderCell>
                      <TableHeaderCell>Durum</TableHeaderCell>
                      <TableHeaderCell>İşlem</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paidPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.month}</TableCell>
                        <TableCell>₺{payment.amount.toLocaleString('tr-TR')}</TableCell>
                        <TableCell>{formatDate(payment.paymentDate || '')}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <Button size="xs" variant="light" icon={ArrowDownTrayIcon}>
                            Makbuz
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="mt-6 flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Henüz ödeme yapmadınız.</p>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
