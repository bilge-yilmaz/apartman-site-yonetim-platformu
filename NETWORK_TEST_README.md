# 🔧 Apartman Yönetim Sistemi - Network Test & Debug Sistemi

## 📋 Genel Bakış

Bu dokümantasyon, apartman yönetim sistemi mobil uygulamasında yaşanan network bağlantı sorunlarının çözümü için geliştirilen test ve debug sistemini açıklamaktadır.

## 🚨 Çözülen Sorunlar

### 1. IP Adresi Uyumsuzluğu
- **Sorun**: Mobil uygulamada farklı IP adresleri kullanılıyordu
- **Çözüm**: Bilgisayarın gerçek IP adresi (`10.196.224.164`) tespit edildi ve tüm konfigürasyonlarda tutarlı hale getirildi

### 2. API Konfigürasyon Sorunları
- **Sorun**: İki farklı API instance'ı ve tutarsız URL yapılandırması
- **Çözüm**: Tek API instance kullanımına geçildi ve environment variable desteği eklendi

### 3. CORS Ayarları
- **Sorun**: Web sunucusunda mobil cihazlar için CORS ayarları eksikti
- **Çözüm**: Socket.IO ve HTTP CORS konfigürasyonu genişletildi

## 🛠️ Teknik Çözümler

### 1. API Konfigürasyonu (`utils/api.ts`)

```typescript
// Dinamik API URL belirleme
const getApiUrl = () => {
  const COMPUTER_IP = '10.196.224.164';
  
  if (__DEV__) {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    return `http://${COMPUTER_IP}:3000`;
  } else {
    return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-domain.com';
  }
};
```

**Özellikler:**
- ✅ Environment variable desteği
- ✅ Network durumu kontrolü
- ✅ Gelişmiş hata yönetimi (401, 403, 404, 500 kodları)
- ✅ 15 saniye timeout
- ✅ Offline queue sistemi (24 saat otomatik temizlik)

### 2. API Services Refactoring (`utils/api-services.ts`)

```typescript
// Tek API instance kullanımı
import api, { apiQueue } from './api';

export const apiServices = {
  async get(url: string) {
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      // Offline durumunda queue'ya ekle
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        await apiQueue.add({ url, method: 'get' });
      }
      throw error;
    }
  }
  // ... diğer metodlar
};
```

**Özellikler:**
- ✅ Tutarlı hata yönetimi
- ✅ Offline queue entegrasyonu
- ✅ Cache yönetimi
- ✅ Tüm CRUD operasyonları için destek

### 3. Web Sunucusu CORS Güncellemesi (`../apartman-site-web/server.js`)

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "http://localhost:8081",
      "http://10.196.224.164:8081", // Mobil cihazlar için
      "http://10.196.224.164:3000", // Web sunucusu için
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // 192.168.x.x:port pattern
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/, // 10.x.x.x:port pattern
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});
```

### 4. Environment Variables (`.env`)

```env
# API URL - Geliştirme ortamı için bilgisayarın IP adresi
EXPO_PUBLIC_API_URL=http://10.196.224.164:3000

# Socket.IO URL
EXPO_PUBLIC_SOCKET_URL=http://10.196.224.164:3000

# Uygulama ayarları
EXPO_PUBLIC_APP_NAME=Apartman Yönetim Sistemi
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_CACHE_DURATION=60
```

## 🔧 Network Test Sistemi

### Network Test Komponenti (`components/NetworkTest.tsx`)

Ana sayfada "Network Test" butonu ile erişilebilen kapsamlı test sistemi:

**Test Özellikleri:**
- 🌐 **Bağlantı Testi**: Genel API bağlantısını test eder
- ⚡ **Ping Testi**: Sunucu yanıt süresini ölçer
- 💰 **Endpoint Testleri**: Specific API endpoint'lerini test eder
- 📶 **Network Bilgileri**: Detaylı network durumu gösterir
- 🐛 **Debug Bilgileri**: API URL, platform, device bilgileri

**Kullanım:**
1. Ana sayfada "Hızlı Erişim" bölümünden "Network Test" butonuna tıklayın
2. Modal açılacak ve test butonlarını kullanabilirsiniz
3. Test sonuçları ve debug bilgileri görüntülenecek

### Test Butonları

```typescript
// Bağlantı Testi
const testNetworkConnection = async () => {
  const response = await apiServices.get('/test-endpoint');
  // ✅ API bağlantısı başarılı!
};

// Ping Testi
const testPing = async () => {
  const startTime = Date.now();
  const response = await fetch(API_URL, { method: 'HEAD' });
  const pingTime = Date.now() - startTime;
  // ✅ Ping başarılı! Süre: 150ms
};
```

