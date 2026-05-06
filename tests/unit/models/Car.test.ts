import Car from '@/models/Car';
import mongoose from 'mongoose';

describe('Car Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const car = new Car({});

    let err: any;
    try {
      await car.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.brand).toBeDefined();
    expect(err.errors.model).toBeDefined();
    expect(err.errors.year).toBeDefined();
    expect(err.errors.chassisNumber).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default values for status, tafweedStatus, totalRepairCost, and isDeleted', async () => {
    const car = new Car({
      brand: 'Toyota',
      model: 'Camry',
      year: 2023,
      chassisNumber: 'CHASSIS123',
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(car.status).toBe('In Stock');
    expect(car.tafweedStatus).toBe('None');
    expect(car.totalRepairCost).toBe(0);
    expect(car.isDeleted).toBe(false);
  });

  it('should fail validation if status is not in enum', async () => {
    const car = new Car({
      brand: 'Toyota',
      model: 'Camry',
      year: 2023,
      chassisNumber: 'CHASSIS123',
      createdBy: new mongoose.Types.ObjectId(),
      status: 'InvalidStatus' as any,
    });

    let err: any;
    try {
      await car.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.status).toBeDefined();
    expect(err.errors.status.kind).toBe('enum');
  });
});
