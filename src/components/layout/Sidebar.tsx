"use client"

import { cn } from "@/lib/utils"
import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HomeIcon,
  BanknotesIcon,
  MegaphoneIcon,
  WrenchIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline"

// Admin ve Manager menü öğeleri
const adminNavigation = [
  { name: "Yönetim Paneli", href: "/admin/dashboard", icon: HomeIcon },
  { name: "Site Sakinleri", href: "/admin/residents", icon: UserGroupIcon },
  { name: "Aidat Yönetimi", href: "/admin/payments", icon: BanknotesIcon },
  { name: "Duyurular", href: "/admin/announcements", icon: MegaphoneIcon },
  { name: "Bakım Talepleri", href: "/admin/maintenance", icon: WrenchIcon },
  { name: "Rezervasyonlar", href: "/admin/reservations", icon: CalendarIcon },
  { name: "Raporlar", href: "/admin/reports", icon: ChartBarIcon },
  { name: "Ayarlar", href: "/admin/settings", icon: Cog6ToothIcon },
]

// Resident menü öğeleri
const residentNavigation = [
  { name: "Sakin Paneli", href: "/resident/dashboard", icon: HomeIcon },
  { name: "Aidat & Ödemeler", href: "/resident/payments", icon: BanknotesIcon },
  { name: "Duyurular", href: "/resident/announcements", icon: MegaphoneIcon },
  { name: "Bakım & Arıza", href: "/resident/maintenance", icon: WrenchIcon },
  { name: "Rezervasyonlar", href: "/resident/reservations", icon: CalendarIcon },
]

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  // Başlangıçta boş bir navigasyon menüsü ile başla
  const [navigation, setNavigation] = useState<any[]>([])
  const pathname = usePathname()

  useEffect(() => {
    // Kullanıcı rolünü al
    const fetchUserRole = async () => {
      try {
        // Cookie'den token'ı al
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        if (token) {
          try {
            // Token'ı decode et
            const base64Payload = token.split('.')[1];
            if (base64Payload) {
              // Base64 decode işlemi
              const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              
              const payload = JSON.parse(jsonPayload);
              const role = payload.role;
              setUserRole(role);
              
              console.log('Kullanıcı rolü:', role);
              
              // Kullanıcı rolüne göre menü öğelerini ayarla
              if (role === "ADMIN" || role === "MANAGER") {
                // Admin ve Manager için admin menülerini göster
                console.log('Admin/Manager navigasyonu yükleniyor');
                setNavigation(adminNavigation);
              } else if (role === "RESIDENT") {
                // Resident için resident menülerini göster
                console.log('Resident navigasyonu yükleniyor');
                setNavigation(residentNavigation);
              } else {
                // Bilinmeyen rol için varsayılan olarak admin menüsünü göster
                console.warn('Bilinmeyen rol:', role, 'varsayılan olarak admin menüsü gösteriliyor');
                setNavigation(adminNavigation);
              }
            } else {
              // Token formatı geçersiz, varsayılan olarak admin menüsünü göster
              console.error('Invalid token format, varsayılan olarak admin menüsü gösteriliyor');
              setNavigation(adminNavigation);
            }
          } catch (parseError) {
            // Token parse hatası, varsayılan olarak admin menüsünü göster
            console.error('Error parsing token:', parseError, 'varsayılan olarak admin menüsü gösteriliyor');
            setNavigation(adminNavigation);
          }
        } else {
          // Token yok, varsayılan olarak admin menüsünü göster
          console.error('Token bulunamadı, varsayılan olarak admin menüsü gösteriliyor');
          setNavigation(adminNavigation);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Hata durumunda varsayılan menüyü göster
        setNavigation(adminNavigation);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [])

  // Yükleme durumunda veya navigasyon boşsa basit bir yükleme göstergesi göster
  if (isLoading) {
    return (
      <>
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="lg:hidden">
          <div className="h-16 w-16 animate-pulse rounded bg-gray-200" />
        </div>
      </>
    )
  }

  return (
    <>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <span className="text-xl font-semibold">Site Yönetimi</span>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => {
                            const isActive = pathname === item.href || 
                              (pathname.startsWith(item.href) && item.href !== "/")
                            return (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className={cn(
                                    isActive
                                      ? "bg-gray-50 text-blue-600"
                                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50",
                                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                  )}
                                >
                                  <item.icon
                                    className={cn(
                                      isActive
                                        ? "text-blue-600"
                                        : "text-gray-400 group-hover:text-blue-600",
                                      "h-6 w-6 shrink-0"
                                    )}
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-xl font-semibold">Site Yönetimi</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (pathname.startsWith(item.href) && item.href !== "/")
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            isActive
                              ? "bg-gray-50 text-blue-600"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50",
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive
                                ? "text-blue-600"
                                : "text-gray-400 group-hover:text-blue-600",
                              "h-6 w-6 shrink-0"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          Site Yönetimi
        </div>
      </div>
    </>
  )
}
