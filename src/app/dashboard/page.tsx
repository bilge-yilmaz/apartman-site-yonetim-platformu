'use client'

import { useEffect } from 'react'
import { useRoleRedirect } from '@/components/layout/RoleBasedLayout'

export default function DashboardPage() {
  const { redirectToDashboard } = useRoleRedirect()

  useEffect(() => {
    // Kullanıcı rolünü al ve uygun dashboard'a yönlendir
    const getUserRole = () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        if (token) {
          const base64Payload = token.split('.')[1]
          const payload = JSON.parse(atob(base64Payload))
          const role = payload.role || 'RESIDENT'
          redirectToDashboard(role)
        } else {
          window.location.href = '/auth/signin'
        }
      } catch (error) {
        console.error('Role redirect error:', error)
        window.location.href = '/auth/signin'
      }
    }

    getUserRole()
  }, [redirectToDashboard])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yönlendiriliyor...</p>
      </div>
    </div>
  )
} 