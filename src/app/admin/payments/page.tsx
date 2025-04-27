'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Button } from '@tremor/react'

interface Payment {
  id: string
  resident: string
  apartment: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
  paymentDate?: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  useEffect(() => {
    // Örnek veri (gerçek API entegrasyonu yapılabilir)
    const loadDummyData = () => {
      const dummyPayments: Payment[] = [
        {
          id: '1',
          resident: 'Ahmet Yılmaz',
          apartment: 'A-101',
          amount: 1200,
          dueDate: '2025-04-15',
          status: 'pending'
        },
        {
          id: '2',
          resident: 'Ayşe Demir',
          apartment: 'A-102',
          amount: 1200,
          dueDate: '2025-04-15',
          status: 'pending'
        },
        {
          id: '3',
          resident: 'Mehmet Kaya',
          apartment: 'B-201',
          amount: 1500,
          dueDate: '2025-04-15',
          status: 'pending'
        },
        {
          id: '4',
          resident: 'Fatma Şahin',
          apartment: 'B-202',
          amount: 1500,
          dueDate: '2025-04-15',
          status: 'overdue'
        },
        {
          id: '5',
          resident: 'Ali Öztürk',
          apartment: 'C-301',
          amount: 1800,
          dueDate: '2025-04-15',
          status: 'pending'
        }
      ]
      
      setPayments(dummyPayments)
      setLoading(false)
    }

    loadDummyData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  // Toplam istatistikler
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const paidAmount = payments
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const pendingAmount = payments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const overdueAmount = payments
    .filter(payment => payment.status === 'overdue')
    .reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Aidat Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tüm aidat ödemelerini görüntüleyin ve yönetin.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button color="blue" onClick={() => setIsAddModalOpen(true)}>Yeni Aidat Ekle</Button>
          <Button color="gray" onClick={() => setIsBulkModalOpen(true)}>Toplu İşlem</Button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Text>Toplam Aidat</Text>
          <p className="mt-2 text-2xl font-semibold">
            ₺{totalAmount.toLocaleString('tr-TR')}
          </p>
        </Card>
        <Card>
          <Text>Ödenen</Text>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            ₺{paidAmount.toLocaleString('tr-TR')}
          </p>
        </Card>
        <Card>
          <Text>Bekleyen</Text>
          <p className="mt-2 text-2xl font-semibold text-yellow-600">
            ₺{pendingAmount.toLocaleString('tr-TR')}
          </p>
        </Card>
        <Card>
          <Text>Gecikmiş</Text>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            ₺{overdueAmount.toLocaleString('tr-TR')}
          </p>
        </Card>
      </div>

      {/* Ödemeler Tablosu */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Site Sakini
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Daire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tutar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Son Ödeme Tarihi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ödeme Tarihi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Durum
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{payment.resident}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{payment.apartment}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">₺{payment.amount.toLocaleString('tr-TR')}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {new Date(payment.dueDate).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {payment.paymentDate 
                        ? new Date(payment.paymentDate).toLocaleDateString('tr-TR')
                        : '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      payment.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.status === 'paid' 
                        ? 'Ödendi' 
                        : payment.status === 'pending'
                          ? 'Bekliyor'
                          : 'Gecikmiş'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      Düzenle
                    </button>
                    {payment.status !== 'paid' && (
                      <>
                        <span className="mx-2 text-gray-300">|</span>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => {
                            // Ödeme işlemi
                            const updatedPayments = payments.map(p => {
                              if (p.id === payment.id) {
                                return {
                                  ...p,
                                  status: 'paid' as const,
                                  paymentDate: new Date().toISOString().split('T')[0]
                                };
                              }
                              return p;
                            });
                            setPayments(updatedPayments);
                            alert(`${payment.resident} için ödeme başarıyla kaydedildi.`);
                          }}
                        >
                          Öde
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Yeni Aidat Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Yeni Aidat Ekle</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsAddModalOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newPayment: Payment = {
                id: (payments.length + 1).toString(),
                resident: formData.get('resident') as string,
                apartment: formData.get('apartment') as string,
                amount: parseFloat(formData.get('amount') as string),
                dueDate: formData.get('dueDate') as string,
                status: 'pending'
              };
              
              setPayments([...payments, newPayment]);
              setIsAddModalOpen(false);
              alert('Yeni aidat başarıyla eklendi.');
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Site Sakini</label>
                <input 
                  type="text" 
                  name="resident" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire</label>
                <input 
                  type="text" 
                  name="apartment" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tutar (TL)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Son Ödeme Tarihi</label>
                <input 
                  type="date" 
                  name="dueDate" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toplu İşlem Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Toplu Aidat İşlemi</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsBulkModalOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const amount = parseFloat(formData.get('amount') as string);
              const dueDate = formData.get('dueDate') as string;
              const action = formData.get('action') as string;
              
              // Örnek olarak tüm bekleyen ödemeleri güncelleme
              if (action === 'update') {
                const updatedPayments = payments.map(payment => {
                  if (payment.status === 'pending') {
                    return {
                      ...payment,
                      amount: amount,
                      dueDate: dueDate
                    };
                  }
                  return payment;
                });
                setPayments(updatedPayments);
                alert('Bekleyen aidatlar toplu olarak güncellendi.');
              } else if (action === 'add') {
                // Tüm dairelere yeni aidat ekleme örneği
                const apartments = [...new Set(payments.map(p => p.apartment))];
                const residents: Record<string, string> = {};
                
                // Her daire için son sakini bul
                payments.forEach(p => {
                  residents[p.apartment] = p.resident;
                });
                
                const newPayments: Payment[] = apartments.map((apartment, index) => ({
                  id: (payments.length + index + 1).toString(),
                  resident: residents[apartment],
                  apartment: apartment,
                  amount: amount,
                  dueDate: dueDate,
                  status: 'pending'
                }));
                
                setPayments([...payments, ...newPayments]);
                alert(`${apartments.length} daire için yeni aidat başarıyla eklendi.`);
              }
              
              setIsBulkModalOpen(false);
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">İşlem Türü</label>
                <select 
                  name="action" 
                  required
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="add">Tüm Dairelere Yeni Aidat Ekle</option>
                  <option value="update">Bekleyen Aidatları Güncelle</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tutar (TL)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Son Ödeme Tarihi</label>
                <input 
                  type="date" 
                  name="dueDate" 
                  required 
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setIsBulkModalOpen(false)}>İptal</Button>
                <Button color="blue" type="submit">Uygula</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aidat Düzenleme Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Aidat Düzenle</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setSelectedPayment(null)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedPayment: Payment = {
                ...selectedPayment,
                resident: formData.get('resident') as string,
                apartment: formData.get('apartment') as string,
                amount: parseFloat(formData.get('amount') as string),
                dueDate: formData.get('dueDate') as string,
                status: formData.get('status') as 'paid' | 'pending' | 'overdue',
                paymentDate: formData.get('status') === 'paid' ? 
                  (selectedPayment.paymentDate || new Date().toISOString().split('T')[0]) : 
                  undefined
              };
              
              const updatedPayments = payments.map(p => 
                p.id === selectedPayment.id ? updatedPayment : p
              );
              
              setPayments(updatedPayments);
              setSelectedPayment(null);
              alert('Aidat bilgileri başarıyla güncellendi.');
            }}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Site Sakini</label>
                <input 
                  type="text" 
                  name="resident" 
                  required 
                  defaultValue={selectedPayment.resident}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Daire</label>
                <input 
                  type="text" 
                  name="apartment" 
                  required 
                  defaultValue={selectedPayment.apartment}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Tutar (TL)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1"
                  defaultValue={selectedPayment.amount}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Son Ödeme Tarihi</label>
                <input 
                  type="date" 
                  name="dueDate" 
                  required 
                  defaultValue={selectedPayment.dueDate}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Durum</label>
                <select 
                  name="status" 
                  defaultValue={selectedPayment.status}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="paid">Ödendi</option>
                  <option value="pending">Bekliyor</option>
                  <option value="overdue">Gecikmiş</option>
                </select>
              </div>
              {selectedPayment.status === 'paid' && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Ödeme Tarihi</label>
                  <input 
                    type="date" 
                    name="paymentDate" 
                    readOnly
                    disabled
                    defaultValue={selectedPayment.paymentDate}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 p-2"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setSelectedPayment(null)}>İptal</Button>
                <Button color="blue" type="submit">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
