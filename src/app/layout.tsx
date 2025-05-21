import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Site Yönetim Platformu",
  description: "Modern site yönetim sistemi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth sayfalarında sidebar ve header gösterme
  // Not: Bu client component olmadığı için usePathname burada çalışmaz
  // Bunun yerine auth sayfaları için ayrı bir layout kullanıyoruz (auth/layout.tsx)
  
  return (
    <html lang="tr" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
          {children}
      </body>
    </html>
  )
}
