/**
 * React Native için Base64 işlemleri
 */

// Base64 karakter tablosu
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

// Base64 encode fonksiyonu
export const encode = (input: string): string => {
  let output = '';
  let i = 0;
  let chr1, chr2, chr3, enc1, enc2, enc3, enc4;

  while (i < input.length) {
    chr1 = input.charCodeAt(i++);
    chr2 = i < input.length ? input.charCodeAt(i++) : Number.NaN;
    chr3 = i < input.length ? input.charCodeAt(i++) : Number.NaN;

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }

  return output;
};

// Base64 decode fonksiyonu
export const decode = (input: string): string => {
  let output = '';
  let i = 0;
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;

  // Base64 dışı karakterleri temizleme
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  while (i < input.length) {
    enc1 = chars.indexOf(input.charAt(i++));
    enc2 = chars.indexOf(input.charAt(i++));
    enc3 = chars.indexOf(input.charAt(i++));
    enc4 = chars.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }

  return output;
};

// Base64Url'yi Base64'e çevirme
export const urlToBase64 = (base64Url: string): string => {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Padding ekle
  while (base64.length % 4) {
    base64 += '=';
  }
  
  return base64;
};

// Base64Url decode fonksiyonu
export const decodeBase64Url = (base64Url: string): string => {
  try {
    const base64 = urlToBase64(base64Url);
    let decodedString = decode(base64);
    
    // UTF-8 karakterlerini decode et
    try {
      return decodeURIComponent(
        decodedString
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch (e) {
      console.error('UTF-8 decode hatası:', e);
      return decodedString;
    }
  } catch (e) {
    console.error('Base64Url decode hatası:', e);
    return '';
  }
};

// JWT token'ından payload kısmını çıkarma ve decode etme
export const decodeJwtPayload = (token: string): any => {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    
    const decodedPayload = decodeBase64Url(parts[1]);
    return JSON.parse(decodedPayload);
  } catch (e) {
    console.error('JWT decode hatası:', e);
    return null;
  }
}; 