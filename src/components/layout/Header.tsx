"use client"

import { Fragment, useEffect, useState } from "react"
import { Menu, Transition } from "@headlessui/react"
import { BellIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

const userNavigation = [
  { name: "Profilim", href: "#" },
  { name: "Ayarlar", href: "#" },
  { name: "Çıkış", href: "#" },
]

const notifications = [
  {
    id: 1,
    title: "Yeni Arıza Bildirimi",
    description: "A-101 nolu daireden yeni bir arıza bildirimi geldi",
    href: "/maintenance",
    time: "5 dakika önce",
  },
  {
    id: 2,
    title: "Ödeme Hatırlatması",
    description: "B-204 nolu daire için ödeme son günü yaklaşıyor",
    href: "/payments",
    time: "1 saat önce",
  },
  {
    id: 3,
    title: "Yeni Rezervasyon",
    description: "Toplantı salonu için yeni rezervasyon talebi",
    href: "/reservations",
    time: "2 saat önce",
  },
]

export function Header() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
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

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 p-1.5 text-gray-400 hover:text-gray-500">
              <span className="sr-only">Bildirimleri görüntüle</span>
              <div className="relative">
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  3
                </span>
              </div>
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
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <div className="px-4 py-2 text-sm font-semibold text-gray-900">
                  Bildirimler
                </div>
                {notifications.map((item) => (
                  <Menu.Item key={item.id}>
                    {({ active }) => (
                      <a
                        href={item.href}
                        className={cn(
                          active ? "bg-gray-50" : "",
                          "block px-4 py-2 text-sm text-gray-700"
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-xs text-gray-500">
                              {item.time}
                            </span>
                          </div>
                          <span className="text-gray-500">
                            {item.description}
                          </span>
                        </div>
                      </a>
                    )}
                  </Menu.Item>
                ))}
                <div className="border-t border-gray-100 px-4 py-2">
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Tüm bildirimleri görüntüle
                  </a>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
            aria-hidden="true"
          />

          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Kullanıcı menüsünü aç</span>
              <img
                className="h-8 w-8 rounded-full bg-gray-50"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                  aria-hidden="true"
                >
                  Yönetici
                </span>
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
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {userNavigation.map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <a
                        href={item.href}
                        className={cn(
                          active ? "bg-gray-50" : "",
                          "block px-3 py-1 text-sm leading-6 text-gray-900"
                        )}
                      >
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
