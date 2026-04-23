import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, token, newPassword } = await request.json();

    // Validate input
    if (!email || !token || !newPassword) {
      throw new ValidationError('Email, token, and newPassword are required');
    }

    // Validate newPassword strength
    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      throw new ValidationError('Invalid email or token');
    }

    // Check if resetTokenExpiry is set
    if (!user.resetTokenExpiry) {
      throw new ValidationError('Invalid token');
    }

    // Check if resetTokenExpiry is in the past
    if (new Date(user.resetTokenExpiry) < new Date()) {
      throw new ValidationError('Token has expired');
    }

    // Hash the token from the request
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Compare the hashed token with the stored resetToken
    if (user.resetToken !== hashedToken) {
      throw new ValidationError('Invalid token');
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user's password
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          resetToken: '',
          resetTokenExpiry: '',
        },
        $inc: {
          passwordVersion: 1,
        },
      }
    );

    return NextResponse.json({
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}