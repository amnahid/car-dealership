global.fetch = jest.fn();

describe('email.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test_api_key';
    process.env.RESEND_FROM_EMAIL = 'noreply@test.com';
    process.env.RESEND_FROM_NAME = 'Test App';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_FROM_NAME;
  });

  describe('isEmailServiceConfigured', () => {
    it('should return true when API key is configured', async () => {
      const { isEmailServiceConfigured } = await import('../../../src/lib/email');
      expect(isEmailServiceConfigured()).toBe(true);
    });

    it('should return false when API key is not set', async () => {
      delete process.env.RESEND_API_KEY;
      const { isEmailServiceConfigured } = await import('../../../src/lib/email');
      expect(isEmailServiceConfigured()).toBe(false);
    });

    it('should return false when API key is placeholder', async () => {
      process.env.RESEND_API_KEY = 'your_resend_api_key_here';
      const { isEmailServiceConfigured } = await import('../../../src/lib/email');
      expect(isEmailServiceConfigured()).toBe(false);
    });
  });

  describe('sendExpiryAlertEmail', () => {
    it('should return error when email service not configured', async () => {
      delete process.env.RESEND_API_KEY;
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
  });

  describe('sendEmail', () => {
    it('should return error when email service not configured', async () => {
      delete process.env.RESEND_API_KEY;
      const { sendEmail } = await import('../../../src/lib/email');

      const result = await sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });
  });
});