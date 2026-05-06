import Guarantor from '@/models/Guarantor';
import mongoose from 'mongoose';

describe('Guarantor Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const guarantor = new Guarantor({});

    let err: any;
    try {
      await guarantor.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.fullName).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.nationalId).toBeDefined();
    expect(err.errors.buildingNumber).toBeDefined();
    expect(err.errors.streetName).toBeDefined();
    expect(err.errors.district).toBeDefined();
    expect(err.errors.city).toBeDefined();
    expect(err.errors.postalCode).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default values for countryCode and isDeleted', async () => {
    const guarantor = new Guarantor({
      fullName: 'Test Guarantor',
      phone: '123456789',
      nationalId: '1234567890',
      buildingNumber: '1',
      streetName: 'Street',
      district: 'District',
      city: 'City',
      postalCode: '12345',
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(guarantor.countryCode).toBe('SA');
    expect(guarantor.isDeleted).toBe(false);
  });

  it('should fail validation if salary is negative', async () => {
    const guarantor = new Guarantor({
      fullName: 'Test Guarantor',
      phone: '123456789',
      nationalId: '1234567890',
      buildingNumber: '1',
      streetName: 'Street',
      district: 'District',
      city: 'City',
      postalCode: '12345',
      createdBy: new mongoose.Types.ObjectId(),
      salary: -100,
    });

    let err: any;
    try {
      await guarantor.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.salary).toBeDefined();
    expect(err.errors.salary.kind).toBe('min');
  });
});
