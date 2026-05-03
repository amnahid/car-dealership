import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car-dealership';
const DB_CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export class DatabaseConnectionError extends Error {
  readonly statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

function isMongoConnectivityError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;

  const message = error.message;
  const name = error.name;

  return (
    /ECONNREFUSED|ENOTFOUND|timed out|authentication failed|connection <monitor>.*closed/i.test(message) ||
    /MongooseServerSelectionError|MongoServerSelectionError/i.test(name)
  );
}

export async function connectDB(): Promise<typeof mongoose> {
  // Reuse only healthy connected instances; reconnect after disconnects.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: DB_CONNECT_TIMEOUT_MS,
        connectTimeoutMS: DB_CONNECT_TIMEOUT_MS,
      })
      .catch((error: unknown) => {
        cached.promise = null;

        if (error instanceof Error && error.message.includes('Password contains unescaped characters')) {
          throw new DatabaseConnectionError(
            `${error.message}. If you use MongoDB Atlas, URL-encode your password (e.g. encodeURIComponent(password)).`
          );
        }

        if (error instanceof Error && /ECONNREFUSED/.test(error.message)) {
          throw new DatabaseConnectionError(
            [
              `Unable to connect to MongoDB at ${MONGODB_URI}.`,
              'MongoDB is not running or the connection string is incorrect.',
              'Start a local MongoDB server or update MONGODB_URI in .env.local.',
            ].join(' ')
          );
        }

        if (isMongoConnectivityError(error)) {
          throw new DatabaseConnectionError(
            [
              `Unable to connect to MongoDB at ${MONGODB_URI}.`,
              'Verify MONGODB_URI, database availability, and network access.',
              'If using a local instance, ensure MongoDB is running and reachable on the configured host/port.',
            ].join(' ')
          );
        }

        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Safely runs a callback within a MongoDB transaction.
 * Automatically falls back to non-transactional execution if the MongoDB 
 * instance is a standalone (not a replica set), which is common in local dev.
 */
export async function runInTransaction<T>(
  callback: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    try {
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result as T;
    } catch (error: any) {
      // Error code 20 or specific message indicates standalone mode
      if (error.code === 20 || error.message?.includes('replica set')) {
        return await callback(session);
      }
      throw error;
    }
  } finally {
    await session.endSession();
  }
}
