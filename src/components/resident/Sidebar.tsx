"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  HomeIcon,
  BanknotesIcon,
  MegaphoneIcon,
  WrenchIcon,
  CalendarIcon,
  UserIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline"

// Resident menü öğeleri
const residentNavigation = [
  { name: "Sakin Paneli", href: "/resident/dashboard", icon: HomeIcon },
  { name: "Aidat & Ödemeler", href: "/resident/payments", icon: BanknotesIcon },
  { name: "Duyurular", href: "/resident/announcements", icon: MegaphoneIcon },
  { name: "Bakım & Arıza", href: "/resident/maintenance", icon: WrenchIcon },
  { name: "Rezervasyonlar", href: "/resident/reservations", icon: CalendarIcon },
  { name: "Profil", href: "/resident/profile", icon: UserIcon },
  { name: "Ayarlar", href: "/resident/settings", icon: Cog6ToothIcon },
]

export function ResidentSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: "Kullanıcı",
    apartment: "A-101",
    avatar: "/avatars/default.png"
  })
  const pathname = usePathname()

  useEffect(() => {
    // Kullanıcı bilgilerini al (gerçek uygulamada API'den çekilecek)
    const fetchUserInfo = async () => {
      try {
        // Örnek veri
        setUserInfo({
          name: "Ahmet Yılmaz",
          apartment: "B-204",
          avatar: "/avatars/default.png"
        })
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    fetchUserInfo()
  }, [])

  return (
    <>
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex transform transition-all duration-300 ease-in-out" 
             style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
               onClick={() => setSidebarOpen(false)}></div>
          
          {/* Sidebar panel */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Menüyü kapat</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
            {/* Logo & User info */}
            <div className="flex flex-shrink-0 items-center px-4">
              <div className="text-xl font-semibold text-blue-600">Site Yönetimi</div>
            </div>
            <div className="mt-5 flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden">
                <img src={userInfo.avatar} alt={userInfo.name} className="h-full w-full object-cover" />
              </div>
              <div className="mt-3 text-center">
                <p className="text-base font-medium text-gray-800">{userInfo.name}</p>
                <p className="text-sm text-gray-500">Daire: {userInfo.apartment}</p>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="mt-8 flex-grow">
              <nav className="px-2">
                <div className="space-y-1">
                  {residentNavigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (pathname.startsWith(item.href) && item.href !== "/")
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-blue-600",
                          "group flex items-center rounded-md px-3 py-2 text-base font-medium"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600",
                            "mr-4 h-6 w-6 flex-shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </nav>
            </div>
            
            {/* Footer */}
            <div className="mt-auto border-t border-gray-200 pt-4 px-4">
              <div className="flex items-center justify-between">
                <button className="text-sm text-gray-500 hover:text-blue-600">
                  Çıkış Yap
                </button>
                <span className="text-xs text-gray-400">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          {/* Logo & User info */}
          <div className="flex h-16 flex-shrink-0 items-center border-b border-gray-200 px-4">
            <div className="text-xl font-semibold text-blue-600">Site Yönetimi</div>
          </div>
          <div className="mt-5 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden">
              <img src={userInfo.avatar} alt={userInfo.name} className="h-full w-full object-cover" />
            </div>
            <div className="mt-3 text-center">
              <p className="text-base font-medium text-gray-800">{userInfo.name}</p>
              <p className="text-sm text-gray-500">Daire: {userInfo.apartment}</p>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="mt-8 flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {residentNavigation.map((item) => {
                const isActive = pathname === item.href || 
                  (pathname.startsWith(item.href) && item.href !== "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600",
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600",
                        "mr-3 h-5 w-5 flex-shrink-0"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* Footer */}
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between w-full">
              <button className="text-sm text-gray-500 hover:text-blue-600">
                Çıkış Yap
              </button>
              <span className="text-xs text-gray-400">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow lg:hidden">
        <button
          type="button"
          className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Menüyü aç</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex flex-1 justify-between px-4">
          <div className="flex flex-1 items-center">
            <div className="text-lg font-semibold text-blue-600">Site Yönetimi</div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="relative ml-3">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                    <img src={userInfo.avatar} alt={userInfo.name} className="h-full w-full object-cover" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">{userInfo.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
