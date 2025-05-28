'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface RoleBasedLayoutProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export default function RoleBasedLayout({ 
  children, 
  allowedRoles = ['ADMIN', 'MANAGER', 'RESIDENT'],
  redirectTo = '/unauthorized'
}: RoleBasedLayoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Cookie'den token'ı al
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        if (!token) {
          router.push('/auth/signin')
          return
        }

        // Token'ı decode et
        const base64Payload = token.split('.')[1]
        const payload = JSON.parse(atob(base64Payload))
        const role = payload.role || 'RESIDENT'
        
        setUserRole(role)

        // Rol kontrolü
        if (!allowedRoles.includes(role)) {
          router.push(redirectTo)
          return
        }

      } catch (error) {
        console.error('Role check error:', error)
        router.push('/auth/signin')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [allowedRoles, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return null
  }

  return <>{children}</>
}

// Rol bazlı yönlendirme hook'u
export function useRoleRedirect() {
  const router = useRouter()

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'MANAGER':
        router.push('/admin/dashboard')
        break
      case 'RESIDENT':
        router.push('/resident/dashboard')
        break
      default:
        router.push('/unauthorized')
    }
  }

  return { redirectToDashboard }
} 