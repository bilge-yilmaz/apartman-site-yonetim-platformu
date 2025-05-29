#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Renkli console output için
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.cyan}${colors.bright}🔧 ${msg}${colors.reset}`)
};

// Test konfigürasyonu
const config = {
  baseUrl: 'http://10.196.224.164:3000',
  endpoints: [
    '/api/test-endpoint',
    '/api/announcements',
    '/api/payments',
    '/api/maintenance'
  ],
  timeout: 5000
};

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      timeout: options.timeout || config.timeout,
      headers: {
        'User-Agent': 'Network-Test-Script/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

// Ping test
async function pingTest(url) {
  const startTime = Date.now();
  try {
    await makeRequest(url, { method: 'HEAD' });
    const duration = Date.now() - startTime;
    return { success: true, duration };
  } catch (error) {
    return { success: false, error: error.message, duration: Date.now() - startTime };
  }
}

// Endpoint test
async function testEndpoint(endpoint) {
  const url = config.baseUrl + endpoint;
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    return {
      endpoint,
      success: true,
      statusCode: response.statusCode,
      duration,
      dataSize: response.data.length
    };
  } catch (error) {
    return {
      endpoint,
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// Ana test fonksiyonu
async function runNetworkTests() {
  log.title('Apartman Yönetim Sistemi - Network Test');
  console.log('');
  
  log.info(`Test URL: ${config.baseUrl}`);
  log.info(`Timeout: ${config.timeout}ms`);
  console.log('');

  // 1. Ping Test
  log.info('🏓 Ping testi başlatılıyor...');
  const pingResult = await pingTest(config.baseUrl);
  
  if (pingResult.success) {
    log.success(`Ping başarılı! Süre: ${pingResult.duration}ms`);
  } else {
    log.error(`Ping başarısız! Hata: ${pingResult.error} (${pingResult.duration}ms)`);
  }
  console.log('');

  // 2. Endpoint Testleri
  log.info('🔗 API endpoint testleri başlatılıyor...');
  const results = [];
  
  for (const endpoint of config.endpoints) {
    log.info(`Testing ${endpoint}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      log.success(`${endpoint} - ${result.statusCode} (${result.duration}ms, ${result.dataSize} bytes)`);
    } else {
      log.error(`${endpoint} - ${result.error} (${result.duration}ms)`);
    }
  }
  
  console.log('');

  // 3. Özet Rapor
  log.title('Test Özeti');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = ((successful / total) * 100).toFixed(1);
  
  console.log(`📊 Başarı Oranı: ${successful}/${total} (${successRate}%)`);
  
  if (pingResult.success) {
    console.log(`⚡ Ping Süresi: ${pingResult.duration}ms`);
  }
  
  const avgDuration = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / successful;
  
  if (successful > 0) {
    console.log(`⏱️  Ortalama Yanıt Süresi: ${avgDuration.toFixed(0)}ms`);
  }
  
  console.log('');

  // 4. Öneriler
  if (successRate < 100) {
    log.warning('Sorun Giderme Önerileri:');
    console.log('  • Web sunucusunun çalıştığından emin olun');
    console.log('  • IP adresini kontrol edin (ipconfig)');
    console.log('  • Firewall ayarlarını kontrol edin');
    console.log('  • CORS konfigürasyonunu doğrulayın');
    console.log('');
  }

  // 5. Başlatma Komutları
  log.info('Sunucuları başlatmak için:');
  console.log('  Web: cd ../apartman-site-web && npm run dev');
  console.log('  Mobil: npx expo start');
  console.log('');

  return {
    pingSuccess: pingResult.success,
    successRate: parseFloat(successRate),
    results
  };
}

// Script çalıştırma
if (require.main === module) {
  runNetworkTests()
    .then(summary => {
      if (summary.pingSuccess && summary.successRate === 100) {
        log.success('Tüm testler başarılı! 🎉');
        process.exit(0);
      } else {
        log.error('Bazı testler başarısız oldu.');
        process.exit(1);
      }
    })
    .catch(error => {
      log.error(`Test hatası: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runNetworkTests, pingTest, testEndpoint }; 