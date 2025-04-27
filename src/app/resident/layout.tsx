'use client'

import { ResidentSidebar } from "@/components/resident/Sidebar"
import { Header } from "@/components/layout/Header"
import { useState } from "react"

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      <ResidentSidebar />

      <div className="lg:pl-72">
        <Header />

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
