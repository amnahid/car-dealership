import ActivityLog from '@/models/ActivityLog';
import mongoose from 'mongoose';

describe('ActivityLog Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const log = new ActivityLog({});

    let err: any;
    try {
      await log.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.user).toBeDefined();
    expect(err.errors.userName).toBeDefined();
    expect(err.errors.action).toBeDefined();
    expect(err.errors.module).toBeDefined();
  });

  it('should create a log entry with valid data', async () => {
    const logData = {
      user: new mongoose.Types.ObjectId(),
      userName: 'Admin',
      action: 'Create Car',
      module: 'Cars',
    };
    const log = new ActivityLog(logData);

    let err: any;
    try {
      await log.validate();
    } catch (error) {
      err = error;
    }

    expect(err).toBeUndefined();
    expect(log.userName).toBe('Admin');
  });
});
