import Employee from '@/models/Employee';
import mongoose from 'mongoose';

describe('Employee Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const employee = new Employee({});

    let err: any;
    try {
      await employee.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.name).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.designation).toBeDefined();
    expect(err.errors.department).toBeDefined();
    expect(err.errors.baseSalary).toBeDefined();
    expect(err.errors.joiningDate).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default value for isActive', () => {
    const employee = new Employee({
      name: 'John Staff',
      phone: '123456',
      designation: 'Sales',
      department: 'Sales',
      baseSalary: 3000,
      joiningDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(employee.isActive).toBe(true);
  });

  it('should fail validation if baseSalary is negative', async () => {
    const employee = new Employee({
      name: 'John Staff',
      phone: '123456',
      designation: 'Sales',
      department: 'Sales',
      baseSalary: -100,
      joiningDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
    });

    let err: any;
    try {
      await employee.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.baseSalary).toBeDefined();
    expect(err.errors.baseSalary.kind).toBe('min');
  });
});
