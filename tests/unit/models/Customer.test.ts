import Customer from '@/models/Customer';
import mongoose from 'mongoose';

describe('Customer Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const customer = new Customer({});

    let err: any;
    try {
      await customer.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.fullName).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.buildingNumber).toBeDefined();
    expect(err.errors.streetName).toBeDefined();
    expect(err.errors.district).toBeDefined();
    expect(err.errors.city).toBeDefined();
    expect(err.errors.postalCode).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default values for countryCode, customerType, otherIdType, and isDeleted', async () => {
    const customer = new Customer({
      fullName: 'Test Customer',
      phone: '123456789',
      buildingNumber: '1',
      streetName: 'Street',
      district: 'District',
      city: 'City',
      postalCode: '12345',
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(customer.countryCode).toBe('SA');
    expect(customer.customerType).toBe('Individual');
    expect(customer.otherIdType).toBe('CRN');
    expect(customer.isDeleted).toBe(false);
  });

  it('should fail validation if customerType is not in enum', async () => {
    const customer = new Customer({
      fullName: 'Test Customer',
      phone: '123456789',
      buildingNumber: '1',
      streetName: 'Street',
      district: 'District',
      city: 'City',
      postalCode: '12345',
      createdBy: new mongoose.Types.ObjectId(),
      customerType: 'InvalidType' as any,
    });

    let err: any;
    try {
      await customer.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.customerType).toBeDefined();
    expect(err.errors.customerType.kind).toBe('enum');
  });
});
