'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Apartman Yönetim Sistemine Hoş Geldiniz
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Devam etmek için Google hesabınızla giriş yapın
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 text-gray-700 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Image
              src="/google.svg"
              alt="Google logo"
              width={20}
              height={20}
              className="h-5 w-5"
            />
            <span>Google ile Giriş Yap</span>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Bu sistem sadece kayıtlı site sakinleri ve yöneticiler tarafından
            kullanılabilir.
          </p>
        </div>
      </div>
    </div>
  )
}
