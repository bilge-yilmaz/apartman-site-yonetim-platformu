"use client"

import { useState, useEffect } from "react"
import { Card, Text, Grid, Tab, TabGroup, TabList, TabPanel, TabPanels, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Badge } from "@tremor/react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { AddPaymentModal } from "@/components/payments/AddPaymentModal"
import { EditPaymentModal } from "@/components/payments/EditPaymentModal"
import { BulkPaymentModal } from "@/components/payments/BulkPaymentModal"
import { ExportPaymentsButton } from "@/components/payments/ExportPaymentsButton"
import { PencilIcon } from "@heroicons/react/24/outline"

interface Payment {
  _id: string;
  apartmentNo: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paymentDate?: string;
  description?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const status = activeTab === 1 ? 'PENDING' : activeTab === 2 ? 'OVERDUE' : '';
      const response = await fetch(`/api/payments${status ? `?status=${status}` : ''}`);
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge color="emerald">Ödendi</Badge>;
      case 'PENDING':
        return <Badge color="amber">Bekliyor</Badge>;
      case 'OVERDUE':
        return <Badge color="rose">Gecikmiş</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    totalCollected: payments.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0),
    pending: {
      count: payments.filter(p => p.status === 'PENDING').length,
      amount: payments.filter(p => p.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0),
    },
    overdue: {
      count: payments.filter(p => p.status === 'OVERDUE').length,
      amount: payments.filter(p => p.status === 'OVERDUE').reduce((acc, curr) => acc + curr.amount, 0),
    },
  };

  const renderPaymentsTable = () => (
    <div>
      <div className="mb-4 flex justify-end">
        <ExportPaymentsButton payments={payments} />
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Daire No</TableHeaderCell>
            <TableHeaderCell>Tutar</TableHeaderCell>
            <TableHeaderCell>Son Ödeme</TableHeaderCell>
            <TableHeaderCell>Durum</TableHeaderCell>
            <TableHeaderCell>Açıklama</TableHeaderCell>
            <TableHeaderCell>İşlemler</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              </TableCell>
            </TableRow>
          ) : payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="text-center py-4 text-gray-500">
                  {activeTab === 1 ? 'Bekleyen ödeme bulunamadı' : 
                   activeTab === 2 ? 'Gecikmiş ödeme bulunamadı' : 
                   'Ödeme kaydı bulunamadı'}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>{payment.apartmentNo}</TableCell>
                <TableCell>₺{payment.amount.toLocaleString('tr-TR')}</TableCell>
                <TableCell>
                  {format(new Date(payment.dueDate), 'd MMMM yyyy', { locale: tr })}
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell>{payment.description || '-'}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-blue-600 focus:outline-none"
                    onClick={() => handleEditClick(payment)}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

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
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            ₺{stats.totalCollected.toLocaleString('tr-TR')}
          </p>
          <Text className="mt-4">{format(new Date(), 'MMMM yyyy', { locale: tr })}</Text>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <Text>Bekleyen Ödemeler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            ₺{stats.pending.amount.toLocaleString('tr-TR')}
          </p>
          <Text className="mt-4">{stats.pending.count} Daire</Text>
        </Card>

        <Card decoration="top" decorationColor="rose">
          <Text>Gecikmiş Ödemeler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            ₺{stats.overdue.amount.toLocaleString('tr-TR')}
          </p>
          <Text className="mt-4">{stats.overdue.count} Daire</Text>
        </Card>
      </Grid>

      <Card>
        <TabGroup onIndexChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabList variant="solid">
              <Tab>Tüm Ödemeler</Tab>
              <Tab>Bekleyenler</Tab>
              <Tab>Gecikmiş</Tab>
            </TabList>

            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() => setIsBulkModalOpen(true)}
              >
                Toplu Ödeme Ekle
              </button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                onClick={() => setIsAddModalOpen(true)}
              >
                Ödeme Ekle
              </button>
            </div>
          </div>

          <TabPanels>
            <TabPanel>
              <div className="mt-6">
                {renderPaymentsTable()}
              </div>
            </TabPanel>
            <TabPanel>
              <div className="mt-6">
                {renderPaymentsTable()}
              </div>
            </TabPanel>
            <TabPanel>
              <div className="mt-6">
                {renderPaymentsTable()}
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>

      <AddPaymentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchPayments}
      />

      <EditPaymentModal
        isOpen={isEditModalOpen}
        payment={selectedPayment}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPayment(null);
        }}
        onSuccess={fetchPayments}
      />

      <BulkPaymentModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={fetchPayments}
      />
    </div>
  );
}
