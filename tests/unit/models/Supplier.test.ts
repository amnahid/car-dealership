import Supplier from '@/models/Supplier';
import mongoose from 'mongoose';

describe('Supplier Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const supplier = new Supplier({});

    let err: any;
    try {
      await supplier.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.companyName).toBeDefined();
    expect(err.errors.companyNumber).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default value for status and isDeleted', () => {
    const supplier = new Supplier({
      companyName: 'Test Corp',
      companyNumber: '123',
      phone: '123456',
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(supplier.status).toBe('active');
    expect(supplier.isDeleted).toBe(false);
  });
});
