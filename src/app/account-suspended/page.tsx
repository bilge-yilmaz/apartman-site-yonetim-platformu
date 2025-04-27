'use client'

import { signOut } from 'next-auth/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function AccountSuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <ExclamationTriangleIcon className="h-10 w-10 text-amber-600" aria-hidden="true" />
          </div>
          
          <h1 className="mt-4 text-3xl font-bold text-amber-600">Hesap Askıya Alındı</h1>
          
          <p className="mt-4 text-gray-600">
            Hesabınız şu anda askıya alınmış durumda. Aşağıdaki nedenlerden biri bu duruma yol açmış olabilir:
          </p>
          
          <ul className="mt-4 space-y-2 text-left text-sm text-gray-600 list-disc pl-6">
            <li>Aidat ödemelerinizde gecikme olması</li>
            <li>Site kurallarına aykırı davranışlar</li>
            <li>Hesap bilgilerinizin doğrulanması gerekliliği</li>
            <li>Yönetim tarafından geçici olarak erişiminizin kısıtlanması</li>
          </ul>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="flex w-full items-center justify-center rounded-md bg-amber-600 px-4 py-3 text-center font-semibold text-white hover:bg-amber-500 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Hesabınızın durumu hakkında bilgi almak için lütfen site yönetimiyle iletişime geçin.
          </p>
          <p className="mt-2">
            İletişim: <a href="mailto:yonetim@apartman-site.com" className="text-blue-600 hover:underline">yonetim@apartman-site.com</a> veya <span className="font-medium">0212 123 45 67</span>
          </p>
        </div>
      </div>
    </div>
  )
}
