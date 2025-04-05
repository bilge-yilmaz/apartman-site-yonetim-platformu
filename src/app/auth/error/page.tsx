'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Hata</h1>
          <p className="mt-2 text-sm text-gray-600">
            {error === 'AccessDenied'
              ? 'Erişim reddedildi. Bu hesap sisteme kayıtlı değil.'
              : 'Giriş yapılırken bir hata oluştu.'}
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="block w-full rounded-md bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-500"
          >
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
