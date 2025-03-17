"use client"

import { Card, Text, Badge, Grid } from "@tremor/react"
import { MegaphoneIcon } from "@heroicons/react/24/outline"

const announcements = [
  {
    id: 1,
    title: "Asansör Bakımı",
    content:
      "Yarın saat 10:00-12:00 arasında A Blok asansörü bakım çalışması nedeniyle hizmet veremeyecektir.",
    date: "8 Mart 2024",
    type: "Bakım",
    priority: "Önemli",
  },
  {
    id: 2,
    title: "Mart Ayı Aidat Ödemeleri",
    content:
      "Mart ayı aidat ödemelerinin son ödeme tarihi 10 Mart 2024'tür. Ödemelerinizi zamanında yapmanızı rica ederiz.",
    date: "5 Mart 2024",
    type: "Aidat",
    priority: "Normal",
  },
  {
    id: 3,
    title: "Bahçe Düzenlemesi",
    content:
      "Bu hafta sonu bahçe düzenleme çalışmaları yapılacaktır. Araçlarınızı bahçe alanından çekmenizi rica ederiz.",
    date: "4 Mart 2024",
    type: "Genel",
    priority: "Normal",
  },
]

export default function AnnouncementsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Duyurular</h1>
        <p className="mt-2 text-sm text-gray-700">
          Site sakinlerine yönelik duyuruları takip edin
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Yeni Duyuru
        </button>
      </div>

      <Grid numItemsLg={2} className="gap-6">
        {announcements.map((announcement) => (
          <Card
            key={announcement.id}
            decoration="top"
            decorationColor={
              announcement.priority === "Önemli" ? "rose" : "blue"
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="rounded-lg bg-blue-50 p-2">
                  <MegaphoneIcon
                    className="h-6 w-6 text-blue-600"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <Text>{announcement.title}</Text>
                  <p className="mt-1 text-sm text-gray-500">
                    {announcement.content}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <Badge
                      color={
                        announcement.priority === "Önemli" ? "rose" : "blue"
                      }
                    >
                      {announcement.priority}
                    </Badge>
                    <Badge>{announcement.type}</Badge>
                    <Text className="text-gray-500">{announcement.date}</Text>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Düzenle
              </button>
            </div>
          </Card>
        ))}
      </Grid>
    </div>
  )
}
