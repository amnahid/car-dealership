import ZatcaConfig from '@/models/ZatcaConfig';
import mongoose from 'mongoose';

describe('ZatcaConfig Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const config = new ZatcaConfig({});

    let err: any;
    try {
      await config.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.sellerName).toBeDefined();
    expect(err.errors.sellerNameAr).toBeDefined();
    expect(err.errors.trn).toBeDefined();
    expect(err.errors.address).toBeDefined();
    expect(err.errors.updatedBy).toBeDefined();
  });

  it('should fail validation if TRN is not 15 digits', async () => {
    const config = new ZatcaConfig({
      sellerName: 'Test Seller',
      sellerNameAr: 'بائع تجريبي',
      trn: '123',
      address: {
        buildingNumber: '1234',
        streetName: 'Street',
        district: 'District',
        city: 'City',
        postalCode: '12345',
      },
      updatedBy: new mongoose.Types.ObjectId(),
    });

    let err: any;
    try {
      await config.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.trn).toBeDefined();
  });

  it('should have default value for pih and environment', () => {
    const config = new ZatcaConfig({
      sellerName: 'Test Seller',
      sellerNameAr: 'بائع تجريبي',
      trn: '123456789012345',
      address: {
        buildingNumber: '1234',
        streetName: 'Street',
        district: 'District',
        city: 'City',
        postalCode: '12345',
      },
      updatedBy: new mongoose.Types.ObjectId(),
    });

    expect(config.environment).toBe('sandbox');
    expect(config.pih).toBeDefined();
  });
});
