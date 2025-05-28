// Environment variables test
console.log('=== Environment Variables Test ===')
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
console.log('NODE_ENV:', process.env.NODE_ENV)

// Tüm NEXT_PUBLIC_ değişkenlerini listele
console.log('\n=== All NEXT_PUBLIC_ Variables ===')
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key] ? 'SET' : 'NOT SET')
  }) 