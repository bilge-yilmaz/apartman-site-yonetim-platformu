const fs = require('fs');
const path = require('path');

console.log('🧹 Cache temizleniyor...');

// AsyncStorage cache dosyalarını temizle (eğer varsa)
const cacheDir = path.join(__dirname, '../.expo');
if (fs.existsSync(cacheDir)) {
  console.log('📁 .expo klasörü temizleniyor...');
  fs.rmSync(cacheDir, { recursive: true, force: true });
}

// Metro cache'i temizle
const metroCacheDir = path.join(__dirname, '../node_modules/.cache');
if (fs.existsSync(metroCacheDir)) {
  console.log('📁 Metro cache temizleniyor...');
  fs.rmSync(metroCacheDir, { recursive: true, force: true });
}

console.log('✅ Cache temizlendi!');
console.log('📱 Şimdi mobil uygulamayı başlatın: npx expo start --clear'); 