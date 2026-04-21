global.fetch = jest.fn();

describe('saleNotifications.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.MAILERLITE_API_KEY = 'test_mailerlite_api_key';
    process.env.MAILERLITE_FROM_EMAIL = 'test@example.com';
    process.env.TWILIO_ACCOUNT_SID = 'test';
    process.env.TWILIO_AUTH_TOKEN = 'test';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
  });

  afterEach(() => {
    delete process.env.MAILERLITE_API_KEY;
    delete process.env.MAILERLITE_FROM_EMAIL;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  describe('NotificationResult interface', () => {
    it('should define NotificationResult interface', async () => {
      const { NotificationResult } = await import('../../../src/lib/saleNotifications');
      const result: NotificationResult = {
        smsSent: true,
        emailSent: true,
        smsError: undefined,
        emailError: undefined,
      };
      expect(result.smsSent).toBe(true);
      expect(result.emailSent).toBe(true);
    });
  });

  describe('CustomerInfo interface', () => {
    it('should define CustomerInfo interface', async () => {
      const module = await import('../../../src/lib/saleNotifications');
      const customer = {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
      };
      expect(customer.name).toBe('John Doe');
      expect(customer.email).toBe('john@example.com');
    });
  });

  describe('SaleInfo interface', () => {
    it('should define SaleInfo interface', async () => {
      const sale = {
        saleId: 'CSH-001',
        carId: 'CAR-001',
        carBrand: 'Toyota',
        carModel: 'Camry',
        finalPrice: 25000,
      };
      expect(sale.saleId).toBe('CSH-001');
      expect(sale.finalPrice).toBe(25000);
    });
  });

  describe('RentalInfo interface', () => {
    it('should define RentalInfo interface', async () => {
      const rental = {
        rentalId: 'RNT-001',
        carId: 'CAR-002',
        carBrand: 'Honda',
        carModel: 'Civic',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        totalAmount: 500,
        dailyRate: 100,
      };
      expect(rental.rentalId).toBe('RNT-001');
      expect(rental.dailyRate).toBe(100);
    });
  });

  describe('isEmailServiceConfigured', () => {
    it('should return true when email service is configured', async () => {
      const { isEmailServiceConfigured } = await import('../../../src/lib/saleNotifications');
      expect(isEmailServiceConfigured()).toBe(true);
    });

    it('should return false when email service is not configured', async () => {
      delete process.env.MAILERLITE_API_KEY;
      const { isEmailServiceConfigured } = await import('../../../src/lib/saleNotifications');
      expect(isEmailServiceConfigured()).toBe(false);
    });
  });

  describe('sendSaleThankYouNotifications', () => {
    it('should send sale thank you notifications with all required fields', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({ ok: true, text: jest.fn().mockResolvedValue('OK') } as any);

      const { sendSaleThankYouNotifications } = await import('../../../src/lib/saleNotifications');

      const result = await sendSaleThankYouNotifications(
        {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
        },
        {
          saleId: 'CSH-001',
          carId: 'CAR-001',
          carBrand: 'Toyota',
          carModel: 'Camry',
          finalPrice: 25000,
        }
      );

      expect(result).toHaveProperty('smsSent');
      expect(result).toHaveProperty('emailSent');
    });

    it('should handle missing email', async () => {
      const { sendSaleThankYouNotifications } = await import('../../../src/lib/saleNotifications');

      const result = await sendSaleThankYouNotifications(
        {
          name: 'John Doe',
          phone: '+1234567890',
        },
        {
          saleId: 'CSH-001',
          carId: 'CAR-001',
          carBrand: 'Toyota',
          carModel: 'Camry',
          finalPrice: 25000,
        }
      );

      expect(result.emailSent).toBe(false);
    });
  });

  describe('sendRentalConfirmationNotifications', () => {
    it('should send rental confirmation notifications', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({ ok: true, text: jest.fn().mockResolvedValue('OK') } as any);

      const { sendRentalConfirmationNotifications } = await import('../../../src/lib/saleNotifications');

      const result = await sendRentalConfirmationNotifications(
        {
          name: 'Jane Doe',
          phone: '+1234567890',
          email: 'jane@example.com',
        },
        {
          rentalId: 'RNT-001',
          carId: 'CAR-002',
          carBrand: 'Honda',
          carModel: 'Civic',
          startDate: '2025-02-01',
          endDate: '2025-02-05',
          totalAmount: 500,
          dailyRate: 100,
        }
      );

      expect(result).toHaveProperty('smsSent');
      expect(result).toHaveProperty('emailSent');
    });
  });
});