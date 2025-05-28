"use client"

import { Fragment, useEffect, useState } from "react"
import { Menu, Transition } from "@headlessui/react"
import { ChevronDownIcon, CogIcon, UserIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import NotificationSender from "@/components/notifications/NotificationSender"
import NotificationCenter from "@/components/notifications/NotificationCenter"

// Rol bazlı navigasyon menüleri
const getNavigationByRole = (role: string) => {
  const baseNavigation = [
    { name: "Profilim", href: "/profile", icon: UserIcon },
    { name: "Çıkış", href: "/auth/signout", icon: null },
  ]

  switch (role) {
    case 'ADMIN':
      return [
        { name: "Admin Paneli", href: "/admin/dashboard", icon: ShieldCheckIcon },
        { name: "Sistem Ayarları", href: "/admin/settings", icon: CogIcon },
        { name: "Kullanıcı Yönetimi", href: "/admin/users", icon: UserIcon },
        ...baseNavigation
      ]
    
    case 'MANAGER':
      return [
        { name: "Yönetici Paneli", href: "/admin/dashboard", icon: ShieldCheckIcon },
        { name: "Site Ayarları", href: "/settings", icon: CogIcon },
        { name: "Sakin Yönetimi", href: "/residents", icon: UserIcon },
        ...baseNavigation
      ]
    
    case 'RESIDENT':
      return [
        { name: "Dashboard", href: "/resident/dashboard", icon: null },
        { name: "Ayarlar", href: "/settings", icon: CogIcon },
        ...baseNavigation
      ]
    
    default:
      return baseNavigation
  }
}

// Rol bazlı renk teması
const getRoleTheme = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return {
        badgeColor: 'bg-red-100 text-red-800',
        badgeText: 'Admin',
        headerAccent: 'border-red-200'
      }
    case 'MANAGER':
      return {
        badgeColor: 'bg-blue-100 text-blue-800',
        badgeText: 'Yönetici',
        headerAccent: 'border-blue-200'
      }
    case 'RESIDENT':
      return {
        badgeColor: 'bg-green-100 text-green-800',
        badgeText: 'Sakin',
        headerAccent: 'border-green-200'
      }
    default:
      return {
        badgeColor: 'bg-gray-100 text-gray-800',
        badgeText: 'Kullanıcı',
        headerAccent: 'border-gray-200'
      }
  }
}

// Rol bazlı özellikler
const getRoleFeatures = (role: string) => {
  return {
    canSendNotifications: ['ADMIN', 'MANAGER'].includes(role),
    canViewReports: ['ADMIN', 'MANAGER'].includes(role),
    canManageUsers: role === 'ADMIN',
    showAdvancedFeatures: ['ADMIN', 'MANAGER'].includes(role)
  }
}

export function Header() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Çıkış yapma işlevi
  const handleSignOut = async () => {
    try {
      // Cookie'yi sil
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Giriş sayfasına yönlendir
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    // Kullanıcı bilgilerini al
    const fetchUserInfo = async () => {
      try {
        // Cookie'den token'ı al
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        if (token) {
          // Token'ı decode et
          const base64Payload = token.split('.')[1]
          const payload = JSON.parse(atob(base64Payload))
          setUser({
            id: payload.id || payload.userId,
            name: payload.name || 'Kullanıcı',
            email: payload.email,
            role: payload.role || 'RESIDENT',
            apartmentNo: payload.apartmentNo,
            block: payload.block
          })
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserInfo()
  }, [])

  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1" />
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
      </header>
    )
  }

  const userRole = user?.role || 'RESIDENT'
  const navigation = getNavigationByRole(userRole)
  const theme = getRoleTheme(userRole)
  const features = getRoleFeatures(userRole)

  return (
    <header className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b ${theme.headerAccent} bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8`}>
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Sol taraf - Rol bazlı bilgiler */}
        <div className="flex items-center">
          {user?.apartmentNo && (
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">
                {user.block ? `${user.block}-${user.apartmentNo}` : user.apartmentNo}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme.badgeColor}`}>
                {theme.badgeText}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1" />
        
        {/* Sağ taraf - Özellikler ve menü */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notification Sender - Sadece Admin/Manager için */}
          <NotificationSender userRole={userRole} />

          {/* Socket.IO Notification Center */}
          <NotificationCenter 
            userId={user?.id}
            userRole={userRole === 'ADMIN' || userRole === 'MANAGER' ? 'admin' : 'resident'}
            apartmentId={user?.apartmentNo}
            blockId={user?.block}
          />

          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
            aria-hidden="true"
          />

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Kullanıcı menüsünü aç</span>
              <div className="relative">
                <img
                  className="h-8 w-8 rounded-full bg-gray-50"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
                {/* Rol göstergesi */}
                <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                  userRole === 'ADMIN' ? 'bg-red-500' :
                  userRole === 'MANAGER' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
              </div>
              <span className="hidden lg:flex lg:items-center">
                <div className="ml-4">
                  <span className="text-sm font-semibold leading-6 text-gray-900">
                    {user?.name || 'Kullanıcı'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${theme.badgeColor}`}>
                      {theme.badgeText}
                    </span>
                    {user?.apartmentNo && (
                      <span className="text-xs text-gray-500">
                        {user.block ? `${user.block}-${user.apartmentNo}` : user.apartmentNo}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDownIcon
                  className="ml-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {/* Kullanıcı Bilgileri */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {user?.apartmentNo && (
                    <p className="text-xs text-gray-400 mt-1">
                      Daire: {user.block ? `${user.block}-${user.apartmentNo}` : user.apartmentNo}
                    </p>
                  )}
                </div>

                {/* Rol bazlı menü öğeleri */}
                {navigation.map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <a
                        href={item.href}
                        onClick={item.name === 'Çıkış' ? (e) => {
                          e.preventDefault()
                          handleSignOut()
                        } : undefined}
                        className={cn(
                          active ? "bg-gray-50" : "",
                          "flex items-center px-4 py-2 text-sm text-gray-700"
                        )}
                      >
                        {item.icon && (
                          <item.icon className="mr-3 h-4 w-4 text-gray-400" />
                        )}
                        {item.name}
                      </a>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}
