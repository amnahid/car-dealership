import Repair from '@/models/Repair';
import mongoose from 'mongoose';

describe('Repair Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const repair = new Repair({});

    let err: any;
    try {
      await repair.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.car).toBeDefined();
    expect(err.errors.carId).toBeDefined();
    expect(err.errors.repairDescription).toBeDefined();
    expect(err.errors.repairDate).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default value for status and isDeleted', () => {
    const repair = new Repair({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      repairDescription: 'Oil change',
      repairDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(repair.status).toBe('Pending');
    expect(repair.isDeleted).toBe(false);
  });
});
