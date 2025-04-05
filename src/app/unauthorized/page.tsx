'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Yetkisiz Erişim</h1>
          <p className="mt-2 text-sm text-gray-600">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          {session?.user?.role === 'RESIDENT' && (
            <p className="mt-4 text-sm text-gray-600">
              Site sakini olarak size özel sayfaları görüntülemek için aşağıdaki
              butona tıklayabilirsiniz.
            </p>
          )}
        </div>

        <div className="mt-8">
          {session?.user?.role === 'RESIDENT' ? (
            <Link
              href="/resident/dashboard"
              className="block w-full rounded-md bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-500"
            >
              Site Sakini Paneline Git
            </Link>
          ) : (
            <Link
              href="/"
              className="block w-full rounded-md bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-500"
            >
              Ana Sayfaya Dön
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
