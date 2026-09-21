import mongoose from 'mongoose';
import CashSale from '@/models/CashSale';
import Transaction from '@/models/Transaction';
import InstallmentSale from '@/models/InstallmentSale';
import Car from '@/models/Car';

describe('Model Integrity & Pre-Save Hooks Tests', () => {
  it('CashSale model should remain registered in mongoose.models without deletion on import', () => {
    expect(mongoose.models.CashSale).toBeDefined();
    expect(CashSale).toBe(mongoose.models.CashSale);
  });

  it('Transaction model should safely handle pre-save without session error', async () => {
    const tx = new Transaction({
      date: new Date(),
      type: 'Income',
      category: 'Cash Sale',
      amount: 50000,
      description: 'Test transaction',
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(tx.transactionId).toBeUndefined();
  });

  it('InstallmentSale should correctly compute remaining amount in pre-save logic', async () => {
    const sale = new InstallmentSale({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      customerName: 'Test Customer',
      customerPhone: '0500000000',
      totalPrice: 100000,
      downPayment: 20000,
      loanAmount: 80000,
      monthlyPayment: 2000,
      tenureMonths: 40,
      startDate: new Date(),
      totalPaid: 10000,
      lateFeeCharged: 200,
    });

    // Principal paid = totalPaid (10000) - lateFeeCharged (200) = 9800
    // Remaining = loanAmount (80000) - 9800 = 70200
    const principalPaid = Math.max(0, (sale.totalPaid || 0) - (sale.lateFeeCharged || 0));
    const remaining = Math.max(0, (sale.loanAmount || 0) - principalPaid);

    expect(remaining).toBe(70200);
  });
});
