import { sendEmail, isEmailServiceConfigured } from './email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailServiceConfigured()) {
    console.warn('Email service not configured, skipping password reset email');
    return { success: false, error: 'Email service not configured' };
  }

  const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;
  const html = buildResetEmailHtml(name, resetUrl);

  try {
    const result = await sendEmail({
      to,
      subject: 'Reset Your AMYAL CAR Password',
      html,
    });

    if (result.success) {
      console.log(`Password reset email sent to ${to}`);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send reset email to ${to}:`, message);
    return { success: false, error: message };
  }
}

function buildResetEmailHtml(name: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #28aaa9 0%, #238f8e 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">AMYAL CAR Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${name},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset the password for your AMYAL CAR account. Click the button below to create a new password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #28aaa9; color: #ffffff; padding: 14px 32px; border-radius: 4px; text-decoration: none; font-size: 15px; font-weight: 600;">
                  Reset My Password
                </a>
              </div>
              <p style="color: #888888; font-size: 13px; line-height: 1.6; margin: 20px 0;">
                This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not be changed.
              </p>
              <p style="color: #888888; font-size: 12px; margin: 30px 0 0 0;">
                If the button above doesn't work, copy and paste the link below into your browser:<br>
                <a href="${resetUrl}" style="color: #28aaa9; word-break: break-all;">${resetUrl}</a>
              </p>
              <p style="color: #888888; font-size: 12px; margin: 30px 0 0 0; text-align: center;">
                © ${new Date().getFullYear()} AMYAL CAR. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