## 📱 Kullanım Kılavuzu

### 1. Geliştirme Ortamı Kurulumu

```bash
# Mobil uygulamayı başlat
cd apartman-site-mobil
npx expo start

# Web sunucusunu başlat (ayrı terminal)
cd ../apartman-site-web
npm run dev
```

### 2. IP Adresi Kontrolü

Bilgisayarınızın IP adresini kontrol edin:

```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
```

IP adresi değiştiyse `.env` dosyasını güncelleyin.

### 3. Network Test Kullanımı

1. **Mobil uygulamayı açın**
2. **Ana sayfada "Network Test" butonuna tıklayın**
3. **Test butonlarını kullanarak bağlantıyı kontrol edin:**
   - 🌐 Bağlantıyı Test Et
   - ⚡ Ping Test
   - 💰 Ödemeleri Test Et
   - 📢 Duyuruları Test Et

### 4. Hata Durumunda Kontrol Listesi

- [ ] Web sunucusu çalışıyor mu? (`http://10.196.224.164:3000`)
- [ ] IP adresi doğru mu? (`.env` dosyasını kontrol edin)
- [ ] Firewall mobil cihazdan erişime izin veriyor mu?
- [ ] Mobil cihaz ve bilgisayar aynı ağda mı?
- [ ] CORS ayarları doğru mu?

## 🔍 Debug Bilgileri

Network Test ekranında görüntülenen debug bilgileri:

```
📶 Network Bilgileri:
- Bağlı: ✅ Evet
- Tip: wifi
- İnternet Erişimi: ✅ Var
- SSID: MyWiFi
- IP: 192.168.1.100

🐛 Debug Bilgileri:
- API URL: http://10.196.224.164:3000
- Socket URL: http://10.196.224.164:3000
- Development Mode: ✅ Evet
- Platform: Android
- Device: Pixel 5
```

## 🚀 Offline Destek

### Queue Sistemi

```typescript
// Offline durumunda işlemler queue'ya eklenir
await apiQueue.add({
  url: '/payments',
  method: 'post',
  data: paymentData
});

// Online olduğunda otomatik işlenir
apiQueue.processQueue();
```

**Özellikler:**
- ✅ 24 saat otomatik temizlik
- ✅ Timestamp bazlı işlem takibi
- ✅ Senkronizasyon bildirimleri
- ✅ Hata durumunda retry mekanizması

## 📊 Cache Yönetimi

```typescript
// 1 saat cache freshness kontrolü
const cachedData = await storage.getCachedPayments();
if (storage.isCacheFresh(cachedData)) {
  return cachedData.data;
}

// Cache'i güncelle
await storage.cachePayments(newData);
```

## 🔧 Sorun Giderme

### Yaygın Hatalar ve Çözümleri

1. **"İnternet bağlantınızı kontrol edin"**
   - Network Test ile bağlantıyı kontrol edin
   - IP adresini doğrulayın
   - Web sunucusunun çalıştığından emin olun

2. **"Sunucuya bağlanılamıyor"**
   - Firewall ayarlarını kontrol edin
   - CORS konfigürasyonunu doğrulayın
   - Port 3000'in açık olduğundan emin olun

3. **"Oturum süreniz dolmuş"**
   - Token geçersiz, yeniden giriş yapın
   - API authentication kontrolü yapın

## 📈 Performans İzleme

Network Test sistemi aşağıdaki metrikleri izler:

- **Ping Süresi**: Sunucu yanıt süresi (ms)
- **API Yanıt Süresi**: Endpoint yanıt süreleri
- **Başarı Oranı**: API çağrılarının başarı yüzdesi
- **Offline Queue Boyutu**: Bekleyen işlem sayısı

## 🔄 Güncellemeler

### v1.0.0 (Mevcut)
- ✅ Network test sistemi
- ✅ Offline queue desteği
- ✅ Cache yönetimi
- ✅ Debug bilgileri
- ✅ CORS konfigürasyonu

### Gelecek Güncellemeler
- 📊 Performans metrikleri dashboard'u
- 🔔 Proaktif network durumu bildirimleri
- 📱 Push notification entegrasyonu
- 🔧 Otomatik network konfigürasyonu

## 📞 Destek

Network sorunları yaşadığınızda:

1. **Network Test** sistemini kullanarak problemi teşhis edin
2. **Debug bilgilerini** kaydedin
3. **Console log'larını** kontrol edin
4. **Hata mesajlarını** not alın

---

**Not**: Bu sistem geliştirme ortamı için optimize edilmiştir. Production ortamında HTTPS ve güvenlik sertifikaları kullanılmalıdır. 