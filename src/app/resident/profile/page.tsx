'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  Textarea,
  Grid,
  Col,
  Badge,
} from '@tremor/react'
import { UserIcon, PhoneIcon, EnvelopeIcon, HomeIcon, KeyIcon } from '@heroicons/react/24/outline'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  block: string
  apartmentNo: string
  joinDate: string
  avatar: string
  emergencyContact: {
    name: string
    phone: string
    relation: string
  }
  vehicles: {
    id: string
    type: string
    brand: string
    model: string
    plate: string
  }[]
}

export default function ResidentProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    // Örnek veri yükleme (gerçek uygulamada API'den çekilecek)
    const loadDummyData = () => {
      const dummyProfile: UserProfile = {
        id: '1',
        name: 'Ahmet Yılmaz',
        email: 'ahmet.yilmaz@example.com',
        phone: '0532 123 4567',
        block: 'B',
        apartmentNo: '204',
        joinDate: '2024-01-15',
        avatar: '/avatars/default.png',
        emergencyContact: {
          name: 'Ayşe Yılmaz',
          phone: '0533 765 4321',
          relation: 'Eş',
        },
        vehicles: [
          {
            id: '1',
            type: 'Otomobil',
            brand: 'Toyota',
            model: 'Corolla',
            plate: '34 ABC 123',
          },
        ],
      }
      
      setProfile(dummyProfile)
      setEditedProfile(dummyProfile)
      setLoading(false)
    }

    // Simüle edilmiş veri yükleme gecikmesi
    setTimeout(() => {
      loadDummyData()
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Profil bilgileri yüklenirken bir hata oluştu.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('tr-TR', options)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setEditedProfile({
        ...editedProfile,
        [parent]: {
          ...editedProfile[parent as keyof UserProfile],
          [child]: value,
        },
      })
    } else {
      setEditedProfile({
        ...editedProfile,
        [name]: value,
      })
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value,
    })
  }

  const handleSaveProfile = () => {
    // Gerçek uygulamada API'ye gönderilecek
    setProfile(editedProfile as UserProfile)
    setIsEditing(false)
    alert('Profil bilgileriniz başarıyla güncellendi!')
  }

  const handleSavePassword = () => {
    // Gerçek uygulamada API'ye gönderilecek
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Yeni şifre ve şifre onayı eşleşmiyor!')
      return
    }
    
    setIsChangingPassword(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    alert('Şifreniz başarıyla güncellendi!')
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profil Bilgilerim</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kişisel bilgilerinizi görüntüleyin ve düzenleyin.
        </p>
      </div>

      {/* Profil Kartı */}
      <Card>
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <div className="flex flex-col items-center">
            <div className="h-32 w-32 overflow-hidden rounded-full bg-gray-200">
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://via.placeholder.com/150'
                }}
              />
            </div>
            {isEditing && (
              <Button 
                size="xs" 
                variant="light" 
                color="blue" 
                className="mt-2"
              >
                Fotoğraf Değiştir
              </Button>
            )}
          </div>
          
          <div className="mt-4 flex-grow sm:ml-6 sm:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Title>{profile.name}</Title>
                <Text className="text-gray-500">
                  Blok: {profile.block} - Daire: {profile.apartmentNo}
                </Text>
                <Text className="text-gray-500">
                  Üyelik: {formatDate(profile.joinDate)}
                </Text>
              </div>
              <div className="mt-4 sm:mt-0">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)}
                  >
                    Profili Düzenle
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setIsEditing(false)
                        setEditedProfile(profile)
                      }}
                    >
                      İptal
                    </Button>
                    <Button 
                      color="blue" 
                      onClick={handleSaveProfile}
                    >
                      Kaydet
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kişisel Bilgiler */}
        <div className="mt-8">
          <Title>Kişisel Bilgiler</Title>
          
          <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="mt-4 gap-4">
            <Col>
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Ad Soyad
                </label>
                {isEditing ? (
                  <TextInput
                    id="name"
                    name="name"
                    icon={UserIcon}
                    value={editedProfile.name || ''}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{profile.name}</span>
                  </div>
                )}
              </div>
            </Col>
            
            <Col>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-posta
                </label>
                {isEditing ? (
                  <TextInput
                    id="email"
                    name="email"
                    type="email"
                    icon={EnvelopeIcon}
                    value={editedProfile.email || ''}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="flex items-center">
                    <EnvelopeIcon className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>
            </Col>
            
            <Col>
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefon
                </label>
                {isEditing ? (
                  <TextInput
                    id="phone"
                    name="phone"
                    icon={PhoneIcon}
                    value={editedProfile.phone || ''}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="flex items-center">
                    <PhoneIcon className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </Col>
            
            <Col>
              <div className="space-y-2">
                <label htmlFor="block" className="block text-sm font-medium text-gray-700">
                  Blok
                </label>
                {isEditing ? (
                  <TextInput
                    id="block"
                    name="block"
                    icon={HomeIcon}
                    value={editedProfile.block || ''}
                    onChange={handleInputChange}
                    disabled
                  />
                ) : (
                  <div className="flex items-center">
                    <HomeIcon className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{profile.block}</span>
                  </div>
                )}
              </div>
            </Col>
            
            <Col>
              <div className="space-y-2">
                <label htmlFor="apartmentNo" className="block text-sm font-medium text-gray-700">
                  Daire No
                </label>
                {isEditing ? (
                  <TextInput
                    id="apartmentNo"
                    name="apartmentNo"
                    icon={HomeIcon}
                    value={editedProfile.apartmentNo || ''}
                    onChange={handleInputChange}
                    disabled
                  />
                ) : (
                  <div className="flex items-center">
                    <HomeIcon className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{profile.apartmentNo}</span>
                  </div>
                )}
              </div>
            </Col>
          </Grid>
        </div>

        {/* Acil Durum İletişim Bilgileri */}
        <div className="mt-8">
          <Title>Acil Durum İletişim Bilgileri</Title>
          
          <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="mt-4 gap-4">
            <Col>
              <div className="space-y-2">
                <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700">
                  Ad Soyad
                </label>
                {isEditing ? (
                  <TextInput
                    id="emergencyContact.name"
                    name="emergencyContact.name"
                    icon={UserIcon}
                    value={editedProfile.emergencyContact?.name || ''}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{profile.emergencyContact.name}</span>
                  </div>
                )}
              </div>
            </Col>
            
            <Col>
              <div className="space-y-2">
                <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-gray-700">
                  Telefon
                </label>
                {isEditing ? (
                  <TextInput
                    id="emergencyContact.phone"
                    name="emergencyContact.phone"
                    icon={PhoneIcon}
                    value={editedProfile.emergencyContact?.phone || ''}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="flex items-center">
                    <PhoneIcon className="mr-2 h-5 w-5 text-gray-400" />
                    <span>{profile.emergencyContact.phone}</span>
                  </div>
                )}
              </div>
            </Col>
            
            <Col>
              <div className="space-y-2">
                <label htmlFor="emergencyContact.relation" className="block text-sm font-medium text-gray-700">
                  Yakınlık
                </label>
                {isEditing ? (
                  <TextInput
                    id="emergencyContact.relation"
                    name="emergencyContact.relation"
                    value={editedProfile.emergencyContact?.relation || ''}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="flex items-center">
                    <span>{profile.emergencyContact.relation}</span>
                  </div>
                )}
              </div>
            </Col>
          </Grid>
        </div>

        {/* Araç Bilgileri */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <Title>Araç Bilgileri</Title>
            {isEditing && (
              <Button 
                size="xs" 
                variant="light" 
                color="blue"
              >
                Araç Ekle
              </Button>
            )}
          </div>
          
          {profile.vehicles.length > 0 ? (
            <div className="mt-4 space-y-4">
              {profile.vehicles.map((vehicle, index) => (
                <Card key={vehicle.id} decoration="left" decorationColor="blue">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center">
                        <Badge color="blue">{vehicle.type}</Badge>
                        <span className="ml-2 font-medium">
                          {vehicle.brand} {vehicle.model}
                        </span>
                      </div>
                      <Text className="mt-1">Plaka: {vehicle.plate}</Text>
                    </div>
                    {isEditing && (
                      <div className="mt-2 sm:mt-0">
                        <Button size="xs" variant="light" color="red">
                          Kaldır
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-sm text-gray-500">Kayıtlı araç bilginiz bulunmuyor.</p>
                {isEditing && (
                  <Button 
                    size="xs" 
                    color="blue" 
                    className="mt-2"
                  >
                    Araç Ekle
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Şifre Değiştirme */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Title>Şifre Değiştir</Title>
            <Text>Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.</Text>
          </div>
          <div>
            {!isChangingPassword ? (
              <Button 
                icon={KeyIcon} 
                onClick={() => setIsChangingPassword(true)}
              >
                Şifre Değiştir
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }}
                >
                  İptal
                </Button>
                <Button 
                  color="blue" 
                  onClick={handleSavePassword}
                >
                  Kaydet
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {isChangingPassword && (
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Mevcut Şifre
              </label>
              <TextInput
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Yeni Şifre
              </label>
              <TextInput
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Yeni Şifre (Tekrar)
              </label>
              <TextInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
