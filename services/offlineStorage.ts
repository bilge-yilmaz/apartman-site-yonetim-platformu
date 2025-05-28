import AsyncStorage from '@react-native-async-storage/async-storage';

// Veri tipleri
export interface Payment {
  id: string;
  apartmentNo: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paymentDate?: string;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resident {
  id: string;
  name: string;
  email: string;
  apartmentNo?: string;
  block?: string;
  phone?: string;
  role: 'ADMIN' | 'RESIDENT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  id: string;
  apartmentNo: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'ELEVATOR' | 'OTHER';
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  startDate?: string;
  completionDate?: string;
  notes?: Array<{
    text: string;
    createdAt: string;
    createdBy: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'MAINTENANCE' | 'PAYMENT' | 'EVENT' | 'EMERGENCY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Storage anahtarları
const STORAGE_KEYS = {
  PAYMENTS: 'offline_payments',
  RESIDENTS: 'offline_residents',
  MAINTENANCE: 'offline_maintenance',
  ANNOUNCEMENTS: 'offline_announcements',
  INITIALIZED: 'offline_initialized'
};

// Yardımcı fonksiyonlar
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);
const getCurrentDateTime = () => new Date().toISOString();

// Genel storage fonksiyonları
const getStorageData = async <T>(key: string): Promise<T[]> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return [];
  }
};

const setStorageData = async <T>(key: string, data: T[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
  }
};

// Örnek veriler oluşturma
const initializeWithSampleData = async (): Promise<void> => {
  const isInitialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (isInitialized) return;

  // Örnek sakinler
  const sampleResidents: Resident[] = [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      apartmentNo: '101',
      block: 'A',
      phone: '0532 123 4567',
      role: 'RESIDENT',
      isActive: true,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    },
    {
      id: '2',
      name: 'Fatma Demir',
      email: 'fatma@example.com',
      apartmentNo: '102',
      block: 'A',
      phone: '0533 234 5678',
      role: 'RESIDENT',
      isActive: true,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    },
    {
      id: '3',
      name: 'Mehmet Kaya',
      email: 'mehmet@example.com',
      apartmentNo: '201',
      block: 'B',
      phone: '0534 345 6789',
      role: 'RESIDENT',
      isActive: true,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    }
  ];

  // Örnek ödemeler
  const samplePayments: Payment[] = [
    {
      id: '1',
      apartmentNo: '101',
      amount: 1200,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      description: 'Aylık Aidat - Aralık 2024',
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    },
    {
      id: '2',
      apartmentNo: '102',
      amount: 1200,
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PAID',
      paymentDate: getCurrentDateTime(),
      paymentMethod: 'BANK_TRANSFER',
      description: 'Aylık Aidat - Aralık 2024',
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    },
    {
      id: '3',
      apartmentNo: '201',
      amount: 1200,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'OVERDUE',
      description: 'Aylık Aidat - Aralık 2024',
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    }
  ];

  // Örnek bakım talepleri
  const sampleMaintenance: MaintenanceRequest[] = [
    {
      id: '1',
      apartmentNo: '101',
      title: 'Musluk Arızası',
      description: 'Mutfak musluğu damlıyor, tamir edilmesi gerekiyor.',
      status: 'PENDING',
      priority: 'MEDIUM',
      category: 'PLUMBING',
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    },
    {
      id: '2',
      apartmentNo: '102',
      title: 'Elektrik Kesintisi',
      description: 'Salon elektriği çalışmıyor.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'ELECTRICAL',
      assignedTo: 'Elektrikçi Ali',
      estimatedCost: 500,
      startDate: getCurrentDateTime(),
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    }
  ];

  // Örnek duyurular
  const sampleAnnouncements: Announcement[] = [
    {
      id: '1',
      title: 'Site Toplantısı',
      content: 'Aylık site toplantısı 15 Aralık Cuma günü saat 19:00\'da yapılacaktır. Tüm site sakinlerinin katılımı önemlidir.',
      category: 'GENERAL',
      priority: 'HIGH',
      startDate: getCurrentDateTime(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    },
    {
      id: '2',
      title: 'Su Kesintisi',
      content: 'Yarın saat 09:00-17:00 arası bakım çalışması nedeniyle su kesintisi yaşanacaktır.',
      category: 'MAINTENANCE',
      priority: 'URGENT',
      startDate: getCurrentDateTime(),
      isActive: true,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    }
  ];

  // Verileri kaydet
  await setStorageData(STORAGE_KEYS.RESIDENTS, sampleResidents);
  await setStorageData(STORAGE_KEYS.PAYMENTS, samplePayments);
  await setStorageData(STORAGE_KEYS.MAINTENANCE, sampleMaintenance);
  await setStorageData(STORAGE_KEYS.ANNOUNCEMENTS, sampleAnnouncements);
  await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
};

