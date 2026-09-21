import mongoose from 'mongoose';

const mockMongoose = {
  connect: jest.fn().mockImplementation(() => Promise.resolve(mockMongoose)),
  connection: {
    readyState: 0,
  },
};

jest.mock('mongoose', () => mockMongoose);

describe('db.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMongoose.connect.mockImplementation(() => Promise.resolve(mockMongoose));
    mockMongoose.connection.readyState = 0;
    (global as any).mongooseCache = { conn: null, promise: null };
  });

  describe('connectDB', () => {
    it('should connect to MongoDB successfully', async () => {
      mockMongoose.connect.mockResolvedValue(mockMongoose as any);

      const { connectDB } = await import('../../../src/lib/db');
      const result = await connectDB();

      expect(mockMongoose.connect).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should reuse existing connection if ready', async () => {
      mockMongoose.connection.readyState = 1;
      (global as any).mongooseCache = { conn: mockMongoose as any, promise: null };

      const { connectDB } = await import('../../../src/lib/db');
      const result = await connectDB();

      expect(mockMongoose.connect).not.toHaveBeenCalled();
      expect(result).toBe(mockMongoose);
    });

    it('should throw DatabaseConnectionError on connection failure', async () => {
      mockMongoose.connect.mockRejectedValue(new Error('ECONNREFUSED'));

      const { connectDB, DatabaseConnectionError } = await import('../../../src/lib/db');

      await expect(connectDB()).rejects.toThrow();
    });
  });

  describe('DatabaseConnectionError', () => {
    it('should create error with correct statusCode', async () => {
      const { DatabaseConnectionError } = await import('../../../src/lib/db');
      const error = new DatabaseConnectionError('Connection failed');

      expect(error.name).toBe('DatabaseConnectionError');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Connection failed');
    });
  });

  describe('runInTransaction', () => {
    it('should execute successfully inside an active transaction when supported', async () => {
      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (cb: () => Promise<void>) => {
          await cb();
        }),
        endSession: jest.fn().mockResolvedValue(undefined),
      };

      (mockMongoose as any).startSession = jest.fn().mockResolvedValue(mockSession);
      mockMongoose.connection.readyState = 1;
      (global as any).mongooseCache = { conn: mockMongoose as any, promise: null };

      const { runInTransaction } = await import('../../../src/lib/db');

      let sessionPassed: any = null;
      const result = await runInTransaction(async (session) => {
        sessionPassed = session;
        return { paymentRecorded: true };
      });

      expect(result).toEqual({ paymentRecorded: true });
      expect(sessionPassed).toBe(mockSession);
      expect(mockSession.withTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should gracefully fallback to non-transactional execution (null session) on MongoClient session mismatch error', async () => {
      const mockSession = {
        withTransaction: jest.fn().mockRejectedValue(
          new Error('MongoInvalidArgumentError: ClientSession must be from the same MongoClient')
        ),
        endSession: jest.fn().mockResolvedValue(undefined),
      };

      (mockMongoose as any).startSession = jest.fn().mockResolvedValue(mockSession);
      mockMongoose.connection.readyState = 1;
      (global as any).mongooseCache = { conn: mockMongoose as any, promise: null };

      const { runInTransaction } = await import('../../../src/lib/db');

      let sessionPassed: any = undefined;
      const result = await runInTransaction(async (session) => {
        sessionPassed = session;
        return { fallbackRecorded: true };
      });

      expect(result).toEqual({ fallbackRecorded: true });
      expect(sessionPassed).toBeNull();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should gracefully fallback to non-transactional execution when standalone replica set error occurs', async () => {
      const standaloneError: any = new Error('Transaction numbers are only allowed on a replica set member or mongos');
      standaloneError.code = 20;

      const mockSession = {
        withTransaction: jest.fn().mockRejectedValue(standaloneError),
        endSession: jest.fn().mockResolvedValue(undefined),
      };

      (mockMongoose as any).startSession = jest.fn().mockResolvedValue(mockSession);
      mockMongoose.connection.readyState = 1;
      (global as any).mongooseCache = { conn: mockMongoose as any, promise: null };

      const { runInTransaction } = await import('../../../src/lib/db');

      let sessionPassed: any = undefined;
      const result = await runInTransaction(async (session) => {
        sessionPassed = session;
        return { standaloneRecorded: true };
      });

      expect(result).toEqual({ standaloneRecorded: true });
      expect(sessionPassed).toBeNull();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should gracefully fallback when startSession itself fails', async () => {
      (mockMongoose as any).startSession = jest.fn().mockRejectedValue(new Error('Sessions not supported'));
      mockMongoose.connection.readyState = 1;
      (global as any).mongooseCache = { conn: mockMongoose as any, promise: null };

      const { runInTransaction } = await import('../../../src/lib/db');

      let sessionPassed: any = undefined;
      const result = await runInTransaction(async (session) => {
        sessionPassed = session;
        return { noSessionRecorded: true };
      });

      expect(result).toEqual({ noSessionRecorded: true });
      expect(sessionPassed).toBeNull();
    });
  });
});