import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // Giriş yapmamış kullanıcıları login sayfasına yönlendir
  if (!session) {
    redirect('/auth/signin')
  }

  // Kullanıcıları rollerine göre yönlendir
  if (session.user.role === 'RESIDENT') {
    redirect('/resident/dashboard')
  } else if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
    redirect('/admin/dashboard')
  }

  // Eğer buraya kadar geldiyse bir sorun var demektir
  return null
}
