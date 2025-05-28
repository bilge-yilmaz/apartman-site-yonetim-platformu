import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'

// MongoDB URI with fallback
const uri = process.env.MONGODB_URI || 'mongodb+srv://bilgeyilmaz121:6RlagK0hLnV3ruOY@turkey-crime-stats.bfnxn.mongodb.net/apartman-site?retryWrites=true&w=majority'

if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Mongoose bağlantısı
export async function connectDB() {
  try {
    if (mongoose.connections[0].readyState) {
      return mongoose.connections[0]
    }
    
    await mongoose.connect(uri)
    console.log('MongoDB bağlantısı başarılı')
    return mongoose.connections[0]
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error)
    throw error
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