// Ödeme işlemleri
export const PaymentStorage = {
  getAll: async (): Promise<Payment[]> => {
    await initializeWithSampleData();
    return getStorageData<Payment>(STORAGE_KEYS.PAYMENTS);
  },

  create: async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
    const payments = await PaymentStorage.getAll();
    const newPayment: Payment = {
      ...payment,
      id: generateId(),
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    };
    payments.push(newPayment);
    await setStorageData(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  },

  update: async (id: string, updates: Partial<Payment>): Promise<Payment | null> => {
    const payments = await PaymentStorage.getAll();
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return null;

    payments[index] = {
      ...payments[index],
      ...updates,
      updatedAt: getCurrentDateTime()
    };
    await setStorageData(STORAGE_KEYS.PAYMENTS, payments);
    return payments[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const payments = await PaymentStorage.getAll();
    const filteredPayments = payments.filter(p => p.id !== id);
    if (filteredPayments.length === payments.length) return false;
    
    await setStorageData(STORAGE_KEYS.PAYMENTS, filteredPayments);
    return true;
  }
};

// Sakin işlemleri
export const ResidentStorage = {
  getAll: async (): Promise<Resident[]> => {
    await initializeWithSampleData();
    return getStorageData<Resident>(STORAGE_KEYS.RESIDENTS);
  },

  create: async (resident: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resident> => {
    const residents = await ResidentStorage.getAll();
    const newResident: Resident = {
      ...resident,
      id: generateId(),
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    };
    residents.push(newResident);
    await setStorageData(STORAGE_KEYS.RESIDENTS, residents);
    return newResident;
  },

  update: async (id: string, updates: Partial<Resident>): Promise<Resident | null> => {
    const residents = await ResidentStorage.getAll();
    const index = residents.findIndex(r => r.id === id);
    if (index === -1) return null;

    residents[index] = {
      ...residents[index],
      ...updates,
      updatedAt: getCurrentDateTime()
    };
    await setStorageData(STORAGE_KEYS.RESIDENTS, residents);
    return residents[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const residents = await ResidentStorage.getAll();
    const filteredResidents = residents.filter(r => r.id !== id);
    if (filteredResidents.length === residents.length) return false;
    
    await setStorageData(STORAGE_KEYS.RESIDENTS, filteredResidents);
    return true;
  }
};

// Bakım işlemleri
export const MaintenanceStorage = {
  getAll: async (): Promise<MaintenanceRequest[]> => {
    await initializeWithSampleData();
    return getStorageData<MaintenanceRequest>(STORAGE_KEYS.MAINTENANCE);
  },

  create: async (maintenance: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceRequest> => {
    const maintenanceRequests = await MaintenanceStorage.getAll();
    const newMaintenance: MaintenanceRequest = {
      ...maintenance,
      id: generateId(),
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    };
    maintenanceRequests.push(newMaintenance);
    await setStorageData(STORAGE_KEYS.MAINTENANCE, maintenanceRequests);
    return newMaintenance;
  },

  update: async (id: string, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | null> => {
    const maintenanceRequests = await MaintenanceStorage.getAll();
    const index = maintenanceRequests.findIndex(m => m.id === id);
    if (index === -1) return null;

    maintenanceRequests[index] = {
      ...maintenanceRequests[index],
      ...updates,
      updatedAt: getCurrentDateTime()
    };
    await setStorageData(STORAGE_KEYS.MAINTENANCE, maintenanceRequests);
    return maintenanceRequests[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const maintenanceRequests = await MaintenanceStorage.getAll();
    const filteredRequests = maintenanceRequests.filter(m => m.id !== id);
    if (filteredRequests.length === maintenanceRequests.length) return false;
    
    await setStorageData(STORAGE_KEYS.MAINTENANCE, filteredRequests);
    return true;
  }
};

// Duyuru işlemleri
export const AnnouncementStorage = {
  getAll: async (): Promise<Announcement[]> => {
    await initializeWithSampleData();
    return getStorageData<Announcement>(STORAGE_KEYS.ANNOUNCEMENTS);
  },

  create: async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> => {
    const announcements = await AnnouncementStorage.getAll();
    const newAnnouncement: Announcement = {
      ...announcement,
      id: generateId(),
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime()
    };
    announcements.push(newAnnouncement);
    await setStorageData(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
    return newAnnouncement;
  },

  update: async (id: string, updates: Partial<Announcement>): Promise<Announcement | null> => {
    const announcements = await AnnouncementStorage.getAll();
    const index = announcements.findIndex(a => a.id === id);
    if (index === -1) return null;

    announcements[index] = {
      ...announcements[index],
      ...updates,
      updatedAt: getCurrentDateTime()
    };
    await setStorageData(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
    return announcements[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const announcements = await AnnouncementStorage.getAll();
    const filteredAnnouncements = announcements.filter(a => a.id !== id);
    if (filteredAnnouncements.length === announcements.length) return false;
    
    await setStorageData(STORAGE_KEYS.ANNOUNCEMENTS, filteredAnnouncements);
    return true;
  }
};

// Tüm verileri temizle (geliştirme için)
export const clearAllData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.PAYMENTS,
    STORAGE_KEYS.RESIDENTS,
    STORAGE_KEYS.MAINTENANCE,
    STORAGE_KEYS.ANNOUNCEMENTS,
    STORAGE_KEYS.INITIALIZED
  ]);
}; 
 
 
 