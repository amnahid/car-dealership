global.fetch = jest.fn();

describe('email.ts', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.Mock;
    process.env.MAILERLITE_API_KEY = 'test_mailerlite_api_key';
    process.env.MAILERLITE_ADMIN_EMAIL = 'admin@test.com';
  });

  afterEach(() => {
    delete process.env.MAILERLITE_API_KEY;
    delete process.env.MAILERLITE_ADMIN_EMAIL;
  });

  describe('isEmailServiceConfigured', () => {
    it('should return true when API key is configured', async () => {
      const { isEmailServiceConfigured } = await import('../../../src/lib/email');
      expect(isEmailServiceConfigured()).toBe(true);
    });

    it('should return false when API key is not set', async () => {
      delete process.env.MAILERLITE_API_KEY;
      const { isEmailServiceConfigured } = await import('../../../src/lib/email');
      expect(isEmailServiceConfigured()).toBe(false);
    });

    it('should return false when API key is placeholder', async () => {
      process.env.MAILERLITE_API_KEY = 'your_mailerlite_api_key_here';
      const { isEmailServiceConfigured } = await import('../../../src/lib/email');
      expect(isEmailServiceConfigured()).toBe(false);
    });
  });

  describe('sendExpiryAlertEmail', () => {
    it('should return error when email service not configured', async () => {
      delete process.env.MAILERLITE_API_KEY;
      const { sendExpiryAlertEmail } = await import('../../../src/lib/email');

      const result = await sendExpiryAlertEmail('test@test.com', {
        carId: 'CAR-001',
        brand: 'Toyota',
        model: 'Camry',
        documentType: 'Registration',
        expiryDate: new Date(),
        daysUntilExpiry: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });

    it('should send email successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, text: jest.fn().mockResolvedValue('OK') } as any);

      const { sendExpiryAlertEmail } = await import('../../../src/lib/email');
      const result = await sendExpiryAlertEmail('test@test.com', {
        carId: 'CAR-001',
        brand: 'Toyota',
        model: 'Camry',
        documentType: 'Registration',
        expiryDate: new Date('2025-02-01'),
        daysUntilExpiry: 10,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mailerlite.com/api/v2/send',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: jest.fn().mockResolvedValue('Server Error') } as any);

      const { sendExpiryAlertEmail } = await import('../../../src/lib/email');
      const result = await sendExpiryAlertEmail('test@test.com', {
        carId: 'CAR-001',
        brand: 'Toyota',
        model: 'Camry',
        documentType: 'Registration',
        expiryDate: new Date(),
        daysUntilExpiry: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('MailerLite API error');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { sendExpiryAlertEmail } = await import('../../../src/lib/email');
      const result = await sendExpiryAlertEmail('test@test.com', {
        carId: 'CAR-001',
        brand: 'Toyota',
        model: 'Camry',
        documentType: 'Registration',
        expiryDate: new Date(),
        daysUntilExpiry: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendBatchExpiryAlertEmails', () => {
    it('should send batch of emails', async () => {
      mockFetch.mockResolvedValue({ ok: true, text: jest.fn().mockResolvedValue('OK') } as any);

      const { sendBatchExpiryAlertEmails } = await import('../../../src/lib/email');
      const docInfos = [
        { carId: 'CAR-001', brand: 'Toyota', model: 'Camry', documentType: 'Registration', expiryDate: new Date(), daysUntilExpiry: 5 },
        { carId: 'CAR-002', brand: 'Honda', model: 'Civic', documentType: 'Insurance', expiryDate: new Date(), daysUntilExpiry: 10 },
      ];

      const result = await sendBatchExpiryAlertEmails(docInfos);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
});