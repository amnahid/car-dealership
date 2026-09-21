import { calculateAccruedLateFee } from '@/lib/installmentUtils';

describe('Installment Late Fee Calculation Tests', () => {
  it('should charge 0 SAR within the 10-day grace period', () => {
    expect(calculateAccruedLateFee(0, 200)).toBe(0);
    expect(calculateAccruedLateFee(5, 200)).toBe(0);
    expect(calculateAccruedLateFee(10, 200)).toBe(0);
  });

  it('should charge 1x monthly late fee for 11 to 40 days overdue', () => {
    expect(calculateAccruedLateFee(11, 200)).toBe(200);
    expect(calculateAccruedLateFee(25, 200)).toBe(200);
    expect(calculateAccruedLateFee(40, 200)).toBe(200);
  });

  it('should charge 2x monthly late fee for 41 to 70 days overdue', () => {
    expect(calculateAccruedLateFee(41, 200)).toBe(400);
    expect(calculateAccruedLateFee(55, 200)).toBe(400);
    expect(calculateAccruedLateFee(70, 200)).toBe(400);
  });

  it('should scale appropriately with custom monthlyLateFee', () => {
    expect(calculateAccruedLateFee(15, 350)).toBe(350);
    expect(calculateAccruedLateFee(45, 350)).toBe(700);
  });
});
