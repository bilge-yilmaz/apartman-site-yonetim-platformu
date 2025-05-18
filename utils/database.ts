import * as SQLite from 'expo-sqlite';
import { Payment } from '../services/api'; // Assuming Payment type is defined here

const DATABASE_NAME = 'app.db';

// Type for cached data, including a timestamp
interface CachedData<T> {
  data: T[];
  timestamp: string;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

const getDb = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    // Expo SDK 49+ (SQLite v12+) için:
    // dbInstance = SQLite.openDatabaseAsync(DATABASE_NAME);
    // Daha eski SDK'lar veya sync tercih edilirse:
    dbInstance = SQLite.openDatabaseSync(DATABASE_NAME);
    if (!dbInstance) {
      throw new Error('Failed to open database');
    }
  }
  return dbInstance;
};

// Type alias for the transaction object provided by withTransactionAsync
// This might need adjustment based on actual expo-sqlite typings for async transactions
// import { type SQLiteTransaction } from 'expo-sqlite/next'; // Eğer bu import çalışmıyorsa aşağıdaki çözüm kullanılır.

// Type for execAsync statements (expo-sqlite v12+ style)
interface SQLStatement {
  sql: string;
  args: unknown[];
}

// Initialize database and create tables if they don't exist
const initDatabase = async (): Promise<void> => {
  const db = getDb();
  try {
    await db.withTransactionAsync(async function(this: any) {
      await this.executeSqlAsync(
        `CREATE TABLE IF NOT EXISTS payments_cache (
            id TEXT PRIMARY KEY NOT NULL,
            userId TEXT,
            data TEXT NOT NULL,
            lastUpdated TEXT NOT NULL
        );`,
        []
      );
    });
    console.log('Database initialized successfully (payments_cache table checked/created).');
  } catch (error) {
    console.error('Error during DB initialization:', error);
    throw error;
  }
};

// --- Payments Cache Functions ---

export const cachePaymentsDb = async (payments: Payment[], userId: string): Promise<void> => {
  const db = getDb();
  const timestamp = new Date().toISOString();

  try {
    await db.withTransactionAsync(async function(this: any) {
      await this.executeSqlAsync('DELETE FROM payments_cache WHERE userId = ?;', [userId]);

      for (const payment of payments) {
        await this.executeSqlAsync(
          'INSERT INTO payments_cache (id, userId, data, lastUpdated) VALUES (?, ?, ?, ?);',
          [payment._id, userId, JSON.stringify(payment), timestamp]
        );
      }
    });
    console.log(`Payments cached successfully for user ${userId} in SQLite.`);
  } catch (error) {
    console.error('Transaction error caching payments:', error);
    throw error;
  }
};

// Tip tanımı: SQLite'dan dönen satırların yapısı için.
interface PaymentCacheRow {
  id: string;
  userId: string;
  data: string; // JSON string of Payment
  lastUpdated: string;
}

export const getCachedPaymentsDb = async (userId: string): Promise<Payment[] | null> => {
  const db = getDb();
  try {
    // Read-only işlemleri için getAllAsync daha uygun olabilir.
    const results = await db.getAllAsync<PaymentCacheRow>(
      'SELECT id, userId, data, lastUpdated FROM payments_cache WHERE userId = ? ORDER BY lastUpdated DESC;',
      [userId]
    );

    if (results && results.length > 0) {
      const payments = results.map(row => JSON.parse(row.data));
      console.log(`Retrieved ${payments.length} cached payments for user ${userId} from SQLite`);
      return payments;
    } else {
      console.log(`No cached payments found for user ${userId} in SQLite`);
      return null;
    }
  } catch (error) {
    console.error('Error executing getCachedPaymentsDb query:', error);
    throw error;
  }
};

// Helper to check freshness, similar to storage.ts but can be adapted for DB
export const isCacheFreshDb = (lastUpdated: string | null): boolean => {
  if (!lastUpdated) return false;
  const cacheTime = new Date(lastUpdated).getTime();
  const now = new Date().getTime();
  const hourInMs = 60 * 60 * 1000; // 1 hour
  return now - cacheTime < hourInMs;
};

// Call initDatabase when this module is loaded or explicitly in App.tsx
initDatabase().catch(err => console.error("Failed to initialize database on load:", err));

export default {
  initDatabase,
  cachePaymentsDb,
  getCachedPaymentsDb,
  isCacheFreshDb,
  // Add other DB operations for other modules here
}; 