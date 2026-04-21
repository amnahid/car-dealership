import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export interface DocumentAlertInfo {
  carId: string;
  brand: string;
  model: string;
  documentType: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY;
  return !!(apiKey && apiKey !== 'your_resend_api_key_here');
}

function getRecipients(): string[] {
  const adminEmail = process.env.RESEND_ADMIN_EMAIL;
  if (adminEmail) {
    return [adminEmail];
  }
  return ['admin@dealership.com'];
}

function buildEmailHtml(docInfo: DocumentAlertInfo): string {
  const formattedDate = new Date(docInfo.expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const urgencyLevel = docInfo.daysUntilExpiry <= 7 ? 'URGENT' : docInfo.daysUntilExpiry <= 15 ? 'Important' : 'Reminder';
  const urgencyColor = docInfo.daysUntilExpiry <= 7 ? '#dc2626' : docInfo.daysUntilExpiry <= 15 ? '#ea580c' : '#d97706';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Expiry Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #28aaa9 0%, #238f8e 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Document Expiry Alert</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Car Dealership Management System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Dear Admin,</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                The following vehicle document is expiring soon and requires your immediate attention:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border-left: 4px solid ${urgencyColor}; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: ${urgencyColor}; font-size: 14px; font-weight: 600; text-transform: uppercase;">${urgencyLevel}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 4px; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Car ID</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #28aaa9; font-weight: 600;">${docInfo.carId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Vehicle</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${docInfo.brand} ${docInfo.model}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Document Type</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${docInfo.documentType}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #666666; font-weight: 500;">Expiry Date</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #333333;">${formattedDate}</td>
                </tr>
                <tr style="background-color: #fff5f5;">
                  <td style="padding: 12px 15px; font-size: 13px; color: #666666; font-weight: 500;">Days Remaining</td>
                  <td style="padding: 12px 15px; font-size: 13px; color: ${urgencyColor}; font-weight: 700;">${docInfo.daysUntilExpiry} days</td>
                </tr>
              </table>
              <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Please take immediate action to renew this document to avoid any legal complications.
              </p>
              <p style="color: #888888; font-size: 12px; margin: 30px 0 0 0; text-align: center;">
                This is an automated notification from Car Dealership Management System.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f5f5f5; padding: 20px; text-align: center;">
              <p style="color: #888888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Car Dealership. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendExpiryAlertEmail(to: string, docInfo: DocumentAlertInfo): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn('Email service not configured. Skipping email alert.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const html = buildEmailHtml(docInfo);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@businessgrowthstudio.online';
    const fromName = process.env.RESEND_FROM_NAME || 'Car Dealership System';

    const { data, error } = await getResendClient().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: `Document Expiring: ${docInfo.carId} - ${docInfo.documentType}`,
      html: html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log(`Expiry alert email sent to ${to} for car ${docInfo.carId}`, data?.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending expiry alert email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendBatchExpiryAlertEmails(docInfos: DocumentAlertInfo[]): Promise<{ sent: number; failed: number }> {
  const recipients = getRecipients();
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    for (const docInfo of docInfos) {
      const result = await sendExpiryAlertEmail(recipient, docInfo);
      if (result.success) {
        sent++;
      } else {
        failed++;
        console.error(`Failed to send email for ${docInfo.carId}:`, result.error);
      }
    }
  }

  return { sent, failed };
}

export function isEmailServiceConfigured(): boolean {
  return isEmailConfigured();
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@businessgrowthstudio.online';
    const fromName = process.env.RESEND_FROM_NAME || 'Car Dealership System';
    const toEmails = Array.isArray(options.to) ? options.to : [options.to];

    const { data, error } = await getResendClient().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmails,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log(`Email sent to ${toEmails.join(', ')}`, data?.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}