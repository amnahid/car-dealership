import VehicleDocument from '@/models/Document';
import mongoose from 'mongoose';

describe('Document Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const doc = new VehicleDocument({});

    let err: any;
    try {
      await doc.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.car).toBeDefined();
    expect(err.errors.carId).toBeDefined();
    expect(err.errors.documentType).toBeDefined();
    expect(err.errors.issueDate).toBeDefined();
    expect(err.errors.expiryDate).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should fail validation if documentType is not in enum', async () => {
    const doc = new VehicleDocument({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      documentType: 'Invalid' as any,
      issueDate: new Date(),
      expiryDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });

    let err: any;
    try {
      await doc.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.documentType).toBeDefined();
    expect(err.errors.documentType.kind).toBe('enum');
  });

  it('should have default alert flags', () => {
    const doc = new VehicleDocument({
      car: new mongoose.Types.ObjectId(),
      carId: 'CAR-001',
      documentType: 'Insurance',
      issueDate: new Date(),
      expiryDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(doc.alertSent30).toBe(false);
    expect(doc.alertSent15).toBe(false);
    expect(doc.alertSent7).toBe(false);
  });
});
