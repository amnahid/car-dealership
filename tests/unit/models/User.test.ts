import User from '@/models/User';
import mongoose from 'mongoose';

describe('User Model', () => {
  it('should be invalid if name is empty', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
    });

    let err: any;
    try {
      await user.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.name).toBeDefined();
  });

  it('should be invalid if email is empty', async () => {
    const user = new User({
      name: 'Test User',
      password: 'password123',
    });

    let err: any;
    try {
      await user.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.email).toBeDefined();
  });

  it('should be invalid if password is empty', async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
    });

    let err: any;
    try {
      await user.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.password).toBeDefined();
  });

  it('should lowercase the email', async () => {
    const user = new User({
      name: 'Test User',
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
    });

    expect(user.email).toBe('test@example.com');
  });

  it('should have default values for role, isActive, isDeleted, and passwordVersion', async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(user.role).toBe('Sales Person');
    expect(user.isActive).toBe(true);
    expect(user.isDeleted).toBe(false);
    expect(user.passwordVersion).toBe(1);
  });

  it('should fail validation if role is not in enum', async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'Invalid Role' as any,
    });

    let err: any;
    try {
      await user.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.role).toBeDefined();
    expect(err.errors.role.kind).toBe('enum');
  });
});
