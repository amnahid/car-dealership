import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/passwordResetEmail';
import { enforceRateLimit } from '@/lib/rateLimit';
import { RequestRateLimitError } from '@/lib/errors';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    // Enforce rate limit
    await enforceRateLimit(request);

    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    // If user not found, return generic success
    // Prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists, a password reset email has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash reset token
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token expiry (1 hour from now)
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken: hashedResetToken,
          resetTokenExpiry: resetTokenExpiry,
        },
      }
    );

    // Build reset URL
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Format expiry time
    const expiryTime = resetTokenExpiry.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
      expiryTime,
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Password reset email sent successfully.',
    });
  } catch (error) {
    if (error instanceof RequestRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}