import { sendEmail, isEmailServiceConfigured } from './email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const SENDER_NAME = 'AMYAL CAR';

export interface PasswordResetInfo {
  email: string;
  name: string;
  resetUrl: string;
  expiryTime: string;
}

export async function sendPasswordResetEmail(
  user: PasswordResetInfo
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailServiceConfigured()) {
    console.warn('Email service not configured, skipping password reset email');
    return { success: false, error: 'Email service not configured' };
  }

  const html = formatPasswordResetEmailHtml(user);

  try {
    const result = await sendEmail({
      to: user.email,
      subject: `Password Reset Request - AMYAL CAR`,
      html,
    });

    if (result.success) {
      console.log(`Password reset email sent to ${user.email}`);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send password reset email to ${user.email}:`, message);
    return { success: false, error: message };
  }
}

export function formatPasswordResetEmailHtml(
  user: PasswordResetInfo
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
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
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear ${user.name},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password. If you requested this, click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Email</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #28aaa9; font-weight: 600;">${user.email}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; font-size: 13px; color: #666666; font-weight: 500;">Expires</td>
                  <td style="padding: 12px 15px; font-size: 13px; color: #d97706; font-weight: 600;">${user.expiryTime}</td>
                </tr>
              </table>
              <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 4px; padding: 16px; margin: 20px 0; text-align: center;">
                <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Reset Your Password</p>
                <a href="${user.resetUrl}" style="display: inline-block; background: #28aaa9; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600;">
                  Reset Password
                </a>
              </div>
              <p style="color: #f59e0b; font-size: 13px; margin: 20px 0; padding: 12px; background: #fffbeb; border-radius: 4px;">
                <strong>Note:</strong> If you did not request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                If you have any questions, please contact your system administrator.
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