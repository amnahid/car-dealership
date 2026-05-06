import NotificationLog from '@/models/NotificationLog';
import mongoose from 'mongoose';

describe('NotificationLog Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const log = new NotificationLog({});

    let err: any;
    try {
      await log.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.channel).toBeDefined();
    expect(err.errors.type).toBeDefined();
    expect(err.errors.recipientName).toBeDefined();
    expect(err.errors.subject).toBeDefined();
    expect(err.errors.content).toBeDefined();
  });

  it('should have default value for status', () => {
    const log = new NotificationLog({
      channel: 'email',
      type: 'Welcome',
      recipientName: 'User',
      subject: 'Welcome',
      content: 'Hello',
    });

    expect(log.status).toBe('pending');
  });

  it('should fail validation if channel is not in enum', async () => {
    const log = new NotificationLog({
      channel: 'invalid' as any,
      type: 'Welcome',
      recipientName: 'User',
      subject: 'Welcome',
      content: 'Hello',
    });

    let err: any;
    try {
      await log.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.channel).toBeDefined();
    expect(err.errors.channel.kind).toBe('enum');
  });
});
