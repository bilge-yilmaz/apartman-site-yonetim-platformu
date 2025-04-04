'use client'

import { useState, useEffect } from 'react'
import { Card, Text, Grid, Tab, TabGroup, TabList, TabPanel, TabPanels, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Badge } from '@tremor/react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CreateMaintenanceModal } from '@/components/maintenance/CreateMaintenanceModal'
import { useRouter } from 'next/navigation'

interface MaintenanceRequest {
  _id: string
  apartmentNo: string
  title: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'ELEVATOR' | 'OTHER'
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  startDate?: string
  completionDate?: string
  createdAt: string
  updatedAt: string
}

export default function MaintenancePage() {
  const router = useRouter()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const status = activeTab === 1 ? 'PENDING' : 
                    activeTab === 2 ? 'IN_PROGRESS' : 
                    activeTab === 3 ? 'COMPLETED' : ''
      const response = await fetch(`/api/maintenance${status ? `?status=${status}` : ''}`)
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching maintenance requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge color="amber">Bekliyor</Badge>
      case 'IN_PROGRESS':
        return <Badge color="blue">Devam Ediyor</Badge>
      case 'COMPLETED':
        return <Badge color="emerald">Tamamlandı</Badge>
      case 'CANCELLED':
        return <Badge color="rose">İptal Edildi</Badge>
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge color="gray">Düşük</Badge>
      case 'MEDIUM':
        return <Badge color="blue">Orta</Badge>
      case 'HIGH':
        return <Badge color="amber">Yüksek</Badge>
      case 'URGENT':
        return <Badge color="rose">Acil</Badge>
      default:
        return null
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PLUMBING':
        return 'Su/Tesisat'
      case 'ELECTRICAL':
        return 'Elektrik'
      case 'HVAC':
        return 'Isıtma/Soğutma'
      case 'STRUCTURAL':
        return 'Yapısal'
      case 'ELEVATOR':
        return 'Asansör'
      case 'OTHER':
        return 'Diğer'
      default:
        return category
    }
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    completed: requests.filter(r => r.status === 'COMPLETED').length,
    urgent: requests.filter(r => r.priority === 'URGENT').length,
  }

  const handleRowClick = (id: string) => {
    router.push(`/maintenance/${id}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bakım & Onarım</h1>
        <p className="mt-2 text-sm text-gray-700">
          Bakım ve onarım taleplerini takip edin ve yönetin
        </p>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        <Card decoration="top" decorationColor="blue">
          <Text>Toplam Talepler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.total}
          </p>
          <Text className="mt-4">Son 30 gün</Text>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <Text>Bekleyen Talepler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.pending}
          </p>
          <Text className="mt-4">{stats.inProgress} talep devam ediyor</Text>
        </Card>

        <Card decoration="top" decorationColor="rose">
          <Text>Acil Talepler</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.urgent}
          </p>
          <Text className="mt-4">{stats.completed} talep tamamlandı</Text>
        </Card>
      </Grid>

      <Card>
        <TabGroup onIndexChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabList variant="solid">
              <Tab>Tüm Talepler</Tab>
              <Tab>Bekleyenler</Tab>
              <Tab>Devam Edenler</Tab>
              <Tab>Tamamlananlar</Tab>
            </TabList>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Yeni Talep
            </button>
          </div>

          <TabPanels>
            {[0, 1, 2, 3].map((tabIndex) => (
              <TabPanel key={tabIndex}>
                <div className="mt-6">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Daire No</TableHeaderCell>
                        <TableHeaderCell>Başlık</TableHeaderCell>
                        <TableHeaderCell>Kategori</TableHeaderCell>
                        <TableHeaderCell>Öncelik</TableHeaderCell>
                        <TableHeaderCell>Durum</TableHeaderCell>
                        <TableHeaderCell>Oluşturulma</TableHeaderCell>
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
                      ) : requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="text-center py-4 text-gray-500">
                              {tabIndex === 1 ? 'Bekleyen bakım talebi bulunamadı' :
                               tabIndex === 2 ? 'Devam eden bakım talebi bulunamadı' :
                               tabIndex === 3 ? 'Tamamlanan bakım talebi bulunamadı' :
                               'Bakım talebi bulunamadı'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        requests.map((request) => (
                          <TableRow 
                            key={request._id}
                            onClick={() => handleRowClick(request._id)}
                            className="cursor-pointer hover:bg-gray-50"
                          >
                            <TableCell>{request.apartmentNo}</TableCell>
                            <TableCell>{request.title}</TableCell>
                            <TableCell>{getCategoryLabel(request.category)}</TableCell>
                            <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              {format(new Date(request.createdAt), 'd MMMM yyyy', { locale: tr })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </Card>

      <CreateMaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchRequests()
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
