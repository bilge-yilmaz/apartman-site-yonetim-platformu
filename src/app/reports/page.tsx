'use client'

import { useState, useEffect } from 'react'
import { Card, Title, AreaChart, DonutChart, BarChart } from '@tremor/react'
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ExportButton } from '@/components/reports/ExportButton'

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(selectedBlock && { block: selectedBlock }),
        ...(selectedCategory && { category: selectedCategory }),
      })

      const response = await fetch(`/api/reports?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateRange, selectedBlock, selectedCategory])

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
        <p className="text-gray-500">Veri yüklenirken bir hata oluştu.</p>
      </div>
    )
  }

  const blocks = Array.from(
    new Set(data.monthlyData[0].blockAnalysis.map((item: any) => item.block))
  )

  const categories = Array.from(
    new Set(
      data.monthlyData[0].maintenanceCategories.map((item: any) => item.category)
    )
  )

  return (
    <div className="space-y-6 p-6">
      {/* Filtreler */}
      <div className="flex flex-wrap gap-4">
        <select
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="">Tüm Bloklar</option>
          {blocks.map((block: string) => (
            <option key={block} value={block}>
              {block} Blok
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((category: string) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateRange.start}
          onChange={(e) =>
            setDateRange((prev) => ({ ...prev, start: e.target.value }))
          }
          className="rounded-lg border border-gray-300 px-3 py-2"
        />

        <input
          type="date"
          value={dateRange.end}
          onChange={(e) =>
            setDateRange((prev) => ({ ...prev, end: e.target.value }))
          }
          className="rounded-lg border border-gray-300 px-3 py-2"
        />

        <div className="flex gap-2">
          <ExportButton data={data} type="excel" />
          <ExportButton data={data} type="pdf" />
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Title>Toplam Gelir</Title>
          <div className="mt-4">
            <div className="text-2xl font-bold text-blue-600">
              ₺{data.totalStats.income.toLocaleString('tr-TR')}
            </div>
            <div
              className={`mt-2 text-sm ${
                data.changes.income >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {data.changes.income >= 0 ? '↑' : '↓'} %
              {Math.abs(data.changes.income).toFixed(1)}
            </div>
          </div>
        </Card>

        <Card>
          <Title>Toplam Gider</Title>
          <div className="mt-4">
            <div className="text-2xl font-bold text-red-600">
              ₺{data.totalStats.expense.toLocaleString('tr-TR')}
            </div>
            <div
              className={`mt-2 text-sm ${
                data.changes.expense <= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {data.changes.expense >= 0 ? '↑' : '↓'} %
              {Math.abs(data.changes.expense).toFixed(1)}
            </div>
          </div>
        </Card>

        <Card>
          <Title>Net Kar</Title>
          <div className="mt-4">
            <div className="text-2xl font-bold text-green-600">
              ₺{data.totalStats.profit.toLocaleString('tr-TR')}
            </div>
            <div
              className={`mt-2 text-sm ${
                data.changes.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {data.changes.profit >= 0 ? '↑' : '↓'} %
              {Math.abs(data.changes.profit).toFixed(1)}
            </div>
          </div>
        </Card>

        <Card>
          <Title>Bakım Talepleri</Title>
          <div className="mt-4">
            <div className="text-2xl font-bold">
              {data.totalStats.maintenance.completed} /{' '}
              {data.totalStats.maintenance.total}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              %
              {(
                (data.totalStats.maintenance.completed /
                  data.totalStats.maintenance.total) *
                100
              ).toFixed(1)}{' '}
              Tamamlanma
            </div>
          </div>
        </Card>
      </div>

      {/* Trend Analizi ve Tahminler */}
      <Card>
        <Title>Gelir/Gider Trendi ve Tahminler</Title>
        <div className="mt-4">
          <AreaChart
            data={[
              ...data.monthlyData,
              ...Array.from({ length: 3 }, (_, i) => ({
                date: format(
                  addMonths(new Date(), i + 1),
                  'MMM yy',
                  { locale: tr }
                ),
                totalIncome: data.predictions.income[i],
                totalExpense: data.predictions.expense[i],
                netProfit: data.predictions.profit[i],
                isPrediction: true,
              })),
            ]}
            index="date"
            categories={['totalIncome', 'totalExpense', 'netProfit']}
            colors={['blue', 'red', 'green']}
            valueFormatter={(value) =>
              `₺${value.toLocaleString('tr-TR')}`
            }
            className="h-72"
          />
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-blue-600">Gelir Trendi</h3>
              <p className="text-sm text-gray-500">
                {data.trendAnalysis.income.direction === 'up'
                  ? '↑ Yükseliş'
                  : data.trendAnalysis.income.direction === 'down'
                  ? '↓ Düşüş'
                  : '→ Stabil'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-red-600">Gider Trendi</h3>
              <p className="text-sm text-gray-500">
                {data.trendAnalysis.expense.direction === 'up'
                  ? '↑ Yükseliş'
                  : data.trendAnalysis.expense.direction === 'down'
                  ? '↓ Düşüş'
                  : '→ Stabil'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-green-600">Kar Trendi</h3>
              <p className="text-sm text-gray-500">
                {data.trendAnalysis.profit.direction === 'up'
                  ? '↑ Yükseliş'
                  : data.trendAnalysis.profit.direction === 'down'
                  ? '↓ Düşüş'
                  : '→ Stabil'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Karşılaştırmalı Analizler */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Title>Yıllık Karşılaştırma</Title>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">Gelir</h3>
              <div
                className={`text-lg ${
                  data.comparativeAnalysis.yearOverYear.income >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.comparativeAnalysis.yearOverYear.income >= 0 ? '↑' : '↓'} %
                {Math.abs(
                  data.comparativeAnalysis.yearOverYear.income
                ).toFixed(1)}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Gider</h3>
              <div
                className={`text-lg ${
                  data.comparativeAnalysis.yearOverYear.expense <= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.comparativeAnalysis.yearOverYear.expense >= 0 ? '↑' : '↓'} %
                {Math.abs(
                  data.comparativeAnalysis.yearOverYear.expense
                ).toFixed(1)}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Kar</h3>
              <div
                className={`text-lg ${
                  data.comparativeAnalysis.yearOverYear.profit >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.comparativeAnalysis.yearOverYear.profit >= 0 ? '↑' : '↓'} %
                {Math.abs(
                  data.comparativeAnalysis.yearOverYear.profit
                ).toFixed(1)}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <Title>Çeyreklik Karşılaştırma</Title>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">Gelir</h3>
              <div
                className={`text-lg ${
                  data.comparativeAnalysis.quarterOverQuarter.income >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.comparativeAnalysis.quarterOverQuarter.income >= 0
                  ? '↑'
                  : '↓'}{' '}
                %
                {Math.abs(
                  data.comparativeAnalysis.quarterOverQuarter.income
                ).toFixed(1)}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Gider</h3>
              <div
                className={`text-lg ${
                  data.comparativeAnalysis.quarterOverQuarter.expense <= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.comparativeAnalysis.quarterOverQuarter.expense >= 0
                  ? '↑'
                  : '↓'}{' '}
                %
                {Math.abs(
                  data.comparativeAnalysis.quarterOverQuarter.expense
                ).toFixed(1)}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Kar</h3>
              <div
                className={`text-lg ${
                  data.comparativeAnalysis.quarterOverQuarter.profit >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.comparativeAnalysis.quarterOverQuarter.profit >= 0
                  ? '↑'
                  : '↓'}{' '}
                %
                {Math.abs(
                  data.comparativeAnalysis.quarterOverQuarter.profit
                ).toFixed(1)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Title>Gider Kategorileri</Title>
          <DonutChart
            data={data.monthlyData[0].expenseCategories}
            category="amount"
            index="name"
            valueFormatter={(value) =>
              `₺${value.toLocaleString('tr-TR')}`
            }
            className="mt-6"
          />
        </Card>

        <Card>
          <Title>Blok Bazlı Aidat Analizi</Title>
          <BarChart
            data={data.monthlyData[0].blockAnalysis}
            index="block"
            categories={['amount']}
            colors={['blue']}
            valueFormatter={(value) =>
              `₺${value.toLocaleString('tr-TR')}`
            }
            className="mt-6"
          />
        </Card>
      </div>
    </div>
  )
}
