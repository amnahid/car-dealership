import { calculateAccruedLateFee, recalculateInstallmentTotals } from '../../../src/lib/installmentUtils';

describe('installmentUtils.ts', () => {
  describe('calculateAccruedLateFee', () => {
    const monthlyFee = 200;

    it('should return 0 for on-time payment (0 days overdue)', () => {
      expect(calculateAccruedLateFee(0, monthlyFee)).toBe(0);
    });

    it('should return 0 for payment within grace period (5 days overdue)', () => {
      expect(calculateAccruedLateFee(5, monthlyFee)).toBe(0);
    });

    it('should return 0 for payment on the last day of grace period (10 days overdue)', () => {
      expect(calculateAccruedLateFee(10, monthlyFee)).toBe(0);
    });

    it('should return monthly fee for payment 11 days overdue', () => {
      expect(calculateAccruedLateFee(11, monthlyFee)).toBe(200);
    });

    it('should return monthly fee for payment 15 days overdue', () => {
      expect(calculateAccruedLateFee(15, monthlyFee)).toBe(200);
    });

    it('should return monthly fee for payment 40 days overdue', () => {
      expect(calculateAccruedLateFee(40, monthlyFee)).toBe(200);
    });

    it('should return double monthly fee for payment 41 days overdue', () => {
      expect(calculateAccruedLateFee(41, monthlyFee)).toBe(400);
    });

    it('should return double monthly fee for payment 70 days overdue', () => {
      expect(calculateAccruedLateFee(70, monthlyFee)).toBe(400);
    });

    it('should return triple monthly fee for payment 71 days overdue', () => {
      expect(calculateAccruedLateFee(71, monthlyFee)).toBe(600);
    });

    it('should use default monthly fee of 200 if not provided', () => {
      expect(calculateAccruedLateFee(15)).toBe(200);
    });

    it('should handle large overdue periods', () => {
      expect(calculateAccruedLateFee(370, monthlyFee)).toBe(2400);
    });
  });

  describe('recalculateInstallmentTotals', () => {
    const fixedNow = new Date('2026-06-15T00:00:00.000Z');

    it('should correctly calculate initial unpaid schedule with Active status', () => {
      const loanAmount = 6000;
      const schedule = [
        { installmentNumber: 1, dueDate: '2026-07-01', amount: 2000, status: 'Pending' },
        { installmentNumber: 2, dueDate: '2026-08-01', amount: 2000, status: 'Pending' },
        { installmentNumber: 3, dueDate: '2026-09-01', amount: 2000, status: 'Pending' },
      ];

      const res = recalculateInstallmentTotals(loanAmount, schedule, fixedNow);

      expect(res.totalPaid).toBe(0);
      expect(res.lateFeeCharged).toBe(0);
      expect(res.remainingAmount).toBe(6000);
      expect(res.saleStatus).toBe('Active');
      expect(res.carStatus).toBe('On Installment');
      expect(res.nextPaymentDate).toEqual(new Date('2026-07-01'));
      expect(res.nextPaymentAmount).toBe(2000);
    });

    it('should correctly calculate totals when payments are recorded with late fees', () => {
      const loanAmount = 6000;
      const schedule = [
        { installmentNumber: 1, dueDate: '2026-05-01', amount: 2000, status: 'Paid', paidAmount: 2200, lateFee: 200 },
        { installmentNumber: 2, dueDate: '2026-07-01', amount: 2000, status: 'Pending' },
        { installmentNumber: 3, dueDate: '2026-08-01', amount: 2000, status: 'Pending' },
      ];

      const res = recalculateInstallmentTotals(loanAmount, schedule, fixedNow);

      expect(res.totalPaid).toBe(2200);
      expect(res.lateFeeCharged).toBe(200);
      // Principal paid = 2200 - 200 = 2000. Remaining = 6000 - 2000 = 4000.
      expect(res.remainingAmount).toBe(4000);
      expect(res.saleStatus).toBe('Active');
      expect(res.carStatus).toBe('On Installment');
      expect(res.nextPaymentDate).toEqual(new Date('2026-07-01'));
      expect(res.nextPaymentAmount).toBe(2000);
    });

    it('should handle payment editing (adjusting paid amount and fee)', () => {
      const loanAmount = 6000;
      // User edited installment #1 from 2200 (200 fee) to 2000 (0 fee)
      const schedule = [
        { installmentNumber: 1, dueDate: '2026-05-01', amount: 2000, status: 'Paid', paidAmount: 2000, lateFee: 0 },
        { installmentNumber: 2, dueDate: '2026-07-01', amount: 2000, status: 'Pending' },
        { installmentNumber: 3, dueDate: '2026-08-01', amount: 2000, status: 'Pending' },
      ];

      const res = recalculateInstallmentTotals(loanAmount, schedule, fixedNow);

      expect(res.totalPaid).toBe(2000);
      expect(res.lateFeeCharged).toBe(0);
      expect(res.remainingAmount).toBe(4000);
      expect(res.saleStatus).toBe('Active');
    });

    it('should accurately handle payment reversion (undoing payment)', () => {
      const loanAmount = 6000;
      // Installment #1 was reverted back to Overdue because its dueDate 2026-05-01 is past fixedNow 2026-06-15
      const schedule = [
        { installmentNumber: 1, dueDate: '2026-05-01', amount: 2000, status: 'Overdue' },
        { installmentNumber: 2, dueDate: '2026-07-01', amount: 2000, status: 'Pending' },
        { installmentNumber: 3, dueDate: '2026-08-01', amount: 2000, status: 'Pending' },
      ];

      const res = recalculateInstallmentTotals(loanAmount, schedule, fixedNow);

      expect(res.totalPaid).toBe(0);
      expect(res.lateFeeCharged).toBe(0);
      expect(res.remainingAmount).toBe(6000);
      expect(res.saleStatus).toBe('Defaulted');
      expect(res.carStatus).toBe('Defaulted');
      expect(res.nextPaymentDate).toEqual(new Date('2026-05-01'));
      expect(res.nextPaymentAmount).toBe(2000);
    });

    it('should mark sale and car as Completed / Sold when all installments are paid', () => {
      const loanAmount = 6000;
      const schedule = [
        { installmentNumber: 1, dueDate: '2026-04-01', amount: 2000, status: 'Paid', paidAmount: 2000, lateFee: 0 },
        { installmentNumber: 2, dueDate: '2026-05-01', amount: 2000, status: 'Paid', paidAmount: 2000, lateFee: 0 },
        { installmentNumber: 3, dueDate: '2026-06-01', amount: 2000, status: 'Paid', paidAmount: 2100, lateFee: 100 },
      ];

      const res = recalculateInstallmentTotals(loanAmount, schedule, fixedNow);

      expect(res.totalPaid).toBe(6100);
      expect(res.lateFeeCharged).toBe(100);
      expect(res.remainingAmount).toBe(0);
      expect(res.saleStatus).toBe('Completed');
      expect(res.carStatus).toBe('Sold');
      expect(res.nextPaymentDate).toBeNull();
      expect(res.nextPaymentAmount).toBe(0);
    });

    it('should transition from Completed back to Active / Defaulted if a payment is reverted', () => {
      const loanAmount = 6000;
      // 3rd installment was reverted
      const schedule = [
        { installmentNumber: 1, dueDate: '2026-04-01', amount: 2000, status: 'Paid', paidAmount: 2000, lateFee: 0 },
        { installmentNumber: 2, dueDate: '2026-05-01', amount: 2000, status: 'Paid', paidAmount: 2000, lateFee: 0 },
        { installmentNumber: 3, dueDate: '2026-07-01', amount: 2000, status: 'Pending' },
      ];

      const res = recalculateInstallmentTotals(loanAmount, schedule, fixedNow);

      expect(res.totalPaid).toBe(4000);
      expect(res.lateFeeCharged).toBe(0);
      expect(res.remainingAmount).toBe(2000);
      expect(res.saleStatus).toBe('Active');
      expect(res.carStatus).toBe('On Installment');
      expect(res.nextPaymentDate).toEqual(new Date('2026-07-01'));
      expect(res.nextPaymentAmount).toBe(2000);
    });
  });
});

