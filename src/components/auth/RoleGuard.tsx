import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { UserRole } from '@/models/User'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallbackUrl?: string
}

/**
 * Rol tabanlı erişim kontrolü sağlayan bileşen
 * Sadece izin verilen rollere sahip kullanıcıların içeriği görmesine izin verir
 */
export const RoleGuard = ({ 
  children, 
  allowedRoles, 
  fallbackUrl = '/unauthorized' 
}: RoleGuardProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    // Oturum yükleniyorsa bekle
    if (status === 'loading') return
    
    // Oturum yoksa giriş sayfasına yönlendir
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    // Kullanıcı aktif değilse hesap askıya alındı sayfasına yönlendir
    if (session?.user && !session.user.isActive) {
      router.push('/account-suspended')
      return
    }
    
    // Kullanıcının rolü izin verilen roller arasında değilse yetkisiz sayfasına yönlendir
    const userRole = session?.user?.role
    if (userRole && !allowedRoles.includes(userRole)) {
      router.push(fallbackUrl)
    }
  }, [status, session, router, allowedRoles, fallbackUrl])
  
  // Oturum yükleniyorsa veya kullanıcı doğrulanmamışsa içeriği gösterme
  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }
  
  // Kullanıcı aktif değilse içeriği gösterme
  if (session?.user && !session.user.isActive) {
    return null
  }
  
  // Kullanıcının rolü izin verilen roller arasında değilse içeriği gösterme
  const userRole = session?.user?.role
  if (userRole && !allowedRoles.includes(userRole)) {
    return null
  }
  
  // Tüm kontroller geçildiyse içeriği göster
  return <>{children}</>
}

/**
 * Sadece yöneticilere özel içerik için koruma bileşeni
 */
export const AdminGuard = ({ children, fallbackUrl }: Omit<RoleGuardProps, 'allowedRoles'>) => {
  return (
    <RoleGuard allowedRoles={['ADMIN']} fallbackUrl={fallbackUrl}>
      {children}
    </RoleGuard>
  )
}

/**
 * Yönetici ve yönetici personeline özel içerik için koruma bileşeni
 */
export const StaffGuard = ({ children, fallbackUrl }: Omit<RoleGuardProps, 'allowedRoles'>) => {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER']} fallbackUrl={fallbackUrl}>
      {children}
    </RoleGuard>
  )
}

/**
 * Sadece site sakinlerine özel içerik için koruma bileşeni
 */
export const ResidentGuard = ({ children, fallbackUrl }: Omit<RoleGuardProps, 'allowedRoles'>) => {
  return (
    <RoleGuard allowedRoles={['RESIDENT']} fallbackUrl={fallbackUrl}>
      {children}
    </RoleGuard>
  )
}
