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
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

interface Payment {
  _id: string
  month: string
  amount: number
  dueDate: string
  status: string
  paymentDate?: string
}

export default function ResidentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDue, setCurrentDue] = useState(0)
  const [nextDueDate, setNextDueDate] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/payments');
        if (!response.ok) {
          throw new Error('Ödemeler yüklenirken bir hata oluştu.');
        }
        const data: Payment[] = await response.json();
        console.log('Fetched payments data:', data); // Log the raw data
        setPayments(data);

        const pending = data.filter(p => p.status.toLowerCase() === 'pending');
        const totalDue = pending.reduce((sum, p) => sum + p.amount, 0);
        setCurrentDue(totalDue);

        if (pending.length > 0) {
          pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          setNextDueDate(new Date(pending[0].dueDate).toLocaleDateString('tr-TR'));
        } else {
          setNextDueDate('-');
        }

      } catch (err: any) {
        setError(err.message || 'Veri yüklenemedi.');
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();

  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  }

  const getStatusBadge = (status: string) => {
    const lowerCaseStatus = status.toLowerCase();
    switch (lowerCaseStatus) {
      case 'pending':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">Bekliyor</span>;
      case 'paid':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Ödendi</span>;
      case 'overdue':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Gecikti</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Bilinmiyor</span>;
    }
  }

  const pendingPayments = payments.filter(payment => payment.status.toLowerCase() === 'pending')
  const paidPayments = payments.filter(payment => payment.status.toLowerCase() === 'paid')

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

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
              Son Ödeme Tarihi: {nextDueDate}
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
                  {payments.map((payment) => {
                    console.log('Rendering payment row:', payment); // Log payment object for this row
                    return (
                      <TableRow key={payment._id}>
                        <TableCell>{payment.month}</TableCell>
                        <TableCell>₺{payment.amount.toLocaleString('tr-TR')}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>
                          {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.status.toLowerCase() === 'pending' ? (
                            <Button 
                              size="xs" 
                              color="blue"
                              onClick={(event) => { 
                                event.stopPropagation(); 
                                console.log('Tüm Ödemeler - Ödeme Yap tıklandı, ID:', payment._id);
                                router.push(`/resident/payments/${payment._id}/pay`);
                              }}
                            >
                              Ödeme Yap
                            </Button>
                          ) : payment.status.toLowerCase() === 'paid' ? (
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
                    )
                  })}
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
                      <TableRow key={payment._id}>
                        <TableCell>{payment.month}</TableCell>
                        <TableCell>₺{payment.amount.toLocaleString('tr-TR')}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <Button 
                            size="xs" 
                            color="blue"
                            onClick={(event) => { 
                              event.stopPropagation(); 
                              console.log('Bekleyen Ödemeler - Ödeme Yap tıklandı, ID:', payment._id);
                              router.push(`/resident/payments/${payment._id}/pay`);
                            }}
                          >
                            Ödeme Yap
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
                      <TableRow key={payment._id}>
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
