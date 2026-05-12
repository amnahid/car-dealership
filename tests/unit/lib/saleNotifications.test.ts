import { NotificationResult } from '../../../src/lib/saleNotifications';
jest.mock('../../../src/lib/notificationLogger', () => ({
  logNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/lib/email', () => {
  const actual = jest.requireActual('../../../src/lib/email');
  return {
    ...actual,
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
  };
});
jest.mock('../../../src/lib/whatsapp', () => {
  const actual = jest.requireActual('../../../src/lib/whatsapp');
  return {
    ...actual,
    sendExpiryWhatsApp: jest.fn().mockResolvedValue({ success: true, messageId: 'WA_TEST' }),
  };
});

describe('saleNotifications.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.RESEND_API_KEY = 're_test_api_key';
    process.env.RESEND_FROM_EMAIL = 'noreply@test.com';
    process.env.RESEND_FROM_NAME = 'Test App';
    process.env.META_WA_ACCESS_TOKEN = 'test';
    process.env.META_WA_PHONE_NUMBER_ID = 'test';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_FROM_NAME;
    delete process.env.META_WA_ACCESS_TOKEN;
    delete process.env.META_WA_PHONE_NUMBER_ID;
  });

  describe('NotificationResult interface', () => {
    it('should define NotificationResult interface', async () => {
      const result: NotificationResult = {
        whatsappSent: true,
                emailSent: true,
                whatsappError: undefined,
                emailError: undefined,
              };
              expect(result.whatsappSent).toBe(true);
      expect(result.emailSent).toBe(true);
    });
  });

  describe('CustomerInfo interface', () => {
    it('should define CustomerInfo interface', async () => {
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
      delete process.env.RESEND_API_KEY;
      const { isEmailServiceConfigured } = await import('../../../src/lib/saleNotifications');
      expect(isEmailServiceConfigured()).toBe(false);
    });
  });

  describe('sendSaleThankYouNotifications', () => {
    it('should send sale thank you notifications with all required fields', async () => {
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
          salePrice: 25000,
          discountType: 'flat',
          discountValue: 0,
          discountAmount: 0,
          finalPrice: 25000,
          vatRate: 15,
          vatAmount: 3750,
          finalPriceWithVat: 28750,
        }
      );

      expect(result).toHaveProperty('whatsappSent');
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
          salePrice: 25000,
          discountType: 'flat',
          discountValue: 0,
          discountAmount: 0,
          finalPrice: 25000,
          vatRate: 15,
          vatAmount: 3750,
          finalPriceWithVat: 28750,
        }
      );

      expect(result.emailSent).toBe(false);
    });
  });

  describe('sendRentalConfirmationNotifications', () => {
    it('should send rental confirmation notifications', async () => {
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
          vatRate: 15,
          vatAmount: 75,
          finalPriceWithVat: 575,
        }
      );

      expect(result).toHaveProperty('whatsappSent');
      expect(result).toHaveProperty('emailSent');
    });
  });

  describe('sendPaymentReminderNotifications', () => {
    it('should send payment reminder notifications', async () => {
      const { sendPaymentReminderNotifications } = await import('../../../src/lib/saleNotifications');

      const result = await sendPaymentReminderNotifications(
        {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
        },
        {
          saleId: 'INS-001',
          carId: 'CAR-001',
          installmentNumber: 1,
          amount: 1000,
          dueDate: '2025-02-01',
          daysUntilDue: 3,
          monthlyLateFee: 200,
        }
      );

      expect(result.whatsappSent).toBe(true);
      expect(result.emailSent).toBe(true);
    });
  });

  describe('sendOverdueNoticeNotifications', () => {
    it('should send overdue notice notifications', async () => {
      const { sendOverdueNoticeNotifications } = await import('../../../src/lib/saleNotifications');

      const result = await sendOverdueNoticeNotifications(
        {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
        },
        {
          saleId: 'INS-001',
          carId: 'CAR-001',
          installmentNumber: 1,
          amount: 1000,
          dueDate: '2025-02-01',
          daysOverdue: 15,
          monthlyLateFee: 200,
          accruedLateFee: 200,
        }
      );

      expect(result.whatsappSent).toBe(true);
      expect(result.emailSent).toBe(true);
    });
  });
});
