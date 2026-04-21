import mongoose from 'mongoose';

const mockMongoose = {
  connect: jest.fn(),
  connection: {
    readyState: 0,
  },
};

jest.mock('mongoose', () => mockMongoose);

describe('db.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});