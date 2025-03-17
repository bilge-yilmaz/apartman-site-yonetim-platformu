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
  AreaChart,
  BarChart,
  DonutChart,
  DateRangePicker,
  Select,
  SelectItem,
  Title,
} from "@tremor/react"
import { tr } from "date-fns/locale"

const monthlyData = [
  {
    date: "Oca 24",
    "Toplam Gelir": 42000,
    "Toplam Gider": 38500,
    "Net Kar": 3500,
  },
  {
    date: "Şub 24",
    "Toplam Gelir": 44500,
    "Toplam Gider": 39000,
    "Net Kar": 5500,
  },
  {
    date: "Mar 24",
    "Toplam Gelir": 75400,
    "Toplam Gider": 41000,
    "Net Kar": 34400,
  },
]

const expenseCategories = [
  {
    name: "Personel",
    tutar: 15000,
  },
  {
    name: "Elektrik",
    tutar: 8500,
  },
  {
    name: "Su",
    tutar: 6500,
  },
  {
    name: "Doğalgaz",
    tutar: 5500,
  },
  {
    name: "Temizlik",
    tutar: 3500,
  },
  {
    name: "Bakım",
    tutar: 2000,
  },
]

const blockData = [
  {
    blok: "A Blok",
    tutar: 25400,
  },
  {
    blok: "B Blok",
    tutar: 28000,
  },
  {
    blok: "C Blok",
    tutar: 22000,
  },
]

const valueFormatter = (number: number) =>
  `₺${number.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Raporlar</h1>
        <p className="mt-2 text-sm text-gray-700">
          Finansal raporları ve istatistikleri görüntüleyin
        </p>
      </div>

      <div className="flex items-center justify-between">
        <DateRangePicker
          className="max-w-md"
          enableSelect={false}
          locale={tr}
          placeholder="Tarih aralığı seçin"
        />
        <Select className="max-w-xs" defaultValue="1">
          <SelectItem value="1">Aylık Rapor</SelectItem>
          <SelectItem value="2">3 Aylık Rapor</SelectItem>
          <SelectItem value="3">Yıllık Rapor</SelectItem>
        </Select>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        <Card decoration="top" decorationColor="emerald">
          <Text>Toplam Gelir</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">₺92.600</p>
          <Text className="mt-4">%5.1 artış</Text>
        </Card>

        <Card decoration="top" decorationColor="rose">
          <Text>Toplam Gider</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">₺71.200</p>
          <Text className="mt-4">%4.5 artış</Text>
        </Card>

        <Card decoration="top" decorationColor="blue">
          <Text>Net Kar</Text>
          <p className="mt-1 text-2xl font-semibold text-gray-900">₺21.400</p>
          <Text className="mt-4">%6.9 artış</Text>
        </Card>
      </Grid>

      <TabGroup>
        <TabList variant="solid">
          <Tab>Genel Bakış</Tab>
          <Tab>Gider Analizi</Tab>
          <Tab>Blok Analizi</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <div className="mt-6">
              <Card>
                <Title>Aylık Gelir/Gider Analizi</Title>
                <Title className="text-3xl font-bold">₺75.400</Title>
                <AreaChart
                  className="h-72 mt-4"
                  data={monthlyData}
                  index="date"
                  categories={["Toplam Gelir", "Toplam Gider", "Net Kar"]}
                  colors={["emerald", "rose", "blue"]}
                  valueFormatter={valueFormatter}
                  showLegend
                  showGridLines
                  showYAxis
                  showXAxis
                  startEndOnly={false}
                  minValue={0}
                  maxValue={80000}
                  yAxisWidth={80}
                />
              </Card>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="mt-6">
              <Card>
                <Text>Gider Kategorileri</Text>
                <DonutChart
                  className="mt-4 h-80"
                  data={expenseCategories}
                  category="tutar"
                  index="name"
                  valueFormatter={valueFormatter}
                  colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
                />
              </Card>
            </div>
          </TabPanel>

          <TabPanel>
            <div className="mt-6">
              <Card>
                <Text>Blok Bazlı Aidat Analizi</Text>
                <BarChart
                  className="mt-4 h-80"
                  data={blockData}
                  index="blok"
                  categories={["tutar"]}
                  colors={["blue"]}
                  valueFormatter={valueFormatter}
                />
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
