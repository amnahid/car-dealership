jest.mock('twilio');

describe('sms.ts', () => {
  let mockTwilioModule: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockTwilioModule = require('twilio');
    process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
    process.env.TWILIO_ADMIN_PHONE = '+1987654321';
  });

  afterEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    delete process.env.TWILIO_ADMIN_PHONE;
  });

  describe('isSmsServiceConfigured', () => {
    it('should return true when all Twilio credentials are configured', async () => {
      const { isSmsServiceConfigured } = await import('../../../src/lib/sms');
      expect(isSmsServiceConfigured()).toBe(true);
    });

    it('should return false when account SID is missing', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      const { isSmsServiceConfigured } = await import('../../../src/lib/sms');
      expect(isSmsServiceConfigured()).toBe(false);
    });

    it('should return false when auth token is missing', async () => {
      delete process.env.TWILIO_AUTH_TOKEN;
      const { isSmsServiceConfigured } = await import('../../../src/lib/sms');
      expect(isSmsServiceConfigured()).toBe(false);
    });

    it('should return false when phone number is missing', async () => {
      delete process.env.TWILIO_PHONE_NUMBER;
      const { isSmsServiceConfigured } = await import('../../../src/lib/sms');
      expect(isSmsServiceConfigured()).toBe(false);
    });

    it('should return false when credentials are placeholders', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'your_twilio_account_sid';
      const { isSmsServiceConfigured } = await import('../../../src/lib/sms');
      expect(isSmsServiceConfigured()).toBe(false);
    });
  });

  describe('formatExpirySms', () => {
    it('should format SMS with URGENT for <= 7 days', async () => {
      const { formatExpirySms } = await import('../../../src/lib/sms');
      const result = formatExpirySms({
        carId: 'CAR-001',
        documentType: 'Registration',
        daysUntilExpiry: 5,
      });
      expect(result).toContain('URGENT');
      expect(result).toContain('CAR-001');
    });

    it('should format SMS without URGENT for > 7 days', async () => {
      const { formatExpirySms } = await import('../../../src/lib/sms');
      const result = formatExpirySms({
        carId: 'CAR-002',
        documentType: 'Insurance',
        daysUntilExpiry: 10,
      });
      expect(result).not.toContain('URGENT');
      expect(result).toContain('CAR-002');
    });
  });

  describe('sendExpirySms', () => {
    it('should return error when service not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      const { sendExpirySms } = await import('../../../src/lib/sms');
      const result = await sendExpirySms('+1987654321', 'Test message');
      expect(result.success).toBe(false);
      expect(result.error).toBe('SMS service not configured');
    });

    it('should send SMS successfully', async () => {
      const mockMessages = {
        create: jest.fn().mockResolvedValue({ sid: 'SM123456' }),
      };
      mockTwilioModule.mockImplementation(() => ({
        messages: mockMessages,
      }));

      const { sendExpirySms } = await import('../../../src/lib/sms');
      const result = await sendExpirySms('+1987654321', 'Test message');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123456');
    });

    it('should handle send error', async () => {
      const mockMessages = {
        create: jest.fn().mockRejectedValue(new Error('Twilio error')),
      };
      mockTwilioModule.mockImplementation(() => ({
        messages: mockMessages,
      }));

      const { sendExpirySms } = await import('../../../src/lib/sms');
      const result = await sendExpirySms('+1987654321', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Twilio error');
    });
  });

  describe('sendExpiryAlertSms', () => {
    it('should return error when admin phone not configured', async () => {
      delete process.env.TWILIO_ADMIN_PHONE;
      const { sendExpiryAlertSms } = await import('../../../src/lib/sms');
      const result = await sendExpiryAlertSms({
        carId: 'CAR-001',
        documentType: 'Registration',
        daysUntilExpiry: 5,
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin phone not configured');
    });

    it('should send alert SMS successfully', async () => {
      const mockMessages = {
        create: jest.fn().mockResolvedValue({ sid: 'SM123456' }),
      };
      mockTwilioModule.mockImplementation(() => ({
        messages: mockMessages,
      }));

      const { sendExpiryAlertSms } = await import('../../../src/lib/sms');
      const result = await sendExpiryAlertSms({
        carId: 'CAR-001',
        documentType: 'Registration',
        daysUntilExpiry: 5,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123456');
    });
  });

  describe('sendBatchExpiryAlertSms', () => {
    it('should send batch of SMS', async () => {
      const mockMessages = {
        create: jest.fn().mockResolvedValue({ sid: 'SM123456' }),
      };
      mockTwilioModule.mockImplementation(() => ({
        messages: mockMessages,
      }));

      const { sendBatchExpiryAlertSms } = await import('../../../src/lib/sms');
      const docInfos = [
        { carId: 'CAR-001', documentType: 'Registration', daysUntilExpiry: 5 },
        { carId: 'CAR-002', documentType: 'Insurance', daysUntilExpiry: 10 },
      ];

      const result = await sendBatchExpiryAlertSms(docInfos);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
});