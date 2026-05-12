jest.mock('../../../src/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/models/WhatsAppConfig', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
  },
}));

describe('whatsapp.ts', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    global.fetch = jest.fn() as jest.Mock;
    process.env.META_WA_ACCESS_TOKEN = 'test_token';
    process.env.META_WA_PHONE_NUMBER_ID = 'test_id';
    process.env.META_WA_ADMIN_PHONE = '1987654321';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.META_WA_ACCESS_TOKEN;
    delete process.env.META_WA_PHONE_NUMBER_ID;
    delete process.env.META_WA_ADMIN_PHONE;
  });

  describe('isWhatsAppServiceConfigured', () => {
    it('should return true when all Meta credentials are configured', async () => {
      const { isWhatsAppServiceConfigured } = await import('../../../src/lib/whatsapp');
      expect(await isWhatsAppServiceConfigured()).toBe(true);
    });

    it('should return false when access token is missing', async () => {
      delete process.env.META_WA_ACCESS_TOKEN;
      const { isWhatsAppServiceConfigured } = await import('../../../src/lib/whatsapp');
      expect(await isWhatsAppServiceConfigured()).toBe(false);
    });

    it('should return false when phone number ID is missing', async () => {
      delete process.env.META_WA_PHONE_NUMBER_ID;
      const { isWhatsAppServiceConfigured } = await import('../../../src/lib/whatsapp');
      expect(await isWhatsAppServiceConfigured()).toBe(false);
    });
  });

  describe('formatExpiryWhatsApp', () => {
    it('should format WhatsApp message with URGENT for <= 7 days', async () => {
      const { formatExpiryWhatsApp } = await import('../../../src/lib/whatsapp');
      const result = formatExpiryWhatsApp({
        carId: 'CAR-001',
        documentType: 'Registration',
        daysUntilExpiry: 5,
      });
      expect(result).toContain('URGENT');
      expect(result).toContain('CAR-001');
      expect(result).toContain('*DOCUMENT EXPIRING*');
    });

    it('should format WhatsApp message without URGENT for > 7 days', async () => {
      const { formatExpiryWhatsApp } = await import('../../../src/lib/whatsapp');
      const result = formatExpiryWhatsApp({
        carId: 'CAR-002',
        documentType: 'Insurance',
        daysUntilExpiry: 10,
      });
      expect(result).not.toContain('URGENT');
      expect(result).toContain('CAR-002');
    });
  });

  describe('sendWhatsAppMessage', () => {
    it('should return error when service not configured', async () => {
      delete process.env.META_WA_ACCESS_TOKEN;
      const { sendWhatsAppMessage } = await import('../../../src/lib/whatsapp');
      const result = await sendWhatsAppMessage('1987654321', 'Test message');
      expect(result.success).toBe(false);
      expect(result.error).toBe('WhatsApp service not configured');
    });

    it('should send WhatsApp successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          messages: [{ id: 'wa_id_123' }]
        }),
      });

      const { sendWhatsAppMessage } = await import('../../../src/lib/whatsapp');
      const result = await sendWhatsAppMessage('1987654321', 'Test message');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wa_id_123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('test_id'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_token',
          }),
        })
      );
    });

    it('should handle API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid parameter' }
        }),
      });

      const { sendWhatsAppMessage } = await import('../../../src/lib/whatsapp');
      const result = await sendWhatsAppMessage('1987654321', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid parameter');
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      const { sendWhatsAppMessage } = await import('../../../src/lib/whatsapp');
      const result = await sendWhatsAppMessage('1987654321', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network failure');
    });
  });

  describe('sendExpiryAlertWhatsApp', () => {
    it('should return error when admin phone not configured', async () => {
      delete process.env.META_WA_ADMIN_PHONE;
      const { sendExpiryAlertWhatsApp } = await import('../../../src/lib/whatsapp');
      const result = await sendExpiryAlertWhatsApp({
        carId: 'CAR-001',
        documentType: 'Registration',
        daysUntilExpiry: 5,
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin phone not configured');
    });

    it('should send alert WhatsApp successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          messages: [{ id: 'wa_id_456' }]
        }),
      });

      const { sendExpiryAlertWhatsApp } = await import('../../../src/lib/whatsapp');
      const result = await sendExpiryAlertWhatsApp({
        carId: 'CAR-001',
        documentType: 'Registration',
        daysUntilExpiry: 5,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wa_id_456');
    });
  });

  describe('sendBatchExpiryAlertWhatsApp', () => {
    it('should send batch of WhatsApp messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          messages: [{ id: 'wa_id_batch' }]
        }),
      });

      const { sendBatchExpiryAlertWhatsApp } = await import('../../../src/lib/whatsapp');
      const docInfos = [
        { carId: 'CAR-001', documentType: 'Registration', daysUntilExpiry: 5 },
        { carId: 'CAR-002', documentType: 'Insurance', daysUntilExpiry: 10 },
      ];

      const result = await sendBatchExpiryAlertWhatsApp(docInfos);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
});