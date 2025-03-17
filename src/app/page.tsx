"use client"

import { Card, Text, Metric, AreaChart } from "@tremor/react"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { AidatTable } from "@/components/dashboard/AidatTable"

const chartdata = [
  {
    date: "Oca 24",
    Tahsilat: 42000,
    Gider: 38500,
  },
  {
    date: "Şub 24",
    Tahsilat: 44500,
    Gider: 39000,
  },
  {
    date: "Mar 24",
    Tahsilat: 75400,
    Gider: 41000,
  },
]

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Hoş Geldiniz</h1>
        <p className="mt-2 text-sm text-gray-700">
          Site yönetim panelinde güncel durumu takip edebilirsiniz.
        </p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card decoration="top" decorationColor="emerald">
          <Text>Aylık Gelir/Gider Analizi</Text>
          <Metric>₺75.400</Metric>
          <AreaChart
            className="mt-4 h-72"
            data={chartdata}
            index="date"
            categories={["Tahsilat", "Gider"]}
            colors={["emerald", "red"]}
            valueFormatter={(number) =>
              `₺${number.toLocaleString("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
            }
            showLegend
            showGridLines
            showYAxis
            showXAxis
            startEndOnly={false}
            minValue={35000}
            maxValue={80000}
            yAxisWidth={80}
          />
        </Card>

        <Card decoration="top" decorationColor="blue">
          <div className="flex items-center justify-between">
            <div>
              <Text>Son Ödemeler</Text>
              <p className="mt-1 text-sm text-gray-500">
                Son yapılan aidat ödemeleri
              </p>
            </div>
            <button
              type="button"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Ödeme Ekle
            </button>
          </div>
          <div className="mt-6">
            <AidatTable />
          </div>
        </Card>
      </div>
    </div>
  )
}
