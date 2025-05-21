'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { useState, useEffect, FormEvent } from 'react'

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showCredentials, setShowCredentials] = useState(false)

  useEffect(() => {
    // Günün saatine göre karşılama mesajı
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting('Günaydın')
    } else if (hour >= 12 && hour < 18) {
      setGreeting('İyi Günler')
    } else {
      setGreeting('İyi Akşamlar')
    }
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      console.error('Giriş sırasında hata oluştu:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleTestAccountSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email) {
      setError('Lütfen email adresinizi girin')
      return
    }
    
    try {
      setIsLoading(true)
      
      // Kendi API endpoint'imizi kullan
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: password || 'test123', // Şifre girilmezse varsayılan test şifresini kullan
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.')
        return
      }
      
      // Başarılı giriş, ana sayfaya yönlendir
      window.location.href = '/'
    } catch (error) {
      console.error('Giriş sırasında hata oluştu:', error)
      setError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleTestAccountClick = (testEmail: string) => {
    setEmail(testEmail)
    setPassword('test123')
    setShowCredentials(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Sol taraf - Logo ve Karşılama */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-indigo-600 to-purple-600 p-8 md:p-10 flex flex-col justify-between">
          <div className="text-white">
            <div className="flex justify-center mb-8">
              <Image src="/apartment.svg" alt="Site Logo" width={160} height={160} priority />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{greeting}!</h2>
            <h1 className="text-3xl font-bold mb-6">Site Yönetim Sistemine Hoş Geldiniz</h1>
            
            <p className="text-indigo-100 mb-8">
              Aidat takibi, bakım bildirimleri ve daha fazlası için giriş yapın.
            </p>
          </div>
          
          <div className="mt-auto">
            <p className="text-indigo-200 text-sm">
              &copy; {new Date().getFullYear()} Site Yönetim Platformu
            </p>
          </div>
        </div>
        
        {/* Sağ taraf - Giriş Formu */}
        <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Giriş Yap</h2>
            <p className="text-gray-600">
              Sisteme erişmek için Google hesabınızla giriş yapın
            </p>
          </div>
          
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg p-3 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Image
                src="/google.svg"
                alt="Google logo"
                width={20}
                height={20}
              />
            )}
            <span className="font-medium">
              {isLoading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}
            </span>
          </button>
          
          {/* Test Hesapları Bölümü */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Test Hesapları</span>
              </div>
            </div>
            
            {showCredentials ? (
              <form onSubmit={handleTestAccountSignIn} className="mt-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email adresiniz"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Test hesaplar için: test123"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowCredentials(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    Geri
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Test hesapları için varsayılan şifre: <span className="font-medium">test123</span>
                </p>
              </form>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3">
                <div 
                  onClick={() => handleTestAccountClick('admin@site.com')}
                  className="rounded-lg bg-gray-50 p-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mr-3">A</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Yönetici</p>
                      <p className="text-xs text-gray-500">admin@site.com</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleTestAccountClick('manager@site.com')}
                  className="rounded-lg bg-gray-50 p-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold mr-3">M</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Yönetici Personeli</p>
                      <p className="text-xs text-gray-500">manager@site.com</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleTestAccountClick('resident@site.com')}
                  className="rounded-lg bg-gray-50 p-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold mr-3">R</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Site Sakini</p>
                      <p className="text-xs text-gray-500">resident@site.com</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Giriş yaparak <span className="text-indigo-600">kullanım koşullarını</span> kabul etmiş olursunuz.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
