import { calculateAccruedLateFee } from '../../../src/lib/installmentUtils';

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
      // 10 + (12 * 30) = 370 days (1 year overdue)
      // 11-40 (1), 41-70 (2), 71-100 (3), 101-130 (4), 131-160 (5), 161-190 (6), 
      // 191-220 (7), 221-250 (8), 251-280 (9), 281-310 (10), 311-340 (11), 341-370 (12)
      expect(calculateAccruedLateFee(370, monthlyFee)).toBe(2400);
    });
  });
});
