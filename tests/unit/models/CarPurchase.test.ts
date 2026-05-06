import CarPurchase from '@/models/CarPurchase';
import mongoose from 'mongoose';

describe('CarPurchase Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const purchase = new CarPurchase({});

    let err: any;
    try {
      await purchase.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.car).toBeDefined();
    expect(err.errors.supplierName).toBeDefined();
    expect(err.errors.purchasePrice).toBeDefined();
    expect(err.errors.purchaseDate).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default value for isNewCar', async () => {
    const purchase = new CarPurchase({
      car: new mongoose.Types.ObjectId(),
      supplierName: 'Best Supplier',
      purchasePrice: 50000,
      purchaseDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(purchase.isNewCar).toBe(true);
  });

  it('should fail validation if purchasePrice is negative', async () => {
    const purchase = new CarPurchase({
      car: new mongoose.Types.ObjectId(),
      supplierName: 'Best Supplier',
      purchasePrice: -100,
      purchaseDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });

    let err: any;
    try {
      await purchase.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.purchasePrice).toBeDefined();
    expect(err.errors.purchasePrice.kind).toBe('min');
  });
});
