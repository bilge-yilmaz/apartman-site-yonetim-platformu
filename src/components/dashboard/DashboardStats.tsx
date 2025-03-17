"use client"

import { Card, Grid, Metric, Text } from "@tremor/react"
import {
  BanknotesIcon,
  HomeIcon,
  ClockIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline"

const stats = [
  {
    name: "Toplam Tahsilat",
    value: "₺75.400",
    description: "Mart ayı toplam tahsilat",
    icon: BanknotesIcon,
    color: "emerald",
  },
  {
    name: "Aktif Daire",
    value: "42",
    description: "Toplam daire sayısı",
    icon: HomeIcon,
    color: "blue",
  },
  {
    name: "Bekleyen Ödeme",
    value: "8",
    description: "Gecikmiş ödemeler",
    icon: ClockIcon,
    color: "amber",
  },
  {
    name: "Aktif Arıza",
    value: "3",
    description: "Bekleyen arıza bildirimi",
    icon: WrenchIcon,
    color: "rose",
  },
]

export function DashboardStats() {
  return (
    <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <Card key={stat.name} decoration="top" decorationColor={stat.color}>
            <div className="flex items-center justify-between">
              <div>
                <Text>{stat.name}</Text>
                <Metric>{stat.value}</Metric>
                <Text className="mt-2 text-gray-500">{stat.description}</Text>
              </div>
              <Icon
                className={`h-12 w-12 text-${stat.color}-500`}
                aria-hidden="true"
              />
            </div>
          </Card>
        )
      })}
    </Grid>
  )
}
