'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeftIcon, ShieldExclamationIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function UnauthorizedPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  // Kullanıcı rolüne göre yönlendirme sayfası
  const getDashboardLink = () => {
    switch (userRole) {
      case 'ADMIN':
      case 'MANAGER':
        return '/admin/dashboard'
      case 'RESIDENT':
        return '/resident/dashboard'
      default:
        return '/'
    }
  }

  // Kullanıcı rolüne göre mesaj
  const getRoleMessage = () => {
    switch (userRole) {
      case 'ADMIN':
        return 'Yönetici olarak, sadece yöneticilere özel alanlara erişebilirsiniz.'
      case 'MANAGER':
        return 'Yönetici personeli olarak, yönetim paneline erişebilirsiniz ancak bazı alanlar sadece yöneticilere özeldir.'
      case 'RESIDENT':
        return 'Site sakini olarak, sadece site sakinlerine özel alanlara erişebilirsiniz.'
      default:
        return 'Bu sayfaya erişim yetkiniz bulunmuyor.'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldExclamationIcon className="h-10 w-10 text-red-600" aria-hidden="true" />
          </div>
          
          <h1 className="mt-4 text-3xl font-bold text-red-600">Yetkisiz Erişim</h1>
          
          <p className="mt-2 text-sm text-gray-600">
            {getRoleMessage()}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href={getDashboardLink()}
            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <HomeIcon className="mr-2 h-5 w-5" />
            Panelime Dön
          </Link>
          
          <Link
            href="javascript:history.back()"
            className="flex w-full items-center justify-center rounded-md bg-gray-200 px-4 py-3 text-center font-semibold text-gray-700 hover:bg-gray-300 transition-colors"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Önceki Sayfaya Dön
          </Link>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Erişim izinleri hakkında sorularınız varsa lütfen site yönetimiyle iletişime geçin.</p>
        </div>
      </div>
    </div>
  )
}
